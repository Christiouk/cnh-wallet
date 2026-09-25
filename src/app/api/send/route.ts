import { NextResponse } from 'next/server';
import { ApiError, body, failure, guard, keys } from '../../../lib/server/http';
import { balance, mainnet, quantity, rpc } from '../../../lib/server/ethereum';
import {
  buildSend,
  receiptStage,
  type SendInput,
} from '../../../lib/wallet/send';
import { CURATED_TOKENS } from '../../../lib/tokens';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    guard(request, 'send-read', 120);
    const input = await body(request);
    if (input.action === 'receipt') {
      keys(input, ['action', 'hash']);
      if (
        typeof input.hash !== 'string' ||
        !/^0x[0-9a-f]{64}$/i.test(input.hash)
      )
        throw new ApiError(400, 'INVALID_HASH', 'Invalid transaction hash');
      await mainnet();
      const receipt = await rpc('eth_getTransactionReceipt', [input.hash]);
      return NextResponse.json(
        { status: receiptStage(receipt, input.hash) },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }
    keys(input, ['action', 'sender', 'recipient', 'symbol', 'amount']);
    if (
      input.action !== 'preview' ||
      ['sender', 'recipient', 'symbol', 'amount'].some(
        (k) => typeof input[k] !== 'string',
      )
    )
      throw new ApiError(400, 'INVALID_INPUT', 'Invalid transfer');
    let transfer;
    try {
      transfer = buildSend(input as SendInput);
    } catch (e) {
      throw new ApiError(400, 'INVALID_TRANSFER', (e as Error).message);
    }
    await mainnet();
    const { token, units, transaction } = transfer;
    const tx = {
      from: input.sender,
      to: transaction.to,
      value: `0x${transaction.value.toString(16)}`,
      ...('data' in transaction ? { data: transaction.data } : {}),
    };
    const [eth, asset, gas, price] = await Promise.all([
      balance(CURATED_TOKENS[0], input.sender as `0x${string}`),
      token.isNative
        ? Promise.resolve(units)
        : balance(token, input.sender as `0x${string}`),
      rpc('eth_estimateGas', [tx]).then(quantity),
      rpc('eth_gasPrice', []).then(quantity),
    ]);
    if (gas <= BigInt(0) || price <= BigInt(0))
      throw new ApiError(502, 'INVALID_GAS', 'Network cost unavailable');
    const estimatedNetworkCost =
      (gas * price * BigInt(120) + BigInt(99)) / BigInt(100);
    if (asset < units)
      throw new ApiError(
        400,
        'INSUFFICIENT_ASSET',
        'Insufficient token balance',
      );
    if (eth < estimatedNetworkCost + (token.isNative ? units : BigInt(0)))
      throw new ApiError(
        400,
        'INSUFFICIENT_ETH',
        'Insufficient ETH for the amount and estimated network cost',
      );
    if (!token.isNative) {
      const result = await rpc('eth_call', [tx, 'latest']);
      if (result !== '0x' && quantity(result) !== BigInt(1))
        throw new ApiError(
          400,
          'TRANSFER_REJECTED',
          'Token transfer simulation failed',
        );
    }
    return NextResponse.json(
      { estimatedNetworkCost: estimatedNetworkCost.toString(), chainId: 1 },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (e) {
    return failure(e);
  }
}
