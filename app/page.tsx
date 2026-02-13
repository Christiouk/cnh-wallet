"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";

export default function Home() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [balance, setBalance] = useState<string>("0");

  const rpcUrl =
    process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.ankr.com/eth";

  useEffect(() => {
    const fetchBalance = async () => {
      if (!user?.wallet?.address) return;

      try {
        const res = await fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_getBalance",
            params: [user.wallet.address, "latest"],
          }),
        });

        const data = await res.json();

        if (data.result) {
          const eth = parseInt(data.result, 16) / 1e18;
          setBalance(eth.toFixed(4));
        }
      } catch (err) {
        console.error("Balance error:", err);
      }
    };

    fetchBalance();
  }, [user, rpcUrl]);

  if (!ready) return null;

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <button
          onClick={login}
          className="rounded-xl bg-white px-6 py-3 text-black font-semibold"
        >
          Login to CNH Wallet
        </button>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="rounded-2xl bg-zinc-900 p-8 w-[420px] space-y-4">
        <h1 className="text-2xl font-bold">CNH Wallet</h1>

        <div>
          <p className="text-sm text-zinc-400">Email</p>
          <p>{user?.email?.address || "No email"}</p>
        </div>

        <div>
          <p className="text-sm text-zinc-400">Wallet</p>
          <p className="break-all">{user?.wallet?.address}</p>
        </div>

        <div>
          <p className="text-sm text-zinc-400">Balance</p>
          <p>{balance} ETH</p>
        </div>

        <button
          onClick={logout}
          className="mt-4 rounded-lg bg-white px-4 py-2 text-black"
        >
          Logout
        </button>
      </div>
    </main>
  );
}
