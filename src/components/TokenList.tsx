'use client';
import { formatUnits } from 'viem';
import type { TokenBalance } from '@/lib/tokens';
import type { PricesMap } from '@/hooks/usePrices';
import { money } from './BalanceCard';
export function assetAmount(value: string) {
  if (!/^\d+(\.\d+)?$/.test(value)) return value;
  const [whole, fraction] = value.split('.');
  return (
    whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') +
    (fraction ? '.' + fraction : '')
  );
}
export type AssetRow = {
  symbol: string;
  name: string;
  standard: string;
  amount: string;
  usd?: number;
};
export function AssetList({
  rows,
  network,
  loading,
  unavailable,
}: {
  rows: AssetRow[];
  network: string;
  loading?: boolean;
  unavailable?: boolean;
}) {
  return (
    <section className="asset-section">
      <div className="section-line">
        <h2>Assets</h2>
        <span className="quiet-label">{network}</span>
      </div>
      {loading ? (
        <p className="empty-state" role="status">
          Loading balances…
        </p>
      ) : unavailable ? (
        <p className="empty-state" role="status">
          Balances unavailable
        </p>
      ) : (
        <ul className="asset-list">
          {rows.map((row) => (
            <li key={row.symbol}>
              <span
                className={`asset-mark asset-${row.symbol.toLowerCase()}`}
                aria-hidden
              >
                {row.symbol === 'ETH' ? '◇' : row.symbol === 'TRX' ? 'T' : '$'}
              </span>
              <div className="asset-description">
                <h3>{row.symbol}</h3>
                <p>
                  {row.name} · {row.standard}
                </p>
              </div>
              <div className="asset-value">
                <p>{assetAmount(row.amount)}</p>
                <span>
                  {row.usd === undefined || !Number.isFinite(row.usd)
                    ? 'USD value unavailable'
                    : money(row.usd)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
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
    <AssetList
      network="Ethereum"
      loading={isLoading}
      unavailable={unavailable}
      rows={tokens.map((t) => ({
        symbol: t.symbol,
        name: t.name,
        standard: t.isNative ? 'Native asset' : 'ERC-20',
        amount: formatUnits(BigInt(t.balance), t.decimals),
        usd: prices[t.symbol]
          ? Number(formatUnits(BigInt(t.balance), t.decimals)) *
            prices[t.symbol].usd
          : undefined,
      }))}
    />
  );
}
