import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeFunctionData, encodeAbiParameters } from 'viem';
import {
  ASSETS,
  HOLDER,
  approval,
  input,
  sellUnits,
  validateQuote,
  validateSimulation,
  holderAbi,
  settlerAbi,
  matchTransaction,
  type Intent,
} from '../src/lib/swap/core';
import { owner, settler, quote } from './fixtures/swap';
for (const sellAsset of Object.keys(ASSETS) as (keyof typeof ASSETS)[])
  for (const buyAsset of Object.keys(ASSETS) as (keyof typeof ASSETS)[])
    if (sellAsset !== buyAsset)
      test(`${sellAsset} → ${buyAsset}: validated native/ERC-20 route and output floor`, () => {
        const i = input({ sellAsset, buyAsset, amount: '1' });
        validateQuote(quote(i), i, owner, true, settler);
      });
test('reject arbitrary token, taker, chain, same token and non-decimal/overprecision amounts', () => {
  const i = { sellAsset: 'USDT', buyAsset: 'ETH', amount: '1' };
  for (const patch of [
    { sellAsset: 'TRX' },
    { buyAsset: HOLDER },
    { buyAsset: 'USDT' },
    { chainId: 137 },
    { taker: settler },
    { amount: '1.0000001' },
    { amount: '-1' },
    { amount: 'NaN' },
    { amount: '1e3' },
    { amount: '0' },
  ])
    assert.throws(() => input({ ...i, ...patch }));
});
test('wrong router, ETH value, amount, output, chain, simulation and provider fee are rejected', () => {
  const i = input({ sellAsset: 'ETH', buyAsset: 'USDT', amount: '1' }),
    r = quote(i);
  for (const patch of [
    { liquidityAvailable: false },
    { sellAmount: '1' },
    { buyToken: ASSETS.USDC.address },
    { taker: settler },
    { chainId: 10 },
    { minBuyAmount: '1' },
    { fees: { integratorFee: { amount: '1' } } },
    { issues: { ...r.issues, simulationIncomplete: true } },
    { transaction: { ...r.transaction, to: HOLDER } },
    { transaction: { ...r.transaction, value: '2' } },
  ])
    assert.throws(() =>
      validateQuote({ ...r, ...patch }, i, owner, true, settler),
    );
});
test('calldata independently enforces recipient, buy token, spend amount and dynamic Settler', () => {
  const i = input({ sellAsset: 'USDT', buyAsset: 'USDC', amount: '1' });
  for (const patch of [
    { recipient: settler },
    { buyToken: ASSETS.ETH.address },
    { minAmountOut: 1n },
  ]) {
    const data = encodeFunctionData({
      abi: settlerAbi,
      functionName: 'execute',
      args: [
        {
          recipient: owner,
          buyToken: ASSETS.USDC.address,
          minAmountOut: 990000n,
          ...patch,
        } as any,
        ['0x12345678'],
        ('0x' + '0'.repeat(64)) as `0x${string}`,
      ],
    });
    const r = quote(i);
    r.transaction.data = encodeFunctionData({
      abi: holderAbi,
      functionName: 'exec',
      args: [settler, ASSETS.USDT.address, 1000000n, settler, data],
    });
    assert.throws(() => validateQuote(r, i, owner, true, settler));
  }
  const r = quote(i);
  assert.throws(() => validateQuote(r, i, owner, true, owner));
});
test('only AllowanceHolder exact approvals; USDT zero-reset; native ETH needs none', () => {
  const i = input({ sellAsset: 'USDT', buyAsset: 'ETH', amount: '5' });
  assert.equal(approval(i, 0n, HOLDER)?.amount, 5000000n);
  assert.equal(approval(i, 1n, HOLDER)?.amount, 0n);
  assert.equal(approval(i, 5000000n, HOLDER), null);
  assert.throws(() => approval(i, 0n, settler));
  assert.throws(() => approval({ ...i, sellAsset: 'ETH' }, 0n, HOLDER));
  assert.equal(
    approval({ ...i, sellAsset: 'USDC' }, 1n, HOLDER)?.amount,
    5000000n,
  );
});
test('forged or old transaction cannot confirm a Swap', () => {
  const tx = {
    chainId: 1 as const,
    from: owner,
    to: HOLDER,
    data: '0x1234' as const,
    value: '0',
    nonce: 4,
    gas: '100000',
    gasPrice: '1',
  };
  const actual = {
    from: owner,
    to: HOLDER,
    input: tx.data,
    value: '0x0',
    nonce: '0x4',
    chainId: '0x1',
  };
  matchTransaction(actual, tx);
  for (const patch of [
    { nonce: '0x3' },
    { chainId: '0xa' },
    { from: settler },
    { input: '0x5678' },
    { value: '0x1' },
  ])
    assert.throws(() => matchTransaction({ ...actual, ...patch }, tx));
});

test('current native ETH AllowanceHolder wrapper uses zero token, exact value/amount and current Settler', () => {
  const i = input({ sellAsset: 'ETH', buyAsset: 'USDC', amount: '1' }),
    r = quote(i),
    inner = r.transaction.data;
  r.transaction.to = HOLDER;
  r.transaction.data = encodeFunctionData({
    abi: holderAbi,
    functionName: 'exec',
    args: [
      settler,
      '0x0000000000000000000000000000000000000000',
      sellUnits(i),
      settler,
      inner,
    ],
  });
  validateQuote(r, i, owner, true, settler);
  r.transaction.data = encodeFunctionData({
    abi: holderAbi,
    functionName: 'exec',
    args: [settler, ASSETS.USDT.address, sellUnits(i), settler, inner],
  });
  assert.throws(() => validateQuote(r, i, owner, true, settler));
});

test('simulation decodes wrapped Settler success and USDT empty return, rejects false or empty router results', () => {
  const yes = encodeAbiParameters([{ type: 'bool' }], [true]);
  const no = encodeAbiParameters([{ type: 'bool' }], [false]);
  const wrapped = (data: `0x${string}`) =>
    encodeAbiParameters([{ type: 'bytes' }], [data]);
  validateSimulation(HOLDER, wrapped(yes));
  validateSimulation(settler, yes);
  validateSimulation(ASSETS.USDC.address, yes);
  validateSimulation(ASSETS.USDT.address, '0x');
  for (const [to, result] of [
    [HOLDER, wrapped(no)],
    [HOLDER, yes],
    [HOLDER, '0x'],
    [settler, '0x'],
    [settler, no],
    [ASSETS.USDC.address, '0x'],
    [ASSETS.USDT.address, no],
  ])
    assert.throws(() => validateSimulation(to, result));
});
