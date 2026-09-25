'use client';
import Image from 'next/image';
import { usePrivy } from '@privy-io/react-auth';
import { COMPANY } from '@/lib/constants';
export default function Header({
  walletAddress,
  onRefresh,
  isRefreshing,
}: {
  walletAddress: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const { logout } = usePrivy();
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-surface/80 border-b border-surface-800/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Morsands" width={36} height={36} />
          <h1 className="font-bold">{COMPANY.walletName}</h1>
          <span className="badge-info">Ethereum</span>
        </div>
        <div className="flex items-center gap-3">
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
