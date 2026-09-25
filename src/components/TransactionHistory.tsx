'use client';
import { useEffect, useState } from 'react';
import { formatUnits } from 'viem';
type Transaction = {
  hash: string;
  timestamp: number;
  direction: string;
  asset: string | null;
  amount: string | null;
  status: string;
};
export default function TransactionHistory({
  walletAddress,
}: {
  walletAddress: string;
}) {
  const [state, setState] = useState<'loading' | 'unavailable' | 'ready'>(
    'loading',
  );
  const [rows, setRows] = useState<Transaction[]>([]);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState('loading');
    async function load() {
      try {
        const response = await fetch(
          `/api/transactions?address=${encodeURIComponent(walletAddress)}`,
          { signal: controller.signal },
        );
        const data = await response.json();
        if (!response.ok || !Array.isArray(data.transactions))
          throw new Error();
        if (!controller.signal.aborted) {
          setRows(data.transactions);
          setState('ready');
        }
      } catch {
        if (!controller.signal.aborted) setState('unavailable');
      }
    }
    void load();
    return () => controller.abort();
  }, [walletAddress, revision]);
  return (
    <section className="glass-card p-5">
      <div className="flex justify-between">
        <h2 className="font-semibold">Activity · Ethereum</h2>
        <button className="btn-ghost" onClick={() => setRevision((r) => r + 1)}>
          Refresh activity
        </button>
      </div>
      <p className="text-xs text-surface-400 my-3">
        Latest 25 normal Ethereum transactions. Token transfers and internal
        transfers are not indexed. Contract activity may have no determinable
        asset or amount.
      </p>
      {state === 'loading' ? (
        <p role="status">Loading activity…</p>
      ) : state === 'unavailable' ? (
        <p role="status">Activity temporarily unavailable</p>
      ) : rows.length === 0 ? (
        <p>No transactions found in this history source.</p>
      ) : (
        <ul className="divide-y divide-surface-800">
          {rows.map((tx) => (
            <li key={tx.hash} className="py-3 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <span className="capitalize">
                  {tx.direction} · {tx.status}
                </span>
                <time dateTime={new Date(tx.timestamp).toISOString()}>
                  {new Date(tx.timestamp).toLocaleString()}
                </time>
              </div>
              <p>
                {tx.amount !== null
                  ? `${formatUnits(BigInt(tx.amount), 18)} ${tx.asset}`
                  : 'Contract activity · amount unavailable'}
              </p>
              <a
                className="text-brand-400 break-all"
                target="_blank"
                rel="noopener noreferrer"
                href={`https://etherscan.io/tx/${tx.hash}`}
              >
                {tx.hash}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
