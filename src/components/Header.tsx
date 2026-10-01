'use client';
import Image from 'next/image';
import AssetIcon from './ui/AssetIcon';
import type { A3Network } from '@/lib/wallet/networks';
export default function Header({
  network,
  onNetworkChange,
  onAccount,
}: {
  network: A3Network;
  onNetworkChange(network: A3Network): void;
  onAccount(): void;
}) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <a href="#wallet-main" className="app-brand" aria-label="A3 Wallet">
          <Image
            src="/brand/a3-wallet-horizontal-light.svg"
            alt="A3 Wallet"
            width={184}
            height={60}
            priority
            unoptimized
          />
        </a>
        <label className="network-control">
          <span className="sr-only">Network</span>
          <AssetIcon symbol={network === 'tron' ? 'TRX' : 'ETH'} size={22} />
          <select
            aria-label="Network"
            value={network}
            onChange={(e) => {
              if (e.target.value === 'ethereum' || e.target.value === 'tron')
                onNetworkChange(e.target.value);
            }}
          >
            <option value="ethereum">Ethereum</option>
            <option value="tron">Tron</option>
          </select>
        </label>
        <button
          className="account-toggle"
          onClick={onAccount}
          aria-label="Open account"
        >
          <svg
            aria-hidden
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 21v-3a7 7 0 0 1 14 0v3" />
          </svg>
          <span>Account</span>
        </button>
      </div>
    </header>
  );
}
