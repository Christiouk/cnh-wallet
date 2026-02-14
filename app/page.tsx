"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth";

type TokenRow = {
  contractAddress: string;
  symbol: string;
  name: string;
  logo?: string | null;
  decimals: number;
  balanceRawHex: string;
  balanceFormatted: string;
  isNative?: boolean;
};

const APP_TITLE = "CNH Wallet";

function shortAddr(addr?: string | null) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function hexToBigIntSafe(hex: string): bigint {
  // Accepts "0x..." or nullish-ish values
  try {
    if (!hex || hex === "0x") return BigInt("0");
    return BigInt(hex);
  } catch {
    return BigInt("0");
  }
}

function pow10(decimals: number): bigint {
  // No bigint literals (avoids TS target issues)
  let p = BigInt("1");
  const ten = BigInt("10");
  for (let i = 0; i < decimals; i++) p = p * ten;
  return p;
}

function formatUnitsFromHex(hexAmount: string, decimals: number, maxDp = 6): string {
  const amount = hexToBigIntSafe(hexAmount);
  if (decimals <= 0) return amount.toString();

  const base = pow10(decimals);
  const whole = amount / base;
  const frac = amount % base;

  // pad fractional part
  const fracStrFull = frac.toString().padStart(decimals, "0");
  const fracTrimmed = fracStrFull.slice(0, Math.min(maxDp, decimals)).replace(/0+$/, "");
  return fracTrimmed ? `${whole.toString()}.${fracTrimmed}` : whole.toString();
}

async function rpc(url: string, method: string, params: any[] = []) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const data = await res.json();
  if (data?.error) throw new Error(data.error?.message || "RPC error");
  return data.result;
}

async function rpcBatch(url: string, calls: Array<{ id: number; method: string; params: any[] }>) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(
      calls.map((c) => ({ jsonrpc: "2.0", id: c.id, method: c.method, params: c.params }))
    ),
  });
  const data = await res.json();
  // Response is array of {id,result} in any order
  if (!Array.isArray(data)) throw new Error("Batch RPC error");
  return data as Array<{ id: number; result?: any; error?: any }>;
}

export default function Page() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();

  const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_KEY || "";
  const rpcUrl = useMemo(() => {
    // Ethereum mainnet (EVM). Later we can add Polygon/Arbitrum etc.
    if (!alchemyKey) return "";
    return `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`;
  }, [alchemyKey]);

  const activeWallet = wallets?.[0];
  const address = activeWallet?.address || "";

  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [error, setError] = useState<string>("");

  // Simple modals
  const [showReceive, setShowReceive] = useState(false);
  const [showSend, setShowSend] = useState(false);

  // Send form
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendToken, setSendToken] = useState<string>("NATIVE_ETH");
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<string>("");

  const primaryEmail = user?.email?.address || "";

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  }

  async function loadPortfolio() {
    setError("");
    if (!rpcUrl) {
      setError("Missing NEXT_PUBLIC_ALCHEMY_KEY (Vercel env var).");
      return;
    }
    if (!address) {
      setError("No wallet address found yet.");
      return;
    }

    setLoading(true);
    try {
      // 1) Native ETH balance
      const ethBalHex: string = await rpc(rpcUrl, "eth_getBalance", [address, "latest"]);
      const ethFormatted = formatUnitsFromHex(ethBalHex, 18, 6);

      const nativeRow: TokenRow = {
        contractAddress: "NATIVE_ETH",
        symbol: "ETH",
        name: "Ethereum",
        decimals: 18,
        balanceRawHex: ethBalHex,
        balanceFormatted: ethFormatted,
        isNative: true,
      };

      // 2) All ERC-20 token balances via Alchemy enhanced API
      // Returns MANY tokens (including dust / spam sometimes).
      const tokenBalancesResult = await rpc(rpcUrl, "alchemy_getTokenBalances", [address, "erc20"]);
      const rawBalances: Array<{ contractAddress: string; tokenBalance: string }> =
        tokenBalancesResult?.tokenBalances || [];

      // Filter out zero balances
      const nonZero = rawBalances.filter((t) => {
        const v = hexToBigIntSafe(t.tokenBalance);
        return v > BigInt("0");
      });

      // Limit metadata fetch so UI stays fast (you can raise later)
      const MAX_META = 60;
      const sliced = nonZero.slice(0, MAX_META);

      // 3) Batch metadata calls (much faster than 60 separate fetches)
      const batchCalls = sliced.map((t, i) => ({
        id: i + 10,
        method: "alchemy_getTokenMetadata",
        params: [t.contractAddress],
      }));

      const metaResp = await rpcBatch(rpcUrl, batchCalls);
      const metaByAddr = new Map<string, any>();

      for (let i = 0; i < sliced.length; i++) {
        const addr = sliced[i].contractAddress.toLowerCase();
        const found = metaResp.find((r) => r.id === i + 10);
        if (found?.result) metaByAddr.set(addr, found.result);
      }

      const tokenRows: TokenRow[] = sliced.map((t) => {
        const meta = metaByAddr.get(t.contractAddress.toLowerCase()) || {};
        const decimals = typeof meta.decimals === "number" ? meta.decimals : 18;
        const symbol = meta.symbol || "TOKEN";
        const name = meta.name || symbol;
        const logo = meta.logo || null;

        return {
          contractAddress: t.contractAddress,
          symbol,
          name,
          logo,
          decimals,
          balanceRawHex: t.tokenBalance,
          balanceFormatted: formatUnitsFromHex(t.tokenBalance, decimals, 6),
        };
      });

      // Sort by "largest" roughly (by raw bigint; ok for MVP)
      tokenRows.sort((a, b) => {
        const av = hexToBigIntSafe(a.balanceRawHex);
        const bv = hexToBigIntSafe(b.balanceRawHex);
        if (av === bv) return a.symbol.localeCompare(b.symbol);
        return bv > av ? 1 : -1;
      });

      setTokens([nativeRow, ...tokenRows]);
    } catch (e: any) {
      setError(e?.message || "Failed to load balances.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authenticated) return;
    if (!address) return;
    loadPortfolio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, address, rpcUrl]);

  async function sendEthViaPrivy() {
    setSendStatus("");
    if (!activeWallet?.getEthereumProvider) {
      setSendStatus("No Ethereum provider available for this wallet.");
      return;
    }
    if (!sendTo || !sendAmount) {
      setSendStatus("Enter recipient + amount.");
      return;
    }

    setSending(true);
    try {
      const provider = await activeWallet.getEthereumProvider();

      // Convert amount string to wei hex safely using BigInt() (no bigint literals).
      // NOTE: For MVP, we support up to 6 decimals input (e.g. 0.123456).
      const amt = sendAmount.trim();
      const parts = amt.split(".");
      const whole = parts[0] || "0";
      const frac = (parts[1] || "").slice(0, 6); // max 6 dp input
      const fracPadded = frac.padEnd(6, "0");
      const wei = BigInt(whole) * pow10(18) + BigInt(fracPadded) * pow10(12); // 6dp -> 18dp

      const valueHex = "0x" + wei.toString(16);

      const txHash = await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: address,
            to: sendTo,
            value: valueHex,
          },
        ],
      });

      setSendStatus(`Sent. Tx: ${txHash}`);
      // Refresh after send
      setTimeout(() => loadPortfolio(), 1500);
    } catch (e: any) {
      setSendStatus(e?.message || "Send failed.");
    } finally {
      setSending(false);
    }
  }

  // ---- UI ----

  if (!ready) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="opacity-70">Loading…</div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl bg-[#141414] border border-white/10 p-6 shadow-xl">
          <div className="text-2xl font-semibold">{APP_TITLE}</div>
          <div className="mt-2 text-sm text-white/60">
            Secure client wallet access (CNH).
          </div>

          <button
            onClick={login}
            className="mt-6 w-full rounded-xl bg-white text-black py-3 font-medium hover:opacity-90"
          >
            Log in / Create account
          </button>

          <div className="mt-4 text-xs text-white/40">
            By continuing you agree to CNH client terms (MVP).
          </div>
        </div>
      </div>
    );
  }

  const totalLine =
    tokens.length > 0
      ? `${tokens[0].balanceFormatted} ${tokens[0].symbol}`
      : loading
      ? "Loading…"
      : "—";

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        {/* Header (MetaMask-ish) */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-lg font-semibold">{APP_TITLE}</div>
            <div className="text-xs text-white/60">
              {primaryEmail ? primaryEmail : "Client"} • {shortAddr(address)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadPortfolio()}
              className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
              title="Refresh"
            >
              Refresh
            </button>
            <button
              onClick={logout}
              className="rounded-xl bg-white text-black px-3 py-2 text-xs font-medium hover:opacity-90"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Balance Card */}
        <div className="rounded-3xl bg-[#151515] border border-white/10 p-6 shadow-2xl">
          <div className="text-xs text-white/60">Balance</div>
          <div className="mt-2 text-4xl font-semibold tracking-tight">
            {loading ? "Loading…" : totalLine}
          </div>

          {error ? (
            <div className="mt-3 text-sm text-red-400">{error}</div>
          ) : (
            <div className="mt-3 text-xs text-white/50">
              Showing ETH + ERC-20 tokens (Alchemy).
            </div>
          )}

          {/* Actions row (MetaMask style) */}
          <div className="mt-6 grid grid-cols-4 gap-3">
            <ActionTile label="Buy" onClick={() => alert("Buy: connect your on-ramp later (MVP).")} />
            <ActionTile label="Swap" onClick={() => alert("Swap: coming next (MVP).")} />
            <ActionTile label="Send" onClick={() => setShowSend(true)} />
            <ActionTile label="Receive" onClick={() => setShowReceive(true)} />
          </div>
        </div>

        {/* Tokens list */}
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Tokens</div>
            <div className="text-xs text-white/50">
              {tokens.length > 0 ? `${tokens.length} assets` : ""}
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {loading && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                Loading token balances…
              </div>
            )}

            {!loading && tokens.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                No assets found yet.
              </div>
            )}

            {!loading &&
              tokens.map((t) => (
                <div
                  key={t.contractAddress}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#101010] p-4 hover:bg-[#141414]"
                >
                  <div className="flex items-center gap-3">
                    <TokenIcon symbol={t.symbol} logo={t.logo} />
                    <div>
                      <div className="text-sm font-medium">{t.name}</div>
                      <div className="text-xs text-white/50">{t.symbol}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {t.balanceFormatted} {t.symbol}
                    </div>
                    <div className="text-[11px] text-white/40">
                      {t.isNative ? "Native" : shortAddr(t.contractAddress)}
                    </div>
                  </div>
                </div>
              ))}
          </div>

          <div className="mt-3 text-[11px] text-white/40">
            Note: For speed, metadata is fetched for the first 60 non-zero tokens. We can increase this and/or add spam filtering.
          </div>
        </div>
      </div>

      {/* RECEIVE MODAL */}
      {showReceive && (
        <Modal title="Receive" onClose={() => setShowReceive(false)}>
          <div className="text-sm text-white/70">
            Share this address to receive funds:
          </div>

          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm break-all">
            {address}
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => copy(address)}
              className="flex-1 rounded-xl bg-white text-black py-3 font-medium hover:opacity-90"
            >
              Copy address
            </button>
            <button
              onClick={() => setShowReceive(false)}
              className="flex-1 rounded-xl border border-white/15 bg-white/5 py-3 font-medium hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* SEND MODAL */}
      {showSend && (
        <Modal title="Send" onClose={() => setShowSend(false)}>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-white/60 mb-1">Token</div>
              <select
                value={sendToken}
                onChange={(e) => setSendToken(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0f0f0f] px-3 py-3 text-sm"
              >
                <option value="NATIVE_ETH">ETH (native)</option>
                {/* For MVP: only ETH send. We’ll add ERC-20 send next. */}
              </select>
              <div className="text-[11px] text-white/40 mt-1">
                MVP: ETH send is enabled. ERC-20 sends next.
              </div>
            </div>

            <div>
              <div className="text-xs text-white/60 mb-1">To</div>
              <input
                value={sendTo}
                onChange={(e) => setSendTo(e.target.value)}
                placeholder="0x… recipient address"
                className="w-full rounded-xl border border-white/10 bg-[#0f0f0f] px-3 py-3 text-sm"
              />
            </div>

            <div>
              <div className="text-xs text-white/60 mb-1">Amount (ETH)</div>
              <input
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                placeholder="0.01"
                className="w-full rounded-xl border border-white/10 bg-[#0f0f0f] px-3 py-3 text-sm"
              />
              <div className="text-[11px] text-white/40 mt-1">
                Tip: Use up to 6 decimals for now (e.g. 0.123456).
              </div>
            </div>

            {sendStatus && <div className="text-sm text-white/80">{sendStatus}</div>}

            <div className="flex gap-2 pt-2">
              <button
                disabled={sending || sendToken !== "NATIVE_ETH"}
                onClick={sendEthViaPrivy}
                className="flex-1 rounded-xl bg-white text-black py-3 font-medium hover:opacity-90 disabled:opacity-40"
              >
                {sending ? "Sending…" : "Send"}
              </button>
              <button
                onClick={() => setShowSend(false)}
                className="flex-1 rounded-xl border border-white/15 bg-white/5 py-3 font-medium hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ActionTile({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl border border-white/10 bg-[#101010] py-4 text-sm font-medium hover:bg-[#141414]"
    >
      {label}
    </button>
  );
}

function TokenIcon({ symbol, logo }: { symbol: string; logo?: string | null }) {
  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={symbol} src={logo} className="h-9 w-9 rounded-full border border-white/10" />;
  }
  return (
    <div className="h-9 w-9 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-xs font-semibold">
      {symbol.slice(0, 3).toUpperCase()}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#141414] p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold">{title}</div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/15 bg-white/5 px-3 py-1 text-sm hover:bg-white/10"
          >
            Close
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
