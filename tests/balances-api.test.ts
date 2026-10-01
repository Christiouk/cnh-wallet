import assert from 'node:assert/strict';
import { test } from 'node:test';
import { POST } from '../src/app/api/balances/route';
const walletAddress = '0x1111111111111111111111111111111111111111';
function request(input: object) {
  return new Request('https://wallet.invalid/api/balances', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}
test('balance API distinguishes real zero from failed/empty provider data', async () => {
  const originalFetch = global.fetch;
  const originalRpc = process.env.ETHEREUM_RPC_URL;
  process.env.ETHEREUM_RPC_URL = 'https://rpc.invalid';
  try {
    for (const value of ['0x0', '0x', null]) {
      global.fetch = async (_url, init) => {
        const call = JSON.parse(init!.body as string);
        return Response.json(
          call.method === 'eth_chainId'
            ? { result: '0x1' }
            : value === null
              ? { error: { message: 'offline' } }
              : { result: value },
        );
      };
      const data = await (await POST(request({ walletAddress }))).json();
      assert.equal(data.balances.length, 3);
      for (const row of data.balances) {
        assert.equal(row.balance, value === '0x0' ? '0' : null);
        assert.equal(Boolean(row.error), value !== '0x0');
      }
    }
  } finally {
    global.fetch = originalFetch;
    if (originalRpc === undefined) delete process.env.ETHEREUM_RPC_URL;
    else process.env.ETHEREUM_RPC_URL = originalRpc;
  }
});
test('balance API rejects malformed addresses, arbitrary token/RPC fields and oversized JSON before RPC', async () => {
  const originalFetch = global.fetch;
  let calls = 0;
  global.fetch = async () => {
    calls++;
    throw new Error();
  };
  try {
    for (const input of [
      { walletAddress: 'bad' },
      { walletAddress, tokens: [{ symbol: 'USDT', address: walletAddress }] },
      { walletAddress, rpc: 'https://evil.invalid' },
    ])
      assert.equal((await POST(request(input))).status, 400);
    assert.equal(
      (await POST(request({ walletAddress: 'x'.repeat(3000) }))).status,
      413,
    );
    assert.equal(calls, 0);
  } finally {
    global.fetch = originalFetch;
  }
});
