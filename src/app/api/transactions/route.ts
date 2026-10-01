import { NextResponse } from 'next/server';
import {
  address,
  ApiError,
  failure,
  guard,
  jsonFetch,
} from '../../../lib/server/http';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  try {
    guard(request, 'activity', 15);
    const params = new URL(request.url).searchParams;
    if (
      [...params.keys()].some((k) => k !== 'address') ||
      params.getAll('address').length !== 1
    )
      throw new ApiError(400, 'INVALID_INPUT', 'Expected one wallet address');
    const wallet = params.get('address');
    address(wallet);
    const key = process.env.ETHERSCAN_API_KEY;
    if (!key)
      throw new ApiError(
        503,
        'ACTIVITY_UNAVAILABLE',
        'Activity temporarily unavailable',
      );
    const query = new URLSearchParams({
      chainid: '1',
      module: 'account',
      action: 'txlist',
      address: wallet,
      startblock: '0',
      endblock: '99999999',
      page: '1',
      offset: '25',
      sort: 'desc',
      apikey: key,
    });
    const data = await jsonFetch(`https://api.etherscan.io/v2/api?${query}`);
    const empty =
      data?.status === '0' &&
      data?.message === 'No transactions found' &&
      Array.isArray(data.result) &&
      data.result.length === 0;
    if (!empty && (data?.status !== '1' || !Array.isArray(data.result)))
      throw new ApiError(
        502,
        'ACTIVITY_UNAVAILABLE',
        'Activity temporarily unavailable',
      );
    const transactions = data.result.map((tx: Record<string, unknown>) => {
      if (
        typeof tx.hash !== 'string' ||
        !/^0x[0-9a-f]{64}$/i.test(tx.hash) ||
        typeof tx.value !== 'string' ||
        !/^\d{1,78}$/.test(tx.value) ||
        typeof tx.timeStamp !== 'string' ||
        !/^\d{1,12}$/.test(tx.timeStamp) ||
        !['0', '1'].includes(String(tx.isError)) ||
        typeof tx.confirmations !== 'string' ||
        !/^\d+$/.test(tx.confirmations)
      )
        throw new Error('Malformed activity');
      address(tx.from);
      if (tx.to !== '') address(tx.to);
      const outgoing = tx.from.toLowerCase() === wallet.toLowerCase();
      if (!outgoing && String(tx.to).toLowerCase() !== wallet.toLowerCase())
        throw new Error('Unrelated activity');
      const native = BigInt(tx.value) > BigInt(0) || tx.input === '0x';
      return {
        hash: tx.hash,
        timestamp: Number(tx.timeStamp) * 1000,
        direction: outgoing ? 'outgoing' : 'incoming',
        asset: native ? 'ETH' : null,
        amount: native ? tx.value : null,
        status:
          tx.isError === '1'
            ? 'failed'
            : BigInt(tx.confirmations) > BigInt(0)
              ? 'confirmed'
              : 'submitted',
      };
    });
    return NextResponse.json(
      {
        transactions,
        coverage:
          'Normal Ethereum transactions only; token transfers and internal transfers are not indexed.',
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    return failure(e);
  }
}
