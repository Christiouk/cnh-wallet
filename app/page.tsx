'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import {
  createPublicClient,
  createWalletClient,
  custom,
  formatUnits,
  http,
  parseEther,
} from 'viem';
import { mainnet } from 'viem/chains';

const erc20Abi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
] as const;

type Token = {
  symbol: string;
  name: string;
  address: `0x${string}`;
  decimals: number;
};

function shortAddr(addr?: string) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function Page() {
  const { login, logout, authenticated, user } = usePrivy();
  const { wallets } = useWallets();

  // ====== CONFIG ======
  // Put a reliable Ethereum Mainnet RPC in NEXT_PUBLIC_RPC_URL
  // (If you use Cloudflare and it errors, switch RPC.)
  const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;

  // USDT mainnet default (you can override with NEXT_PUBLIC_USDT_ADDRESS)
  const USDT_ADDRESS =
    (process.env.NEXT_PUBLIC_USDT_ADDRESS as `0x${string}`) ||
    ('0xdAC17F958D2ee523a2206206994597C13D831ec7' as `0x${string}`);

  const TOKENS: Token[] = useMemo(
    () => [
      { symbol: 'USDT', name: 'Tether USD', address: USDT_ADDRESS, decimals: 6 },
      // Add more later (example):
      // { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
      // { symbol: 'WETH', name: 'Wrapped Ether', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
    ],
    [USDT_ADDRESS]
  );

  const embeddedWallet = useMemo(() => {
    // Privy embedded wallet usually appears here once user is logged in
    // We pick the first wallet with an address (works for your demo)
    return wallets?.find((w) => !!w.address) || null;
  }, [wallets]);

  const address = (embeddedWallet?.address || '') as `0x${string}`;

  const publicClient = useMemo(() => {
    if (!RPC_URL) return null;
    return createPublicClient({
      chain: mainnet,
      transport: http(RPC_URL),
    });
  }, [RPC_URL]);

  // ====== STATE ======
  const [nativeBalanceEth, setNativeBalanceEth] = useState<string>('—');
  const [tokenBalances, setTokenBalances] = useState<Record<string, string>>({});
  const [loadingBalances, setLoadingBalances] = useState(false);

  // Send form
  const [to, setTo] = useState<string>('');
  const [amountEth, setAmountEth] = useState<string>('');
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState<string>('');
  const [error, setError] = useState<string>('');

  // ====== BALANCES ======
  async function refreshBalances() {
    setError('');
    setTxHash('');

    if (!authenticated) return;
    if (!address) return;
    if (!publicClient) {
      setError('Missing NEXT_PUBLIC_RPC_URL in your environment.');
      return;
    }

    try {
      setLoadingBalances(true);

      // Native ETH
      const wei = await publicClient.getBalance({ address });
      const eth = formatUnits(wei, 18);
      setNativeBalanceEth(eth);

      // ERC-20 tokens (USDT + others)
      const results: Record<string, string> = {};
      for (const t of TOKENS) {
        const bal = await publicClient.readContract({
          address: t.address,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address],
        });
        results[t.symbol] = formatUnits(bal, t.decimals);
      }
      setTokenBalances(results);
    } catch (e: any) {
      // If you see Cloudflare-eth errors again -> change your RPC URL.
      setError(e?.message || 'Failed to load balances (RPC error).');
    } finally {
      setLoadingBalances(false);
    }
  }

  useEffect(() => {
    refreshBalances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, address, publicClient]);

  // ====== SEND ETH (A) ======
  async function sendEth() {
    setError('');
    setTxHash('');

    if (!authenticated) return;
    if (!embeddedWallet) {
      setError('No wallet found for this user.');
      return;
    }
    if (!to || !to.startsWith('0x') || to.length !== 42) {
      setError('Enter a valid recipient address (0x…).');
      return;
    }
    if (!amountEth || Number(amountEth) <= 0) {
      setError('Enter a valid ETH amount.');
      return;
    }

    try {
      setSending(true);

      const provider = await embeddedWallet.getEthereumProvider();
      const walletClient = createWalletClient({
        chain: mainnet,
        transport: custom(provider),
      });

      const hash = await walletClient.sendTransaction({
        account: address,
        to: to as `0x${string}`,
        value: parseEther(amountEth),
      });

      setTxHash(hash);
      await refreshBalances();
    } catch (e: any) {
      setError(e?.message || 'Transaction failed.');
    } finally {
      setSending(false);
    }
  }

  // ====== UI ======
  return (
    <main style={{ padding: 28, minHeight: '100vh' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 18,
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>CNH Wallet</div>
          <div style={{ opacity: 0.7, marginTop: 2 }}>
            Institutional client portal
          </div>
        </div>

        {!authenticated ? (
          <button
            onClick={login}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.08)',
              cursor: 'pointer',
            }}
          >
            Login
          </button>
        ) : (
          <button
            onClick={logout}
            style={{
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.08)',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        )}
      </header>

      {!authenticated ? (
        <section
          style={{
            maxWidth: 520,
            padding: 22,
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.10)',
            background: 'rgba(255,255,255,0.05)',
          }}
        >
          <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
            Welcome to CNH Wallet
          </div>
          <div style={{ opacity: 0.75, marginBottom: 14 }}>
            Secure access for clients. Authenticate to view your wallet profile
            and balances.
          </div>
          <button
            onClick={login}
            style={{
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.10)',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            Login
          </button>
          <div style={{ marginTop: 10, opacity: 0.6, fontSize: 12 }}>
            Tip: in Privy dashboard, keep <b>Email</b> enabled and use{' '}
            <b>embedded wallets</b> for “CNH wallets”.
          </div>
        </section>
      ) : (
        <section
          style={{
            maxWidth: 820,
            display: 'grid',
            gap: 14,
          }}
        >
          <div
            style={{
              padding: 22,
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.10)',
              background: 'rgba(255,255,255,0.05)',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>
              Client Dashboard
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              <div>
                <div style={{ opacity: 0.65, fontSize: 12 }}>Email</div>
                <div style={{ fontWeight: 700 }}>
                  {user?.email?.address || 'No email'}
                </div>
              </div>

              <div>
                <div style={{ opacity: 0.65, fontSize: 12 }}>Status</div>
                <div style={{ fontWeight: 700 }}>Authenticated</div>
              </div>

              <div>
                <div style={{ opacity: 0.65, fontSize: 12 }}>Wallet</div>
                <div style={{ fontWeight: 700 }}>
                  {address ? address : 'No wallet found yet'}
                </div>
                {address ? (
                  <button
                    onClick={() => navigator.clipboard.writeText(address)}
                    style={{
                      marginTop: 6,
                      padding: '8px 10px',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(255,255,255,0.08)',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    Copy address
                  </button>
                ) : null}
              </div>

              <div>
                <div style={{ opacity: 0.65, fontSize: 12 }}>Chain</div>
                <div style={{ fontWeight: 700 }}>ethereum</div>
              </div>

              <div style={{ marginTop: 6 }}>
                <button
                  onClick={refreshBalances}
                  disabled={loadingBalances}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.10)',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  {loadingBalances ? 'Refreshing…' : 'Refresh balances'}
                </button>
              </div>

              {error ? (
                <div
                  style={{
                    marginTop: 10,
                    padding: 10,
                    borderRadius: 12,
                    background: 'rgba(255,0,0,0.08)',
                    border: '1px solid rgba(255,0,0,0.20)',
                    fontSize: 12,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {error}
                </div>
              ) : null}

              {txHash ? (
                <div
                  style={{
                    marginTop: 10,
                    padding: 10,
                    borderRadius: 12,
                    background: 'rgba(0,255,0,0.06)',
                    border: '1px solid rgba(0,255,0,0.16)',
                    fontSize: 12,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  Sent ✅ Tx hash: {txHash}
                </div>
              ) : null}
            </div>
          </div>

          {/* BALANCES (B) */}
          <div
            style={{
              padding: 22,
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.10)',
              background: 'rgba(255,255,255,0.05)',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>
              Balances
            </div>

            <div
              style={{
                display: 'grid',
                gap: 10,
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              }}
            >
              <div
                style={{
                  padding: 14,
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(0,0,0,0.18)',
                }}
              >
                <div style={{ opacity: 0.65, fontSize: 12 }}>ETH</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>
                  {nativeBalanceEth === '—'
                    ? '—'
                    : Number(nativeBalanceEth).toFixed(6)}
                </div>
              </div>

              {TOKENS.map((t) => (
                <div
                  key={t.symbol}
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(0,0,0,0.18)',
                  }}
                >
                  <div style={{ opacity: 0.65, fontSize: 12 }}>{t.symbol}</div>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>
                    {tokenBalances[t.symbol] === undefined
                      ? '—'
                      : Number(tokenBalances[t.symbol]).toFixed(6)}
                  </div>
                  <div style={{ opacity: 0.55, fontSize: 11, marginTop: 6 }}>
                    {t.name}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SEND / RECEIVE (A) */}
          <div
            style={{
              padding: 22,
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.10)',
              background: 'rgba(255,255,255,0.05)',
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 10 }}>
              Send / Receive (ETH)
            </div>

            <div style={{ display: 'grid', gap: 10, maxWidth: 520 }}>
              <div style={{ opacity: 0.75, fontSize: 12 }}>
                Receive: share your address{' '}
                {address ? `(${shortAddr(address)})` : ''}
              </div>

              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ opacity: 0.75, fontSize: 12 }}>To address</span>
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value.trim())}
                  placeholder="0x…"
                  style={{
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(0,0,0,0.20)',
                    outline: 'none',
                  }}
                />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ opacity: 0.75, fontSize: 12 }}>
                  Amount (ETH)
                </span>
                <input
                  value={amountEth}
                  onChange={(e) => setAmountEth(e.target.value)}
                  placeholder="0.01"
                  style={{
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(0,0,0,0.20)',
                    outline: 'none',
                  }}
                />
              </label>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={sendEth}
                  disabled={sending || !address}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.10)',
                    cursor: 'pointer',
                    fontWeight: 800,
                  }}
                >
                  {sending ? 'Sending…' : 'Send ETH'}
                </button>

                {address ? (
                  <button
                    onClick={() => navigator.clipboard.writeText(address)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(255,255,255,0.06)',
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    Copy receive address
                  </button>
                ) : null}
              </div>

              <div style={{ opacity: 0.55, fontSize: 12 }}>
                Note: token sending (USDT, etc.) can be added next — ETH send is
                the clean first step.
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
