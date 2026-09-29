global.IS_REACT_ACT_ENVIRONMENT = true;
const assert = require('node:assert/strict');
const { test } = require('node:test');
const React = require('react');
const { create, act } = require('react-test-renderer');
const Module = require('node:module');
const path = require('node:path');
const originalLoad = Module._load;
const sender = '0x1111111111111111111111111111111111111111';
const recipient = '0x2222222222222222222222222222222222222222';
const hash = '0x' + 'a'.repeat(64);
let signCalls = [],
  resolveSignature;
Module._load = function (id, parent, isMain) {
  if (id === '@/hooks/useEmbeddedWallets')
    return {
      useEmbeddedWallets: () => ({
        user: { id: 'synthetic' },
        evm: { status: 'ready', wallet: { address: sender } },
      }),
    };
  if (id === '@privy-io/react-auth')
    return {
      useSendTransaction: () => ({
        sendTransaction: (tx, options) => {
          signCalls.push({ tx, options });
          return new Promise((resolve) => {
            resolveSignature = resolve;
          });
        },
      }),
    };
  if (id === './Modal' && parent.filename.endsWith('/SendModal.js'))
    return {
      __esModule: true,
      default: ({ isOpen, children }) =>
        isOpen ? React.createElement('section', null, children) : null,
    };
  if (id.startsWith('@/'))
    return originalLoad.call(
      this,
      path.resolve(__dirname, '../.test-build/src', id.slice(2)),
      parent,
      isMain,
    );
  return originalLoad.call(this, id, parent, isMain);
};
const Send = require('../.test-build/src/components/SendModal').default;
Module._load = originalLoad;
test('Send UI moves review → signature → submitted → confirming → receipt-confirmed without duplicate signing', async () => {
  const originalFetch = global.fetch,
    originalSetTimeout = global.setTimeout,
    originalClearTimeout = global.clearTimeout;
  let timer, resolveReceipt;
  global.setTimeout = (fn) => {
    timer = fn;
    return 1;
  };
  global.clearTimeout = () => {};
  global.fetch = async (_url, init) =>
    JSON.parse(init.body).action === 'preview'
      ? Response.json({ estimatedNetworkCost: '1000', chainId: 1 })
      : new Promise((resolve) => {
          resolveReceipt = resolve;
        });
  let root;
  const text = () => JSON.stringify(root.toJSON());
  const button = (label) =>
    root.root
      .findAllByType('button')
      .find((b) => b.children.join('') === label);
  try {
    await act(async () => {
      root = create(React.createElement(Send, { isOpen: true, onClose() {} }));
    });
    await act(async () => {
      const inputs = root.root.findAllByType('input');
      inputs[0].props.onChange({ target: { value: recipient } });
      inputs[1].props.onChange({ target: { value: '1' } });
    });
    await act(async () => {
      await button('Review transfer').props.onClick();
    });
    assert.match(text(), /review/);
    assert.equal(signCalls.length, 0);
    let confirmation;
    await act(async () => {
      confirmation = button('Confirm and sign').props.onClick();
      await Promise.resolve();
      await Promise.resolve();
    });
    assert.match(text(), /Requesting approval/);
    assert.equal(signCalls.length, 1);
    await act(async () => {
      resolveSignature({ hash });
      await confirmation;
    });
    assert.match(text(), /submitted/);
    assert.doesNotMatch(text(), /Confirmed in an Ethereum block/);
    assert.equal(signCalls[0].tx.value, BigInt('1000000000000000000'));
    assert.equal(signCalls[0].options.address, sender);
    await act(async () => {
      timer();
      await Promise.resolve();
    });
    assert.match(text(), /confirming/);
    await act(async () => {
      resolveReceipt(Response.json({ status: 'confirmed' }));
    });
    assert.match(text(), /Confirmed in an Ethereum block/);
    assert.equal(signCalls.length, 1);
    assert.match(text(), new RegExp(hash));
  } finally {
    if (root) await act(async () => root.unmount());
    global.fetch = originalFetch;
    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
  }
});
