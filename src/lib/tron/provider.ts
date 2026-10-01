import {
  BANDWIDTH_BYTES,
  MAX_ENERGY_FEE,
  TRON_USDT,
  parseUsdt,
  tronHex,
  validTronAddress,
  transferData,
  validateTransaction,
  type TronBalances,
  type TronActivity,
  type TronIdentity,
  type SendIntent,
  type Confirmation,
} from './core';
// A fixed internal operation set. Nothing in the browser can choose a URL or RPC method.
export type Operation =
  | 'account'
  | 'balance'
  | 'decimals'
  | 'activity'
  | 'simulate'
  | 'parameters'
  | 'resources'
  | 'build'
  | 'broadcast'
  | 'receipt';
export type TronTransport = (
  operation: Operation,
  args: Record<string, unknown>,
) => Promise<any>;
function unavailable(): never {
  throw new Error('Tron provider temporarily unavailable');
}
function integer(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}
function uintResult(result: any) {
  if (
    result?.result?.result !== true ||
    !Array.isArray(result.constant_result) ||
    result.constant_result.length !== 1 ||
    !/^[a-f0-9]{64}$/i.test(result.constant_result[0])
  )
    unavailable();
  return BigInt('0x' + result.constant_result[0]).toString();
}
export async function readBalances(
  transport: TronTransport,
  owner: string,
): Promise<TronBalances> {
  tronHex(owner);
  const [account, token] = await Promise.allSettled([
    transport('account', { owner }).then((data) => {
      if (
        data?.success !== true ||
        !Array.isArray(data.data) ||
        data.data.length > 1
      )
        unavailable();
      if (data.data.length === 0) return { units: '0', activated: false };
      const a = data.data[0];
      if (
        a.address?.toLowerCase() !== tronHex(owner) ||
        (a.balance !== undefined && !integer(a.balance))
      )
        unavailable();
      return { units: String(a.balance ?? 0), activated: true };
    }),
    Promise.all([
      transport('balance', { owner }),
      transport('decimals', { owner }),
    ]).then(([balance, decimals]) => {
      if (uintResult(decimals) !== '6') unavailable();
      return uintResult(balance);
    }),
  ]);
  return {
    trx:
      account.status === 'fulfilled'
        ? { status: 'ready', units: account.value.units }
        : { status: 'unavailable' },
    usdt:
      token.status === 'fulfilled'
        ? { status: 'ready', units: token.value }
        : { status: 'unavailable' },
    activated: account.status === 'fulfilled' ? account.value.activated : null,
  };
}
export async function readActivity(
  transport: TronTransport,
  owner: string,
): Promise<TronActivity[]> {
  tronHex(owner);
  const result = await transport('activity', { owner });
  if (
    result?.success !== true ||
    !Array.isArray(result.data) ||
    result.data.length > 20
  )
    unavailable();
  return result.data.map((row: any) => {
    if (
      !/^[a-f0-9]{64}$/i.test(row.transaction_id) ||
      row.token_info?.address !== TRON_USDT.contract ||
      row.token_info?.decimals !== 6 ||
      row.type !== 'Transfer' ||
      !validTronAddress(row.from) ||
      !validTronAddress(row.to) ||
      (row.from !== owner && row.to !== owner) ||
      !/^\d+$/.test(row.value) ||
      BigInt(row.value) >= 2n ** 256n ||
      !integer(row.block_timestamp) ||
      row.block_timestamp === 0
    )
      unavailable();
    return {
      hash: row.transaction_id,
      from: row.from,
      to: row.to,
      units: row.value,
      timestamp: row.block_timestamp,
      status: 'indexed-confirmed',
    };
  });
}
export class ResourceRequired extends Error {
  constructor() {
    super(
      'Network resource required. This Tron address needs activation or more TRX before sending.',
    );
  }
}
export async function prepareSend(
  transport: TronTransport,
  owner: TronIdentity,
  recipient: string,
  amount: string,
) {
  if (tronHex(recipient) === '41' + '0'.repeat(40))
    throw new Error('Invalid Tron recipient');
  if (recipient === owner.address || recipient === TRON_USDT.contract)
    throw new Error(
      'Choose a recipient other than this wallet or the USDT contract',
    );
  const units = parseUsdt(amount).toString();
  const balances = await readBalances(transport, owner.address);
  if (
    balances.usdt.status !== 'ready' ||
    balances.trx.status !== 'ready' ||
    balances.activated === null
  )
    unavailable();
  if (BigInt(balances.usdt.units) < BigInt(units))
    throw new Error('Insufficient USDT balance');
  if (!balances.activated) throw new ResourceRequired();
  const [simulation, parameters, resources] = await Promise.all([
    transport('simulate', { owner: owner.address, recipient, units }),
    transport('parameters', {}),
    transport('resources', { owner: owner.address }),
  ]);
  if (
    simulation?.result?.result !== true ||
    !integer(simulation.energy_used) ||
    simulation.energy_used <= 0 ||
    simulation?.transaction?.ret?.some((r: any) => r.ret !== 'SUCCESS') ||
    (simulation.constant_result?.length && uintResult(simulation) !== '1')
  )
    throw new Error('Transfer simulation unavailable or rejected');
  const parameter = (key: string) => {
    const entries = parameters?.chainParameter?.filter(
      (p: any) => p.key === key,
    );
    if (
      entries?.length !== 1 ||
      !integer(entries[0].value) ||
      entries[0].value <= 0
    )
      unavailable();
    return entries[0].value as number;
  };
  if (
    !resources ||
    typeof resources !== 'object' ||
    Array.isArray(resources) ||
    resources.Error
  )
    unavailable();
  for (const key of [
    'EnergyLimit',
    'EnergyUsed',
    'NetLimit',
    'NetUsed',
    'freeNetLimit',
    'freeNetUsed',
  ])
    if (resources[key] !== undefined && !integer(resources[key])) unavailable();
  const energy = Math.ceil(simulation.energy_used * 1.2);
  const feeLimit = energy * parameter('getEnergyFee');
  const bandwidthFee = BANDWIDTH_BYTES * parameter('getTransactionFee');
  if (
    !Number.isSafeInteger(feeLimit) ||
    feeLimit > MAX_ENERGY_FEE ||
    bandwidthFee > 10_000_000
  )
    throw new Error('Network cost exceeds the A3 safety limit');
  // Conservative funded-TRX fallback. Do not assume rented/staked resources remain available.
  if (BigInt(balances.trx.units) < BigInt(feeLimit + bandwidthFee))
    throw new ResourceRequired();
  const built = await transport('build', {
    owner: owner.address,
    recipient,
    units,
    feeLimit,
  });
  if (built?.result?.result !== true || !built.transaction) unavailable();
  // FullNode commonly includes an empty ret array; it is not signing data.
  const { txID, raw_data, raw_data_hex, visible } = built.transaction;
  const intent: SendIntent = {
    ...owner,
    recipient,
    units,
    feeLimit,
    bandwidthFee,
    network: 'tron:mainnet',
    expires: raw_data?.expiration,
    transaction: {
      txID,
      raw_data,
      raw_data_hex,
      ...(visible === undefined ? {} : { visible }),
    },
  };
  validateTransaction(intent, owner);
  return {
    intent,
    applicationFee: '0' as const,
    energy,
    bandwidth: BANDWIDTH_BYTES,
  };
}
const TRANSFER_TOPIC =
  'ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
export async function confirmSend(
  transport: TronTransport,
  intent: SendIntent,
): Promise<Confirmation> {
  const receipt = await transport('receipt', { hash: intent.transaction.txID });
  if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt))
    unavailable();
  if (Object.keys(receipt).length === 0) return 'pending';
  if (
    receipt.id !== intent.transaction.txID ||
    !integer(receipt.blockNumber) ||
    !receipt.receipt?.result
  )
    unavailable();
  if (receipt.receipt.result !== 'SUCCESS') {
    // Known solidified execution failures only. A malformed/unknown status must
    // not suggest that it is safe to create a replacement payment.
    const failed = [
      'REVERT',
      'BAD_JUMP_DESTINATION',
      'OUT_OF_MEMORY',
      'PRECOMPILED_CONTRACT',
      'STACK_TOO_SMALL',
      'STACK_TOO_LARGE',
      'ILLEGAL_OPERATION',
      'STACK_OVERFLOW',
      'OUT_OF_ENERGY',
      'OUT_OF_TIME',
      'JVM_STACK_OVER_FLOW',
      'TRANSFER_FAILED',
      'INVALID_CODE',
    ];
    if (failed.includes(receipt.receipt.result)) return 'failed';
    unavailable();
  }
  const match = receipt.log?.some(
    (log: any) =>
      log.address?.toLowerCase() === tronHex(TRON_USDT.contract).slice(2) &&
      Array.isArray(log.topics) &&
      log.topics.length === 3 &&
      log.topics[0]?.toLowerCase() === TRANSFER_TOPIC &&
      log.topics[1]?.toLowerCase() ===
        tronHex(intent.address).slice(2).padStart(64, '0') &&
      log.topics[2]?.toLowerCase() ===
        tronHex(intent.recipient).slice(2).padStart(64, '0') &&
      log.data?.toLowerCase() ===
        BigInt(intent.units).toString(16).padStart(64, '0'),
  );
  if (!match) unavailable(); // Success without the intended transfer is never payment success.
  return 'confirmed';
}
export function callPayload(owner: string, recipient: string, units: string) {
  return {
    owner_address: tronHex(owner),
    contract_address: tronHex(TRON_USDT.contract),
    function_selector: 'transfer(address,uint256)',
    parameter: transferData(recipient, units).slice(8),
    visible: false,
  };
}
