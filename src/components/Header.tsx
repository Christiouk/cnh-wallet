'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { COMPANY, CONTACT } from '@/lib/constants';

interface HeaderProps {
  walletAddress?: string;
  onRefresh: () => void;
  isRefreshing: boolean;
  activeNetwork: string;
  onNetworkChange: (network: string) => void;
}

const NETWORKS = [
  { id: 'ethereum', label: 'Ethereum', short: 'ETH', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
  { id: 'base', label: 'Base', short: 'Base', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  { id: 'polygon', label: 'Polygon', short: 'MATIC', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  { id: 'arbitrum', label: 'Arbitrum', short: 'ARB', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  { id: 'optimism', label: 'Optimism', short: 'OP', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  { id: 'bsc', label: 'BNB Chain', short: 'BNB', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  { id: 'bitcoin', label: 'Bitcoin', short: 'BTC', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
];

function truncateAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function Header({ walletAddress, onRefresh, isRefreshing, activeNetwork, onNetworkChange }: HeaderProps) {
  const { logout } = usePrivy();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const active = NETWORKS.find(n => n.id === activeNetwork) || NETWORKS[0];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-surface/80 border-b border-surface-800/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Top row: logo + address + actions */}
        <div className="flex items-center justify-between py-3.5">
          {/* Logo & Address */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 shadow-lg shadow-brand-600/20">
                <Image
                  src="/logo.png"
                  alt="Morsands"
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-white leading-tight">{COMPANY.walletName}</h1>
              </div>
            </div>
            {walletAddress && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-800/60 hover:bg-surface-700/60 border border-surface-700/30 transition-all duration-200 ml-2 group"
                title="Copy wallet address"
              >
                <span className="text-xs font-mono text-surface-300 group-hover:text-white transition-colors">
                  {truncateAddress(walletAddress)}
                </span>
                <svg className="w-3.5 h-3.5 text-surface-500 group-hover:text-brand-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {copied ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  )}
                </svg>
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/card"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-600/20 hover:bg-brand-600/30 border border-brand-500/30 text-brand-400 hover:text-brand-300 text-xs font-semibold transition-all duration-200"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
              Get Card
            </Link>
            <a
              href={CONTACT.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost text-sm hidden sm:flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              <span>Trade Support</span>
            </a>
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="btn-ghost text-sm flex items-center gap-1.5"
              title="Refresh balances"
            >
              <svg
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={logout}
              className="btn-ghost text-sm flex items-center gap-1.5 text-red-400/80 hover:text-red-400 hover:bg-red-500/5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Network switcher row */}
        <div className="pb-3 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1.5 min-w-max">
            {NETWORKS.map(network => {
              const isActive = activeNetwork === network.id;
              return (
                <button
                  key={network.id}
                  onClick={() => onNetworkChange(network.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150 whitespace-nowrap ${
                    isActive
                      ? `${network.bg} ${network.border} ${network.color}`
                      : 'bg-surface-800/40 border-surface-700/20 text-surface-500 hover:text-surface-300 hover:bg-surface-800/60 hover:border-surface-700/40'
                  }`}
                >
                  {network.id === 'bitcoin' ? (
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.167-1.064-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.132-.84-.2l-1.815-.45-.35 1.407s.975.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.524 2.75 2.084v.006z"/>
                    </svg>
                  ) : (
                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-current' : 'bg-surface-600'}`} />
                  )}
                  <span className="hidden sm:inline">{network.label}</span>
                  <span className="sm:hidden">{network.short}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}

export { NETWORKS };
export type { HeaderProps };
