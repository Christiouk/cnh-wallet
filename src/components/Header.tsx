'use client';
import Image from 'next/image';
import { usePrivy } from '@privy-io/react-auth';
import type { A3Network } from '@/lib/wallet/networks';
import { COMPANY } from '@/lib/constants';
export default function Header({
  network = 'ethereum',
  onNetworkChange,
  walletAddress,
  onRefresh,
  isRefreshing,
}: {
  network?: A3Network;
  onNetworkChange?: (network: A3Network) => void;
  walletAddress: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const { logout } = usePrivy();
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-surface/80 border-b border-surface-800/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <Image src="/brand/a3-wallet-horizontal-light.svg" alt={COMPANY.walletName} width={184} height={60} className="h-auto shrink-0" priority unoptimized />
          <h1 className="sr-only">{COMPANY.walletName}</h1>
          <label className="text-sm">
            <span className="sr-only">Network</span>
            <select
              aria-label="Network"
              className="bg-surface-800 rounded-lg px-3 py-2"
              value={network}
              onChange={(e) => {
                if (e.target.value === 'ethereum' || e.target.value === 'tron')
                  onNetworkChange?.(e.target.value);
              }}
            >
              <option value="ethereum">Ethereum</option>
              <option value="tron">Tron</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <span className="text-xs font-mono">
            {walletAddress
              ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
              : 'Wallet unavailable'}
          </span>
          <button
            className="btn-ghost"
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            Refresh
          </button>
          <button className="btn-ghost" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
