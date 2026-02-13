"use client";

import { useEffect, useMemo, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
} from "viem";
import { mainnet } from "viem/chains";

const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "balance", type: "uint256" }],
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "ok", type: "bool" }],
  },
] as const;

// Mainnet token addresses (ETH has no contract)
// USDT (Ethereum): 0xdAC17F958D2ee523a2206206994597C13D831ec7
// USDC (Ethereum): 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
const TOKENS = [
  { key: "ETH", name: "Ethereum", symbol: "ETH", decimals: 18, address: null },
  {
    key: "USDT",
    name: "Tether USD",
    symbol: "USDT",
    decimals: 6,
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" as const,
  },
  // Optional but “professional” (you can remove if you want only USDT)
  {
    key: "USDC",
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as const,
  },
] as const;

function shortAddr(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function Page() {
  const { ready, authenticated, user, login, logout v2 test } = usePrivy();
  const { wallets } = useWallets();

  const [balances, setBalances] = useState<Record<string, string>>({});
  const [loadingBalances, setLoadingBalances] = useState(false);

  const [showReceive, setShowReceive] = useState(false);
  const [showSend, setShowSend] = useState(false);

  const [sendToken, setSendToken] = useState<(typeof TOKENS)[number]>(TOKENS[0]);
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [txStatus, setTxStatus] = useState<string>("");

  const address = (user?.wallet?.address || "") as `0x${string}`;

  // Use your RPC if set; fallback is fine.
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.ankr.com/eth";

  const publicClient = useMemo(() => {
    return createPublicClient({
      chain: mainnet,
      transport: http(rpcUrl),
    });
  }, [rpcUrl]);

  // Privy embedded wallet provider (needed for sending)
  const walletClientPromise = useMemo(async () => {
    // pick the first EVM wallet available from Privy
    const evmWallet = wallets.find((w) => w.chainType === "ethereum");
    if (!evmWallet) return null;

    const provider = await evmWallet.getEthereumProvider();

    return createWalletClient({
      chain: mainnet,
      transport: custom(provider),
    });
  }, [wallets]);

  async function refreshBalances() {
    if (!address) return;
    setLoadingBalances(true);
    setTxStatus("");

    try {
      const next: Record<string, string> = {};

      // ETH
      const ethBal = await publicClient.getBalance({ address });
      next["ETH"] = formatEther(ethBal);

      // ERC-20s
      for (const t of TOKENS) {
        if (!t.address) continue;
        const raw = await publicClient.readContract({
          address: t.address,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [address],
        });
        next[t.symbol] = formatUnits(raw, t.decimals);
      }

      setBalances(next);
    } catch (e: any) {
      console.error(e);
      setTxStatus("Balance fetch error. Check RPC / network.");
    } finally {
      setLoadingBalances(false);
    }
  }

  useEffect(() => {
    if (ready && authenticated && address) refreshBalances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authenticated, address]);

  async function copyAddress() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setTxStatus("Address copied.");
    setTimeout(() => setTxStatus(""), 1500);
  }

  async function sendTx() {
    setTxStatus("");

    const to = sendTo.trim() as `0x${string}`;
    if (!to.startsWith("0x") || to.length !== 42) {
      setTxStatus("Invalid recipient address.");
      return;
    }
    if (!sendAmount || Number(sendAmount) <= 0) {
      setTxStatus("Enter a valid amount.");
      return;
    }

    const wc = await walletClientPromise;
    if (!wc) {
      setTxStatus("No wallet client available (Privy provider not found).");
      return;
    }

    try {
      setTxStatus("Sending…");

      // ETH transfer
      if (sendToken.symbol === "ETH") {
        const hash = await wc.sendTransaction({
          account: address,
          to,
          value: parseEther(sendAmount),
        });

        setTxStatus(`Sent. Tx: ${hash}`);
        setSendAmount("");
        setSendTo("");
        await refreshBalances();
        return;
      }

      // ERC-20 transfer (USDT/USDC)
      const tokenAddr = sendToken.address as `0x${string}`;
      const amount = parseUnits(sendAmount, sendToken.decimals);

      const hash = await wc.writeContract({
        account: address,
        address: tokenAddr,
        abi: ERC20_ABI,
        functionName: "transfer",
        args: [to, amount],
      });

      setTxStatus(`Sent. Tx: ${hash}`);
      setSendAmount("");
      setSendTo("");
      await refreshBalances();
    } catch (e: any) {
      console.error(e);
      setTxStatus(e?.shortMessage || e?.message || "Transaction failed.");
    }
  }

  if (!ready) return null;

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="w-[420px] rounded-2xl bg-zinc-900 p-8 space-y-4">
          <h1 className="text-2xl font-bold">CNH Wallet</h1>
          <p className="text-zinc-400">
            Secure client access. Login to view balances.
          </p>
          <button
            onClick={login}
            className="rounded-xl bg-white px-6 py-3 text-black font-semibold w-full"
          >
            Login / Sign up
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white p-6">
      <div className="w-[520px] rounded-2xl bg-zinc-900 p-8 space-y-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">CNH Wallet</h1>
            <p className="text-zinc-400 text-sm">
              {user?.email?.address || "No email"} · {shortAddr(address)}
            </p>
          </div>
          <button
            onClick={logout}
            className="rounded-lg bg-white px-4 py-2 text-black"
          >
            Logout
          </button>
        </div>

        {/* Balances */}
        <div className="rounded-xl bg-zinc-950/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Balances</h2>
            <button
              onClick={refreshBalances}
              className="text-sm text-zinc-300 hover:text-white"
              disabled={loadingBalances}
            >
              {loadingBalances ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          <div className="space-y-2">
            {TOKENS.map((t) => (
              <div
                key={t.key}
                className="flex items-center justify-between rounded-lg bg-zinc-950/30 px-3 py-2"
              >
                <div>
                  <div className="font-medium">{t.symbol}</div>
                  <div className="text-xs text-zinc-400">{t.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {balances[t.symbol] ? Number(balances[t.symbol]).toFixed(6) : "0.000000"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowReceive(true)}
            className="rounded-xl bg-white px-4 py-3 text-black font-semibold"
          >
            Receive
          </button>
          <button
            onClick={() => setShowSend(true)}
            className="rounded-xl bg-white px-4 py-3 text-black font-semibold"
          >
            Send
          </button>
        </div>

        {txStatus ? (
          <div className="text-sm text-zinc-300">{txStatus}</div>
        ) : null}
      </div>

      {/* Receive modal */}
      {showReceive && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4">
          <div className="w-[520px] rounded-2xl bg-zinc-900 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Receive</h3>
              <button
                onClick={() => setShowReceive(false)}
                className="text-zinc-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-zinc-400">
              Use this address to receive ETH, USDT, and other tokens on Ethereum.
            </p>

            <div className="rounded-xl bg-zinc-950/40 p-4">
              <div className="text-xs text-zinc-400 mb-1">Your address</div>
              <div className="break-all font-mono text-sm">{address}</div>
              <button
                onClick={copyAddress}
                className="mt-3 rounded-lg bg-white px-4 py-2 text-black font-semibold"
              >
                Copy address
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send modal */}
      {showSend && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4">
          <div className="w-[520px] rounded-2xl bg-zinc-900 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Send</h3>
              <button
                onClick={() => setShowSend(false)}
                className="text-zinc-300 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-3">
              <div>
                <div className="text-xs text-zinc-400 mb-1">Token</div>
                <select
                  value={sendToken.symbol}
                  onChange={(e) => {
                    const t = TOKENS.find((x) => x.symbol === e.target.value);
                    if (t) setSendToken(t);
                  }}
                  className="w-full rounded-lg bg-zinc-950/40 px-3 py-2"
                >
                  {TOKENS.map((t) => (
                    <option key={t.key} value={t.symbol}>
                      {t.symbol} — {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="text-xs text-zinc-400 mb-1">To (address)</div>
                <input
                  value={sendTo}
                  onChange={(e) => setSendTo(e.target.value)}
                  placeholder="0x…"
                  className="w-full rounded-lg bg-zinc-950/40 px-3 py-2 font-mono text-sm"
                />
              </div>

              <div>
                <div className="text-xs text-zinc-400 mb-1">Amount</div>
                <input
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg bg-zinc-950/40 px-3 py-2"
                />
                <div className="text-xs text-zinc-500 mt-1">
                  Available:{" "}
                  {balances[sendToken.symbol]
                    ? Number(balances[sendToken.symbol]).toFixed(6)
                    : "0.000000"}{" "}
                  {sendToken.symbol}
                </div>
              </div>

              <button
                onClick={sendTx}
                className="rounded-xl bg-white px-4 py-3 text-black font-semibold"
              >
                Confirm send
              </button>

              <button
                onClick={() => setShowSend(false)}
                className="rounded-xl bg-zinc-800 px-4 py-3 text-white font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
