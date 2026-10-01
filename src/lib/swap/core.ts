import {
  decodeFunctionData,
  decodeFunctionResult,
  encodeFunctionData,
  erc20Abi,
  parseAbi,
  parseUnits,
} from 'viem';
export const ASSETS = {
  ETH: {
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    decimals: 18,
  },
  USDT: {
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    decimals: 6,
  },
  USDC: {
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    decimals: 6,
  },
} as const;
export type Asset = keyof typeof ASSETS;
// Current official Cancun AllowanceHolder deployment. Settler is resolved from the registry, never pinned here.
export const HOLDER = '0x0000000000001ff3684f28c67538d4d072c22734';
export const REGISTRY = '0x00000000000004533fe15556b1e086bb1a72ceae';
export const holderAbi = parseAbi([
  'function exec(address operator,address token,uint256 amount,address target,bytes data) payable returns (bytes)',
]);
export const settlerAbi = parseAbi([
  'function execute((address recipient,address buyToken,uint256 minAmountOut) slippage,bytes[] actions,bytes32 zid) payable returns (bool)',
]);
export type Intent = { sellAsset: Asset; buyAsset: Asset; amount: string };
export type Transaction = {
  chainId: 1;
  from: string;
  to: string;
  data: `0x${string}`;
  value: string;
  gas: string;
  gasPrice: string;
  nonce: number;
};
export type QuoteView = {
  id: string;
  intent: Intent;
  address: string;
  buyAmount: string;
  minimum: string;
  networkCost: string;
  providerFee: string;
  expiresAt: number;
  approval: 'none' | 'reset' | 'approve';
  balance: string;
  phase: 'price' | 'approval' | 'firm';
  approvalAmount?: string;
};
export function check(
  value: unknown,
  message = 'Swap validation failed',
): asserts value {
  if (!value) throw new Error(message);
}
export function same(a: unknown, b: string) {
  return typeof a === 'string' && a.toLowerCase() === b.toLowerCase();
}
export function units(v: unknown): bigint {
  check(typeof v === 'string' && /^\d{1,78}$/.test(v));
  const n = BigInt(v);
  check(n < 2n ** 256n);
  return n;
}
export function input(v: Record<string, unknown>): Intent {
  check(
    Object.keys(v).every((k) =>
      ['sellAsset', 'buyAsset', 'amount'].includes(k),
    ),
    'Unsupported Swap input',
  );
  check(
    typeof v.sellAsset === 'string' &&
      Object.hasOwn(ASSETS, v.sellAsset) &&
      typeof v.buyAsset === 'string' &&
      Object.hasOwn(ASSETS, v.buyAsset) &&
      v.sellAsset !== v.buyAsset,
    'Unsupported asset pair',
  );
  const i = v as Intent;
  check(
    typeof i.amount === 'string' &&
      i.amount.length <= 100 &&
      /^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(i.amount) &&
      (i.amount.split('.')[1]?.length || 0) <= ASSETS[i.sellAsset].decimals,
    'Enter a valid token amount',
  );
  check(
    sellUnits(i) > 0n && sellUnits(i) < 2n ** 256n,
    'Enter a positive amount',
  );
  return i;
}
export const sellUnits = (i: Intent) =>
  parseUnits(i.amount, ASSETS[i.sellAsset].decimals);
export function approval(i: Intent, current: bigint, spender: string) {
  check(
    i.sellAsset !== 'ETH' && same(spender, HOLDER),
    'Invalid allowance spender',
  );
  const required = sellUnits(i);
  if (current >= required) return null;
  const amount = i.sellAsset === 'USDT' && current > 0n ? 0n : required;
  return {
    amount,
    to: ASSETS[i.sellAsset].address,
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: 'approve',
      args: [HOLDER, amount],
    }),
    value: '0',
  };
}
export function validateQuote(
  r: any,
  i: Intent,
  taker: string,
  firm: boolean,
  settler?: string,
) {
  check(r?.liquidityAvailable === true, 'No liquidity available');
  check(
    same(r.sellToken, ASSETS[i.sellAsset].address) &&
      same(r.buyToken, ASSETS[i.buyAsset].address) &&
      units(r.sellAmount) === sellUnits(i),
  );
  // The v2 response need not echo chain/taker. They are fixed in our authenticated request;
  // any echoes must agree, and the final transaction and calldata bind the actual sender/recipient.
  check(
    (r.chainId === undefined || r.chainId === 1) &&
      (r.taker === undefined || same(r.taker, taker)),
  );
  const bought = units(r.buyAmount),
    minimum = r.minBuyAmount == null && !firm ? 0n : units(r.minBuyAmount);
  check(bought > 0n && minimum <= bought && (!firm || minimum > 0n));
  // Omitted slippageBps uses documented API default 100 bps. Reject a weaker floor.
  check(!minimum || minimum >= (bought * 9900n) / 10000n);
  check(
    r.fees &&
      (r.fees.integratorFee == null ||
        units(r.fees.integratorFee.amount) === 0n),
    'A3 fees are not supported',
  );
  check(
    r.permit2 == null &&
      r.issues &&
      r.issues.balance == null &&
      Array.isArray(r.issues.invalidSourcesPassed) &&
      !r.issues.invalidSourcesPassed.length,
  );
  const spender = r.issues.allowance?.spender || r.allowanceTarget;
  if (i.sellAsset !== 'ETH')
    check(
      same(spender, HOLDER) &&
        (!r.allowanceTarget || same(r.allowanceTarget, HOLDER)),
      'Invalid allowance spender',
    );
  else check(r.issues.allowance == null, 'ETH does not require approval');
  if (!firm) return;
  check(
    r.issues.simulationIncomplete === false && r.issues.allowance == null,
    'Swap simulation unavailable',
  );
  const tx = r.transaction;
  check(
    tx &&
      typeof tx.data === 'string' &&
      /^0x(?:[0-9a-f]{2})+$/i.test(tx.data) &&
      tx.data.length <= 262146,
  );
  check(
    (tx.from === undefined || same(tx.from, taker)) &&
      (tx.chainId === undefined || tx.chainId === 1),
  );
  check(
    units(tx.value) === (i.sellAsset === 'ETH' ? sellUnits(i) : 0n),
    'Unexpected ETH value',
  );
  check(
    !!settler &&
      /^0x[0-9a-f]{40}$/i.test(settler) &&
      !same(settler, HOLDER),
  );
  let calldata = tx.data as `0x${string}`;
  if (i.sellAsset === 'ETH' && same(tx.to, settler!)) {
    // Native direct-Settler variant documented by 0x. No approval.
  } else {
    check(same(tx.to, HOLDER), 'Unexpected Swap router');
    const decoded = decodeFunctionData({ abi: holderAbi, data: calldata });
    const [operator, token, amount, target, data] = decoded.args;
    check(
      same(operator, settler!) &&
        same(target, settler!) &&
        same(
          token,
          i.sellAsset === 'ETH'
            ? '0x0000000000000000000000000000000000000000'
            : ASSETS[i.sellAsset].address,
        ) &&
        amount === sellUnits(i),
    );
    calldata = data;
  }
  const decoded = decodeFunctionData({ abi: settlerAbi, data: calldata });
  const [slippage, actions] = decoded.args;
  check(
    same(slippage.recipient, taker) &&
      same(slippage.buyToken, ASSETS[i.buyAsset].address) &&
      slippage.minAmountOut === minimum &&
      actions.length > 0 &&
      actions.length <= 128,
    'Unsafe output protection',
  );
}
export function matchTransaction(actual: any, expected: Transaction) {
  check(
    actual &&
      same(actual.from, expected.from) &&
      same(actual.to, expected.to) &&
      same(actual.input, expected.data) &&
      BigInt(actual.value) === BigInt(expected.value) &&
      BigInt(actual.nonce) === BigInt(expected.nonce) &&
      (actual.chainId === undefined || BigInt(actual.chainId) === 1n),
    'Transaction does not match this Swap',
  );
}

// Approval and router calls have different ABIs. Never treat empty router data as success.
export function validateSimulation(to: string, data: unknown) {
  check(typeof data === 'string' && /^0x(?:[0-9a-f]{2})*$/i.test(data));
  if (same(to, ASSETS.USDT.address) && data === '0x') return;
  let result = data as `0x${string}`;
  if (same(to, HOLDER))
    result = decodeFunctionResult({
      abi: holderAbi,
      functionName: 'exec',
      data: result,
    });
  check(
    decodeFunctionResult({
      abi: settlerAbi,
      functionName: 'execute',
      data: result,
    }) === true,
    'Transaction simulation failed',
  );
}
