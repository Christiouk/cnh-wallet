global.IS_REACT_ACT_ENVIRONMENT = true;
const assert = require('node:assert/strict');
const { test } = require('node:test');
const React = require('react');
const { create, act } = require('react-test-renderer');
const Module = require('node:module');
const path = require('node:path');
const { OWNER, fixtureIntent } = require('../.test-build/tests/fixtures/tron');
const originalLoad = Module._load;
let user = {
  id: OWNER.did,
  linkedAccounts: [
    {
      type: 'wallet',
      id: OWNER.walletId,
      chainType: 'tron',
      walletClientType: 'privy',
      connectorType: 'embedded',
      address: OWNER.address,
    },
  ],
};
let refresh = async () => user;
const signed = [],
  created = [];
Module._load = function (id, parent, main) {
  if (id === '@privy-io/react-auth')
    return {
      usePrivy: () => ({
        ready: true,
        authenticated: true,
        user,
        getAccessToken: async () => 'synthetic',
      }),
      useUser: () => ({ refreshUser: () => refresh() }),
    };
  if (id === '@privy-io/react-auth/extended-chains')
    return {
      useCreateWallet: () => ({
        createWallet: async (input) => {
          created.push(input);
          return { user };
        },
      }),
      useSignRawHash: () => ({
        signRawHash: async (input) => {
          signed.push(input);
          return { signature: '0x' + '1'.repeat(128) };
        },
      }),
    };
  if (id.startsWith('@/'))
    return originalLoad.call(
      this,
      path.resolve(__dirname, '../.test-build/src', id.slice(2)),
      parent,
      main,
    );
  return originalLoad.call(this, id, parent, main);
};
const { useTronWallet } = require('../.test-build/src/hooks/useTronWallet');
Module._load = originalLoad;
let adapter;
function Harness() {
  adapter = useTronWallet();
  return null;
}
test('actual adapter never creates on mount and signs only exact Tron address/hash; identity changes and unmount block signing', async () => {
  let root;
  const quote = {
    intent: fixtureIntent(),
    ticket: 'fixture',
    applicationFee: '0',
    energy: 120000,
    bandwidth: 1000,
  };
  try {
    await act(async () => {
      root = create(React.createElement(Harness));
    });
    assert.equal(created.length, 0);
    await adapter.driver.sign(quote);
    assert.deepEqual(signed[0], {
      address: OWNER.address,
      chainType: 'tron',
      hash: '0x' + quote.intent.transaction.txID,
    });
    refresh = async () => ({ ...user, id: 'different-user' });
    await assert.rejects(adapter.driver.sign(quote), /context changed/);
    assert.equal(signed.length, 1);
    let resolveRefresh;
    refresh = () =>
      new Promise((resolve) => {
        resolveRefresh = resolve;
      });
    const pending = adapter.driver.sign(quote);
    await act(async () => root.unmount());
    resolveRefresh(user);
    await assert.rejects(pending, /Account changed/);
    assert.equal(signed.length, 1);
    assert.equal(created.length, 0);
  } finally {
    if (root) await act(async () => root.unmount());
  }
});
