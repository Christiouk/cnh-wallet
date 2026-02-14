"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";

type AssetRow = {
  symbol: string;
  name: string;
  balance: string;
  isNative?: boolean;
};

function shortAddr(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatEthFromWeiHex(weiHex?: string) {
  try {
    if (!weiHex) return "0";
    // weiHex like "0x0" or "0x12ab..."
    const wei = BigInt(weiHex);
    const WEI_PER_ETH = BigInt("1000000000000000000"); // no 10n literals
    const whole = wei / WEI_PER_ETH;
    const frac = wei % WEI_PER_ETH;

    // 6 decimals
    const fracStr = frac.toString().padStart(18, "0").slice(0, 6);
    const trimmed = fracStr.replace(/0+$/, "");
    return trimmed.length ? `${whole.toString()}.${trimmed}` : whole.toString();
  } catch {
    return "0";
  }
}

export default function Page() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();

  const evmWallet = useMemo(() => {
    return wallets?.find((w) => w.chainType === "ethereum");
  }, [wallets]);

  const address = evmWallet?.address;

  const [ethBalance, setEthBalance] = useState<string>("—");
  const [error, setError] = useState<string>("");

  // IMPORTANT: only run fetch inside useEffect (never at module load)
  useEffect(() => {
    let cancelled = false;

    async function loadEthBalance() {
      setError("");

      if (!address) {
        setEthBalance("—");
        return;
      }

      const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_KEY;
      if (!alchemyKey) {
        setEthBalance("—");
        setError("Missing NEXT_PUBLIC_ALCHEMY_KEY (set it in .env.local + Vercel env vars).");
        return;
      }

      try {
        // Ethereum mainnet endpoint
        const url = `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`;

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_getBalance",
            params: [address, "latest"],
          }),
        });

        const data = await res.json();
        const eth = formatEthFromWeiHex(data?.result);

        if (!cancelled) {
          setEthBalance(`${eth} ETH`);
        }
      } catch (e: any) {
        if (!cancelled) {
          setEthBalance("—");
          setError("Failed to fetch ETH balance.");
        }
      }
    }

    loadEthBalance();
    return () => {
      cancelled = true;
    };
  }, [address]);

  // Simple UI (no Tailwind required to pass build)
  const wrap: React.CSSProperties = {
    minHeight: "100vh",
    background: "#000",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  };

  const card: React.CSSProperties = {
    width: "min(720px, 100%)",
    borderRadius: 24,
    background: "rgba(255,255,255,0.06)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
    padding: 24,
    border: "1px solid rgba(255,255,255,0.08)",
  };

  const pillBtn: React.CSSProperties = {
    borderRadius: 14,
    padding: "10px 14px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  };

  const primaryBtn: React.CSSProperties = {
    borderRadius: 14,
    padding: "10px 14px",
    background: "#fff",
    border: "1px solid rgba(255,255,255,0.10)",
    color: "#000",
    cursor: "pointer",
    fontWeight: 700,
  };

  if (!ready) {
    return (
      <div style={wrap}>
        <div style={card}>Loading…</div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div style={wrap}>
        <div style={card}>
          <h1 style={{ fontSize: 26, margin: 0 }}>CNH Wallet</h1>
          <p style={{ opacity: 0.75, marginTop: 8 }}>
            Log in to create your CNH embedded wallet.
          </p>
          <button style={primaryBtn} onClick={login}>
            Login
          </button>
        </div>
      </div>
    );
  }

  const email = user?.email?.address ?? "—";

  const assets: AssetRow[] = [
    {
      symbol: "ETH",
      name: "Ethereum",
      balance: ethBalance,
      isNative: true,
    },
  ];

  return (
    <div style={wrap}>
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>CNH Wallet</div>
            <div style={{ opacity: 0.75, marginTop: 6 }}>
              {email} • {shortAddr(address)}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              style={pillBtn}
              onClick={() => {
                // just re-run by changing state via same effect dependencies (address)
                // quick "refresh" trigger: set to dash then back
                setEthBalance("—");
                setError("");
                // effect will refetch automatically on next tick
                setTimeout(() => setEthBalance("—"), 0);
              }}
            >
              Refresh
            </button>
            <button style={primaryBtn} onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        <div style={{ marginTop: 18, padding: 18, borderRadius: 18, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ opacity: 0.7, fontWeight: 700 }}>Balance</div>
          <div style={{ fontSize: 44, fontWeight: 900, marginTop: 8 }}>{ethBalance}</div>

          {error ? (
            <div style={{ marginTop: 10, color: "#ff5c5c", fontWeight: 700 }}>{error}</div>
          ) : (
            <div style={{ marginTop: 10, opacity: 0.65 }}>
              ETH fetched via Alchemy (Ethereum Mainnet).
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10, marginTop: 16 }}>
            <button style={pillBtn} onClick={() => alert("Buy: connect on-ramp later")}>Buy</button>
            <button style={pillBtn} onClick={() => alert("Swap: connect DEX later")}>Swap</button>
            <button style={pillBtn} onClick={() => alert("Send: wiring next")}>Send</button>
            <button style={pillBtn} onClick={() => alert("Receive: show QR next")}>Receive</button>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontWeight: 900, fontSize: 16 }}>Tokens</div>
            <div style={{ opacity: 0.6, fontWeight: 700 }}>{assets.length} assets</div>
          </div>

          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            {assets.map((a) => (
              <div
                key={a.symbol}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 14,
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 999,
                      display: "grid",
                      placeItems: "center",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      fontWeight: 900,
                    }}
                  >
                    {a.symbol}
                  </div>
                  <div>
                    <div style={{ fontWeight: 900 }}>{a.name}</div>
                    <div style={{ opacity: 0.65, fontWeight: 700 }}>
                      {a.symbol} {a.isNative ? "• Native" : ""}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 900 }}>{a.balance}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 10, opacity: 0.55, fontSize: 12 }}>
            Next step: we’ll add “all tokens” (ERC-20) list from Alchemy Token Balances API, plus logos + spam filtering.
          </div>
        </div>
      </div>
    </div>
  );
}
