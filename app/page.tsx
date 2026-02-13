'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth';

function shortAddr(addr?: string) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

async function rpcGetBalance(address: string): Promise<string> {
  // Try a few public RPCs (some endpoints rate-limit or glitch sometimes)
  const rpcs = [
    'https://cloudflare-eth.com',
    'https://ethereum.publicnode.com',
    'https://rpc.ankr.com/eth',
  ];

  const body = (method: string, params: any[]) =>
    JSON.stringify({ jsonrpc: '2.0', id: 1, method, params });

  let lastErr: any = null;

  for (const url of rpcs) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: body('eth_getBalance', [address, 'latest']),
        cache: 'no-store',
      });

      const json = await res.json();
      if (json?.result) return json.result as string;
      lastErr = json?.error ?? new Error('No result');
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr ?? new Error('Failed to fetch balance');
}

function weiHexToEth(weiHex: string): string {
  // weiHex like "0x0" or "0x12ab..."
  const wei = BigInt(weiHex);
  const ethInt = wei / 10n ** 18n;
  const ethFrac = wei % 10n ** 18n;
  const fracStr = ethFrac.toString().padStart(18, '0').slice(0, 6); // 6 dp
  return `${ethInt.toString()}.${fracStr}`.replace(/\.?0+$/, (m) => (m === '.' ? '' : m));
}

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-950 p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-white">{title}</div>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm text-white/70 hover:bg-white/10"
          >
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export default function Page() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();

  const embeddedWallet = useMemo(() => {
    // Prefer Privy embedded wallet if present
    // Some versions set wallet.walletClientType === 'privy'
    return (
      wallets?.find((w: any) => w.walletClientType === 'privy') ??
      wallets?.[0] ??
      null
    );
  }, [wallets]);

  const address = embeddedWallet?.address as string | undefined;

  const [ethBalance, setEthBalance] = useState<string>('—');
  const [balanceErr, setBalanceErr] = useState<string>('');

  const [openReceive, setOpenReceive] = useState(false);
  const [openSend, setOpenSend] = useState(false);
  const [openBuy, setOpenBuy] = useState(false);
  const [openSwap, setOpenSwap] = useState(false);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setBalanceErr('');
      setEthBalance('—');
      if (!address) return;

      try {
        const weiHex = await rpcGetBalance(address);
        if (cancelled) return;
        setEthBalance(weiHexToEth(weiHex));
      } catch (e: any) {
        if (cancelled) return;
        setBalanceErr('Could not fetch balance (RPC).');
        setEthBalance('—');
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [address]);

  async function copyAddress() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-white/70">Loading…</div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6">
          <div className="text-xl font-semibold">CNH Wallet</div>
          <div className="mt-2 text-sm text-white/60">
            Sign in to view your wallet.
          </div>
          <button
            onClick={login}
            className="mt-6 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90"
          >
            Log in / Sign up
          </button>
          <div className="mt-4 text-xs text-white/40">
            Secure authentication powered by Privy.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top bar */}
      <div className="mx-auto max-w-3xl px-6 pt-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-semibold">CNH Wallet</div>
            <div className="mt-1 text-sm text-white/60">
              {user?.email?.address ?? 'Authenticated'}
            </div>
          </div>

          <button
            onClick={logout}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            Logout
          </button>
        </div>

        {/* Main card */}
        <div className="mt-6 rounded-3xl border border-white/10 bg-zinc-950 p-6">
          {/* Wallet header row */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-sm text-white/60">Wallet</div>
              <div className="mt-1 flex items-center gap-3">
                <div className="truncate font-mono text-sm">
                  {address ?? '—'}
                </div>
                <button
                  onClick={copyAddress}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <div className="mt-2 text-xs text-white/40">
                Network: <span className="text-white/60">Ethereum</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm text-white/60">Balance</div>
              <div className="mt-1 text-2xl font-semibold">
                {ethBalance === '—' ? '—' : `${ethBalance} ETH`}
              </div>
              {balanceErr ? (
                <div className="mt-1 text-xs text-red-400">{balanceErr}</div>
              ) : (
                <div className="mt-1 text-xs text-white/40">
                  Tokens view (multi-token) comes next.
                </div>
              )}
            </div>
          </div>

          {/* Add funds (MetaMask-like) */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm text-white/70">Get your wallet ready to use web3</div>
            <button
              onClick={() => setOpenBuy(true)}
              className="mt-3 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90"
            >
              Add funds
            </button>
          </div>

          {/* Action buttons row */}
          <div className="mt-5 grid grid-cols-4 gap-3">
            <button
              onClick={() => setOpenBuy(true)}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10"
            >
              <div className="text-xs text-white/60">Buy</div>
              <div className="mt-1 text-sm font-semibold">Buy</div>
            </button>
            <button
              onClick={() => setOpenSwap(true)}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10"
            >
              <div className="text-xs text-white/60">Swap</div>
              <div className="mt-1 text-sm font-semibold">Swap</div>
            </button>
            <button
              onClick={() => setOpenSend(true)}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10"
            >
              <div className="text-xs text-white/60">Send</div>
              <div className="mt-1 text-sm font-semibold">Send</div>
            </button>
            <button
              onClick={() => setOpenReceive(true)}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10"
            >
              <div className="text-xs text-white/60">Receive</div>
              <div className="mt-1 text-sm font-semibold">Receive</div>
            </button>
          </div>

          {/* Tabs (Tokens / Activity) */}
          <div className="mt-8">
            <div className="flex items-center gap-6 border-b border-white/10">
              <div className="border-b-2 border-white pb-3 text-sm font-semibold">
                Tokens
              </div>
              <div className="pb-3 text-sm text-white/50">Activity</div>
            </div>

            {/* Token list (placeholder; ETH only for now) */}
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">Ethereum</div>
                    <div className="mt-1 text-xs text-white/60">
                      {ethBalance === '—' ? '—' : `${ethBalance} ETH`}
                    </div>
                  </div>
                  <div className="text-sm text-white/70">
                    {ethBalance === '—' ? '—' : `${ethBalance} ETH`}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-dashed border-white/15 bg-transparent p-4">
                <div className="text-sm font-semibold">Next step</div>
                <div className="mt-1 text-sm text-white/60">
                  Replace this with an <span className="text-white/80">“all tokens”</span> list (USDT, USDC, DAI, WBTC, etc.) via an indexer API.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pb-10 text-xs text-white/40">
          CNH Wallet (MVP) — MetaMask-style layout. Buttons will be wired next.
        </div>
      </div>

      {/* Modals */}
      <Modal open={openReceive} title="Receive" onClose={() => setOpenReceive(false)}>
        <div className="text-sm text-white/70">Share this address to receive funds:</div>
        <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 font-mono text-sm">
          {address ?? '—'}
        </div>
        <button
          onClick={copyAddress}
          className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90"
        >
          {copied ? 'Copied' : 'Copy address'}
        </button>
        <div className="mt-3 text-xs text-white/40">
          (QR code can be added after the token list step.)
        </div>
      </Modal>

      <Modal open={openSend} title="Send" onClose={() => setOpenSend(false)}>
        <div className="text-sm text-white/70">
          Send will be enabled after we add transaction flow + policies.
        </div>
        <div className="mt-4 space-y-3">
          <input
            disabled
            placeholder="Recipient address (coming soon)"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 placeholder:text-white/30"
          />
          <input
            disabled
            placeholder="Amount (coming soon)"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70 placeholder:text-white/30"
          />
          <button
            disabled
            className="w-full rounded-xl bg-white/20 px-4 py-3 text-sm font-semibold text-white/60"
          >
            Send (coming soon)
          </button>
        </div>
      </Modal>

      <Modal open={openBuy} title="Buy / Add funds" onClose={() => setOpenBuy(false)}>
        <div className="text-sm text-white/70">
          This button will connect to a fiat on-ramp (Ramp / MoonPay / Sardine, etc.).
        </div>
        <div className="mt-3 text-xs text-white/40">
          For now, use “Receive” to fund the wallet from an exchange.
        </div>
      </Modal>

      <Modal open={openSwap} title="Swap" onClose={() => setOpenSwap(false)}>
        <div className="text-sm text-white/70">
          Swap requires a DEX aggregator integration (0x / 1inch / LI.FI). We’ll add it after multi-token balances.
        </div>
      </Modal>
    </div>
  );
}
