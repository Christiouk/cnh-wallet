global.IS_REACT_ACT_ENVIRONMENT = true;
const assert = require('node:assert/strict');
const { test } = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { create, act } = require('react-test-renderer');
const Module = require('node:module');
const path = require('node:path');
const {
  OWNER,
  RECIPIENT,
  fixtureIntent,
} = require('../.test-build/tests/fixtures/tron');
const load = Module._load;
Module._load = function (id, parent, main) {
  if (id === '../Modal' && parent.filename.includes('/tron/'))
    return {
      __esModule: true,
      default: ({ children }) => React.createElement('section', null, children),
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
const Receive =
  require('../.test-build/src/components/tron/TronReceive').default;
const Send = require('../.test-build/src/components/tron/TronSend').default;
Module._load = load;
test('Tron Receive has correct address, QR, network and explicit TRC-20 warning; rejects Ethereum', () => {
  const html = renderToStaticMarkup(
    React.createElement(Receive, { address: OWNER.address, onClose() {} }),
  );
  assert.match(html, /USDT TRC-20/);
  assert.match(html, new RegExp(OWNER.address));
  assert.match(html, /<svg/);
  assert.match(html, /TRON \/ TRC-20/);
  assert.match(html, /Do not send USDT ERC-20/);
  const bad = renderToStaticMarkup(
    React.createElement(Receive, {
      address: '0x1111111111111111111111111111111111111111',
      onClose() {},
    }),
  );
  assert.match(bad, /Tron wallet unavailable/);
  assert.doesNotMatch(bad, /<svg/);
});
test('Tron Send lifecycle signs once, hash is not success, pending survives reopen, receipt confirms', async () => {
  const oldTimeout = global.setTimeout,
    oldClear = global.clearTimeout;
  let timer,
    resolveSignature,
    resolveBroadcast,
    signed = 0,
    confirmed = 0;
  const store = new Map();
  global.sessionStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
  };
  global.setTimeout = (fn) => {
    timer = fn;
    return 1;
  };
  global.clearTimeout = () => {};
  const quote = {
    intent: fixtureIntent(),
    ticket: 'fixture',
    applicationFee: '0',
    energy: 120000,
    bandwidth: 1000,
  };
  let receipt = 'pending';
  const driver = {
    current: () => OWNER,
    enable: async () => {},
    sign: () => {
      signed++;
      return new Promise((r) => {
        resolveSignature = r;
      });
    },
    api: async (action) =>
      action === 'prepare'
        ? quote
        : action === 'broadcast'
          ? new Promise((r) => {
              resolveBroadcast = r;
            })
          : { status: receipt },
  };
  let root;
  const text = () => JSON.stringify(root.toJSON());
  const button = (label) =>
    root.root
      .findAllByType('button')
      .find((b) => b.children.join('') === label);
  const props = {
    owner: OWNER,
    driver,
    onClose() {},
    onConfirmed() {
      confirmed++;
    },
  };
  try {
    await act(async () => {
      root = create(React.createElement(Send, props));
    });
    await act(async () => {
      const fields = root.root.findAllByType('input');
      fields[0].props.onChange({ target: { value: RECIPIENT } });
      fields[1].props.onChange({ target: { value: '1.25' } });
    });
    await act(async () => {
      await root.root
        .findByType('form')
        .props.onSubmit({ preventDefault() {} });
    });
    assert.match(text(), /Confirm and authorize/);
    assert.match(text(), /None · 0 USDT/);
    let sending;
    await act(async () => {
      sending = button('Confirm and authorize').props.onClick();
    });
    assert.match(text(), /Requesting approval/);
    assert.equal(signed, 1);
    await act(async () => {
      resolveSignature('0x' + '1'.repeat(128));
    });
    assert.match(text(), /Submitted/);
    assert.doesNotMatch(text(), /Transfer confirmed/);
    await act(async () => {
      resolveBroadcast({ status: 'submitted' });
      await sending;
    });
    await act(async () => {
      await timer();
    });
    assert.match(text(), /Confirming on Tron/);
    assert.equal(store.size, 1);
    await act(async () => {
      root.unmount();
      root = create(React.createElement(Send, props));
    });
    assert.match(text(), /Confirming on Tron/);
    assert.equal(signed, 1);
    receipt = 'confirmed';
    await act(async () => {
      await timer();
    });
    assert.match(text(), /Transfer confirmed/);
    assert.equal(confirmed, 1);
    assert.equal(store.size, 0);
  } finally {
    if (root) await act(async () => root.unmount());
    global.setTimeout = oldTimeout;
    global.clearTimeout = oldClear;
    delete global.sessionStorage;
  }
});

test('Receive QR encodes the exact selected Tron address', async () => {
  const { QRCodeSVG } = require('qrcode.react');
  let root;
  try {
    await act(async () => {
      root = create(
        React.createElement(Receive, { address: OWNER.address, onClose() {} }),
      );
    });
    assert.equal(root.root.findByType(QRCodeSVG).props.value, OWNER.address);
  } finally {
    if (root) await act(async () => root.unmount());
  }
});
