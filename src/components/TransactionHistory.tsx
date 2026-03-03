'use client';
import { useState, useEffect, useCallback } from 'react';
import { formatUnits } from 'viem';

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  isError: boolean;
  functionName: string;
}

interface TransactionHistoryProps {
  walletAddress: string;
}

function shortenAddress(addr: string) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatTimeAgo(timestamp: string) {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - parseInt(timestamp);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatEthValue(value: string) {
  try {
    const eth = parseFloat(formatUnits(BigInt(value), 18));
    if (eth === 0) return '0 ETH';
    if (eth < 0.0001) return '< 0.0001 ETH';
    return `${eth.toFixed(4)} ETH`;
  } catch {
    return '— ETH';
  }
}

export default function TransactionHistory({ walletAddress }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!walletAddress) return;
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress }),
      });
      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-800/50 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Recent Transactions</h2>
        <button
          onClick={fetchTransactions}
          className="text-xs text-surface-500 hover:text-brand-400 transition-colors"
        >
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="skeleton w-8 h-8 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-3 w-32 rounded" />
                <div className="skeleton h-3 w-20 rounded" />
              </div>
              <div className="skeleton h-3 w-16 rounded" />
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-10 h-10 rounded-xl bg-surface-800/60 flex items-center justify-center mx-auto mb-3">
            <svg className="w-5 h-5 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
            </svg>
          </div>
          <p className="text-sm text-surface-500">No transactions yet</p>
          <p className="text-xs text-surface-600 mt-1">Your transaction history will appear here</p>
        </div>
      ) : (
        <div className="divide-y divide-surface-800/30">
          {transactions.map((tx) => {
            const isSent = tx.from.toLowerCase() === walletAddress.toLowerCase();
            const isReceived = tx.to.toLowerCase() === walletAddress.toLowerCase();
            const direction = isSent ? 'sent' : isReceived ? 'received' : 'contract';

            return (
              <a
                key={tx.hash}
                href={`https://etherscan.io/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors group"
              >
                {/* Icon */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  tx.isError
                    ? 'bg-red-500/10'
                    : direction === 'sent'
                    ? 'bg-orange-500/10'
                    : direction === 'received'
                    ? 'bg-emerald-500/10'
                    : 'bg-brand-500/10'
                }`}>
                  {tx.isError ? (
                    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : direction === 'sent' ? (
                    <svg className="w-4 h-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                    </svg>
                  ) : direction === 'received' ? (
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                    </svg>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-semibold capitalize ${
                      tx.isError ? 'text-red-400' :
                      direction === 'sent' ? 'text-orange-400' :
                      direction === 'received' ? 'text-emerald-400' :
                      'text-brand-400'
                    }`}>
                      {tx.isError ? 'Failed' : direction === 'contract' ? 'Contract' : direction}
                    </span>
                    <span className="text-xs text-surface-600">·</span>
                    <span className="text-xs text-surface-500">{formatTimeAgo(tx.timeStamp)}</span>
                  </div>
                  <p className="text-xs text-surface-500 truncate mt-0.5">
                    {direction === 'sent' ? `To: ${shortenAddress(tx.to)}` : `From: ${shortenAddress(tx.from)}`}
                  </p>
                </div>

                {/* Value */}
                <div className="text-right flex-shrink-0">
                  <p className={`text-xs font-medium ${
                    tx.isError ? 'text-red-400' :
                    direction === 'received' ? 'text-emerald-400' : 'text-surface-300'
                  }`}>
                    {direction === 'received' ? '+' : direction === 'sent' ? '-' : ''}{formatEthValue(tx.value)}
                  </p>
                  <svg className="w-3 h-3 text-surface-700 group-hover:text-surface-500 transition-colors ml-auto mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
