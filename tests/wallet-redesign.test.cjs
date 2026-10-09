global.IS_REACT_ACT_ENVIRONMENT = true;
const assert = require('node:assert/strict');
const { test } = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { create, act } = require('react-test-renderer');
const Module = require('node:module');
const path = require('node:path');
const load = Module._load;
Module._load = function (id, parent, main) {
  if (id.startsWith('@/'))
    return load.call(
      this,
      path.resolve(__dirname, '../.test-build/src', id.slice(2)),
      parent,
      main,
    );
  return load.call(this, id, parent, main);
};
const Balance = require('../.test-build/src/components/BalanceCard').default;
const Activity =
  require('../.test-build/src/components/ui/ActivityView').default;
const Status = require('../.test-build/src/components/ui/TransferStatus');
const { LoginView } = require('../.test-build/src/components/LoginScreen');
const {
  default: WalletShell,
  AccountPanel,
} = require('../.test-build/src/components/ui/WalletShell');
const Actions = require('../.test-build/src/components/ActionButtons').default;
Module._load = load;
const render = (Component, props) =>
  renderToStaticMarkup(React.createElement(Component, props));
test('zero balance, loading, unavailable and missing pricing stay distinct', () => {
  assert.match(
    render(Balance, { totalUsdValue: 0, isLoading: false }),
    /\$0\.00/,
  );
  for (const props of [
    { isLoading: true },
    { isLoading: false, unavailable: true },
    { isLoading: false },
  ]) {
    const html = render(Balance, props);
    assert.doesNotMatch(html, /\$0\.00/);
  }
  assert.match(
    render(Balance, { isLoading: false, unavailable: true }),
    /Balance unavailable/,
  );
  assert.match(
    render(Balance, { isLoading: false }),
    /USD valuation unavailable/,
  );
});
test('activity provider failure cannot become empty activity', () => {
  const props = {
    network: 'Tron',
    rows: [],
    note: 'USDT TRC-20 only',
    onRefresh() {},
  };
  const unavailable = render(Activity, { ...props, state: 'unavailable' });
  assert.match(unavailable, /Activity temporarily unavailable/);
  assert.doesNotMatch(unavailable, /No recent activity/);
  assert.match(
    render(Activity, { ...props, state: 'ready' }),
    /No recent activity/,
  );
});
test('submitted and confirming are not success; provider internals are not displayed', () => {
  for (const stage of [
    'submitted',
    'confirming',
    'requesting-signature',
    'signing',
  ]) {
    const html = render(Status.default, { stage, network: 'Ethereum' });
    assert.doesNotMatch(html, /Transfer confirmed|status-confirmed/);
  }
  assert.match(
    render(Status.default, { stage: 'confirmed', network: 'Tron' }),
    /Transfer confirmed/,
  );
  assert.match(
    Status.friendlyError('Network resource required. Add TRX.'),
    /Network resource required/,
  );
  assert.match(
    Status.friendlyError('Insufficient ETH for network cost'),
    /Insufficient ETH/,
  );
  assert.doesNotMatch(
    Status.friendlyError('Error: SDK_SECRET at module/file.ts:99'),
    /SDK_SECRET|module\/file/,
  );
});
test('preserved post-launch Apple, device sign-in and email call only their assigned callback', async () => {
  process.env.NEXT_PUBLIC_A3_POST01_AUTH_ENABLED = 'true';
  const calls = [];
  let root;
  await act(async () => {
    root = create(
      React.createElement(LoginView, {
        onApple: () => calls.push('apple'),
        onDevice: () => calls.push('device'),
        onEmail: () => calls.push('email'),
      }),
    );
  });
  await act(async () => {
    for (const button of root.root.findAllByType('button'))
      button.props.onClick();
  });
  assert.deepEqual(calls, ['apple', 'device', 'email']);
  delete process.env.NEXT_PUBLIC_A3_POST01_AUTH_ENABLED;
  await act(async () => root.unmount());
});
test('account panel displays full addresses but no internal identity fields', () => {
  const html = render(AccountPanel, {
    account: {
      email: 'synthetic@example.test',
      ethereum: '0x' + '1'.repeat(40),
      tron: 'synthetic-tron-address',
      did: 'private-id',
      walletId: 'internal-wallet',
    },
    onLogout() {},
  });
  assert.match(html, /synthetic@example.test/);
  assert.match(html, /synthetic-tron-address/);
  assert.doesNotMatch(html, /private-id|internal-wallet/);
  assert.match(html, /Sign out/);
});
test('Receive remains available when Tron Send is gated', () => {
  const html = render(Actions, {
    disabled: false,
    sendDisabled: true,
    onSend() {},
    onReceive() {},
  });
  assert.match(
    html,
    /<button class="btn-primary"><span[^>]*>[^<]*<\/span>Receive<\/button>/,
  );
  assert.match(html, /<button class="btn-secondary" disabled=""/);
  assert.doesNotMatch(html, /Buy|Swap/);
});

test('opening Settings preserves the mounted wallet and its confirmation lifecycle', async () => {
  let mounts = 0,
    unmounts = 0,
    root;
  function WalletLifecycle() {
    React.useEffect(() => {
      mounts++;
      return () => {
        unmounts++;
      };
    }, []);
    return React.createElement('p', null, 'Confirmation in progress');
  }
  const props = {
    network: 'ethereum',
    onNetworkChange() {},
    account: {},
    onLogout() {},
    onViewChange() {},
  };
  const render = (view) =>
    React.createElement(
      WalletShell,
      { ...props, view },
      React.createElement(WalletLifecycle),
    );
  await act(async () => {
    root = create(render('wallet'));
  });
  await act(async () => {
    root.update(render('settings'));
  });
  assert.equal(mounts, 1);
  assert.equal(unmounts, 0);
  assert.equal(root.root.findAllByProps({ hidden: true }).length, 1);
  await act(async () => {
    root.update(render('wallet'));
  });
  assert.equal(mounts, 1);
  assert.equal(unmounts, 0);
  await act(async () => root.unmount());
  assert.equal(unmounts, 1);
});

test('activity identifies known assets locally without inventing an asset for contract activity', () => {
  const base = {
    network: 'Ethereum',
    state: 'ready',
    onRefresh() {},
    note: 'Provider scope retained',
  };
  const row = {
    hash: 'synthetic',
    direction: 'Sent',
    amount: '1.25',
    asset: 'USDT',
    timestamp: 1700000000000,
    status: 'confirmed',
    explorer: 'https://example.test/tx',
  };
  const known = render(Activity, { ...base, rows: [row] });
  assert.match(known, /tokens\/usdt.svg/);
  assert.match(known, /ERC-20/);
  assert.match(known, /Ethereum/);
  const unknown = render(Activity, {
    ...base,
    rows: [
      { ...row, asset: null, amount: null, direction: 'Contract activity' },
    ],
  });
  assert.match(unknown, /Asset unavailable/);
  assert.match(unknown, /Amount unavailable/);
  assert.doesNotMatch(unknown, /tokens\//);
});
test('Tron resource notice explains network cost, retains details and never implies an A3 charge', () => {
  const ErrorView =
    require('../.test-build/src/components/ui/TransferError').default;
  const html = render(ErrorView, {
    message: 'Network resource required. Add TRX before sending.',
  });
  assert.match(html, /role="alert"/);
  assert.match(html, /Network resource required/);
  assert.match(html, /not an A3 charge/);
  assert.match(html, /<summary tabindex="0">Network details/);
  assert.match(html, /Add TRX before sending/);
  assert.doesNotMatch(
    render(ErrorView, { message: '<raw provider secret>' }),
    /raw provider secret/,
  );
});

test('deletion initiation is explicit, contains no identity in its URL and never claims completion', () => {
  const html = render(AccountPanel, { account: { email: 'owner@example.invalid', ethereum: '0x1111111111111111111111111111111111111111' }, onLogout() {} });
  assert.match(html, /Request account deletion/);
  assert.match(html, /mailto:privacy@morsands.com\?subject=A3%20account%20deletion%20request/);
  assert.match(html, /does not submit a request/);
  assert.match(html, /Final deletion is not automated/);
  assert.doesNotMatch(html, /href="[^"]*(owner%40|owner@example|0x1111)/);
  assert.doesNotMatch(html, /Account deleted|Deletion complete/);
});

test('Release 1 live dashboards have no Buy or Swap wiring; implementations remain available for isolated development', () => {
  const fs = require('node:fs');
  for (const f of ['Dashboard.tsx', 'tron/TronWorkspace.tsx']) {
    const source = fs.readFileSync(path.join(__dirname, '../src/components', f), 'utf8');
    const live = source.split('export function ')[0];
    assert.doesNotMatch(live, /renderBuy=|renderSwap=|<Buy\b|<Swap\b/);
  }
  for (const f of ['buy/Buy.tsx', 'swap/Swap.tsx']) assert.ok(fs.existsSync(path.join(__dirname, '../src/components', f)));
});
