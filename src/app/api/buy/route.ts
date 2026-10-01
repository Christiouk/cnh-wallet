import { NextResponse } from 'next/server';
import { body, failure, guard, keys, ApiError } from '@/lib/server/http';
import { buyInput, pair } from '@/lib/buy/core';
import {
  configuration,
  buyUser,
  options,
  quote,
  session,
  status,
  readTicket,
  requirePair,
} from '@/lib/server/buy';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin');
    const config = configuration();
    const url = new URL(request.url);
    // Use the approved public origin when Next runs behind a proxy/internal hostname.
    const expectedOrigin =
      config.origin ||
      `${url.protocol}//${request.headers.get('host') || url.host}`;
    if (!origin || origin !== expectedOrigin)
      throw new ApiError(
        403,
        'INVALID_ORIGIN',
        'Cross-origin request rejected',
      );
    guard(request, 'buy', 30, expectedOrigin);
    const input = await body(request, 6144);
    const { action, ...fields } = input;
    if (action === 'options' || action === 'quote') {
      if (action === 'options') keys(fields, ['network', 'asset']);
      else buyInput(fields);
      pair(fields.network, fields.asset);
      const owner = await buyUser(request, fields.network);
      requirePair(fields.network, String(fields.asset));
      const value =
        action === 'options'
          ? {
              address: owner.address,
              methods: await options(fields.network, String(fields.asset)),
            }
          : await quote(buyInput(fields), owner);
      return NextResponse.json(value, {
        headers: { 'Cache-Control': 'no-store' },
      });
    }
    if (action === 'session' || action === 'status') {
      keys(fields, ['ticket']);
      // Authentication is required even before reading an untrusted ticket.
      if (!request.headers.get('authorization')?.startsWith('Bearer '))
        throw new ApiError(401, 'UNAUTHORIZED', 'Sign in to buy crypto');
      const ticket = readTicket(
        fields.ticket,
        action === 'session' ? 'quote' : 'flow',
      );
      const owner = await buyUser(request, ticket.input.network);
      const value =
        action === 'session'
          ? await session(ticket, owner, request)
          : await status(ticket, owner);
      return NextResponse.json(value, {
        headers: { 'Cache-Control': 'no-store' },
      });
    }
    throw new ApiError(400, 'INVALID_INPUT', 'Unsupported Buy request');
  } catch (error) {
    return failure(error);
  }
}
