import {
  encodeFunctionData,
  erc20Abi,
  isAddress,
  parseUnits,
  zeroAddress,
} from 'viem';
import { CURATED_TOKENS } from '../tokens';
export type SendInput = {
  sender: string;
  recipient: string;
  symbol: string;
  amount: string;
};
export type SendStage =
  | 'review'
  | 'requesting-signature'
  | 'submitted'
  | 'confirming'
  | 'confirmed'
  | 'failed';
export function buildSend(input: SendInput) {
  if (
    !isAddress(input.sender) ||
    !isAddress(input.recipient) ||
    input.recipient.toLowerCase() === zeroAddress
  )
    throw new Error('Enter a valid, nonzero Ethereum address');
  const token = CURATED_TOKENS.find((token) => token.symbol === input.symbol);
  if (!token || token.chainId !== 1) throw new Error('Unsupported asset');
  if (
    typeof input.amount !== 'string' ||
    input.amount.length > 100 ||
    !/^\d+(\.\d+)?$/.test(input.amount) ||
    (input.amount.split('.')[1]?.length || 0) > token.decimals
  )
    throw new Error(`Enter an amount with at most ${token.decimals} decimals`);
  const units = parseUnits(input.amount, token.decimals);
  if (units <= BigInt(0) || units >= BigInt(2) ** BigInt(256))
    throw new Error('Amount must be positive and within the supported range');
  const transaction = token.isNative
    ? {
        to: input.recipient as `0x${string}`,
        value: units,
        chainId: 1 as const,
      }
    : {
        to: token.address as `0x${string}`,
        value: BigInt(0),
        chainId: 1 as const,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'transfer',
          args: [input.recipient as `0x${string}`, units],
        }),
      };
  return { token, units, transaction };
}
export function receiptStage(receipt: unknown, hash: string): SendStage {
  if (receipt === null) return 'confirming';
  if (!receipt || typeof receipt !== 'object')
    throw new Error('Invalid receipt');
  const r = receipt as Record<string, unknown>;
  if (
    r.transactionHash !== hash ||
    typeof r.blockNumber !== 'string' ||
    !/^0x[0-9a-f]+$/i.test(r.blockNumber)
  )
    throw new Error('Invalid receipt');
  if (r.status === '0x1') return 'confirmed';
  if (r.status === '0x0') return 'failed';
  throw new Error('Invalid receipt status');
}
// The only signing boundary: one full-amount transfer, with the explicit resolved signer.
export async function submitSend(
  input: SendInput,
  send: (
    tx: ReturnType<typeof buildSend>['transaction'],
    options: { address: string },
  ) => Promise<{ hash: string }>,
) {
  return send(buildSend(input).transaction, { address: input.sender });
}
