global.IS_REACT_ACT_ENVIRONMENT = true;
const { test } = require('node:test'),
  assert = require('node:assert/strict'),
  React = require('react'),
  { create, act } = require('react-test-renderer'),
  Module = require('node:module'),
  path = require('node:path');
const load = Module._load;
Module._load = function (id, parent, main) {
  if (id === '@privy-io/react-auth') return {};
  if (id === 'next/image')
    return {
      __esModule: true,
      default: (p) => React.createElement('img', p),
    };
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
const { SwapPanel } = require('../.test-build/src/components/swap/Swap');
Module._load = load;
const address = '0x1111111111111111111111111111111111111111';
const button = (ui, label) =>
  ui.root
    .findAllByType('button')
    .find((b) => b.children.join('') === label);
const text = (ui) => JSON.stringify(ui.toJSON());
test('unavailable Swap has canonical assets and no active quote or signing', async () => {
  let ui;
  await act(async () => {
    ui = create(
      React.createElement(SwapPanel, {
        address,
        balances: [],
        driver: {
          api: async () => ({ enabled: false }),
          sign: async () => {
            throw Error('must not sign');
          },
        },
        onClose() {},
        onRefresh() {},
      }),
    );
  });
  try {
    assert.match(text(ui), /Swap currently unavailable/);
    assert.match(text(ui), /ERC-20/);
    assert.doesNotMatch(text(ui), /TRX|Tron/);
    assert.equal(button(ui, 'Get estimate').props.disabled, true);
  } finally {
    await act(async () => ui.unmount());
  }
});
test('approval, fresh firm review, submitted, confirmation and rejection stay distinct', async () => {
  for (const failure of [false, true]) {
    let ui,
      phase = 'price',
      signs = 0,
      refreshes = 0;
    const v = {
      id: 'fixture',
      address,
      intent: { sellAsset: 'USDT', buyAsset: 'ETH', amount: '1' },
      buyAmount: '1000000000000000',
      minimum: '990000000000000',
      networkCost: '10000',
      providerFee: '0',
      balance: '5000000',
      expiresAt: Date.now() + 60000,
      phase: 'price',
      approval: 'approve',
    };
    const driver = {
      api: async (action) => {
        if (action === 'availability') return { enabled: true };
        if (action === 'price') return v;
        if (action === 'prepare') {
          phase = signs ? 'firm' : 'approval';
          return { ...v, phase, approvalAmount: '1000000' };
        }
        if (action === 'authorize')
          return {
            transaction: { from: address, chainId: 1 },
            expiresAt: Date.now() + 30000,
          };
        if (action === 'receipt')
          return {
            status:
              phase === 'approval' ? 'approval-confirmed' : 'confirmed',
          };
      },
      sign: async () => {
        if (failure) throw Error('rejected');
        signs++;
        return '0x' + 'a'.repeat(64);
      },
    };
    await act(async () => {
      ui = create(
        React.createElement(SwapPanel, {
          address,
          balances: [],
          driver,
          onClose() {},
          onRefresh() {
            refreshes++;
          },
        }),
      );
    });
    try {
      await act(async () =>
        ui.root
          .findByType('input')
          .props.onChange({ target: { value: '1' } }),
      );
      await act(async () => button(ui, 'Get estimate').props.onClick());
      assert.match(text(ui), /Quote ready/);
      await act(async () => button(ui, 'Review Swap').props.onClick());
      assert.match(text(ui), /Approval required/);
      await act(async () => button(ui, 'Approve USDT').props.onClick());
      if (failure) {
        assert.match(text(ui), /rejected or could not be completed/);
        assert.equal(refreshes, 0);
      } else {
        assert.match(text(ui), /Submitted/);
        assert.doesNotMatch(text(ui), /Swap confirmed/);
        await act(async () =>
          button(ui, 'Check confirmation').props.onClick(),
        );
        assert.match(text(ui), /Approval confirmed/);
        assert.equal(refreshes, 0);
        await act(async () =>
          button(ui, 'Continue to fresh quote').props.onClick(),
        );
        assert.match(text(ui), /Review Swap/);
        await act(async () => button(ui, 'Confirm Swap').props.onClick());
        assert.equal(refreshes, 0);
        await act(async () =>
          button(ui, 'Check confirmation').props.onClick(),
        );
        assert.match(text(ui), /Swap confirmed/);
        assert.equal(refreshes, 1);
      }
    } finally {
      await act(async () => ui.unmount());
    }
  }
});

test('closing during authorization prevents a late wallet signature', async () => {
  let ui,
    release,
    signed = false;
  const view = {
    id: 'closing',
    address,
    intent: { sellAsset: 'ETH', buyAsset: 'USDT', amount: '1' },
    buyAmount: '1000000',
    minimum: '990000',
    networkCost: '10000',
    providerFee: '0',
    balance: '2000000000000000000',
    expiresAt: Date.now() + 60000,
    phase: 'price',
    approval: 'none',
  };
  const driver = {
    api: async (action) => {
      if (action === 'availability') return { enabled: true };
      if (action === 'price') return view;
      if (action === 'prepare') return { ...view, phase: 'firm' };
      if (action === 'authorize')
        return new Promise((resolve) => {
          release = resolve;
        });
    },
    sign: async () => {
      signed = true;
      return '0x' + 'a'.repeat(64);
    },
  };
  const props = {
    address,
    balances: [],
    driver,
    onClose() {},
    onRefresh() {},
  };
  await act(async () => {
    ui = create(React.createElement(SwapPanel, props));
  });
  try {
    await act(async () =>
      ui.root
        .findByType('input')
        .props.onChange({ target: { value: '1' } }),
    );
    await act(async () => button(ui, 'Get estimate').props.onClick());
    await act(async () => button(ui, 'Review Swap').props.onClick());
    let pending;
    await act(async () => {
      pending = button(ui, 'Confirm Swap').props.onClick();
    });
    await act(async () =>
      ui.update(
        React.createElement(SwapPanel, { ...props, isOpen: false }),
      ),
    );
    await act(async () => {
      release({
        transaction: { from: address, chainId: 1 },
        expiresAt: Date.now() + 30000,
      });
      await pending;
    });
    assert.equal(signed, false);
  } finally {
    await act(async () => ui.unmount());
  }
});
