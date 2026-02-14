"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth";

type TokenRow = {
  contractAddress: string;
  symbol: string;
  name: string;
  decimals: number;
  logo?: string;
  rawBalance: string; // hex or decimal string from API
  displayBalance: string;
};

const CHAIN = "Ethereum";
const ALCHEMY_BASE = (key: string) => `https://eth-mainnet.g.alchemy.com/v2/${key}`;

function shortAddr(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function copyToClipboard(text: string) {
  if (!text) return;
  navigator.clipboard?.writeText(text).catch(() => {});
}

function hexToBigInt(hex: string) {
  try {
    if (!hex) return BigInt(0);
    return BigInt(hex);
  } catch {
    return BigInt(0);
  }
}

function formatUnits(value: bigint, decimals: number, maxDp = 6) {
  const base = BigInt("10") ** BigInt(String(decimals));
  const whole = value / base;
  const fraction = value % base;

  const fracStr = fraction.toString().padStart(decimals, "0").slice(0, maxDp);
  const trimmed = fracStr.replace(/0+$/, "");
  return trimmed.length ? `${whole.toString()}.${trimmed}` : whole.toString();
}

async function jsonRpc(url: string, method: string, params: any[]) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`RPC failed: ${res.status}`);
  return res.json();
}

export default function Page() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();

  const embeddedWallet = useMemo(() => {
    // Prefer embedded wallet if present; fallback to first wallet
    const w = wallets?.find((x: any) => x.walletClientType === "privy");
    return w ?? wallets?.[0];
  }, [wallets]);

  const address = embeddedWallet?.address as string | undefined;
  const email = user?.email?.address ?? "";

  const [ethBalance, setEthBalance] = useState<string>("0");
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [balanceError, setBalanceError] = useState<string>("");

  // Modals
  const [showReceive, setShowReceive] = useState(false);
  const [showSend, setShowSend] = useState(false);

  // Send form
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendAsset, setSendAsset] = useState<"ETH" | string>("ETH"); // "ETH" or token contract
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState<string>("");

  const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_KEY || "";

  useEffect(() => {
    if (!address) return;

    (async () => {
      setLoadingBalances(true);
      setBalanceError("");

      try {
        // 1) ETH balance via JSON-RPC
        const rpcUrl = alchemyKey ? ALCHEMY_BASE(alchemyKey) : "https://cloudflare-eth.com";
        const ethRes = await jsonRpc(rpcUrl, "eth_getBalance", [address, "latest"]);
        const wei = hexToBigInt(ethRes?.result || "0x0");
        const eth = formatUnits(wei, 18, 6);
        setEthBalance(eth);
      } catch {
        setEthBalance("0");
      }

      try {
        // 2) Token balances via Alchemy REST (requires key)
        if (!alchemyKey) {
          setTokens([]);
          setBalanceError("Missing NEXT_PUBLIC_ALCHEMY_KEY (needed for token balances).");
          setLoadingBalances(false);
          return;
        }

        // Get all ERC-20 balances (Alchemy)
        const balancesUrl = `${ALCHEMY_BASE(alchemyKey)}/getTokenBalances?address=${address}`;
        const balancesRes = await fetch(balancesUrl);
        if (!balancesRes.ok) throw new Error("Token balances request failed");
        const balancesJson = await balancesRes.json();

        const tokenBalances: { contractAddress: string; tokenBalance: string }[] =
          balancesJson?.tokenBalances || [];

        // Filter out 0 balances
        const nonZero = tokenBalances.filter((t) => {
          const b = (t?.tokenBalance || "0x0").toLowerCase();
          return b !== "0x0" && b !== "0x" && b !== "0";
        });

        // Fetch metadata in parallel (cap to keep UI fast)
        const cap = nonZero.slice(0, 80);

        const meta = await Promise.all(
          cap.map(async (t) => {
            try {
              const metaUrl = `${ALCHEMY_BASE(alchemyKey)}/getTokenMetadata?contractAddress=${t.contractAddress}`;
              const r = await fetch(metaUrl);
              if (!r.ok) throw new Error("meta failed");
              const j = await r.json();

              const decimals = Number(j?.decimals ?? 18);
              const raw = t.tokenBalance || "0x0";
              const rawBig = hexToBigInt(raw);
              const display = formatUnits(rawBig, decimals, 6);

              const symbol = (j?.symbol || "").toString().trim() || "TOKEN";
              const name = (j?.name || "").toString().trim() || symbol;

              return {
                contractAddress: t.contractAddress,
                symbol,
                name,
                decimals,
                logo: j?.logo,
                rawBalance: raw,
                displayBalance: display,
              } as TokenRow;
            } catch {
              // If metadata fails, still show contract + raw
              const raw = t.tokenBalance || "0x0";
              const rawBig = hexToBigInt(raw);
              const display = formatUnits(rawBig, 18, 6);
              return {
                contractAddress: t.contractAddress,
                symbol: "TOKEN",
                name: shortAddr(t.contractAddress),
                decimals: 18,
                rawBalance: raw,
                displayBalance: display,
              } as TokenRow;
            }
          })
        );

        // Sort by symbol for clean look
        meta.sort((a, b) => a.symbol.localeCompare(b.symbol));

        setTokens(meta);
      } catch (e: any) {
        setTokens([]);
        setBalanceError(e?.message || "Failed to load token balances.");
      } finally {
        setLoadingBalances(false);
      }
    })();
  }, [address, alchemyKey]);

  async function doSend() {
    setSendMsg("");
    if (!address) return;

    const to = sendTo.trim();
    if (!to || !to.startsWith("0x") || to.length < 42) {
      setSendMsg("Enter a valid destination address.");
      return;
    }

    const amt = sendAmount.trim();
    if (!amt || Number.isNaN(Number(amt)) || Number(amt) <= 0) {
      setSendMsg("Enter a valid amount.");
      return;
    }

    if (!embeddedWallet?.getEip1193Provider) {
      setSendMsg("Wallet provider not available.");
      return;
    }

    setSending(true);

    try {
      const provider = await embeddedWallet.getEip1193Provider();

      // ETH send
      if (sendAsset === "ETH") {
        // Convert ETH -> wei using bigint without bigint literals
        const parts = amt.split(".");
        const whole = parts[0] || "0";
        const frac = (parts[1] || "").slice(0, 18).padEnd(18, "0");
        const wei = BigInt(whole) * (BigInt("10") ** BigInt("18")) + BigInt(frac || "0");

        const valueHex = "0x" + wei.toString(16);

        const txHash = await provider.request({
          method: "eth_sendTransaction",
          params: [
            {
              from: address,
              to,
              value: valueHex,
            },
          ],
        });

        setSendMsg(`Sent. Tx: ${String(txHash).slice(0, 12)}…`);
        setShowSend(false);
        setSendTo("");
        setSendAmount("");
        setSendAsset("ETH");
        return;
      }

      // ERC-20 send (basic transfer)
      // data = transfer(to, amount)
      // function selector: a9059cbb
      const token = tokens.find((t) => t.contractAddress.toLowerCase() === String(sendAsset).toLowerCase());
      const decimals = token?.decimals ?? 18;

      const parts = amt.split(".");
      const whole = parts[0] || "0";
      const frac = (parts[1] || "").slice(0, decimals).padEnd(decimals, "0");
      const amountBase = BigInt(whole) * (BigInt("10") ** BigInt(String(decimals))) + BigInt(frac || "0");

      const toPadded = to.toLowerCase().replace("0x", "").padStart(64, "0");
      const amtPadded = amountBase.toString(16).padStart(64, "0");
      const data = "0xa9059cbb" + toPadded + amtPadded;

      const txHash = await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: address,
            to: String(sendAsset),
            data,
            value: "0x0",
          },
        ],
      });

      setSendMsg(`Token sent. Tx: ${String(txHash).slice(0, 12)}…`);
      setShowSend(false);
      setSendTo("");
      setSendAmount("");
      setSendAsset("ETH");
    } catch (e: any) {
      setSendMsg(e?.message || "Send failed.");
    } finally {
      setSending(false);
    }
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading…
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl bg-zinc-900/60 border border-white/10 p-6">
          <div className="text-2xl font-semibold">CNH Wallet</div>
          <div className="text-white/60 mt-1">Secure client wallet access</div>

          <button
            onClick={login}
            className="mt-6 w-full rounded-2xl bg-white text-black font-semibold py-3"
          >
            Log in / Create wallet
          </button>

          <div className="mt-4 text-xs text-white/50">
            By continuing, you create or access your embedded wallet.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl bg-zinc-900/60 border border-white/10 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xl font-semibold">CNH Wallet</div>
            <div className="text-xs text-white/60 mt-1">{CHAIN}</div>
          </div>

          <button
            onClick={() => {
              if (address) copyToClipboard(address);
            }}
            className="text-xs rounded-xl bg-white/10 border border-white/10 px-3 py-2 hover:bg-white/15"
            title="Copy address"
          >
            {shortAddr(address)} ⧉
          </button>
        </div>

        {/* Account */}
        <div className="mt-4 text-sm text-white/70">
          <div className="truncate">{email}</div>
        </div>

        {/* Main balance */}
        <div className="mt-4">
          <div className="text-4xl font-semibold tracking-tight">
            {loadingBalances ? "…" : ethBalance} <span className="text-white/70">ETH</span>
          </div>
          <div className="text-xs text-white/50 mt-1">
            {balanceError ? balanceError : "Live balances (ETH + tokens)"}
          </div>
        </div>

        {/* Quick actions (MetaMask style) */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowSend(true)}
            className="rounded-2xl bg-white/10 border border-white/10 py-3 font-semibold hover:bg-white/15"
          >
            Send
          </button>
          <button
            onClick={() => setShowReceive(true)}
            className="rounded-2xl bg-white/10 border border-white/10 py-3 font-semibold hover:bg-white/15"
          >
            Receive
          </button>
        </div>

        {/* Token list */}
        <div className="mt-6">
          <div className="text-sm font-semibold text-white/80 mb-2">Tokens</div>

          <div className="rounded-2xl bg-black/30 border border-white/10 overflow-hidden">
            {/* ETH row */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-sm">
                  Ξ
                </div>
                <div>
                  <div className="text-sm font-semibold">Ethereum</div>
                  <div className="text-xs text-white/60">ETH</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{loadingBalances ? "…" : ethBalance}</div>
                <div className="text-xs text-white/60">ETH</div>
              </div>
            </div>

            {/* ERC-20 rows */}
            {tokens.length === 0 ? (
              <div className="px-4 py-4 text-xs text-white/60">
                {alchemyKey
                  ? (loadingBalances ? "Loading token balances…" : "No token balances found yet.")
                  : "Set NEXT_PUBLIC_ALCHEMY_KEY to show token balances."}
              </div>
            ) : (
              <div className="max-h-72 overflow-auto">
                {tokens.map((t) => (
                  <div
                    key={t.contractAddress}
                    className="flex items-center justify-between px-4 py-3 border-b border-white/10 last:border-b-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-xs">
                        {t.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={t.logo} alt={t.symbol} className="h-9 w-9 object-cover" />
                        ) : (
                          t.symbol.slice(0, 2)
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{t.name}</div>
                        <div className="text-xs text-white/60 truncate">{t.symbol}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-semibold">{t.displayBalance}</div>
                      <div className="text-xs text-white/60">{t.symbol}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="mt-6 w-full rounded-2xl bg-white text-black font-semibold py-3"
        >
          Logout
        </button>
      </div>

      {/* Receive Modal */}
      {showReceive && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-3xl bg-zinc-900 border border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">Receive</div>
              <button
                onClick={() => setShowReceive(false)}
                className="text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 text-xs text-white/60">Your wallet address</div>
            <div className="mt-2 rounded-2xl bg-black/40 border border-white/10 p-4 break-all">
              {address}
            </div>

            <button
              onClick={() => address && copyToClipboard(address)}
              className="mt-4 w-full rounded-2xl bg-white/10 border border-white/10 py-3 font-semibold hover:bg-white/15"
            >
              Copy address
            </button>

            <div className="mt-3 text-xs text-white/50">
              Tip: clients can send ETH or tokens to this address (same as MetaMask).
            </div>
          </div>
        </div>
      )}

      {/* Send Modal */}
      {showSend && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-3xl bg-zinc-900 border border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">Send</div>
              <button
                onClick={() => setShowSend(false)}
                className="text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <div className="text-xs text-white/60">Asset</div>
              <select
                value={sendAsset}
                onChange={(e) => setSendAsset(e.target.value)}
                className="mt-2 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 outline-none"
              >
                <option value="ETH">ETH</option>
                {tokens.map((t) => (
                  <option key={t.contractAddress} value={t.contractAddress}>
                    {t.symbol} — {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <div className="text-xs text-white/60">To address</div>
              <input
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
                placeholder="0x…"
                className="mt-2 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 outline-none"
              />
            </div>

            <div className="mt-4">
              <div className="text-xs text-white/60">Amount</div>
              <input
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                placeholder="0.00"
                className="mt-2 w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 outline-none"
              />
            </div>

            {sendMsg ? (
              <div className="mt-3 text-xs text-white/70 rounded-2xl bg-black/30 border border-white/10 p-3">
                {sendMsg}
              </div>
            ) : null}

            <button
              onClick={doSend}
              disabled={sending}
              className="mt-4 w-full rounded-2xl bg-white text-black font-semibold py-3 disabled:opacity-60"
            >
              {sending ? "Sending…" : "Confirm send"}
            </button>

            <div className="mt-3 text-xs text-white/50">
              Note: this sends on Ethereum mainnet using your embedded wallet signer (Privy).
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
