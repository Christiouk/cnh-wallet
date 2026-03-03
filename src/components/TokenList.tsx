'use client';
import Image from 'next/image';
import { TokenBalance } from '@/lib/tokens';
import { formatBalance } from '@/lib/utils';
import { PricesMap } from '@/hooks/usePrices';

interface TokenListProps {
  tokens: TokenBalance[];
  isLoading: boolean;
  prices?: PricesMap;
}

const TOKEN_LOGOS: Record<string, string> = {
  ETH:  '/tokens/eth.png',
  WBTC: '/tokens/wbtc.png',
  USDT: '/tokens/usdt.png',
  USDC: '/tokens/usdc.png',
  DAI:  '/tokens/dai.png',
  WETH: '/tokens/eth.png',
  LINK: '/tokens/link.png',
  UNI:  '/tokens/uni.png',
};

const TOKEN_FALLBACK_COLORS: Record<string, string> = {
  ETH:  'bg-blue-600',
  WBTC: 'bg-orange-600',
  USDT: 'bg-emerald-600',
  USDC: 'bg-blue-500',
  DAI:  'bg-yellow-600',
  WETH: 'bg-indigo-600',
  LINK: 'bg-blue-700',
  UNI:  'bg-pink-600',
  MATIC:'bg-purple-600',
  BNB:  'bg-yellow-500',
};

function TokenIcon({ symbol }: { symbol: string }) {
  const logo = TOKEN_LOGOS[symbol];
  const fallbackColor = TOKEN_FALLBACK_COLORS[symbol] || 'bg-surface-700';
  return (
    <div className={`w-10 h-10 rounded-full flex-shrink-0 overflow-hidden shadow-lg ${logo ? 'bg-surface-800/60' : fallbackColor + ' flex items-center justify-center'}`}>
      {logo ? (
        <Image
          src={logo}
          alt={symbol}
          width={40}
          height={40}
          className="w-full h-full object-cover"
          onError={(e) => {
            const el = e.currentTarget as HTMLImageElement;
            el.style.display = 'none';
            el.parentElement!.classList.add(fallbackColor);
          }}
        />
      ) : (
        <span className="text-white text-xs font-bold">{symbol.slice(0, 3)}</span>
      )}
    </div>
  );
}

function TokenSkeleton() {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10 rounded-full" />
        <div className="space-y-1.5">
          <div className="skeleton h-4 w-20 rounded" />
          <div className="skeleton h-3 w-16 rounded" />
        </div>
      </div>
      <div className="text-right space-y-1.5">
        <div className="skeleton h-4 w-24 rounded ml-auto" />
        <div className="skeleton h-3 w-12 rounded ml-auto" />
      </div>
    </div>
  );
}

function formatUSD(value: number): string {
  if (value >= 1000) return '$' + value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (value >= 1) return '$' + value.toFixed(2);
  if (value >= 0.01) return '$' + value.toFixed(4);
  return '$' + value.toFixed(6);
}

function formatPortfolioUSD(value: number): string {
  if (value === 0) return '$0.00';
  return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function TokenList({ tokens, isLoading, prices = {} }: TokenListProps) {
  // Only show tokens the user actually holds
  const heldTokens = tokens.filter(
    (token) => token.balance !== '0' && parseFloat(formatBalance(token.balance, token.decimals)) > 0
  );

  const totalUSD = heldTokens.reduce((sum, token) => {
    const price = prices[token.symbol]?.usd || 0;
    const balance = parseFloat(formatBalance(token.balance, token.decimals));
    return sum + balance * price;
  }, 0);

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-800/50">
        <div>
          <h2 className="text-base font-semibold text-white">Token Portfolio</h2>
          {!isLoading && totalUSD > 0 && (
            <p className="text-xs text-surface-500 mt-0.5">
              Total value:{' '}
              <span className="text-brand-400 font-medium">{formatPortfolioUSD(totalUSD)}</span>
            </p>
          )}
        </div>
        <span className="text-xs text-surface-500 bg-surface-800/60 px-2.5 py-1 rounded-full border border-surface-700/30">
          Multi-Chain
        </span>
      </div>

      {isLoading ? (
        <div className="divide-y divide-surface-800/30">
          {[1, 2, 3].map((i) => (
            <TokenSkeleton key={i} />
          ))}
        </div>
      ) : heldTokens.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="text-sm text-surface-500">No token balances found on this network.</p>
          <p className="text-xs text-surface-600 mt-1">Deposit assets or switch network to view your portfolio.</p>
        </div>
      ) : (
        <div className="divide-y divide-surface-800/30">
          {heldTokens.map((token) => {
            const formatted = formatBalance(token.balance, token.decimals);
            const price = prices[token.symbol];
            const usdValue = price ? parseFloat(formatted) * price.usd : null;
            const change24h = price?.usd_24h_change;
            const isPositive = change24h !== undefined && change24h >= 0;

            return (
              <div
                key={token.symbol}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.02] transition-colors duration-150"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <TokenIcon symbol={token.symbol} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{token.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-xs text-surface-500">{token.symbol}</span>
                      {price && (
                        <>
                          <span className="text-surface-700 text-xs">&middot;</span>
                          <span className="text-xs text-surface-400">{formatUSD(price.usd)}</span>
                          {change24h !== undefined && (
                            <span className={`text-xs font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                              {isPositive ? '+' : ''}{change24h.toFixed(2)}%
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-sm font-semibold text-white">
                    {formatted} {token.symbol}
                  </p>
                  {usdValue !== null && usdValue > 0 && (
                    <p className="text-xs text-surface-400 mt-0.5">{formatPortfolioUSD(usdValue)}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && (
        <div className="px-6 py-3 border-t border-surface-800/30 flex items-center justify-between">
          <p className="text-xs text-surface-600">Prices via CoinGecko &middot; Updated every 60s</p>
          {heldTokens.length > 0 && (
            <span className="text-xs text-surface-700">{heldTokens.length} asset{heldTokens.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      )}
    </div>
  );
}
