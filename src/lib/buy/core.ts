import { isAddress } from 'viem';
import { validTronAddress } from '../tron/core';
import { ApiError, keys } from '../server/http';
import {
  PAIRS,
  METHODS,
  type BuyNetwork,
  type BuyInput,
  type BuyOwner,
  type BuyStatus,
} from './model';
export * from './model';
export function pair(
  network: unknown,
  asset: unknown,
): asserts network is BuyNetwork {
  if (!PAIRS.includes(`${network}:${asset}`))
    throw new ApiError(
      400,
      'UNSUPPORTED_PAIR',
      'This asset and network are not available for Buy',
    );
}
export function buyInput(value: Record<string, unknown>): BuyInput {
  keys(value, ['network', 'asset', 'amount', 'paymentMethod']);
  pair(value.network, value.asset);
  if (
    typeof value.amount !== 'string' ||
    !/^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(value.amount) ||
    Number(value.amount) <= 0
  )
    throw new ApiError(
      400,
      'INVALID_AMOUNT',
      'Enter a positive GBP amount with up to two decimal places',
    );
  if (
    typeof value.paymentMethod !== 'string' ||
    !Object.hasOwn(METHODS, value.paymentMethod)
  )
    throw new ApiError(
      400,
      'INVALID_PAYMENT',
      'Choose a supported payment method',
    );
  return value as BuyInput;
}
export function resolveBuyWallet(
  did: string,
  accounts: unknown[],
  network: BuyNetwork,
): BuyOwner {
  const wallets = accounts
    .filter(
      (a): a is Record<string, unknown> => !!a && typeof a === 'object',
    )
    .filter(
      (a) =>
        a.type === 'wallet' &&
        a.chain_type === network &&
        a.connector_type === 'embedded' &&
        ['privy', 'privy-v2'].includes(String(a.wallet_client_type)),
    );
  if (!wallets.length && network === 'tron')
    throw new ApiError(409, 'TRON_NOT_ENABLED', 'Enable Tron first');
  const w = wallets[0];
  if (
    wallets.length !== 1 ||
    typeof w?.id !== 'string' ||
    !w.id ||
    typeof w.address !== 'string' ||
    !(network === 'tron'
      ? validTronAddress(w.address)
      : isAddress(w.address))
  )
    throw new ApiError(
      409,
      'WALLET_UNAVAILABLE',
      'Your wallet selection needs verification',
    );
  return { did, walletId: w.id, address: w.address };
}
// Provider order evidence must match every server-bound field. Unknown schema fails closed.
export function orderStatus(
  order: Record<string, unknown>,
  input: BuyInput,
  owner: BuyOwner,
  id: string,
): BuyStatus {
  const sameAddress =
    typeof order.walletAddress === 'string' &&
    (input.network === 'ethereum'
      ? order.walletAddress.toLowerCase() === owner.address.toLowerCase()
      : order.walletAddress === owner.address);
  if (
    order.partnerOrderId !== id ||
    !sameAddress ||
    order.network !== input.network ||
    order.cryptoCurrency !== input.asset ||
    order.fiatCurrency !== 'GBP' ||
    order.fiatAmount !== Number(input.amount) ||
    order.isBuyOrSell !== 'BUY'
  )
    return 'unavailable';
  switch (order.status) {
    case 'COMPLETED':
      return 'completed';
    case 'FAILED':
    case 'REFUNDED':
      return 'failed';
    case 'CANCELLED':
      return 'cancelled';
    case 'EXPIRED':
      return 'expired';
    case 'AWAITING_PAYMENT_FROM_USER':
      return 'started';
    case 'PAYMENT_DONE_MARKED_BY_USER':
    case 'PROCESSING':
    case 'PENDING_DELIVERY_FROM_TRANSAK':
    case 'ON_HOLD_PENDING_DELIVERY_FROM_TRANSAK':
      return 'processing';
    default:
      return 'unavailable';
  }
}
export function widgetUrl(value: unknown): string {
  try {
    if (typeof value !== 'string' || value.length > 8192) throw new Error();
    const url = new URL(value);
    if (
      url.origin !== 'https://global-stg.transak.com' ||
      url.pathname !== '/' ||
      url.username ||
      url.password ||
      url.hash ||
      !url.searchParams.get('sessionId')
    )
      throw new Error();
    return value;
  } catch {
    throw new ApiError(
      502,
      'INVALID_SESSION',
      'Secure checkout is unavailable',
    );
  }
}
