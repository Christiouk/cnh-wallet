'use client';
export function money(value: number) {
  return (
    '$' +
    value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}
export default function BalanceCard({
  totalUsdValue,
  isLoading,
  unavailable = false,
  network = 'Ethereum',
}: {
  totalEthBalance?: string;
  totalUsdValue?: number;
  isLoading: boolean;
  unavailable?: boolean;
  network?: 'Ethereum' | 'Tron';
}) {
  return (
    <section className="balance-area" aria-label={`${network} portfolio`}>
      <div className="section-line">
        <p className="eyebrow">TOTAL BALANCE</p>
        <span className="network-tag">{network}</span>
      </div>
      {isLoading ? (
        <div className="balance-state" role="status">
          <span className="loading-line" />
          Loading your balances…
        </div>
      ) : unavailable ? (
        <div className="balance-state" role="status">
          Balance unavailable
          <p className="small muted">
            Your balance could not be loaded. Try refreshing.
          </p>
        </div>
      ) : totalUsdValue !== undefined && Number.isFinite(totalUsdValue) ? (
        <>
          <p
            className="portfolio-total"
            data-compact={money(totalUsdValue).length > 13}
          >
            {money(totalUsdValue)}
          </p>
          <p className="small muted">Estimated value · {network} assets only</p>
        </>
      ) : (
        <div className="balance-state" role="status">
          USD valuation unavailable
          <p className="small muted">Your asset balances are shown below.</p>
        </div>
      )}
    </section>
  );
}
