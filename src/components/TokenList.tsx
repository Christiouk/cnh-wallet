'use client';

import { TokenBalance } from '@/lib/tokens';
import { formatBalance } from '@/lib/utils';

interface TokenListProps {
  tokens: TokenBalance[];
  isLoading: boolean;
}

function TokenIcon({ symbol, logoUrl }: { symbol: string; logoUrl: string }) {
  const colors: Record<string, string> = {
    ETH: 'from-blue-500 to-blue-700',
    USDT: 'from-emerald-500 to-emerald-700',
    USDC: 'from-blue-400 to-blue-600',
    WETH: 'from-indigo-500 to-indigo-700',
    WBTC: 'from-orange-500 to-orange-700',
  };

  return (
    <div
      className={`w-10 h-10 rounded-full bg-gradient-to-br ${
        colors[symbol] || 'from-surface-600 to-surface-800'
      } flex items-center justify-center shadow-lg flex-shrink-0`}
    >
      <span className="text-white text-xs font-bold">
        {symbol.slice(0, 3)}
      </span>
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

export default function TokenList({ tokens, isLoading }: TokenListProps) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-800/50">
        <h2 className="text-base font-semibold text-white">Tokens</h2>
        <span className="text-xs text-surface-500">Ethereum Mainnet</span>
      </div>

      {isLoading ? (
        <div className="divide-y divide-surface-800/30">
          {[1, 2, 3, 4].map((i) => (
            <TokenSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-surface-800/30">
          {tokens.map((token) => {
            const formatted = formatBalance(token.balance, token.decimals);
            const hasBalance = token.balance !== '0';

            return (
              <div
                key={token.symbol}
                className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors duration-150"
              >
                <div className="flex items-center gap-3">
                  <TokenIcon symbol={token.symbol} logoUrl={token.logoUrl} />
                  <div>
                    <p className="text-sm font-semibold text-white">{token.name}</p>
                    <p className="text-xs text-surface-500">
                      {token.symbol}
                      {token.isNative && (
                        <span className="ml-1.5 text-surface-600">&middot; Native</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${hasBalance ? 'text-white' : 'text-surface-500'}`}>
                    {formatted} {token.symbol}
                  </p>
                  {!hasBalance && (
                    <p className="text-xs text-surface-600">&mdash;</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && (
        <div className="px-6 py-3 border-t border-surface-800/30">
          <p className="text-xs text-surface-600">
            No other assets found yet. Once you deposit tokens to your address, they&apos;ll show here.
          </p>
        </div>
      )}
    </div>
  );
}
