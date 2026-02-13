'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

function short(addr?: string) {
  if (!addr) return '';
  return addr.slice(0, 6) + '…' + addr.slice(-4);
}

// Safe hex -> ETH string (no BigInt, works on older TS targets)
function weiHexToEthSafe(weiHex: unknown): string {
  try {
    if (typeof weiHex !== 'string') return '0';
    if (!weiHex.startsWith('0x')) return '0';

    // Parse hex as a decimal string without BigInt:
    // For balances that fit in JS number range, this is fine.
    // If very large, it may lose precision, but will not NaN/crash.
    const weiNumber = Number.parseInt(weiHex, 16);
    if (!Number.isFinite(weiNumber)) return '0';

    const eth = weiNumber / 1e18;
    if (!Number.isFinite(eth)) return '0';

    // Show up to 6 dp, trim trailing zeros
    return eth.toFixed(6).replace(/\.?0+$/, '');
  } catch {
    return '0';
  }
}

export default function Page() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();

  const [ethBalance, setEthBalance] = useState<string>('0');

  const wallet = wallets?.[0];
  const address = wallet?.address;

  const email = useMemo(() => user?.email?.address ?? 'No email', [user]);

  useEffect(() => {
    if (!address) return;

    let cancelled = false;

    async function loadBalance() {
      try {
        const res = await fetch('https://cloudflare-eth.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getBalance',
            params: [address, 'latest'],
          }),
        });

        const data = await res.json();

        // IMPORTANT: ensure we read `result`
        const eth = weiHexToEthSafe(data?.result);

        if (!cancelled) setEthBalance(eth);
      } catch {
        if (!cancelled) setEthBalance('0');
      }
    }

    loadBalance();

    return () => {
      cancelled = true;
    };
  }, [address]);

  if (!ready) {
    return (
      <main className="h-screen flex items-center justify-center bg-black text-white">
        Loading...
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="h-screen flex items-center justify-center bg-black text-white">
        <button
          onClick={login}
          className="px-6 py-3 rounded-xl bg-white text-black font-medium"
        >
          Connect Wallet
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-zinc-900 rounded-2xl p-6 shadow-xl space-y-4">
        <h1 className="text-xl font-semibold">CNH Wallet</h1>

        <div className="text-sm text-zinc-400">{email}</div>

        <div className="text-xs text-zinc-500 break-all">{short(address)}</div>

        <div className="text-3xl font-semibold">{ethBalance} ETH</div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button className="py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700">
            Send
          </button>

          <button className="py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700">
            Receive
          </button>
        </div>

        <button
          onClick={logout}
          className="w-full mt-4 py-3 rounded-xl bg-white text-black font-medium"
        >
          Logout
        </button>
      </div>
    </main>
  );
}
