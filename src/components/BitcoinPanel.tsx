'use client';
import { useState, useEffect, useCallback } from 'react';
import { CONTACT, FEE } from '@/lib/constants';

interface BitcoinAddress {
  type: 'p2wpkh' | 'p2tr' | 'p2pkh';
  address: string;
  label: string;
}

interface BtcBalance {
  confirmed: number;  // satoshis
  unconfirmed: number;
}

function satsToBtc(sats: number): string {
  return (sats / 1e8).toFixed(8).replace(/\.?0+$/, '') || '0';
}

function formatBtcUsd(btc: number, usdPrice: number): string {
  const val = btc * usdPrice;
  if (val === 0) return '$0.00';
  return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface BitcoinPanelProps {
  btcUsdPrice?: number;
}

export default function BitcoinPanel({ btcUsdPrice = 0 }: BitcoinPanelProps) {
  const [addresses, setAddresses] = useState<BitcoinAddress[]>([]);
  const [balance, setBalance] = useState<BtcBalance | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [leatherInstalled, setLeatherInstalled] = useState<boolean | null>(null);

  // Check if Leather is installed
  useEffect(() => {
    const check = () => {
      setLeatherInstalled(!!(window as any).LeatherProvider);
    };
    // Give extension time to inject
    const t = setTimeout(check, 500);
    return () => clearTimeout(t);
  }, []);

  const primaryAddress = addresses.find(a => a.type === 'p2wpkh') || addresses[0];
  const taprootAddress = addresses.find(a => a.type === 'p2tr');

  const fetchBalance = useCallback(async (address: string) => {
    if (!address) return;
    setIsLoadingBalance(true);
    try {
      const res = await fetch(`https://blockstream.info/api/address/${address}`);
      if (!res.ok) throw new Error('Blockstream API error');
      const data = await res.json();
      setBalance({
        confirmed: data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum,
        unconfirmed: data.mempool_stats.funded_txo_sum - data.mempool_stats.spent_txo_sum,
      });
    } catch (err) {
      console.error('BTC balance fetch failed:', err);
    } finally {
      setIsLoadingBalance(false);
    }
  }, []);

  // Auto-refresh balance every 60s
  useEffect(() => {
    if (!primaryAddress) return;
    fetchBalance(primaryAddress.address);
    const interval = setInterval(() => fetchBalance(primaryAddress.address), 60000);
    return () => clearInterval(interval);
  }, [primaryAddress, fetchBalance]);

  const connectLeather = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const leather = (window as any).LeatherProvider;
      if (!leather) {
        setError('Leather wallet not detected. Please install it first.');
        setIsConnecting(false);
        return;
      }
      const response = await leather.request('getAddresses');
      const result = response?.result?.addresses || [];
      const parsed: BitcoinAddress[] = result
        .filter((a: any) => a.symbol === 'BTC')
        .map((a: any) => ({
          type: a.type as BitcoinAddress['type'],
          address: a.address,
          label: a.type === 'p2wpkh' ? 'Native SegWit' : a.type === 'p2tr' ? 'Taproot' : 'Legacy',
        }));
      if (parsed.length === 0) {
        setError('No Bitcoin addresses found in Leather wallet.');
        return;
      }
      setAddresses(parsed);
    } catch (err: any) {
      setError(err?.message || 'Failed to connect Leather wallet.');
    } finally {
      setIsConnecting(false);
    }
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(addr);
    setTimeout(() => setCopied(null), 2000);
  };

  const confirmedBtc = balance ? balance.confirmed / 1e8 : 0;
  const unconfirmedBtc = balance ? balance.unconfirmed / 1e8 : 0;

  // Not yet connected
  if (addresses.length === 0) {
    return (
      <div className="glass-card overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-800/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-orange-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.167-1.064-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.132-.84-.2l-1.815-.45-.35 1.407s.975.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.524 2.75 2.084v.006z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Bitcoin Network</h2>
            <p className="text-xs text-surface-500">Native BTC via Leather Wallet</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Security note */}
          <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/15">
            <div className="flex gap-3">
              <svg className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-orange-300 mb-1">How Bitcoin works in this wallet</p>
                <p className="text-xs text-surface-400 leading-relaxed">
                  Bitcoin uses the <span className="text-orange-300 font-medium">Leather browser extension</span> — your private keys never leave your device or touch this app. All transaction signing happens inside Leather. This wallet only reads your address and balance.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/15 text-sm text-red-300">
              {error}
            </div>
          )}

          {leatherInstalled === false ? (
            <div className="text-center space-y-4 py-2">
              <p className="text-sm text-surface-400">Leather wallet extension is not installed.</p>
              <a
                href="https://leather.io/install-extension"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/15 text-sm font-medium transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Install Leather Wallet
              </a>
            </div>
          ) : (
            <button
              onClick={connectLeather}
              disabled={isConnecting}
              className="w-full p-3.5 rounded-xl bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/15 text-orange-400 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.167-1.064-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.132-.84-.2l-1.815-.45-.35 1.407s.975.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.524 2.75 2.084v.006z"/>
                  </svg>
                  Connect Leather Wallet
                </>
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Connected state
  return (
    <div className="glass-card overflow-hidden">
      <div className="px-6 py-4 border-b border-surface-800/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-orange-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.167-1.064-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.132-.84-.2l-1.815-.45-.35 1.407s.975.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.524 2.75 2.084v.006z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">Bitcoin</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
              <span className="text-xs text-emerald-400">Leather Connected</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => primaryAddress && fetchBalance(primaryAddress.address)}
          className="text-xs text-surface-500 hover:text-brand-400 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Balance */}
      <div className="px-6 py-5 border-b border-surface-800/30">
        {isLoadingBalance ? (
          <div className="space-y-2">
            <div className="skeleton h-8 w-36 rounded-lg" />
            <div className="skeleton h-4 w-24 rounded" />
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{satsToBtc(balance?.confirmed || 0)}</span>
              <span className="text-lg font-semibold text-orange-400">BTC</span>
            </div>
            {btcUsdPrice > 0 && (
              <p className="text-sm text-surface-400 mt-1">
                {formatBtcUsd(confirmedBtc, btcUsdPrice)}
              </p>
            )}
            {balance && balance.unconfirmed !== 0 && (
              <p className="text-xs text-surface-500 mt-1">
                + {satsToBtc(Math.abs(balance.unconfirmed))} BTC unconfirmed
              </p>
            )}
          </>
        )}
      </div>

      {/* Addresses */}
      <div className="divide-y divide-surface-800/30">
        {primaryAddress && (
          <div className="px-5 py-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-surface-500 mb-0.5">Native SegWit (bc1q…)</p>
                <p className="text-xs font-mono text-surface-300 truncate">{primaryAddress.address}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => copyAddress(primaryAddress.address)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    copied === primaryAddress.address
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-surface-800/60 text-surface-400 hover:text-white border border-surface-700/30'
                  }`}
                >
                  {copied === primaryAddress.address ? 'Copied!' : 'Copy'}
                </button>
                <a
                  href={`https://blockstream.info/address/${primaryAddress.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-800/60 text-surface-400 hover:text-white border border-surface-700/30 transition-all"
                >
                  Explorer
                </a>
              </div>
            </div>
          </div>
        )}

        {taprootAddress && (
          <div className="px-5 py-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-surface-500 mb-0.5">Taproot (bc1p…)</p>
                <p className="text-xs font-mono text-surface-300 truncate">{taprootAddress.address}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => copyAddress(taprootAddress.address)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    copied === taprootAddress.address
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-surface-800/60 text-surface-400 hover:text-white border border-surface-700/30'
                  }`}
                >
                  {copied === taprootAddress.address ? 'Copied!' : 'Copy'}
                </button>
                <a
                  href={`https://blockstream.info/address/${taprootAddress.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-800/60 text-surface-400 hover:text-white border border-surface-700/30 transition-all"
                >
                  Explorer
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Security note */}
      <div className="px-5 py-3.5 border-t border-surface-800/30 bg-surface-900/20">
        <div className="flex gap-2">
          <svg className="w-3.5 h-3.5 text-orange-400/60 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <p className="text-xs text-surface-600 leading-relaxed">
            Bitcoin uses Leather&apos;s browser extension API — no private keys are ever exposed to this app. All transaction signing happens inside Leather.
          </p>
        </div>
      </div>
    </div>
  );
}
