'use client';

import { COMPANY } from '@/lib/constants';

interface BalanceCardProps {
  totalEthBalance: string;
  isLoading: boolean;
}

export default function BalanceCard({ totalEthBalance, isLoading }: BalanceCardProps) {
  return (
    <div className="glass-card p-6 sm:p-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-600/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-surface-400 text-sm font-medium">Portfolio Balance</span>
          <span className="badge-info">{COMPANY.network}</span>
        </div>

        {isLoading ? (
          <div className="space-y-2 mt-3">
            <div className="skeleton h-10 w-48 rounded-lg" />
            <div className="skeleton h-4 w-32 rounded" />
          </div>
        ) : (
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
                {totalEthBalance}
              </span>
              <span className="text-xl sm:text-2xl font-semibold text-surface-400">ETH</span>
            </div>
            <p className="text-surface-500 text-sm mt-2">
              ETH + tokens will appear here once the address holds assets.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
