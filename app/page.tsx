"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { createPublicClient, http, formatEther } from "viem";
import { mainnet } from "viem/chains";

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
});

function shortAddr(addr?: string) {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export default function Page() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();

  const [balance, setBalance] = useState<string>("0");

  const wallet = wallets?.[0];
  const address = wallet?.address;

  useEffect(() => {
    async function loadBalance() {
      if (!address) return;

      try {
        const bal = await client.getBalance({
          address: address as `0x${string}`,
        });

        setBalance(formatEther(bal));
      } catch (err) {
        console.error("Balance error:", err);
        setBalance("0");
      }
    }

    loadBalance();
  }, [address]);

  if (!ready) return null;

  if (!authenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <button
          onClick={login}
          className="rounded-lg bg-white px-6 py-3 font-semibold text-black"
        >
          Login to CNH Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-black text-white">
      <div className="w-[380px] rounded-2xl bg-neutral-900 p-6 shadow-xl">
        {/* 🔹 VISIBLE DEPLOY TEST */}
        <h1 className="mb-4 text-2xl font-bold">CNH Wallet — V2 TEST</h1>

        <div className="mb-3 text-sm text-neutral-400">Email</div>
        <div className="mb-4">{user?.email?.address}</div>

        <div className="mb-3 text-sm text-neutral-400">Wallet</div>
        <div className="mb-4 break-all">{shortAddr(address)}</div>

        <div className="mb-3 text-sm text-neutral-400">Balance</div>
        <div className="mb-6">{Number(balance).toFixed(4)} ETH</div>

        <button
          onClick={logout}
          className="rounded-lg bg-white px-5 py-2 font-semibold text-black"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
