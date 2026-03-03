'use client';
import Image from 'next/image';
import { PricesMap } from '@/hooks/usePrices';

interface PriceTickerProps {
  prices: PricesMap;
  loading?: boolean;
}

const TICKER_TOKENS = [
  { symbol: 'BTC',  name: 'Bitcoin',  logo: '/tokens/btc.png' },
  { symbol: 'ETH',  name: 'Ethereum', logo: '/tokens/eth.png' },
  { symbol: 'USDT', name: 'Tether',   logo: '/tokens/usdt.png' },
  { symbol: 'USDC', name: 'USD Coin', logo: '/tokens/usdc.png' },
  { symbol: 'WBTC', name: 'Wrapped BTC', logo: '/tokens/wbtc.png' },
  { symbol: 'LINK', name: 'Chainlink',   logo: '/tokens/link.png' },
];

function formatPrice(value: number): string {
  if (value >= 10000) return '$' + value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (value >= 1000)  return '$' + value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (value >= 1)     return '$' + value.toFixed(4);
  return '$' + value.toFixed(6);
}

export default function PriceTicker({ prices, loading }: PriceTickerProps) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center overflow-x-auto scrollbar-hide divide-x divide-surface-800/40">
        {TICKER_TOKENS.map((token) => {
          const price = prices[token.symbol];
          const change = price?.usd_24h_change;
          const isPositive = change !== undefined && change >= 0;

          return (
            <div
              key={token.symbol}
              className="flex items-center gap-2.5 px-5 py-3.5 flex-shrink-0 min-w-[160px]"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-surface-800/60 flex items-center justify-center">
                <Image
                  src={token.logo}
                  alt={token.name}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white">{token.symbol}</span>
                  {!loading && change !== undefined && (
                    <span className={`text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{change.toFixed(2)}%
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {loading || !price ? (
                    <span className="skeleton inline-block h-4 w-20 rounded" />
                  ) : (
                    formatPrice(price.usd)
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
