const assert = require('node:assert/strict');
const { test } = require('node:test');
const Module = require('node:module');
const path = require('node:path');
const { TronWeb, utils } = require('tronweb');
const {
  OWNER,
  RECIPIENT,
  fixtureIntent,
  fixtureTransaction,
  uint,
} = require('../.test-build/tests/fixtures/tron');
let authDid = OWNER.did;
let accounts = [
  {
    type: 'wallet',
    id: OWNER.walletId,
    chain_type: 'tron',
    connector_type: 'embedded',
    wallet_client_type: 'privy',
    address: OWNER.address,
  },
];
const load = Module._load;
Module._load = function (id, parent, main) {
  if (id === 'server-only') return {};
  if (id === '@privy-io/node')
    return {
      PrivyClient: class {
        utils() {
          return {
            auth: () => ({
              verifyAccessToken: async (token) => {
                if (token !== 'synthetic-token')
                  throw new Error('secret-internal-auth-error');
                return { user_id: authDid };
              },
            }),
          };
        }
        users() {
          return {
            _get: async () => ({ id: authDid, linked_accounts: accounts }),
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
const server = require('../.test-build/src/lib/server/tron');
const route = require('../.test-build/src/app/api/tron/route');
Module._load = load;
const request = (input, token = 'synthetic-token', origin) =>
  new Request('https://wallet.invalid/api/tron', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
      ...(origin ? { origin } : {}),
    },
    body: JSON.stringify(input),
  });
test('authenticated Tron API denies unauthorized, ambiguous, external, arbitrary action/contract and oversize requests', async () => {
  process.env.NEXT_PUBLIC_PRIVY_APP_ID = 'cmlkt2n7x00wp0cl6diua9vtf';
  process.env.PRIVY_APP_SECRET = 'synthetic-not-a-secret';
  process.env.TRONGRID_API_KEY = 'synthetic-not-a-key';
  const original = accounts;
  assert.equal(
    (await route.POST(request({ action: 'balances' }, 'invalid'))).status,
    401,
  );
  assert.equal(
    (
      await route.POST(
        request(
          { action: 'balances' },
          'synthetic-token',
          'https://evil.invalid',
        ),
      )
    ).status,
    403,
  );
  for (const payload of [
    { action: '__proto__' },
    { action: 'balance', method: 'wallet/createaccount' },
    {
      action: 'prepare',
      recipient: RECIPIENT,
      amount: '1',
      contract: RECIPIENT,
    },
  ])
    assert.equal((await route.POST(request(payload))).status, 400);
  assert.equal(
    (
      await route.POST(
        request({ action: 'balances', extra: 'x'.repeat(13000) }),
      )
    ).status,
    413,
  );
  for (const bad of [
    [],
    [original[0], original[0]],
    [{ ...original[0], connector_type: 'injected' }],
    [{ ...original[0], address: '0x1111111111111111111111111111111111111111' }],
  ]) {
    accounts = bad;
    assert.equal(
      (await route.POST(request({ action: 'balances' }))).status,
      409,
    );
  }
  accounts = original;
  assert.equal((await route.POST(request({ action: 'create' }))).status, 503);
  assert.equal(
    (
      await route.POST(
        request({ action: 'prepare', recipient: RECIPIENT, amount: '1' }),
      )
    ).status,
    503,
  );
});
test('sealed review cannot be edited, used by another wallet, or signed after expiry', () => {
  process.env.A3_TRON_INTENT_SECRET =
    'synthetic-test-secret-material-only'.repeat(2);
  const intent = fixtureIntent(),
    ticket = server.sealIntent(intent);
  assert.deepEqual(server.openIntent(ticket, OWNER), intent);
  assert.throws(() => server.openIntent(ticket + 'x', OWNER));
  assert.throws(() =>
    server.openIntent(ticket, { ...OWNER, walletId: 'other-wallet' }),
  );
  const expired = {
    ...intent,
    transaction: {
      ...intent.transaction,
      raw_data: { ...intent.transaction.raw_data, expiration: 1 },
    },
  };
  assert.throws(() => server.openIntent(server.sealIntent(expired), OWNER));
  assert.equal(
    server.openIntent(ticket, OWNER, false).transaction.txID,
    intent.transaction.txID,
  );
});
test('signature recovery verifies actual Tron owner; wrong key cannot broadcast', async () => {
  // Deterministic cryptographic fixture only; never a Privy/customer wallet or network call.
  const testKey = Buffer.alloc(32, 7).toString('hex');
  const owner = { ...OWNER, address: TronWeb.address.fromPrivateKey(testKey) };
  const intent = fixtureIntent();
  Object.assign(intent, owner);
  intent.transaction = fixtureTransaction(owner.address);
  intent.expires = intent.transaction.raw_data.expiration;
  const signature = utils.crypto.ECKeySign(
    Buffer.from(intent.transaction.txID, 'hex'),
    Buffer.from(testKey, 'hex'),
  );
  const signed = await server.attachSignature(
    intent,
    '0x' + signature.slice(0, 128),
  );
  assert.equal(
    new TronWeb({ fullHost: 'https://invalid.invalid' }).trx.ecRecover(signed),
    owner.address,
  );
  await assert.rejects(
    server.attachSignature(fixtureIntent(), '0x' + signature.slice(0, 128)),
    /selected Tron wallet/,
  );
  await assert.rejects(server.attachSignature(intent, '0x1234'));
});
test('provider transport uses fixed host, contract and secret header; errors are sanitized and timeout signal is set', async () => {
  const originalFetch = global.fetch;
  let observed;
  global.fetch = async (url, init) => {
    observed = { url, init };
    return Response.json(uint(0));
  };
  try {
    await server.tronTransport('balance', { owner: OWNER.address });
    assert.match(
      observed.url,
      /^https:\/\/api\.trongrid\.io\/walletsolidity\/triggerconstantcontract$/,
    );
    assert.equal(
      observed.init.headers['TRON-PRO-API-KEY'],
      'synthetic-not-a-key',
    );
    assert.equal(observed.init.signal instanceof AbortSignal, true);
    assert.equal(
      JSON.parse(observed.init.body).function_selector,
      'balanceOf(address)',
    );
    await assert.rejects(
      server.tronTransport('arbitrary', { url: 'https://evil.invalid' }),
    );
    global.fetch = async () => {
      throw new Error('private-provider-secret');
    };
    const response = await route.POST(request({ action: 'activity' }));
    assert.equal(response.status, 502);
    assert.doesNotMatch(await response.text(), /private-provider-secret/);
  } finally {
    global.fetch = originalFetch;
  }
});

test('broadcast endpoint accepts only an owned sealed transfer and never returns confirmed for a hash', async () => {
  const originalFetch = global.fetch;
  const originalAccounts = accounts;
  process.env.A3_TRON_SEND_ENABLED = 'true';
  const fixtureKey = Buffer.alloc(32, 7).toString('hex');
  const owner = {
    ...OWNER,
    address: TronWeb.address.fromPrivateKey(fixtureKey),
  };
  accounts = [{ ...accounts[0], address: owner.address }];
  const intent = fixtureIntent();
  Object.assign(intent, owner);
  intent.transaction = fixtureTransaction(owner.address);
  intent.expires = intent.transaction.raw_data.expiration;
  const ticket = server.sealIntent(intent);
  const signature =
    '0x' +
    utils.crypto
      .ECKeySign(
        Buffer.from(intent.transaction.txID, 'hex'),
        Buffer.from(fixtureKey, 'hex'),
      )
      .slice(0, 128);
  let broadcasts = 0;
  global.fetch = async (url, init) => {
    assert.equal(url, 'https://api.trongrid.io/wallet/broadcasttransaction');
    assert.equal(JSON.parse(init.body).txID, intent.transaction.txID);
    broadcasts++;
    return Response.json({ result: true, txid: intent.transaction.txID });
  };
  try {
    const response = await route.POST(
      request({ action: 'broadcast', ticket, signature }),
    );
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      hash: intent.transaction.txID,
      status: 'submitted',
    });
    assert.equal(broadcasts, 1);
    assert.equal(
      (
        await route.POST(
          request({ action: 'broadcast', ticket: ticket + 'x', signature }),
        )
      ).status,
      400,
    );
    assert.equal(broadcasts, 1);
    global.fetch = async () => {
      throw new Error('timeout-after-possible-acceptance');
    };
    const uncertain = await route.POST(
      request({ action: 'broadcast', ticket, signature }),
    );
    assert.deepEqual(await uncertain.json(), {
      hash: intent.transaction.txID,
      status: 'uncertain',
    });
  } finally {
    global.fetch = originalFetch;
    accounts = originalAccounts;
    process.env.A3_TRON_SEND_ENABLED = 'false';
  }
});
