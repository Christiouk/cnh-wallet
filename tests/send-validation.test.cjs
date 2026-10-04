const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const load = Module._load;
const address = '0x1111111111111111111111111111111111111111';
const other = '0x2222222222222222222222222222222222222222';
const linked = () => ({ type: 'wallet', chain_type: 'ethereum', connector_type: 'embedded', wallet_client_type: 'privy', address });
let user = { id: 'did:privy:synthetic-owner', linked_accounts: [linked()] };
Module._load = function(id, parent, main) {
  if (id === '@privy-io/node') return { PrivyClient: class {
    utils() { return { auth: () => ({ verifyAccessToken: async token => {
      if (token !== 'synthetic-token') throw Error('Private credential details');
      return { user_id: 'did:privy:synthetic-owner' };
    } }) }; }
    users() { return { _get: async () => user }; }
  } };
  return load.call(this, id, parent, main);
};
const { GET, POST } = require('../.test-build/src/app/api/send/route');
const { submitSend } = require('../.test-build/src/lib/wallet/send');
Module._load = load;

test('owner validation denies unauthenticated, wrong identity, external/duplicate wallets, altered intent, nonce changes, fees and expired access', async () => {
  const names = ['A3_ETHEREUM_SEND_ENABLED','A3_ETHEREUM_SEND_VALIDATION','PRIVY_APP_SECRET','NEXT_PUBLIC_PRIVY_APP_ID','ETHEREUM_RPC_URL'];
  const before = Object.fromEntries(names.map(n => [n, process.env[n]]));
  const originalFetch = global.fetch;
  const config = { address, nonce: 0, expiresAt: Date.now() + 60000 };
  process.env.A3_ETHEREUM_SEND_ENABLED = 'false';
  process.env.A3_ETHEREUM_SEND_VALIDATION = JSON.stringify(config);
  process.env.PRIVY_APP_SECRET = 'synthetic-not-a-live-secret';
  process.env.NEXT_PUBLIC_PRIVY_APP_ID = 'cmlkt2n7x00wp0cl6diua9vtf';
  process.env.ETHEREUM_RPC_URL = 'https://rpc.invalid';
  let nonce = '0x0', pending = '0x0', code = '0x', price = '0x2faf080', gas = '0x5208', rpcCalls = 0;
  global.fetch = async (_url, init) => {
    rpcCalls++;
    const { method, params } = JSON.parse(init.body);
    const result = { eth_chainId: '0x1', eth_getCode: code, eth_gasPrice: price,
      eth_estimateGas: gas, eth_getBalance: '0x100000000000000' }[method];
    if (method === 'eth_getTransactionCount') return Response.json({ result: params[1] === 'pending' ? pending : nonce });
    if (result === undefined) throw Error('Unexpected RPC method: ' + method);
    return Response.json({ result });
  };
  const req = (input, token = 'synthetic-token') => new Request('https://wallet.invalid/api/send', {
    method: input ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    ...(input ? { body: JSON.stringify({ action: 'preview', sender: address, recipient: address, symbol: 'ETH', amount: '0.000001', ...input }) } : {}),
  });
  const preview = async (input = {}, token) => POST(req(input, token));
  try {
    assert.deepEqual(await (await GET(req(null, ''))).json(), { send: false });
    assert.equal((await preview({}, '')).status, 403);
    assert.equal((await preview({}, 'forged-token')).status, 403);
    assert.equal(rpcCalls, 0);
    assert.deepEqual(await (await GET(req())).json(), { send: true, validation: true });
    const success = await preview();
    assert.equal(success.status, 200);
    const result = await success.json();
    assert.equal(result.validation.gasLimit, '21000');
    assert.equal(result.validation.gasPrice, '60000000');
    assert.equal(result.estimatedNetworkCost, '1260000000000');
    for (const changed of [{ recipient: other }, { sender: other }, { symbol: 'USDT' }, { amount: '0.000002' }])
      assert.equal((await preview(changed)).status, 403);
    for (const wallets of [[{ ...linked(), address: other }], [linked(), linked()], [{ ...linked(), connector_type: 'external' }], []]) {
      user = { id: 'did:privy:synthetic-owner', linked_accounts: wallets };
      assert.equal((await preview()).status, 403);
    }
    user = { id: 'did:privy:another-user', linked_accounts: [linked()] };
    assert.equal((await preview()).status, 403);
    user = { id: 'did:privy:synthetic-owner', linked_accounts: [linked()] };
    nonce = '0x1'; assert.equal((await preview()).status, 409); nonce = '0x0';
    pending = '0x1'; assert.equal((await preview()).status, 409); pending = '0x0';
    code = '0x1234'; assert.equal((await preview()).status, 409); code = '0x';
    price = '0x3b9aca00'; assert.equal((await preview()).status, 409); price = '0x2faf080';
    gas = '0x6000'; assert.equal((await preview()).status, 409); gas = '0x5208';
    for (const raw of ['', '{', JSON.stringify({ ...config, expiresAt: Date.now() - 1 }), JSON.stringify({ ...config, nonce: -1 }), JSON.stringify({ ...config, expiresAt: Date.now() + 25 * 3600000 })]) {
      process.env.A3_ETHEREUM_SEND_VALIDATION = raw;
      assert.equal((await preview()).status, 503);
    }
  } finally {
    global.fetch = originalFetch;
    for (const n of names) if (before[n] === undefined) delete process.env[n]; else process.env[n] = before[n];
  }
});

test('validation signing boundary fixes chain, amount, recipient, nonce and total gas fee, forces owner confirmation and submits once', async () => {
  const intent = { sender: address, recipient: address, symbol: 'ETH', amount: '0.000001' };
  const envelope = { gasLimit: '21000', gasPrice: '100000000', nonce: 0, expiresAt: Date.now() + 60000 };
  let calls = 0;
  const send = async (tx, options) => {
    calls++;
    assert.equal(tx.to, address); assert.equal(tx.value, 1000000000000n);
    assert.equal(tx.chainId, 1); assert.equal(tx.nonce, 0); assert.equal(tx.type, 0);
    assert.equal(tx.gasLimit * tx.gasPrice, 2100000000000n);
    assert.equal('data' in tx, false);
    assert.deepEqual(options, { address, uiOptions: { showWalletUIs: true } });
    return { hash: '0x' + 'a'.repeat(64) };
  };
  await submitSend(intent, send, envelope);
  for (const changed of [{ gasPrice: '142857143' }, { gasLimit: '22000' }, { nonce: -1 }, { expiresAt: 1 }])
    await assert.rejects(submitSend(intent, send, { ...envelope, ...changed }));
  for (const changed of [{ recipient: other }, { amount: '0.000002' }, { symbol: 'USDT' }])
    await assert.rejects(submitSend({ ...intent, ...changed }, send, envelope));
  assert.equal(calls, 1);
});
