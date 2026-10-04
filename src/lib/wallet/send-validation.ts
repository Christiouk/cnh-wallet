import type { SendInput } from './send';

export const VALIDATION_AMOUNT = '0.000001';
export const VALIDATION_MAX_FEE = BigInt('3000000000000');
export type ValidationSigning = { gasLimit: string; gasPrice: string; nonce: number; expiresAt: number };

// Check again at the signing boundary, independent of the review's fee estimate.
export function validationTransaction(input: SendInput, value: ValidationSigning) {
  if (input.symbol !== 'ETH' || input.amount !== VALIDATION_AMOUNT ||
      input.sender.toLowerCase() !== input.recipient.toLowerCase() ||
      value.gasLimit !== '21000' || !/^\d{1,20}$/.test(value.gasPrice) ||
      !Number.isSafeInteger(value.nonce) || value.nonce < 0 ||
      !Number.isSafeInteger(value.expiresAt) || value.expiresAt <= Date.now())
    throw new Error('The approved validation intent is unavailable or changed');
  const gasLimit = BigInt(value.gasLimit), gasPrice = BigInt(value.gasPrice);
  if (gasPrice <= BigInt(0) || gasLimit * gasPrice > VALIDATION_MAX_FEE)
    throw new Error('The network fee exceeds the approved limit');
  return { type: 0 as const, gasLimit, gasPrice, nonce: value.nonce };
}
