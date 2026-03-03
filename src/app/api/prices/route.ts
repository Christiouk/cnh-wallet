import { NextResponse } from 'next/server';

const COINGECKO_IDS = [
  'bitcoin',
  'ethereum',
  'wrapped-bitcoin',
  'tether',
  'usd-coin',
  'dai',
  'weth',
  'chainlink',
  'uniswap',
  'matic-network',
  'binancecoin',
];

const SYMBOL_MAP: Record<string, string> = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  'wrapped-bitcoin': 'WBTC',
  tether: 'USDT',
  'usd-coin': 'USDC',
  dai: 'DAI',
  weth: 'WETH',
  chainlink: 'LINK',
  uniswap: 'UNI',
  'matic-network': 'MATIC',
  binancecoin: 'BNB',
};

let cache: { data: Record<string, any>; timestamp: number } | null = null;
const CACHE_TTL = 60 * 1000; // 60 seconds

export async function GET() {
  try {
    // Return cached data if fresh
    if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
      return NextResponse.json({ prices: cache.data });
    }

    const ids = COINGECKO_IDS.join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=false`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        ...(process.env.COINGECKO_API_KEY
          ? { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY }
          : {}),
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const raw = await response.json();

    // Transform to symbol-keyed map
    const prices: Record<string, { usd: number; usd_24h_change: number }> = {};
    for (const [id, data] of Object.entries(raw)) {
      const symbol = SYMBOL_MAP[id];
      if (symbol) {
        prices[symbol] = data as { usd: number; usd_24h_change: number };
      }
    }

    cache = { data: prices, timestamp: Date.now() };
    return NextResponse.json({ prices });
  } catch (error) {
    console.error('Prices API error:', error);
    // Return cached data even if stale on error
    if (cache) {
      return NextResponse.json({ prices: cache.data, stale: true });
    }
    return NextResponse.json({ prices: {}, error: 'Failed to fetch prices' }, { status: 500 });
  }
}
