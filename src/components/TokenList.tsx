'use client';
import { formatUnits } from 'viem';
import type { TokenBalance } from '@/lib/tokens';
import type { PricesMap } from '@/hooks/usePrices';
export default function TokenList({
  tokens,
  isLoading,
  prices,
  unavailable,
}: {
  tokens: TokenBalance[];
  isLoading: boolean;
  prices: PricesMap;
  unavailable: boolean;
}) {
  return (
    <section className="glass-card p-5">
      <h2 className="font-semibold mb-4">Assets · Ethereum</h2>
      {isLoading ? (
        <p role="status">Loading balances…</p>
      ) : unavailable ? (
        <p role="status">Balances unavailable</p>
      ) : (
        <ul className="divide-y divide-surface-800">
          {tokens.map((t) => (
            <li key={t.symbol} className="py-4 flex justify-between gap-3">
              <div>
                <p>
                  {t.name} <span className="text-surface-400">{t.symbol}</span>
                </p>
                <p className="text-xs text-surface-400">
                  Ethereum{t.isNative ? '' : ' · ERC-20'}
                </p>
              </div>
              <div className="text-right min-w-0 max-w-[65%]">
                <p className="break-all">
                  {formatUnits(BigInt(t.balance), t.decimals)} {t.symbol}
                </p>
                <p className="text-xs text-surface-400">
                  {prices[t.symbol]
                    ? `$${(Number(formatUnits(BigInt(t.balance), t.decimals)) * prices[t.symbol].usd).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : 'USD price unavailable'}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
