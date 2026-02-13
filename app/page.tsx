'use client';

import { useEffect, useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';

function short(addr?: string) {
  if (!addr) return '';
  return addr.slice(0, 6) + '…' + addr.slice(-4);
}

function weiHexToEth(weiHex: string): string {
  try {
    const wei = parseInt(weiHex, 16);
    const eth = wei / 1e18;
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

  useEffect(() => {
    if (!address) return;

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
        const eth = weiHexToEth(data.result);
        setEthBalance(eth);
      } catch {
        setEthBalance('0');
      }
    }

    loadBalance();
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

        <div className="text-sm text-zinc-400">
          {user?.email?.address ?? 'No email'}
        </div>

        <div className="text-xs text-zinc-500 break-all">
          {short(address)}
        </div>

        <div className="text-3xl font-semibold">
          {ethBalance} ETH
        </div>

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
