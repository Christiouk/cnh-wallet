import assert from 'node:assert/strict';
import { test } from 'node:test';
import { decodeFunctionData, erc20Abi, parseUnits } from 'viem';
import {
  buildSend,
  receiptStage,
  submitSend,
  type SendInput,
} from '../src/lib/wallet/send';
import { CURATED_TOKENS } from '../src/lib/tokens';
const input: SendInput = {
  sender: '0x1111111111111111111111111111111111111111',
  recipient: '0x2222222222222222222222222222222222222222',
  symbol: 'ETH',
  amount: '1.234567890123456789',
};
test('ETH and each curated ERC-20 submit exactly once, full entered amount, explicit embedded signer, no fee transfer', async () => {
  for (const symbol of ['ETH', 'USDT', 'USDC']) {
    const send = {
      ...input,
      symbol,
      amount: symbol === 'ETH' ? input.amount : '12.345678',
    };
    const calls: unknown[] = [];
    await submitSend(send, async (tx, options) => {
      calls.push(tx);
      assert.equal(options.address, input.sender);
      assert.equal(tx.chainId, 1);
      if (symbol === 'ETH') {
        assert.equal(tx.to, input.recipient);
        assert.equal(tx.value, parseUnits(input.amount, 18));
        assert.equal('data' in tx, false);
      } else {
        assert.equal(
          tx.to,
          CURATED_TOKENS.find((t) => t.symbol === symbol)!.address,
        );
        assert.equal(tx.value, BigInt(0));
        const decoded = decodeFunctionData({
          abi: erc20Abi,
          data: (tx as { data: `0x${string}` }).data,
        });
        assert.equal(decoded.functionName, 'transfer');
        assert.deepEqual(decoded.args, [input.recipient, BigInt(12345678)]);
      }
      return { hash: '0x' + 'a'.repeat(64) };
    });
    assert.equal(calls.length, 1);
  }
});
test('Send rejects invalid recipient, zero address, empty/nonpositive/exponent/overprecision/oversized amount and unsupported asset', () => {
  for (const change of [
    { recipient: '' },
    { recipient: 'bad' },
    { recipient: '0x' + '0'.repeat(40) },
    { amount: '' },
    { amount: '0' },
    { amount: '-1' },
    { amount: '1e2' },
    { amount: '1.0000001', symbol: 'USDT' },
    { amount: '9'.repeat(79) },
    { symbol: 'WBTC' },
    { symbol: 'TRX' },
  ])
    assert.throws(() => buildSend({ ...input, ...change }));
});
test('hash alone is not confirmation; receipt block/status/hash are required', () => {
  const hash = '0x' + 'a'.repeat(64);
  assert.equal(receiptStage(null, hash), 'confirming');
  assert.equal(
    receiptStage(
      { transactionHash: hash, blockNumber: '0x1', status: '0x1' },
      hash,
    ),
    'confirmed',
  );
  assert.equal(
    receiptStage(
      { transactionHash: hash, blockNumber: '0x1', status: '0x0' },
      hash,
    ),
    'failed',
  );
  for (const receipt of [
    { transactionHash: hash },
    { transactionHash: 'bad', status: '0x1', blockNumber: '0x1' },
    { transactionHash: hash, status: '0x2', blockNumber: '0x1' },
  ])
    assert.throws(() => receiptStage(receipt, hash));
});
