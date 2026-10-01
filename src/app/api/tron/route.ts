import { NextResponse } from 'next/server';
import { ApiError, body, failure, guard, keys } from '@/lib/server/http';
import {
  attachSignature,
  openIntent,
  sealIntent,
  tronConfiguration,
  tronTransport,
  tronUser,
} from '@/lib/server/tron';
import {
  confirmSend,
  prepareSend,
  readActivity,
  readBalances,
  ResourceRequired,
} from '@/lib/tron/provider';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const json = (value: unknown) =>
  NextResponse.json(value, { headers: { 'Cache-Control': 'no-store' } });
export async function GET(request: Request) {
  try {
    guard(request, 'tron-config');
    if (new URL(request.url).search)
      throw new ApiError(400, 'INVALID_INPUT', 'Unsupported query');
    return json(tronConfiguration());
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    guard(request, 'tron', 60);
    const input = await body(request, 12000);
    if (typeof input.action !== 'string')
      throw new ApiError(400, 'INVALID_INPUT', 'Invalid Tron request');
    const fields: Record<string, string[]> = {
      balances: [],
      activity: [],
      create: [],
      prepare: ['recipient', 'amount'],
      broadcast: ['ticket', 'signature'],
      confirm: ['ticket'],
    };
    if (!Object.hasOwn(fields, input.action))
      throw new ApiError(400, 'INVALID_INPUT', 'Unsupported Tron request');
    keys(input, ['action', ...fields[input.action]]);
    const owner = await tronUser(request, input.action !== 'create');
    // Additional authenticated quota; production needs a shared gateway quota as documented.
    guard(
      new Request(request.url, { headers: { 'x-forwarded-for': owner.did } }),
      `tron-user-${input.action}`,
      input.action === 'prepare' ||
        input.action === 'broadcast' ||
        input.action === 'create'
        ? 8
        : 60,
    );
    if (input.action === 'create') {
      if (!tronConfiguration().creation)
        throw new ApiError(
          503,
          'TRON_DISABLED',
          'Tron setup awaits live validation',
        );
      return json({ allowed: true }); // Only the user's Privy SDK can create, following explicit consent.
    }
    if (input.action === 'balances')
      return json(await readBalances(tronTransport, owner.address));
    if (input.action === 'activity')
      return json(await readActivity(tronTransport, owner.address));
    if (input.action === 'confirm')
      return json({
        status: await confirmSend(
          tronTransport,
          openIntent(input.ticket, owner, false),
        ),
      });
    if (!tronConfiguration().send)
      throw new ApiError(
        503,
        'TRON_DISABLED',
        'Tron sending awaits live validation',
      );
    if (input.action === 'prepare') {
      if (
        typeof input.recipient !== 'string' ||
        typeof input.amount !== 'string'
      )
        throw new ApiError(
          400,
          'INVALID_INPUT',
          'Enter a Tron recipient and USDT amount',
        );
      try {
        const quote = await prepareSend(
          tronTransport,
          owner,
          input.recipient,
          input.amount,
        );
        return json({ ...quote, ticket: sealIntent(quote.intent) });
      } catch (error) {
        if (error instanceof ResourceRequired)
          throw new ApiError(409, 'RESOURCE_REQUIRED', error.message);
        // Only known local validation messages, never provider bodies, reach the UI.
        const safe = [
          'Invalid Tron address',
          'Invalid Tron recipient',
          'Enter a positive amount with at most 6 decimal places',
          'Invalid USDT amount',
          'Insufficient USDT balance',
          'Network cost exceeds the A3 safety limit',
          'Choose a recipient other than this wallet or the USDT contract',
          'Transfer simulation unavailable or rejected',
        ];
        if (error instanceof Error && safe.includes(error.message))
          throw new ApiError(400, 'PREFLIGHT_FAILED', error.message);
        throw error;
      }
    }
    const intent = openIntent(input.ticket, owner);
    const signed = await attachSignature(intent, input.signature);
    try {
      const result = await tronTransport('broadcast', signed);
      if (result?.result === true || result?.code === 'DUP_TRANSACTION_ERROR')
        return json({ hash: intent.transaction.txID, status: 'submitted' });
      // A rejection is not proof of non-inclusion after a retry. Keep polling the same hash.
      return json({ hash: intent.transaction.txID, status: 'uncertain' });
    } catch {
      return json({ hash: intent.transaction.txID, status: 'uncertain' });
    }
  } catch (e) {
    return failure(e);
  }
}
