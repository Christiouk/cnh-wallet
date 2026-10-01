global.IS_REACT_ACT_ENVIRONMENT = true;
const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const { create, act } = require('react-test-renderer');
const Module = require('node:module'),
  path = require('node:path');
const load = Module._load;
Module._load = function (id, parent, main) {
  if (id === 'next/image')
    return {
      __esModule: true,
      default: (props) => React.createElement('img', props),
    };
  if (id === '@privy-io/react-auth') return {};
  if (id === '../Modal')
    return {
      __esModule: true,
      default: ({ children }) => React.createElement('div', {}, children),
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
const { BuyPanel } = require('../.test-build/src/components/buy/Buy');
Module._load = load;
const events = {};
global.window = {
  addEventListener(n, f) {
    events[n] = f;
  },
  removeEventListener(n) {
    delete events[n];
  },
};
global.document = {
  visibilityState: 'visible',
  addEventListener() {},
  removeEventListener() {},
};
const address = '0x1111111111111111111111111111111111111111';
const text = (ui) => JSON.stringify(ui.toJSON());
const button = (ui, label) =>
  ui.root
    .findAllByType('button')
    .find((b) => b.children.join('') === label);
test('Buy UI identifies ERC-20/TRC-20, renders safe errors and never offers an unquoted checkout', async () => {
  for (const [code, message] of [
    ['BUY_UNAVAILABLE', 'Buy currently unavailable'],
    ['PROVIDER_UNAVAILABLE', 'temporarily unavailable'],
    ['TRON_NOT_ENABLED', 'Enable Tron first'],
  ]) {
    let ui;
    await act(async () => {
      ui = create(
        React.createElement(BuyPanel, {
          network: 'tron',
          address,
          driver: async () => {
            throw new Error(code);
          },
          onClose() {},
          onRefresh() {},
        }),
      );
    });
    assert.match(text(ui), /Tron · TRC-20/);
    assert.match(text(ui), new RegExp(message));
    assert.equal(button(ui, 'Review purchase').props.disabled, true);
    await act(async () => ui.unmount());
  }
});
test('Buy review, expiry, provider evidence status and targeted refresh', async () => {
  for (const scenario of [
    'quote-error',
    'expired',
    'processing',
    'completed',
    'failed',
    'cancelled',
    'unavailable',
  ]) {
    let ui,
      refreshes = 0,
      opens = 0;
    const driver = async (action) => {
      if (action === 'options')
        return {
          address,
          methods: [
            {
              id: 'gbp_bank_transfer',
              name: 'Bank transfer',
              min: 25,
              max: 10000,
            },
          ],
        };
      if (action === 'quote') {
        if (scenario === 'quote-error')
          throw new Error('QUOTE_UNAVAILABLE');
        return {
          address,
          cryptoAmount: 620,
          totalFee: 8,
          ticket: 'quote',
          expiresAt: Date.now() + (scenario === 'expired' ? -2000 : 10000),
        };
      }
      if (action === 'session')
        return {
          widgetUrl: 'https://global-stg.transak.com/?sessionId=fixture',
          expiresAt: Date.now() + 300000,
          ticket: 'flow',
        };
      if (action === 'status') return { status: scenario };
    };
    await act(async () => {
      ui = create(
        React.createElement(BuyPanel, {
          network: 'ethereum',
          address,
          driver,
          onClose() {},
          onRefresh() {
            refreshes++;
          },
          openCheckout: () => ({
            opener: null,
            closed: false,
            close() {},
            location: {
              replace() {
                opens++;
              },
            },
          }),
        }),
      );
    });
    assert.match(text(ui), /Ethereum · ERC-20/);
    await act(async () =>
      ui.root
        .findByType('input')
        .props.onChange({ target: { value: '500' } }),
    );
    await act(async () => button(ui, 'Review purchase').props.onClick());
    if (scenario === 'quote-error')
      assert.match(text(ui), /Quote unavailable/);
    else if (scenario === 'expired')
      assert.equal(button(ui, 'Continue to Transak').props.disabled, true);
    else {
      assert.match(text(ui), /No A3 fee or spread/);
      await act(async () =>
        button(ui, 'Continue to Transak').props.onClick(),
      );
      assert.equal(opens, 1);
      assert.match(text(ui), /Purchase started/);
      assert.doesNotMatch(text(ui), /reports purchase completed/);
      await act(async () =>
        button(ui, 'Check status & refresh wallet').props.onClick(),
      );
      assert.equal(refreshes, 1);
      const expected = {
        processing: 'Purchase processing',
        completed: 'Transak reports purchase completed',
        failed: 'Checkout failed',
        cancelled: 'Checkout cancelled',
        unavailable: 'Purchase submitted through Transak',
      };
      assert.match(text(ui), new RegExp(expected[scenario]));
    }
    await act(async () => ui.unmount());
  }
});
