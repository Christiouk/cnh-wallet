import { encodeFunctionData, erc20Abi } from 'viem';
import { ApiError, jsonFetch } from './http';
import type { Token } from '../tokens';

// A fixed server-configured endpoint only. No URL or method is accepted from callers.
export async function rpc(
  method:
    | 'eth_chainId'
    | 'eth_getBalance'
    | 'eth_getCode'
    | 'eth_getTransactionCount'
    | 'eth_call'
    | 'eth_estimateGas'
    | 'eth_gasPrice'
    | 'eth_getTransactionReceipt',
  params: unknown[],
) {
  const url = process.env.ETHEREUM_RPC_URL || process.env.NEXT_PUBLIC_RPC_URL;
  if (!url)
    throw new ApiError(
      503,
      'RPC_NOT_CONFIGURED',
      'Ethereum provider unavailable',
    );
  const data = await jsonFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if (data?.error || !data || !('result' in data))
    throw new ApiError(
      502,
      'RPC_ERROR',
      'Ethereum provider could not complete the request',
    );
  return data.result;
}
export function quantity(value: unknown): bigint {
  if (
    typeof value !== 'string' ||
    !/^0x[0-9a-f]+$/i.test(value) ||
    value.length > 66
  )
    throw new ApiError(
      502,
      'INVALID_RPC_RESPONSE',
      'Invalid Ethereum provider response',
    );
  return BigInt(value);
}
export async function mainnet() {
  if (quantity(await rpc('eth_chainId', [])) !== BigInt(1))
    throw new ApiError(
      503,
      'WRONG_NETWORK',
      'Ethereum mainnet provider required',
    );
}
export async function balance(token: Token, wallet: `0x${string}`) {
  return quantity(
    await (token.isNative
      ? rpc('eth_getBalance', [wallet, 'latest'])
      : rpc('eth_call', [
          {
            to: token.address,
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: 'balanceOf',
              args: [wallet],
            }),
          },
          'latest',
        ])),
  );
}
