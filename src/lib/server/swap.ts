import 'server-only';
import { randomUUID } from 'node:crypto';
import {
  decodeFunctionResult,
  encodeFunctionData,
  erc20Abi,
  formatUnits,
  parseAbi,
} from 'viem';
import { ApiError } from './http';
import {
  ASSETS,
  HOLDER,
  REGISTRY,
  approval,
  check,
  input,
  matchTransaction,
  same,
  sellUnits,
  units,
  validateQuote,
  validateSimulation,
  type Intent,
  type QuoteView,
  type Transaction,
} from '../swap/core';
import type { BuyOwner } from '../buy/model';
export function swapConfiguration() {
  const e = process.env;
  const enabled =
    e.A3_SWAP_ENABLED === 'true' &&
    e.A3_SWAP_VERIFIED === 'true' &&
    e.VERCEL_ENV !== 'production' &&
    !!e.ZEROX_API_KEY &&
    !!e.ETHEREUM_RPC_URL &&
    /^https:\/\/[^/]+$/.test(e.A3_SWAP_ORIGIN || '');
  return { enabled, origin: e.A3_SWAP_ORIGIN || '' };
}
export function requireSwap() {
  if (!swapConfiguration().enabled)
    throw new ApiError(
      503,
      'SWAP_UNAVAILABLE',
      'Swap currently unavailable',
    );
}
// Both 0x and RPC responses are bounded before JSON parsing; redirects cannot leak keys.
export async function boundedJson(url: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(10000),
  });
  check(response.ok, 'Swap provider unavailable');
  const reader = response.body?.getReader();
  check(reader);
  let size = 0,
    result = '';
  const decoder = new TextDecoder();
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > 524288) {
        await reader.cancel();
        throw new Error('Provider response too large');
      }
      result += decoder.decode(next.value, { stream: true });
    }
    return JSON.parse(result + decoder.decode());
  } finally {
    reader.releaseLock();
  }
}
export async function swapRpc(method: string, params: unknown[]) {
  const result = await boundedJson(process.env.ETHEREUM_RPC_URL!, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  check(
    result && !result.error && 'result' in result,
    'Ethereum preflight unavailable',
  );
  return result.result;
}
const hex = (n: bigint) => `0x${n.toString(16)}`;
async function mainnet() {
  check(
    BigInt(await swapRpc('eth_chainId', [])) === 1n,
    'Ethereum mainnet required',
  );
}
async function amountOf(asset: keyof typeof ASSETS, owner: string) {
  return BigInt(
    await swapRpc(
      asset === 'ETH' ? 'eth_getBalance' : 'eth_call',
      asset === 'ETH'
        ? [owner, 'latest']
        : [
            {
              to: ASSETS[asset].address,
              data: encodeFunctionData({
                abi: erc20Abi,
                functionName: 'balanceOf',
                args: [owner as `0x${string}`],
              }),
            },
            'latest',
          ],
    ),
  );
}
async function allowance(i: Intent, owner: string) {
  if (i.sellAsset === 'ETH') return 0n;
  return BigInt(
    await swapRpc('eth_call', [
      {
        to: ASSETS[i.sellAsset].address,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'allowance',
          args: [owner as `0x${string}`, HOLDER],
        }),
      },
      'latest',
    ]),
  );
}
const registryAbi = parseAbi([
  'function ownerOf(uint256 tokenId) view returns (address)',
]);
async function currentSettler() {
  const result = await swapRpc('eth_call', [
    {
      to: REGISTRY,
      data: encodeFunctionData({
        abi: registryAbi,
        functionName: 'ownerOf',
        args: [2n],
      }),
    },
    'latest',
  ]);
  const value = decodeFunctionResult({
    abi: registryAbi,
    functionName: 'ownerOf',
    data: result,
  });
  check(!same(value, '0x0000000000000000000000000000000000000000'));
  check(
    (await swapRpc('eth_getCode', [value, 'latest'])) !== '0x',
    'Swap router unavailable',
  );
  return value;
}
async function provider(
  kind: 'price' | 'quote',
  i: Intent,
  owner: BuyOwner,
) {
  const params = new URLSearchParams({
    chainId: '1',
    sellToken: ASSETS[i.sellAsset].address,
    buyToken: ASSETS[i.buyAsset].address,
    sellAmount: sellUnits(i).toString(),
    taker: owner.address,
    recipient: owner.address,
  });
  return boundedJson(
    `https://api.0x.org/swap/allowance-holder/${kind}?${params}`,
    {
      headers: {
        '0x-api-key': process.env.ZEROX_API_KEY!,
        '0x-version': 'v2',
      },
    },
  );
}
export const getIndicativePrice = (i: Intent, owner: BuyOwner) =>
  provider('price', i, owner);
export const getFirmQuote = (i: Intent, owner: BuyOwner) =>
  provider('quote', i, owner);
type Flow = {
  owner: BuyOwner;
  i: Intent;
  view: QuoteView;
  expires: number;
  state:
    | 'price'
    | 'approval'
    | 'firm'
    | 'issued-approval'
    | 'issued-swap'
    | 'approved'
    | 'confirmed'
    | 'failed';
  quote?: any;
  tx?: Transaction;
  hash?: string;
  busy?: boolean;
};
// Deliberately single-process controlled validation only. A cold start rejects unknown sessions.
// A distributed atomic store is a release prerequisite; production execution is disabled.
const flows = new Map<string, Flow>();
const userLimits = new Map<string, { count: number; until: number }>();
export function userLimit(did: string) {
  const now = Date.now();
  for (const [id, v] of userLimits)
    if (v.until <= now) userLimits.delete(id);
  const v = userLimits.get(did) || { count: 0, until: now + 60000 };
  check(
    v.count < 20 && (userLimits.has(did) || userLimits.size < 2048),
    'Please wait before retrying',
  );
  v.count++;
  userLimits.set(did, v);
}
function get(id: unknown, owner: BuyOwner) {
  check(typeof id === 'string' && id.length < 80, 'Invalid Swap session');
  const f = flows.get(id);
  check(f && f.expires > Date.now(), 'Swap session expired');
  check(
    f.owner.did === owner.did &&
      f.owner.walletId === owner.walletId &&
      same(f.owner.address, owner.address),
    'Wallet changed',
  );
  return f;
}
function summary(
  id: string,
  i: Intent,
  owner: BuyOwner,
  r: any,
  balance: bigint,
): QuoteView {
  let providerFee = 'Not reported';
  if (r.fees?.zeroExFee) {
    const a = Object.entries(ASSETS).find(([, v]) =>
      same(r.fees.zeroExFee.token, v.address),
    );
    check(a, 'Unknown provider fee');
    providerFee = `${formatUnits(units(r.fees.zeroExFee.amount), a[1].decimals)} ${a[0]}`;
  } else providerFee = '0';
  const gas = r.transaction?.gas ?? r.gas,
    price = r.transaction?.gasPrice ?? r.gasPrice;
  return {
    id,
    intent: i,
    address: owner.address,
    buyAmount: r.buyAmount,
    minimum: r.minBuyAmount || '0',
    networkCost: gas && price ? (units(gas) * units(price)).toString() : '',
    providerFee,
    expiresAt: Date.now() + 60000,
    approval: 'none',
    balance: balance.toString(),
    phase: 'price',
  };
}
export async function price(raw: Record<string, unknown>, owner: BuyOwner) {
  requireSwap();
  const i = input(raw);
  await mainnet();
  const now = Date.now();
  for (const [id, f] of flows) if (f.expires <= now) flows.delete(id);
  check(flows.size < 2048, 'Please retry later');
  const [r, balance, allowed] = await Promise.all([
    getIndicativePrice(i, owner),
    amountOf(i.sellAsset, owner.address),
    allowance(i, owner.address),
  ]);
  check(balance >= sellUnits(i), 'Insufficient sell-asset balance');
  validateQuote(r, i, owner.address, false);
  const id = randomUUID(),
    view = summary(id, i, owner, r, balance);
  if (i.sellAsset !== 'ETH' && allowed < sellUnits(i))
    view.approval =
      i.sellAsset === 'USDT' && allowed > 0n ? 'reset' : 'approve';
  flows.set(id, {
    owner,
    i,
    view,
    state: 'price',
    expires: now + 86400000,
  });
  return view;
}
async function preflight(
  f: Flow,
  tx: Pick<Transaction, 'to' | 'data' | 'value'>,
): Promise<Transaction> {
  await mainnet();
  const wire = {
    from: f.owner.address,
    to: tx.to,
    data: tx.data,
    value: hex(BigInt(tx.value)),
  };
  const [asset, eth, gasRaw, priceRaw, nonceRaw, result] =
    await Promise.all([
      amountOf(f.i.sellAsset, f.owner.address),
      amountOf('ETH', f.owner.address),
      swapRpc('eth_estimateGas', [wire]),
      swapRpc('eth_gasPrice', []),
      swapRpc('eth_getTransactionCount', [f.owner.address, 'pending']),
      swapRpc('eth_call', [wire, 'latest']),
    ]);
  check(asset >= sellUnits(f.i), 'Insufficient sell-asset balance');
  const gas = (BigInt(gasRaw) * 120n + 99n) / 100n,
    gasPrice = BigInt(priceRaw),
    nonce = Number(BigInt(nonceRaw));
  check(gas > 0n && gasPrice > 0n && Number.isSafeInteger(nonce));
  check(
    eth >= BigInt(tx.value) + gas * gasPrice,
    'Insufficient ETH for network gas',
  );
  validateSimulation(tx.to, result);
  return {
    ...tx,
    from: f.owner.address,
    chainId: 1,
    gas: gas.toString(),
    gasPrice: gasPrice.toString(),
    nonce,
  };
}
export async function prepare(id: unknown, owner: BuyOwner) {
  requireSwap();
  const f = get(id, owner);
  check(
    !f.busy && ['price', 'approved'].includes(f.state),
    'Swap step already used',
  );
  if (f.state === 'price')
    check(f.view.expiresAt > Date.now(), 'Quote expired');
  f.busy = true;
  try {
    await mainnet();
    const allowed = await allowance(f.i, owner.address);
    const a =
      f.i.sellAsset === 'ETH' ? null : approval(f.i, allowed, HOLDER);
    if (a) {
      // Revalidate provider allowance field before offering a permission transaction.
      const r = await getIndicativePrice(f.i, owner);
      validateQuote(r, f.i, owner.address, false);
      check(same(r.issues.allowance?.spender || r.allowanceTarget, HOLDER));
      f.tx = await preflight(f, a);
      f.state = 'approval';
      f.view = {
        ...f.view,
        phase: 'approval',
        approval: a.amount === 0n ? 'reset' : 'approve',
        approvalAmount: a.amount.toString(),
        expiresAt: Date.now() + 30000,
        networkCost: (BigInt(f.tx.gas) * BigInt(f.tx.gasPrice)).toString(),
      };
    } else {
      const [r, settler] = await Promise.all([
        getFirmQuote(f.i, owner),
        currentSettler(),
      ]);
      validateQuote(r, f.i, owner.address, true, settler);
      f.quote = r;
      f.tx = await preflight(f, {
        to: r.transaction.to,
        data: r.transaction.data,
        value: r.transaction.value,
      });
      f.state = 'firm';
      f.view = {
        ...summary(f.view.id, f.i, owner, r, BigInt(f.view.balance)),
        phase: 'firm',
        expiresAt: Date.now() + 30000,
        networkCost: (BigInt(f.tx.gas) * BigInt(f.tx.gasPrice)).toString(),
      };
    }
    return f.view;
  } finally {
    f.busy = false;
  }
}
export async function authorize(id: unknown, owner: BuyOwner) {
  requireSwap();
  const f = get(id, owner);
  check(
    !f.busy &&
      ['approval', 'firm'].includes(f.state) &&
      f.view.expiresAt > Date.now(),
    'Quote expired or already used',
  );
  f.busy = true;
  try {
    if (f.state === 'firm') {
      validateQuote(
        f.quote,
        f.i,
        owner.address,
        true,
        await currentSettler(),
      );
      if (f.i.sellAsset !== 'ETH')
        check(
          (await allowance(f.i, owner.address)) >= sellUnits(f.i),
          'Allowance required',
        );
    }
    const checked = await preflight(f, f.tx!);
    check(
      f.view.expiresAt > Date.now() &&
        checked.nonce === f.tx!.nonce &&
        BigInt(checked.gas) * BigInt(checked.gasPrice) <=
          BigInt(f.view.networkCost),
      'Quote expired; review updated network cost',
    );
    f.tx = checked;
    f.hash = undefined;
    f.state = f.state === 'approval' ? 'issued-approval' : 'issued-swap';
    return { transaction: checked, expiresAt: f.view.expiresAt };
  } finally {
    f.busy = false;
  }
}
export async function receipt(id: unknown, hash: unknown, owner: BuyOwner) {
  requireSwap();
  const f = get(id, owner);
  check(
    typeof hash === 'string' && /^0x[0-9a-f]{64}$/i.test(hash),
    'Invalid transaction hash',
  );
  check(
    !f.busy &&
      [
        'issued-approval',
        'issued-swap',
        'approved',
        'confirmed',
        'failed',
      ].includes(f.state),
    'No submitted transaction',
  );
  if (
    f.hash === hash &&
    ['approved', 'confirmed', 'failed'].includes(f.state)
  )
    return {
      status: f.state === 'approved' ? 'approval-confirmed' : f.state,
    };
  f.busy = true;
  try {
    check(!f.hash || f.hash === hash, 'Transaction hash changed');
    await mainnet();
    const [actual, mined] = await Promise.all([
      swapRpc('eth_getTransactionByHash', [hash]),
      swapRpc('eth_getTransactionReceipt', [hash]),
    ]);
    if (!actual) return { status: 'confirming' };
    matchTransaction(actual, f.tx!);
    check(same(actual.hash, hash));
    f.hash = hash;
    if (!mined) return { status: 'confirming' };
    check(
      same(mined.transactionHash, hash) &&
        same(mined.from, owner.address) &&
        same(mined.to, f.tx!.to) &&
        /^0x[0-9a-f]+$/i.test(mined.blockNumber),
    );
    if (mined.status === '0x0') {
      f.state = 'failed';
      return { status: 'failed' };
    }
    check(mined.status === '0x1', 'Unknown transaction status');
    if (f.state === 'issued-approval') {
      f.state = 'approved';
      return { status: 'approval-confirmed' };
    }
    f.state = 'confirmed';
    return { status: 'confirmed' };
  } finally {
    f.busy = false;
  }
}
