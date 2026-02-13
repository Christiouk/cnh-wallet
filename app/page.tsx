"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

export default function Page() {
  const { ready, authenticated, user, logout } = usePrivy();

  const [balance, setBalance] = useState<string>("Loading...");

  useEffect(() => {
    async function fetchBalance() {
      if (!user?.wallet?.address) return;

      try {
        const res = await fetch(process.env.NEXT_PUBLIC_ETH_RPC_URL as string, {
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

        if (data?.result) {
          const eth = parseInt(data.result, 16) / 1e18;
          setBalance(`${eth.toFixed(4)} ETH`);
        } else {
          setBalance("Error fetching balance");
        }
      } catch (err) {
        setBalance("RPC error");
      }
    }

    fetchBalance();
  }, [user]);

  if (!ready) return null;

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Not authenticated</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <div className="max-w-md bg-zinc-900 rounded-2xl p-6 space-y-4">
        <h1 className="text-xl font-semibold">Client Dashboard</h1>

        <div>
          <p className="text-sm text-zinc-400">Email</p>
          <p>{user?.email?.address}</p>
        </div>

        <div>
          <p className="text-sm text-zinc-400">Wallet</p>
          <p className="break-all">{user?.wallet?.address}</p>
        </div>

        <div>
          <p className="text-sm text-zinc-400">Balance</p>
          <p>{balance}</p>
        </div>

        <button
          onClick={logout}
          className="bg-white text-black px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
