const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const evm = {
  type: 'wallet',
  chain_type: 'ethereum',
  connector_type: 'embedded',
  wallet_client_type: 'privy',
  id: 'synthetic-evm',
  address: '0x1111111111111111111111111111111111111111',
};
const tron = {
  ...evm,
  chain_type: 'tron',
  id: 'synthetic-tron',
  address: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
};
let accounts = [evm, tron];
const did = 'did:privy:a3-buy-synthetic';
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
                  throw new Error('private-provider-message');
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
const core = require('../.test-build/src/lib/buy/core');
const server = require('../.test-build/src/lib/server/buy');
const route = require('../.test-build/src/app/api/buy/route');
Module._load = load;
const input = {
  network: 'tron',
  asset: 'USDT',
  amount: '500',
  paymentMethod: 'gbp_bank_transfer',
};
const request = (
  data,
  token = 'synthetic-token',
  origin = 'https://wallet.invalid',
) =>
  new Request('https://wallet.invalid/api/buy', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(origin ? { origin } : {}),
    },
    body: JSON.stringify(data),
  });
const configured = () =>
  Object.assign(process.env, {
    NEXT_PUBLIC_PRIVY_APP_ID: 'cmlkt2n7x00wp0cl6diua9vtf',
    PRIVY_APP_SECRET: 'synthetic-secret',
    TRANSAK_API_KEY: 'synthetic-key',
    TRANSAK_API_SECRET: 'synthetic-secret',
    TRANSAK_ENVIRONMENT: 'staging',
    A3_BUY_STAGING_ENABLED: 'true',
    TRANSAK_REFERRER_ORIGIN: 'https://wallet.invalid',
    A3_BUY_TICKET_SECRET: 'a'.repeat(40),
    A3_BUY_VERIFIED_PAIRS: core.PAIRS.join(','),
    A3_BUY_DEV_USER_IP: '192.0.2.1',
  });
let calls = [],
  order = [],
  providerFee = 0,
  failQuote = false;
const provider = async (url, init = {}) => {
  calls.push({ url: String(url), init });
  assert.ok(
    String(url).startsWith('https://api-stg.transak.com/') ||
      String(url).startsWith('https://api-gateway-stg.transak.com/'),
  );
  assert.equal(init.headers['x-api-key'], 'synthetic-key');
  let result;
  if (url.includes('fiat-currencies'))
    result = {
      response: [
        {
          symbol: 'GBP',
          isAllowed: true,
          supportingCountries: ['GB'],
          paymentOptions: [
            {
              id: 'gbp_bank_transfer',
              isActive: true,
              limitCurrency: 'GBP',
              minAmount: 25,
              maxAmount: 10000,
            },
          ],
        },
      ],
    };
  else if (url.includes('crypto-currencies'))
    result = {
      response: core.PAIRS.map((p) => {
        const [network, symbol] = p.split(':');
        return {
          symbol,
          isAllowed: true,
          network: { name: network, fiatCurrenciesNotSupported: [] },
          kycCountriesNotSupported: [],
        };
      }),
    };
  else if (url.includes('/quotes?')) {
    if (failQuote)
      return new Response('private-provider-error', { status: 500 });
    const q = new URL(url).searchParams;
    result = {
      response: {
        fiatCurrency: 'GBP',
        fiatAmount: Number(q.get('fiatAmount')),
        cryptoCurrency: q.get('cryptoCurrency'),
        network: q.get('network'),
        paymentMethod: q.get('paymentMethod'),
        isBuyOrSell: 'BUY',
        cryptoAmount: 620.12,
        totalFee: 8.2,
        feeBreakdown: [{ id: 'partner_fee', value: providerFee }],
      },
    };
  } else if (url.includes('refresh-token'))
    result = {
      data: {
        accessToken: 'synthetic-access',
        expiresAt: Math.floor(Date.now() / 1000) + 6000,
      },
    };
  else if (url.includes('/auth/session'))
    result = {
      data: {
        widgetUrl:
          'https://global-stg.transak.com/?sessionId=synthetic-ott',
      },
    };
  else if (url.includes('/orders?')) result = { data: order };
  else throw new Error('Unexpected provider operation');
  return Response.json(result);
};
test('Buy input allowlist excludes TRX, wrong networks, injection and malformed amounts', () => {
  for (const p of core.PAIRS) {
    const [network, asset] = p.split(':');
    assert.equal(core.buyInput({ ...input, network, asset }).asset, asset);
  }
  for (const patch of [
    { network: 'bitcoin' },
    { asset: 'TRX' },
    { asset: 'ETH' },
    { amount: '-1' },
    { amount: 'NaN' },
    { amount: 500 },
    { amount: '1e3' },
    { amount: '1.234' },
    { amount: '0' },
    { amount: ' 50' },
    { walletAddress: evm.address },
    { paymentMethod: '__proto__' },
  ])
    assert.throws(() => core.buyInput({ ...input, ...patch }));
});
test('Buy resolves only one existing embedded wallet on the requested chain', () => {
  assert.equal(
    core.resolveBuyWallet(did, accounts, 'ethereum').address,
    evm.address,
  );
  assert.equal(
    core.resolveBuyWallet(did, accounts, 'tron').address,
    tron.address,
  );
  assert.throws(
    () => core.resolveBuyWallet(did, [evm], 'tron'),
    /Enable Tron first/,
  );
  for (const a of [
    [evm, evm],
    [{ ...evm, connector_type: 'injected' }],
    [{ ...evm, address: tron.address }],
  ])
    assert.throws(() => core.resolveBuyWallet(did, a, 'ethereum'));
});
test('Buy API auth, origin, configuration and input boundaries deny by default', async () => {
  configured();
  for (const token of ['', 'invalid'])
    assert.equal(
      (
        await route.POST(
          request({ action: 'session', ticket: 'forged' }, token),
        )
      ).status,
      token ? 409 : 401,
    );
  assert.equal(
    (
      await route.POST(
        request(
          { action: 'options', network: 'ethereum', asset: 'ETH' },
          'invalid',
        ),
      )
    ).status,
    401,
  );
  for (const origin of ['', 'https://evil.invalid'])
    assert.equal(
      (
        await route.POST(
          request(
            { action: 'options', network: 'tron', asset: 'USDT' },
            undefined,
            origin,
          ),
        )
      ).status,
      403,
    );
  assert.equal(
    (
      await route.POST(
        request({
          action: 'options',
          network: 'tron',
          asset: 'USDT',
          walletAddress: evm.address,
        }),
      )
    ).status,
    400,
  );
  accounts = [evm];
  assert.equal(
    (
      await route.POST(
        request({ action: 'options', network: 'tron', asset: 'USDT' }),
      )
    ).status,
    409,
  );
  accounts = [evm, tron];
  process.env.TRANSAK_ENVIRONMENT = 'production';
  assert.equal(server.configuration().enabled, false);
  assert.equal(
    (
      await route.POST(
        request({ action: 'options', network: 'tron', asset: 'USDT' }),
      )
    ).status,
    503,
  );
  configured();
  process.env.VERCEL_ENV = 'production';
  assert.equal(server.configuration().enabled, false);
  delete process.env.VERCEL_ENV;
});
test('server quote/session locks destination, asset, amount, payment, return; rejects tampering, expiry and replay', async () => {
  configured();
  const oldFetch = global.fetch;
  global.fetch = provider;
  calls = [];
  try {
    const response = await route.POST(
      request({ action: 'quote', ...input }),
    );
    assert.equal(response.status, 200);
    const q = await response.json();
    assert.equal(q.address, tron.address);
    assert.equal(q.cryptoAmount, 620.12);
    assert.throws(() => server.readTicket(q.ticket + 'tampered', 'quote'));
    const ticket = server.readTicket(q.ticket, 'quote');
    assert.ok(ticket.exp - Date.now() <= 120000);
    assert.throws(() =>
      server.readTicket(
        server.signTicket({ ...ticket, exp: Date.now() - 1 }),
        'quote',
      ),
    );
    assert.throws(() =>
      server.bindOwner(ticket, { ...ticket.owner, did: 'other' }),
    );
    const result = await route.POST(
      request({ action: 'session', ticket: q.ticket }),
    );
    assert.equal(result.status, 200);
    const session = await result.json();
    assert.ok(session.expiresAt - Date.now() <= 300000);
    assert.equal(
      session.widgetUrl,
      'https://global-stg.transak.com/?sessionId=synthetic-ott',
    );
    const launch = calls.find((c) => c.url.includes('/auth/session'));
    const params = JSON.parse(launch.init.body).widgetParams;
    assert.equal(launch.init.headers['x-user-ip'], '192.0.2.1');
    assert.equal(params.walletAddress, tron.address);
    assert.equal(params.network, 'tron');
    assert.equal(params.cryptoCurrencyCode, 'USDT');
    assert.equal(params.disableWalletAddressForm, true);
    assert.equal(params.fiatAmount, 500);
    assert.equal(params.fiatCurrency, 'GBP');
    assert.equal(params.productsAvailed, 'BUY');
    assert.equal(params.paymentMethod, input.paymentMethod);
    assert.equal(
      params.redirectURL,
      'https://wallet.invalid/buy/return?network=tron',
    );
    assert.equal(params.countryCode, undefined);
    assert.equal(
      (await route.POST(request({ action: 'session', ticket: q.ticket })))
        .status,
      409,
    );
    assert.equal(
      (
        await route.POST(
          request({ action: 'session', ticket: q.ticket, amount: '1' }),
        )
      ).status,
      400,
    );
    const flow = server.readTicket(session.ticket, 'flow');
    order = [
      {
        partnerOrderId: flow.id,
        walletAddress: tron.address,
        network: 'tron',
        cryptoCurrency: 'USDT',
        fiatCurrency: 'GBP',
        fiatAmount: 500,
        isBuyOrSell: 'BUY',
        status: 'PROCESSING',
      },
    ];
    for (const [state, expected] of [
      ['PROCESSING', 'processing'],
      ['COMPLETED', 'completed'],
      ['FAILED', 'failed'],
      ['CANCELLED', 'cancelled'],
    ]) {
      order[0].status = state;
      assert.equal(
        (await server.status(flow, flow.owner)).status,
        expected,
      );
    }
    order[0].walletAddress = evm.address;
    assert.equal(
      (await server.status(flow, flow.owner)).status,
      'unavailable',
    );
    order = [];
    assert.equal(
      (await server.status(flow, flow.owner)).status,
      'unavailable',
    );
    assert.equal(
      (
        await route.POST(
          request({
            action: 'status',
            ticket: session.ticket,
            status: 'COMPLETED',
          }),
        )
      ).status,
      400,
    );
  } finally {
    global.fetch = oldFetch;
  }
});
test('provider limits, failure, partner fees and redirects fail safely', async () => {
  configured();
  const oldFetch = global.fetch;
  global.fetch = provider;
  try {
    for (const amount of ['24', '10001'])
      await assert.rejects(
        () => server.providerQuote({ ...input, amount }),
        /limits/,
      );
    providerFee = 1;
    await assert.rejects(() => server.providerQuote(input), /unavailable/);
    providerFee = 0;
    failQuote = true;
    const r = await route.POST(request({ action: 'quote', ...input }));
    assert.equal(r.status, 502);
    assert.doesNotMatch(
      await r.text(),
      /private-provider-error|synthetic-secret/,
    );
    failQuote = false;
    for (const url of [
      'https://evil.invalid/?sessionId=x',
      'javascript:alert(1)',
      'https://global.transak.com/?sessionId=x',
      'https://global-stg.transak.com/?apiKey=x',
    ])
      assert.throws(() => core.widgetUrl(url));
  } finally {
    global.fetch = oldFetch;
  }
});
test('order completion requires provider evidence bound to the full flow', () => {
  const owner = { did, walletId: tron.id, address: tron.address };
  const order = {
    partnerOrderId: 'flow',
    walletAddress: tron.address,
    network: 'tron',
    cryptoCurrency: 'USDT',
    fiatCurrency: 'GBP',
    fiatAmount: 500,
    isBuyOrSell: 'BUY',
    status: 'COMPLETED',
  };
  assert.equal(core.orderStatus(order, input, owner, 'flow'), 'completed');
  for (const patch of [
    { partnerOrderId: 'other' },
    { walletAddress: evm.address },
    { network: 'ethereum' },
    { cryptoCurrency: 'TRX' },
    { fiatAmount: 1 },
    { isBuyOrSell: 'SELL' },
    { status: 'invented' },
  ])
    assert.equal(
      core.orderStatus({ ...order, ...patch }, input, owner, 'flow'),
      'unavailable',
    );
});

test('approved public origin works behind an internal Next hostname; missing authorization still fails', async () => {
  configured();
  const req = new Request('http://localhost:3000/api/buy', { method: 'POST', headers: { origin: 'https://wallet.invalid', host: 'wallet.invalid', 'content-type': 'application/json' }, body: JSON.stringify({ action: 'session', ticket: 'fake' }) });
  assert.equal((await route.POST(req)).status, 401);
});
