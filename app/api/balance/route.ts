// app/api/balance/route.ts
import { NextResponse } from "next/server";
import { createPublicClient, http, formatEther } from "viem";
import { mainnet } from "viem/chains";

export const runtime = "nodejs"; // important for viem/http on Vercel

function isEthAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address")?.trim();

    if (!address || !isEthAddress(address)) {
      return NextResponse.json(
        { error: "Invalid or missing address" },
        { status: 400 }
      );
    }

    // Public Ethereum RPC (works for simple reads)
    const client = createPublicClient({
      chain: mainnet,
      transport: http("https://cloudflare-eth.com"),
    });

    const balanceWei = await client.getBalance({ address: address as `0x${string}` });

    return NextResponse.json({
      address,
      chain: "ethereum",
      balanceWei: balanceWei.toString(),
      balanceEth: formatEther(balanceWei),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "Failed to fetch balance" },
      { status: 500 }
    );
  }
}
