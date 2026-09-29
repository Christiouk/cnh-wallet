const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  Module = require('node:module'),
  path = require('node:path');
const {
  encodeAbiParameters,
  decodeFunctionData,
  erc20Abi,
} = require('viem');
const load = Module._load;
const did = 'did:privy:swap-synthetic',
  address = '0x1111111111111111111111111111111111111111';
let accounts = [
  {
    type: 'wallet',
    chain_type: 'ethereum',
    connector_type: 'embedded',
    wallet_client_type: 'privy',
    id: 'synthetic-evm',
    address,
  },
];
Module._load = function (id, parent, main) {
  if (id === 'server-only') return {};
  if (id === '@privy-io/node')
    return {
      PrivyClient: class {
        utils() {
          return {
            auth: () => ({
              verifyAccessToken: async (token) => {
                if (token !== 'synthetic') throw Error();
                return { user_id: did };
              },
            }),
          };
        }
        users() {
          return {
            _get: async () => ({ id: did, linked_accounts: accounts }),
          };
        }
      },
    };
  if (id.startsWith('@/'))
    return load.call(
      this,
      path.resolve(__dirname, '../.test-build/src', id.slice(2)),
      parent,
      main,
    );
  return load.call(this, id, parent, main);
};
const server = require('../.test-build/src/lib/server/swap'),
  route = require('../.test-build/src/app/api/swap/route'),
  core = require('../.test-build/src/lib/swap/core');
Module._load = load;
const fixture = require('../.test-build/tests/fixtures/swap');
const owner = { did, address, walletId: 'synthetic-evm' };
let allowed = 0n,
  nonce = 0,
  pending = true,
  reverted = false,
  actual = null,
  gasFail = false,
  chain = '0x1',
  requests = [],
  ethBalance = 10n ** 22n,
  tokenBalance = 10n ** 22n;
function config() {
  Object.assign(process.env, {
    NEXT_PUBLIC_PRIVY_APP_ID: 'cmlkt2n7x00wp0cl6diua9vtf',
    PRIVY_APP_SECRET: 'synthetic',
    ZEROX_API_KEY: 'synthetic',
    ETHEREUM_RPC_URL: 'https://rpc.invalid',
    A3_SWAP_ENABLED: 'true',
    A3_SWAP_VERIFIED: 'true',
    A3_SWAP_ORIGIN: 'https://wallet.invalid',
  });
}
const request = (
  fields,
  token = 'synthetic',
  origin = 'https://wallet.invalid',
) =>
  new Request('https://wallet.invalid/api/swap', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(fields),
  });
const fetcher = async (url, init = {}) => {
  requests.push({ url, init });
  let result;
  if (url.startsWith('https://api.0x.org/')) {
    assert.equal(init.headers['0x-version'], 'v2');
    assert.equal(init.headers['0x-api-key'], 'synthetic');
    const p = new URL(url).searchParams;
    assert.equal(p.get('chainId'), '1');
    assert.equal(p.get('taker'), address);
    assert.equal(p.get('swapFeeBps'), null);
    const sell = Object.keys(core.ASSETS).find(
        (a) => core.ASSETS[a].address === p.get('sellToken'),
      ),
      buy = Object.keys(core.ASSETS).find(
        (a) => core.ASSETS[a].address === p.get('buyToken'),
      );
    const i = { sellAsset: sell, buyAsset: buy, amount: '1' };
    result = fixture.quote(i);
    if (
      url.includes('/price') &&
      sell !== 'ETH' &&
      allowed < core.sellUnits(i)
    )
      result.issues.allowance = {
        actual: allowed.toString(),
        spender: core.HOLDER,
      };
    if (url.includes('/price')) delete result.transaction;
    return Response.json(result);
  }
  const { method, params } = JSON.parse(init.body);
  if (method === 'eth_chainId') result = chain;
  else if (method === 'eth_getBalance')
    result = '0x' + ethBalance.toString(16);
  else if (method === 'eth_getCode') result = '0x1234';
  else if (method === 'eth_gasPrice') result = '0x3b9aca00';
  else if (method === 'eth_getTransactionCount')
    result = '0x' + nonce.toString(16);
  else if (method === 'eth_estimateGas') {
    if (gasFail)
      return Response.json({ error: { message: 'private-error' } });
    result = '0x186a0';
  } else if (method === 'eth_call') {
    if (params[0].to === core.REGISTRY)
      result = encodeAbiParameters(
        [{ type: 'address' }],
        [fixture.settler],
      );
    else if (params[0].data.startsWith('0x70a08231'))
      result = '0x' + tokenBalance.toString(16);
    else if (params[0].data.startsWith('0xdd62ed3e'))
      result = '0x' + allowed.toString(16);
    else if (params[0].to === core.HOLDER)
      result = encodeAbiParameters(
        [{ type: 'bytes' }],
        [encodeAbiParameters([{ type: 'bool' }], [true])],
      );
    else if (params[0].to === core.ASSETS.USDT.address) result = '0x';
    else result = encodeAbiParameters([{ type: 'bool' }], [true]);
  } else if (method === 'eth_getTransactionByHash') result = actual;
  else if (method === 'eth_getTransactionReceipt')
    result = pending
      ? null
      : {
          transactionHash: actual.hash,
          from: address,
          to: actual.to,
          blockNumber: '0x123',
          status: reverted ? '0x0' : '0x1',
        };
  else throw Error('Unexpected method');
  return Response.json({ jsonrpc: '2.0', id: 1, result });
};
function broadcast(tx) {
  actual = {
    hash: '0x' + 'a'.repeat(64),
    from: address,
    to: tx.to,
    input: tx.data,
    value: '0x' + BigInt(tx.value).toString(16),
    nonce: '0x' + tx.nonce.toString(16),
    chainId: '0x1',
  };
  return actual.hash;
}
test('Swap API auth, input, mainnet and production gates', async () => {
  config();
  const old = global.fetch;
  global.fetch = fetcher;
  try {
    assert.equal(
      (
        await route.POST(
          request(
            {
              action: 'price',
              sellAsset: 'ETH',
              buyAsset: 'USDT',
              amount: '1',
            },
            '',
          ),
        )
      ).status,
      401,
    );
    assert.equal(
      (
        await route.POST(
          request(
            {
              action: 'price',
              sellAsset: 'ETH',
              buyAsset: 'USDT',
              amount: '1',
            },
            'bad',
          ),
        )
      ).status,
      401,
    );
    assert.equal(
      (
        await route.POST(
          request({
            action: 'price',
            sellAsset: 'ETH',
            buyAsset: 'USDT',
            amount: '1',
            taker: address,
          }),
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await route.POST(
          request({ action: 'price' }, undefined, 'https://evil.invalid'),
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await route.POST(
          request({ action: 'rpc', method: 'eth_sendRawTransaction' }),
        )
      ).status,
      400,
    );
    process.env.VERCEL_ENV = 'production';
    assert.equal(server.swapConfiguration().enabled, false);
    delete process.env.VERCEL_ENV;
    chain = '0xa';
    await assert.rejects(() =>
      server.price(
        { sellAsset: 'ETH', buyAsset: 'USDT', amount: '1' },
        owner,
      ),
    );
    chain = '0x1';
    const originals = accounts;
    accounts = [{ ...accounts[0], connector_type: 'injected' }];
    assert.equal(
      (await route.POST(request({ action: 'availability' }))).status,
      409,
    );
    accounts = originals;
  } finally {
    global.fetch = old;
  }
});
test('approval confirmation is mandatory; zero reset then exact approval then fresh quote; replay and forged hashes fail', async () => {
  config();
  const old = global.fetch;
  global.fetch = fetcher;
  try {
    allowed = 1n;
    nonce = 0;
    pending = true;
    reverted = false;
    const v = await server.price(
      { sellAsset: 'USDT', buyAsset: 'USDC', amount: '1' },
      owner,
    );
    let review = await server.prepare(v.id, owner);
    assert.equal(review.approval, 'reset');
    let issued = await server.authorize(v.id, owner);
    assert.equal(
      decodeFunctionData({ abi: erc20Abi, data: issued.transaction.data })
        .args[1],
      0n,
    );
    await assert.rejects(() => server.prepare(v.id, owner));
    await assert.rejects(() => server.authorize(v.id, owner));
    let hash = broadcast(issued.transaction);
    assert.equal(
      (await server.receipt(v.id, hash, owner)).status,
      'confirming',
    );
    pending = false;
    allowed = 0n;
    nonce++;
    assert.equal(
      (await server.receipt(v.id, hash, owner)).status,
      'approval-confirmed',
    );
    assert.equal(
      (await server.receipt(v.id, hash, owner)).status,
      'approval-confirmed',
    );
    review = await server.prepare(v.id, owner);
    assert.equal(review.approvalAmount, '1000000');
    issued = await server.authorize(v.id, owner);
    hash = broadcast(issued.transaction);
    allowed = 1000000n;
    nonce++;
    assert.equal(
      (await server.receipt(v.id, hash, owner)).status,
      'approval-confirmed',
    );
    review = await server.prepare(v.id, owner);
    assert.equal(review.phase, 'firm');
    await assert.rejects(() =>
      server.authorize(v.id, { ...owner, did: 'other' }),
    );
    issued = await server.authorize(v.id, owner);
    await assert.rejects(() => server.authorize(v.id, owner));
    hash = broadcast(issued.transaction);
    const expectedNonce = actual.nonce;
    actual.nonce = '0x0';
    await assert.rejects(() => server.receipt(v.id, hash, owner));
    actual.nonce = expectedNonce;
    assert.equal(
      (await server.receipt(v.id, hash, owner)).status,
      'confirmed',
    );
  } finally {
    global.fetch = old;
  }
});
test('native ETH needs no approval; stale quote, gas failure and reverted receipt are safe', async () => {
  config();
  const old = global.fetch;
  global.fetch = fetcher;
  const clock = Date.now;
  try {
    const v = await server.price(
      { sellAsset: 'ETH', buyAsset: 'USDC', amount: '1' },
      owner,
    );
    Date.now = () => clock() + 61000;
    await assert.rejects(() => server.prepare(v.id, owner), /expired/);
    Date.now = clock;
    gasFail = true;
    await assert.rejects(() => server.prepare(v.id, owner));
    gasFail = false;
    const firm = await server.prepare(v.id, owner);
    assert.equal(firm.approval, 'none');
    const tx = await server.authorize(v.id, owner);
    const hash = broadcast(tx.transaction);
    reverted = true;
    pending = false;
    assert.equal(
      (await server.receipt(v.id, hash, owner)).status,
      'failed',
    );
  } finally {
    Date.now = clock;
    global.fetch = old;
    reverted = false;
  }
});
test('provider response size, status, and timeouts never expose an unrestricted proxy', async () => {
  const old = global.fetch;
  try {
    global.fetch = async () => new Response('x'.repeat(524289));
    await assert.rejects(
      () => server.boundedJson('https://api.0x.org/'),
      /large/,
    );
    global.fetch = async () =>
      new Response('private body', { status: 500 });
    await assert.rejects(
      () => server.boundedJson('https://api.0x.org/'),
      /provider unavailable/,
    );
  } finally {
    global.fetch = old;
  }
});

test('sell balance and ETH gas shortages block before a permission or Swap is issued', async () => {
  config();
  const old = global.fetch;
  global.fetch = fetcher;
  try {
    tokenBalance = 0n;
    await assert.rejects(
      () =>
        server.price(
          { sellAsset: 'USDT', buyAsset: 'ETH', amount: '1' },
          owner,
        ),
      /Insufficient sell-asset balance/,
    );
    tokenBalance = 10n ** 22n;
    allowed = 0n;
    const p = await server.price(
      { sellAsset: 'USDT', buyAsset: 'ETH', amount: '1' },
      owner,
    );
    ethBalance = 0n;
    await assert.rejects(
      () => server.prepare(p.id, owner),
      /Insufficient ETH for network gas/,
    );
    await assert.rejects(() => server.authorize(p.id, owner));
  } finally {
    global.fetch = old;
    ethBalance = 10n ** 22n;
    tokenBalance = 10n ** 22n;
  }
});
test('firm review expires before transaction issuance and authenticated quote requests are limited', async () => {
  config();
  const old = global.fetch,
    clock = Date.now;
  global.fetch = fetcher;
  try {
    const p = await server.price(
      { sellAsset: 'ETH', buyAsset: 'USDT', amount: '1' },
      owner,
    );
    await server.prepare(p.id, owner);
    Date.now = () => clock() + 31000;
    await assert.rejects(() => server.authorize(p.id, owner), /expired/);
    Date.now = clock;
    for (let i = 0; i < 20; i++)
      server.userLimit('deterministic-limited-user');
    assert.throws(
      () => server.userLimit('deterministic-limited-user'),
      /wait/,
    );
  } finally {
    global.fetch = old;
    Date.now = clock;
  }
});
