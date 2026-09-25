const assert = require('node:assert/strict');
const { test } = require('node:test');
const React = require('react');
const { create, act } = require('react-test-renderer');
const { usePortfolioBalances } = require('../.test-build/src/hooks/usePortfolioBalances');
const { CURATED_TOKENS } = require('../.test-build/src/lib/tokens');

test('account switches, refresh, rejected RPC and late responses cannot display an old or false zero balance', async () => {
  const originalFetch = global.fetch;
  const requests = [];
  global.fetch = (_url, options) => new Promise((resolve, reject) => requests.push({ resolve, reject, options }));
  let latest;
  function Probe({ userId, address }) { latest = usePortfolioBalances(userId, address); return null; }
  const response = value => ({ ok: true, json: async () => ({ balances: CURATED_TOKENS.map(t => ({ symbol: t.symbol, address: t.address, balance: value })) }) });
  let root;
  try {
    await act(async () => { root = create(React.createElement(Probe, { userId: 'a', address: '0xa' })); });
    assert.equal(latest.state.status, 'loading');
    await act(async () => { root.update(React.createElement(Probe, { userId: 'b', address: '0xb' })); });
    assert.equal(requests[0].options.signal.aborted, true);
    await act(async () => { requests[0].resolve(response('123')); });
    assert.equal(latest.state.status, 'loading');
    await act(async () => { requests[1].resolve(response('0')); });
    assert.equal(latest.state.status, 'ready');
    assert.equal(latest.state.balances[0].balance, '0');
    await act(async () => { root.update(React.createElement(Probe, {})); });
    assert.equal(latest.state.status, 'unavailable');
    await act(async () => { root.update(React.createElement(Probe, { userId: 'b', address: '0xb' })); });
    assert.equal(latest.state.status, 'loading');
    await act(async () => { requests[2].resolve(response('1')); });
    assert.equal(latest.state.status, 'ready');
    await act(async () => { latest.refresh(); });
    assert.equal(latest.state.status, 'loading');
    await act(async () => { requests[3].reject(new Error('network unavailable')); });
    assert.equal(latest.state.status, 'rpc-error');
    assert.equal('balances' in latest.state, false);
    await act(async () => { root.update(React.createElement(Probe, {})); });
    assert.equal(latest.state.status, 'unavailable');
    assert.equal(requests.length, 4);
  } finally {
    if (root) await act(async () => root.unmount());
    global.fetch = originalFetch;
  }
});
