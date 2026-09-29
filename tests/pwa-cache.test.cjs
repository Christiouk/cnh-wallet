const assert = require('node:assert/strict');
const { test } = require('node:test');
const vm = require('node:vm');
const fs = require('node:fs');
test('service worker excludes navigation, APIs, RSC, query strings, arbitrary images and external requests', async () => {
  const handlers = {},
    cached = [],
    deleted = [];
  vm.runInNewContext(fs.readFileSync('public/sw.js', 'utf8'), {
    URL,
    Promise,
    fetch: async () => ({
      ok: true,
      type: 'basic',
      clone() {
        return this;
      },
    }),
    caches: {
      open: async () => ({
        addAll: async (urls) => cached.push(...urls),
        put: async () => {},
      }),
      match: async () => undefined,
      keys: async () => [
        'a3-brand-v2',
        'a3-brand-static-v2',
        'a3-ui-static-v3',
      ],
      delete: async (name) => deleted.push(name),
    },
    self: {
      location: { origin: 'https://wallet.example.test' },
      addEventListener: (name, fn) => (handlers[name] = fn),
      skipWaiting() {},
      clients: { claim: async () => {} },
    },
  });
  let pending;
  handlers.install({ waitUntil: (p) => (pending = p) });
  await pending;
  assert(!cached.includes('/'));
  assert(cached.includes('/manifest.json'));
  for (const pathname of cached) assert(fs.existsSync('public' + pathname));
  handlers.activate({ waitUntil: (p) => (pending = p) });
  await pending;
  assert.deepEqual(deleted, ['a3-brand-v2', 'a3-brand-static-v2']);
  for (const [url, mode, method] of [
    ['/', 'navigate', 'GET'],
    ['/api/balances', 'cors', 'GET'],
    ['/?_rsc=token', 'cors', 'GET'],
    ['/account.png', 'cors', 'GET'],
    ['/icons/icon-192x192.png?account=1', 'cors', 'GET'],
    ['https://auth.privy.io/', 'cors', 'GET'],
    ['/icons/icon-192x192.png', 'cors', 'POST'],
  ]) {
    let intercepted = false;
    handlers.fetch({
      request: {
        url: new URL(url, 'https://wallet.example.test').href,
        mode,
        method,
      },
      respondWith() {
        intercepted = true;
      },
    });
    assert.equal(intercepted, false, url);
  }
  let response;
  handlers.fetch({
    request: {
      url: 'https://wallet.example.test/icons/icon-192x192.png',
      method: 'GET',
      mode: 'cors',
    },
    respondWith: (p) => (response = p),
    waitUntil() {},
  });
  assert(response);
  await response;
});
test('manifest retains A3 identity and approved install icons', () => {
  const manifest = JSON.parse(fs.readFileSync('public/manifest.json'));
  assert.equal(manifest.name, 'A3 Wallet');
  assert.equal(manifest.short_name, 'A3');
  assert.equal(manifest.display, 'standalone');
  assert.deepEqual(
    manifest.icons.map((i) => i.sizes),
    ['192x192', '512x512'],
  );
  for (const icon of manifest.icons) assert(fs.existsSync('public' + icon.src));
});
