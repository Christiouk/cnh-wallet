import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { walletAddress } = await req.json();
    if (!walletAddress) {
      return NextResponse.json({ transactions: [] });
    }

    const apiKey = process.env.ETHERSCAN_API_KEY || '';
    const url = `https://api.etherscan.io/api?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&page=1&offset=10&sort=desc&apikey=${apiKey}`;

    const response = await fetch(url, { next: { revalidate: 30 } });
    if (!response.ok) {
      throw new Error('Etherscan request failed');
    }

    const data = await response.json();
    if (data.status !== '1') {
      // No transactions or error — return empty list gracefully
      return NextResponse.json({ transactions: [] });
    }

    const transactions = (data.result || []).slice(0, 8).map((tx: any) => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      timeStamp: tx.timeStamp,
      isError: tx.isError === '1',
      functionName: tx.functionName || '',
    }));

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Transactions API error:', error);
    return NextResponse.json({ transactions: [] });
  }
}
