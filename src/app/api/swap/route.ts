import { NextResponse } from 'next/server';
import { ApiError, body, failure, guard, keys } from '@/lib/server/http';
import { buyUser } from '@/lib/server/buy';
import {
  swapConfiguration,
  requireSwap,
  userLimit,
  price,
  prepare,
  authorize,
  receipt,
} from '@/lib/server/swap';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    const url = new URL(request.url),
      expected =
        swapConfiguration().origin ||
        `${url.protocol}//${request.headers.get('host') || url.host}`;
    if (request.headers.get('origin') !== expected)
      throw new ApiError(
        403,
        'INVALID_ORIGIN',
        'Cross-origin request rejected',
      );
    guard(request, 'swap', 40, expected);
    const value = await body(request, 2048),
      { action, ...fields } = value;
    if (action === 'availability') keys(fields, []);
    else if (action === 'price')
      keys(fields, ['sellAsset', 'buyAsset', 'amount']);
    else if (action === 'prepare' || action === 'authorize')
      keys(fields, ['id']);
    else if (action === 'receipt') keys(fields, ['id', 'hash']);
    else
      throw new ApiError(
        400,
        'INVALID_ACTION',
        'Unsupported Swap operation',
      );
    const owner = await buyUser(request, 'ethereum');
    if (action === 'availability')
      return NextResponse.json(
        { enabled: swapConfiguration().enabled },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    requireSwap();
    userLimit(owner.did);
    const result =
      action === 'price'
        ? await price(fields, owner)
        : action === 'prepare'
          ? await prepare(fields.id, owner)
          : action === 'authorize'
            ? await authorize(fields.id, owner)
            : await receipt(fields.id, fields.hash, owner);
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    if (e instanceof ApiError)
      return failure(
        e.code === 'BUY_UNAVAILABLE'
          ? new ApiError(
              503,
              'SWAP_UNAVAILABLE',
              'Swap currently unavailable',
            )
          : e,
      );
    // Only our controlled errors cross the boundary; never provider JSON, URLs or calldata.
    const safe = [
      'Swap currently unavailable',
      'Unsupported asset pair',
      'Enter a valid token amount',
      'Enter a positive amount',
      'No liquidity available',
      'Insufficient sell-asset balance',
      'Insufficient ETH for network gas',
      'Quote expired',
      'Quote expired or already used',
      'Quote expired; review updated network cost',
      'Please wait before retrying',
      'Swap session expired',
      'Wallet changed',
      'Allowance required',
    ];
    const message =
      e instanceof Error && safe.includes(e.message)
        ? e.message
        : 'Swap provider unavailable. Please try again.';
    return failure(new ApiError(400, 'SWAP_BLOCKED', message));
  }
}
