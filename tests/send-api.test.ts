import assert from 'node:assert/strict';
import { test } from 'node:test';
import { POST } from '../src/app/api/send/route';
const sender = '0x1111111111111111111111111111111111111111';
const recipient = '0x2222222222222222222222222222222222222222';
const request = (input: object) =>
  new Request('https://wallet.invalid/api/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
test('preflight requires mainnet, sufficient ETH and asset balances, and successful simulation', async () => {
  const originalFetch = global.fetch;
  const originalRpc = process.env.ETHEREUM_RPC_URL;
  process.env.ETHEREUM_RPC_URL = 'https://rpc.invalid';
  let chain = '0x1',
    eth = '0xde0b6b3a7640000',
    token = '0xf4240',
    simulation = '0x1';
  global.fetch = async (_url, init) => {
    const call = JSON.parse(init!.body as string);
    const result =
      call.method === 'eth_chainId'
        ? chain
        : call.method === 'eth_getBalance'
          ? eth
          : call.method === 'eth_estimateGas'
            ? '0x5208'
            : call.method === 'eth_gasPrice'
              ? '0x3b9aca00'
              : call.params[0].data.startsWith('0x70a08231')
                ? token
                : simulation;
    return Response.json({ result });
  };
  const preview = () =>
    POST(
      request({
        action: 'preview',
        sender,
        recipient,
        symbol: 'USDT',
        amount: '1',
      }),
    );
  try {
    assert.equal((await preview()).status, 200);
    eth = '0x0';
    assert.equal(
      (await (await preview()).json()).error.code,
      'INSUFFICIENT_ETH',
    );
    eth = '0xde0b6b3a7640000';
    token = '0x0';
    assert.equal(
      (await (await preview()).json()).error.code,
      'INSUFFICIENT_ASSET',
    );
    token = '0xf4240';
    simulation = '0x0';
    assert.equal(
      (await (await preview()).json()).error.code,
      'TRANSFER_REJECTED',
    );
    simulation = '0x1';
    chain = '0x89';
    assert.equal((await (await preview()).json()).error.code, 'WRONG_NETWORK');
    chain = '0x1';
    assert.equal(
      (
        await POST(
          request({
            action: 'preview',
            sender,
            recipient,
            symbol: 'ETH',
            amount: '1',
          }),
        )
      ).status,
      400,
    );
    global.fetch = async () => {
      throw new Error('secret provider detail');
    };
    const failed = await preview();
    assert.equal(failed.status, 502);
    assert.doesNotMatch(await failed.text(), /secret provider/);
  } finally {
    global.fetch = originalFetch;
    if (originalRpc === undefined) delete process.env.ETHEREUM_RPC_URL;
    else process.env.ETHEREUM_RPC_URL = originalRpc;
  }
});
