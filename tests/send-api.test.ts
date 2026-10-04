import assert from 'node:assert/strict';
import { test } from 'node:test';
import { GET, POST } from '../src/app/api/send/route';
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
  const originalGate = process.env.A3_ETHEREUM_SEND_ENABLED;
  process.env.A3_ETHEREUM_SEND_ENABLED = 'true';
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
    if (originalGate === undefined) delete process.env.A3_ETHEREUM_SEND_ENABLED;
    else process.env.A3_ETHEREUM_SEND_ENABLED = originalGate;
    if (originalRpc === undefined) delete process.env.ETHEREUM_RPC_URL;
    else process.env.ETHEREUM_RPC_URL = originalRpc;
  }
});

test('Send release gate rejects preparation before provider calls; missing and malformed flags fail closed', async () => {
  const previous = process.env.A3_ETHEREUM_SEND_ENABLED;
  const previousFetch = global.fetch;
  let calls = 0;
  global.fetch = async () => { calls++; throw new Error('Must not contact provider'); };
  try {
    for (const flag of [undefined, '', 'false', 'TRUE', '1']) {
      if (flag === undefined) delete process.env.A3_ETHEREUM_SEND_ENABLED;
      else process.env.A3_ETHEREUM_SEND_ENABLED = flag;
      const config = await GET();
      assert.equal(config.headers.get('cache-control'), 'no-store');
      assert.deepEqual(await config.json(), { send: false });
      const response = await POST(request({ action: 'preview', sender, recipient, symbol: 'ETH', amount: '0.000001' }));
      assert.equal(response.status, 503);
      assert.equal((await response.json()).error.code, 'SEND_DISABLED');
    }
    assert.equal(calls, 0);
  } finally {
    global.fetch = previousFetch;
    if (previous === undefined) delete process.env.A3_ETHEREUM_SEND_ENABLED;
    else process.env.A3_ETHEREUM_SEND_ENABLED = previous;
  }
});
