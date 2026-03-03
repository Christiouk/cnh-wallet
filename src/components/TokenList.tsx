'use client';
import { TokenBalance } from '@/lib/tokens';
import { formatBalance } from '@/lib/utils';
import { PricesMap } from '@/hooks/usePrices';

interface TokenListProps {
  tokens: TokenBalance[];
  isLoading: boolean;
  prices?: PricesMap;
}

const TOKEN_COLORS: Record<string, { from: string; to: string }> = {
  ETH:  { from: 'from-blue-500',    to: 'to-blue-700' },
  WBTC: { from: 'from-orange-500',  to: 'to-orange-700' },
  USDT: { from: 'from-emerald-500', to: 'to-emerald-700' },
  USDC: { from: 'from-blue-400',    to: 'to-blue-600' },
  DAI:  { from: 'from-yellow-500',  to: 'to-yellow-700' },
  WETH: { from: 'from-indigo-500',  to: 'to-indigo-700' },
  LINK: { from: 'from-blue-600',    to: 'to-blue-800' },
  UNI:  { from: 'from-pink-500',    to: 'to-pink-700' },
  MATIC:{ from: 'from-purple-500',  to: 'to-purple-700' },
  BNB:  { from: 'from-yellow-400',  to: 'to-yellow-600' },
};

function TokenIcon({ symbol }: { symbol: string }) {
  const colors = TOKEN_COLORS[symbol] || { from: 'from-surface-600', to: 'to-surface-800' };
  return (
    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colors.from} ${colors.to} flex items-center justify-center shadow-lg flex-shrink-0`}>
      <span className="text-white text-xs font-bold">{symbol.slice(0, 3)}</span>
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
