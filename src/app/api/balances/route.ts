import { NextRequest, NextResponse } from 'next/server';

const ERC20_ABI_BALANCE_OF = '0x70a08231';

interface BalanceResult {
  symbol: string;
  address: string | null;
  balance: string;
  error?: string;
}

async function rpcCall(method: string, params: unknown[]): Promise<unknown> {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
  if (!rpcUrl) {
    throw new Error('RPC_URL not configured');
  }

  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`RPC request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`RPC error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  return data.result;
}

async function getEthBalance(walletAddress: string): Promise<string> {
  const result = await rpcCall('eth_getBalance', [walletAddress, 'latest']);
  return BigInt(result as string).toString();
}

async function getErc20Balance(
  walletAddress: string,
  tokenAddress: string
): Promise<string> {
  const paddedAddress = walletAddress.slice(2).padStart(64, '0');
  const data = `${ERC20_ABI_BALANCE_OF}${paddedAddress}`;

  const result = await rpcCall('eth_call', [
    { to: tokenAddress, data },
    'latest',
  ]);

  const hex = result as string;
  if (!hex || hex === '0x' || hex === '0x0') return '0';
  return BigInt(hex).toString();
}

interface TokenRequest {
  symbol: string;
  address: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, tokens } = body as {
      walletAddress: string;
      tokens: TokenRequest[];
    };

    if (!walletAddress || !tokens || !Array.isArray(tokens)) {
      return NextResponse.json(
        { error: 'Invalid request: walletAddress and tokens are required' },
        { status: 400 }
      );
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    const results: BalanceResult[] = await Promise.all(
      tokens.map(async (token): Promise<BalanceResult> => {
        try {
          let balance: string;
          if (!token.address) {
            // Native ETH
            balance = await getEthBalance(walletAddress);
          } else {
            balance = await getErc20Balance(walletAddress, token.address);
          }
          return {
            symbol: token.symbol,
            address: token.address,
            balance,
          };
        } catch (err) {
          console.error(`Error fetching balance for ${token.symbol}:`, err);
          return {
            symbol: token.symbol,
            address: token.address,
            balance: '0',
            error: 'Failed to fetch balance',
          };
        }
      })
    );

    return NextResponse.json({ balances: results });
  } catch (err) {
    console.error('Balance API error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch balances. Please try again.' },
      { status: 500 }
    );
  }
}
