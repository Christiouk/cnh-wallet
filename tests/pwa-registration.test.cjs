global.IS_REACT_ACT_ENVIRONMENT = true;
const assert = require('node:assert/strict');
const { test } = require('node:test');
const React = require('react');
const { create, act } = require('react-test-renderer');
const { ServiceWorkerRegistration } = require('../.test-build/src/components/ServiceWorkerRegistration');
test('PWA registers before or after page load, cleans listeners, and stays off in development', async () => {
  const names = ['window', 'document', 'navigator'];
  const originals = names.map(name => Object.getOwnPropertyDescriptor(global, name));
  const env = process.env.NODE_ENV;
  try {
    for (const [mode, ready] of [['production', 'complete'], ['production', 'loading'], ['development', 'complete']]) {
      process.env.NODE_ENV = mode;
      let calls = 0, listener, root;
      Object.defineProperty(global, 'document', { configurable: true, value: { readyState: ready } });
      Object.defineProperty(global, 'navigator', { configurable: true, value: { serviceWorker: { register: async (url) => { assert.equal(url, '/sw.js'); calls++; return { scope: 'local-fixture' }; } } } });
      Object.defineProperty(global, 'window', { configurable: true, value: {
        addEventListener(type, fn, options) { assert.equal(type, 'load'); assert.equal(options.once, true); listener = fn; },
        removeEventListener(type, fn) { assert.equal(type, 'load'); if (listener === fn) listener = undefined; },
      } });
      await act(async () => { root = create(React.createElement(ServiceWorkerRegistration)); });
      if (mode === 'production' && ready === 'loading') { assert.equal(calls, 0); await act(async () => { listener(); }); }
      assert.equal(calls, mode === 'production' ? 1 : 0);
      await act(async () => { root.unmount(); });
      assert.equal(listener, undefined);
    }
  } finally {
    names.forEach((name, i) => { if (originals[i]) Object.defineProperty(global, name, originals[i]); else delete global[name]; });
    if (env === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = env;
  }
});
