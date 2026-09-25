import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NextRequest } from 'next/server';
import { POST } from '../src/app/api/balances/route';

test('balance API distinguishes real zero, RPC rejection and empty contract response', async () => {
  const originalFetch = global.fetch;
  const originalRpc = process.env.NEXT_PUBLIC_RPC_URL;
  const originalError = console.error;
  process.env.NEXT_PUBLIC_RPC_URL = 'https://rpc.invalid';
  console.error = () => {}; // Expected RPC failures, no live provider is contacted.
  const request = () => new NextRequest('https://wallet.invalid/api/balances', {
    method: 'POST', body: JSON.stringify({ walletAddress: '0x1111111111111111111111111111111111111111',
      tokens: [{ symbol: 'USDT', address: '0x2222222222222222222222222222222222222222' }] }),
  });
  try {
    global.fetch = async () => new Response(JSON.stringify({ result: '0x0' }));
    const zero = await (await POST(request())).json();
    assert.equal(zero.balances[0].balance, '0');
    assert.equal(zero.balances[0].error, undefined);
    for (const rpcResult of [{ error: { message: 'offline' } }, { result: '0x' }]) {
      global.fetch = async () => new Response(JSON.stringify(rpcResult));
      const failed = await (await POST(request())).json();
      assert.equal(failed.balances[0].balance, null);
      assert.equal(failed.balances[0].error, 'Failed to fetch balance');
    }
  } finally {
    global.fetch = originalFetch;
    console.error = originalError;
    if (originalRpc === undefined) delete process.env.NEXT_PUBLIC_RPC_URL;
    else process.env.NEXT_PUBLIC_RPC_URL = originalRpc;
  }
});
