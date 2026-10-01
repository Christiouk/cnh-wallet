import { NextResponse } from 'next/server';
import { CURATED_TOKENS } from '../../../lib/tokens';
import { failure, guard, jsonFetch } from '../../../lib/server/http';
export const dynamic = 'force-dynamic';
let cache: {
  prices: Record<string, { usd: number; usd_24h_change: number }>;
  updatedAt: number;
} | null = null;
export async function GET(request: Request) {
  try {
    guard(request, 'prices', 60);
    if (new URL(request.url).search)
      return NextResponse.json(
        {
          error: { code: 'INVALID_INPUT', message: 'No parameters supported' },
        },
        { status: 400 },
      );
    if (cache && Date.now() - cache.updatedAt < 60000)
      return NextResponse.json(cache);
    const ids = CURATED_TOKENS.map((t) => t.coingeckoId).join(',') + ',tron';
    const raw = await jsonFetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      {
        headers: {
          Accept: 'application/json',
          ...(process.env.COINGECKO_API_KEY
            ? { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY }
            : {}),
        },
      },
    );
    const prices: NonNullable<typeof cache>['prices'] = {};
    for (const token of CURATED_TOKENS) {
      const price = raw?.[token.coingeckoId!];
      if (
        !price ||
        typeof price.usd !== 'number' ||
        !Number.isFinite(price.usd) ||
        price.usd <= 0
      )
        throw new Error('Invalid price');
      prices[token.symbol] = {
        usd: price.usd,
        usd_24h_change:
          typeof price.usd_24h_change === 'number' &&
          Number.isFinite(price.usd_24h_change)
            ? price.usd_24h_change
            : 0,
      };
    }
    if (
      typeof raw?.tron?.usd === 'number' &&
      Number.isFinite(raw.tron.usd) &&
      raw.tron.usd > 0
    ) {
      prices.TRX = {
        usd: raw.tron.usd,
        usd_24h_change: Number.isFinite(raw.tron.usd_24h_change)
          ? raw.tron.usd_24h_change
          : 0,
      };
    }
    cache = { prices, updatedAt: Date.now() };
    return NextResponse.json(cache);
  } catch (e) {
    return failure(e);
  }
}
