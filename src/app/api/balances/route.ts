import { NextResponse } from 'next/server';
import { CURATED_TOKENS } from '../../../lib/tokens';
import { address, body, failure, guard, keys } from '../../../lib/server/http';
import { balance, mainnet } from '../../../lib/server/ethereum';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    guard(request, 'balances', 30);
    const input = await body(request);
    keys(input, ['walletAddress']);
    address(input.walletAddress);
    const wallet = input.walletAddress;
    await mainnet();
    const balances = await Promise.all(
      CURATED_TOKENS.map(async (token) => {
        try {
          return {
            symbol: token.symbol,
            address: token.address,
            balance: (await balance(token, wallet)).toString(),
          };
        } catch {
          return {
            symbol: token.symbol,
            address: token.address,
            balance: null,
            error: 'Balance unavailable',
          };
        }
      }),
    );
    return NextResponse.json(
      { network: 'ethereum', chainId: 1, balances },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    return failure(e);
  }
}
