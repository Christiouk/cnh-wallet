'use client';
import AssetIcon from './AssetIcon';
export type ActivityRow = {
  hash: string;
  direction: string;
  amount: string | null;
  asset: string | null;
  timestamp: number;
  status: string;
  explorer: string;
};
export default function ActivityView({
  network,
  state,
  rows,
  note,
  onRefresh,
  limit,
}: {
  network: string;
  state: 'loading' | 'unavailable' | 'ready';
  rows: ActivityRow[];
  note: string;
  onRefresh(): void;
  limit?: number;
}) {
  return (
    <section className="activity-section">
      <div className="section-line">
        <div>
          <p className="eyebrow">{network}</p>
          <h2>{limit ? 'Recent activity' : 'Activity'}</h2>
        </div>
        <button
          className="btn-ghost refresh-button"
          onClick={onRefresh}
          aria-label="Refresh activity"
        >
          ↻
        </button>
      </div>
      {state === 'loading' ? (
        <p className="empty-state" role="status">
          Loading activity…
        </p>
      ) : state === 'unavailable' ? (
        <div className="empty-state" role="status">
          <strong>Activity temporarily unavailable</strong>
          <p>Try refreshing in a moment.</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="empty-state">
          <span aria-hidden>↗</span>
          <h3>No recent activity</h3>
          <p>No transfers found in this history source.</p>
        </div>
      ) : (
        <ul className="activity-list">
          {rows.slice(0, limit).map((tx, index) => (
            <li key={`${tx.hash}:${index}`}>
              <span className="activity-artwork" aria-hidden>
                {tx.asset &&
                ['ETH', 'USDT', 'USDC', 'TRX'].includes(tx.asset) ? (
                  <AssetIcon symbol={tx.asset} size={30} />
                ) : (
                  <span className="activity-direction">↔</span>
                )}
              </span>
              <div className="activity-description">
                <h3>
                  {tx.direction === 'outgoing'
                    ? 'Sent'
                    : tx.direction === 'incoming'
                      ? 'Received'
                      : tx.direction}
                </h3>
                <p className="activity-asset">
                  {tx.asset || 'Asset unavailable'} · {network}
                  {tx.asset === 'USDT' || tx.asset === 'USDC'
                    ? ` · ${network === 'Tron' ? 'TRC-20' : 'ERC-20'}`
                    : ''}
                </p>
                <time dateTime={new Date(tx.timestamp).toISOString()}>
                  {new Date(tx.timestamp)
                    .toISOString()
                    .slice(0, 16)
                    .replace('T', ' ') + ' UTC'}
                </time>
                <span className="quiet-label">{tx.status}</span>
              </div>
              <div className="activity-amount">
                <p>
                  {tx.amount !== null
                    ? `${tx.amount} ${tx.asset || ''}`
                    : 'Amount unavailable'}
                </p>
                <a
                  href={tx.explorer}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`View ${network} transaction ${tx.hash}`}
                >
                  Explorer ↗
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="activity-note">{note}</p>
    </section>
  );
}
