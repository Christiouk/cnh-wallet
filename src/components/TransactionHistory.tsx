'use client';
import { useEffect, useState } from 'react';
import { formatUnits } from 'viem';
import ActivityView from './ui/ActivityView';
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
  limit,
}: {
  walletAddress: string;
  limit?: number;
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
    <ActivityView
      network="Ethereum"
      state={state}
      limit={limit}
      onRefresh={() => setRevision((r) => r + 1)}
      note="Latest 25 normal Ethereum transactions. Token transfers and internal transfers are not indexed. Contract activity may have no determinable asset or amount."
      rows={rows.map((tx) => ({
        ...tx,
        amount: tx.amount !== null ? formatUnits(BigInt(tx.amount), 18) : null,
        explorer: `https://etherscan.io/tx/${tx.hash}`,
      }))}
    />
  );
}
