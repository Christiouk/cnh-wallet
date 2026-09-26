import { TronWeb, utils } from 'tronweb';
import type { User } from '@privy-io/react-auth';
import { getEmbeddedTronWallet } from '../wallet/selection';

// Tether's supported-protocols registry; mainnet only. Never client supplied.
export const TRON_USDT = Object.freeze({
  symbol: 'USDT',
  network: 'tron',
  contract: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
  decimals: 6,
});
export const TRON_ASSETS = [
  TRON_USDT,
  { symbol: 'TRX', network: 'tron', decimals: 6 },
] as const;
export const MAX_ENERGY_FEE = 100_000_000; // Hard ceiling: 100 TRX; refuse larger estimates.
export const BANDWIDTH_BYTES = 1000; // Upper bound, verified against serialized signed transaction.
export function validTronAddress(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(value) &&
    TronWeb.isAddress(value)
  );
}
export function tronHex(address: string): string {
  if (!validTronAddress(address)) throw new Error('Invalid Tron address');
  return TronWeb.address.toHex(address).toLowerCase();
}
export function shortTronAddress(address: string) {
  return validTronAddress(address)
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : 'Tron wallet unavailable';
}
export function tronExplorer(kind: 'address' | 'transaction', value: string) {
  if (
    kind === 'address'
      ? !validTronAddress(value)
      : !/^[a-f0-9]{64}$/i.test(value)
  )
    throw new Error('Invalid explorer target');
  return `https://tronscan.org/#/${kind}/${value}`;
}
export function parseUsdt(value: string): bigint {
  if (!/^(0|[1-9]\d{0,70})(\.\d{1,6})?$/.test(value))
    throw new Error('Enter a positive amount with at most 6 decimal places');
  const [whole, fraction = ''] = value.split('.');
  const units = BigInt(whole) * 1_000_000n + BigInt(fraction.padEnd(6, '0'));
  if (units <= 0n || units >= 2n ** 256n)
    throw new Error('Invalid USDT amount');
  return units;
}
export function displayUnits(value: string) {
  const units = BigInt(value);
  const fraction = (units % 1_000_000n)
    .toString()
    .padStart(6, '0')
    .replace(/0+$/, '');
  return `${units / 1_000_000n}${fraction ? '.' + fraction : ''}`;
}
export function transferData(recipient: string, units: string) {
  if (tronHex(recipient) === '41' + '0'.repeat(40))
    throw new Error('Invalid Tron recipient');
  if (
    !/^\d+$/.test(units) ||
    BigInt(units) <= 0n ||
    BigInt(units) >= 2n ** 256n
  )
    throw new Error('Invalid amount');
  return (
    'a9059cbb' +
    tronHex(recipient).slice(2).padStart(64, '0') +
    BigInt(units).toString(16).padStart(64, '0')
  );
}
export type TronIdentity = { did: string; walletId: string; address: string };
export type UserSnapshot = Pick<User, 'id' | 'linkedAccounts'>;
export function selectTron(
  user: UserSnapshot | null,
  ready = true,
  authenticated = true,
) {
  const result = getEmbeddedTronWallet({ user, ready, authenticated });
  if (
    result.status === 'ready' &&
    (!validTronAddress(result.wallet.address) || !result.wallet.id)
  )
    return { status: 'unavailable' as const };
  return result;
}
export function identity(user: UserSnapshot): TronIdentity {
  const selected = selectTron(user);
  if (selected.status !== 'ready' || !selected.wallet.id)
    throw new Error('Tron wallet selection requires verification');
  return {
    did: user.id,
    walletId: selected.wallet.id,
    address: selected.wallet.address,
  };
}
export function assertContinuity(before: UserSnapshot, after: UserSnapshot) {
  const evm = (user: UserSnapshot) =>
    user.linkedAccounts
      .filter((a) => a.type === 'wallet' && a.chainType === 'ethereum')
      .map((a) =>
        JSON.stringify(
          a.type === 'wallet'
            ? [
                a.id,
                a.address.toLowerCase(),
                a.walletClientType,
                a.connectorType,
              ]
            : [],
        ),
      )
      .sort();
  if (
    before.id !== after.id ||
    JSON.stringify(evm(before)) !== JSON.stringify(evm(after))
  )
    throw new Error(
      'Account continuity could not be verified. Stop and contact support.',
    );
}
export type BalanceRead =
  | { status: 'ready'; units: string }
  | { status: 'unavailable' };
export type TronBalances = {
  trx: BalanceRead;
  usdt: BalanceRead;
  activated: boolean | null;
};
export type TronActivity = {
  hash: string;
  from: string;
  to: string;
  units: string;
  timestamp: number;
  status: 'indexed-confirmed';
};
export type UnsignedTron = {
  txID: string;
  raw_data_hex: string;
  raw_data: {
    contract: {
      type: string;
      parameter: {
        type_url: string;
        value: {
          owner_address: string;
          contract_address: string;
          data: string;
          call_value?: number;
        };
      };
    }[];
    ref_block_bytes: string;
    ref_block_hash: string;
    timestamp: number;
    expiration: number;
    fee_limit: number;
  };
  visible?: boolean;
};
export type SendIntent = TronIdentity & {
  recipient: string;
  units: string;
  feeLimit: number;
  bandwidthFee: number;
  expires: number;
  transaction: UnsignedTron;
  network: 'tron:mainnet';
};
export type SendQuote = {
  intent: SendIntent;
  ticket: string;
  applicationFee: '0';
  energy: number;
  bandwidth: number;
};
export type Confirmation = 'pending' | 'confirmed' | 'failed';

function onlyKeys(object: object, allowed: string[]) {
  if (Object.keys(object).some((k) => !allowed.includes(k)))
    throw new Error('Unexpected transaction field');
}
/** Validate JSON, protobuf bytes AND hash before any Privy signing request. */
export function validateTransaction(
  intent: SendIntent,
  expected: TronIdentity,
  now = Date.now(),
) {
  if (
    intent.network !== 'tron:mainnet' ||
    intent.did !== expected.did ||
    intent.walletId !== expected.walletId ||
    intent.address !== expected.address
  )
    throw new Error('Wallet context changed');
  tronHex(intent.address);
  const tx = intent.transaction;
  onlyKeys(tx, ['txID', 'raw_data_hex', 'raw_data', 'visible']);
  if (
    tx.visible === true ||
    !/^[a-f0-9]{64}$/i.test(tx.txID) ||
    !/^(?:[a-f0-9]{2})+$/i.test(tx.raw_data_hex)
  )
    throw new Error('Invalid transaction encoding');
  const raw = tx.raw_data;
  onlyKeys(raw, [
    'contract',
    'ref_block_bytes',
    'ref_block_hash',
    'timestamp',
    'expiration',
    'fee_limit',
  ]);
  if (
    !Number.isSafeInteger(intent.feeLimit) ||
    intent.feeLimit <= 0 ||
    intent.feeLimit > MAX_ENERGY_FEE ||
    raw.fee_limit !== intent.feeLimit ||
    !Number.isSafeInteger(intent.bandwidthFee) ||
    intent.bandwidthFee < 0 ||
    intent.bandwidthFee > 10_000_000
  )
    throw new Error('Invalid network fee bound');
  if (
    !Number.isSafeInteger(raw.timestamp) ||
    !Number.isSafeInteger(raw.expiration) ||
    raw.timestamp > now + 30_000 ||
    raw.timestamp < now - 300_000 ||
    raw.expiration <= now + 5_000 ||
    raw.expiration > now + 300_000 ||
    intent.expires !== raw.expiration
  )
    throw new Error('Review expired. Request a new review.');
  if (
    !/^[a-f0-9]{4}$/i.test(raw.ref_block_bytes) ||
    !/^[a-f0-9]{16}$/i.test(raw.ref_block_hash) ||
    raw.contract.length !== 1
  )
    throw new Error('Invalid transaction reference');
  const call = raw.contract[0];
  onlyKeys(call, ['type', 'parameter']);
  onlyKeys(call.parameter, ['type_url', 'value']);
  onlyKeys(call.parameter.value, [
    'owner_address',
    'contract_address',
    'data',
    'call_value',
  ]);
  const value = call.parameter.value;
  if (
    call.type !== 'TriggerSmartContract' ||
    call.parameter.type_url !==
      'type.googleapis.com/protocol.TriggerSmartContract' ||
    (value.call_value ?? 0) !== 0 ||
    value.owner_address.toLowerCase() !== tronHex(intent.address) ||
    value.contract_address.toLowerCase() !== tronHex(TRON_USDT.contract) ||
    value.data.toLowerCase() !== transferData(intent.recipient, intent.units)
  )
    throw new Error('Transaction does not match the reviewed USDT transfer');
  const pb = utils.transaction.txJsonToPb(tx);
  if (
    utils.transaction.txPbToRawDataHex(pb).toLowerCase() !==
      tx.raw_data_hex.toLowerCase() ||
    utils.transaction.txPbToTxID(pb).replace(/^0x/, '').toLowerCase() !==
      tx.txID.toLowerCase()
  )
    throw new Error('Transaction hash mismatch');
  if (tx.raw_data_hex.length / 2 + 70 > BANDWIDTH_BYTES)
    throw new Error('Transaction exceeds bandwidth estimate');
}
