global.IS_REACT_ACT_ENVIRONMENT = true;
const assert = require('node:assert/strict');
const { test } = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const Module = require('node:module');
const path = require('node:path');
const originalLoad = Module._load;
const address = '0x1111111111111111111111111111111111111111';
const wallet = {
  user: { id: 'synthetic-user' },
  evm: { status: 'ready', wallet: { address } },
};
const tokens = require('../.test-build/src/lib/tokens').CURATED_TOKENS;
Module._load = function (id, parent, isMain) {
  if (id === '@/hooks/useEmbeddedWallets')
    return { useEmbeddedWallets: () => wallet };
  if (id === '@/hooks/usePortfolioBalances')
    return {
      usePortfolioBalances: () => ({
        state: {
          status: 'ready',
          balances: tokens.map((t) => ({
            ...t,
            balance: '0',
            formattedBalance: '0',
          })),
        },
        refresh() {},
      }),
    };
  if (id === '@/hooks/usePrices')
    return { usePrices: () => ({ prices: {}, isLoading: false }) };
  if (id === '@privy-io/react-auth')
    return {
      usePrivy: () => ({ logout() {} }),
      useSendTransaction: () => ({
        sendTransaction: async () => {
          throw new Error('No signing permitted in UI rendering test');
        },
      }),
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
const Dashboard = require('../.test-build/src/components/Dashboard').default;
const Receive = require('../.test-build/src/components/ReceiveModal').default;
const Actions = require('../.test-build/src/components/ActionButtons').default;
Module._load = originalLoad;
test('rendered dashboard has only Buy/Send/Receive actions and no legacy product or broad network options', () => {
  const html = renderToStaticMarkup(React.createElement(Dashboard));
  for (const action of ['Buy', 'Send', 'Receive'])
    assert.match(html, new RegExp('>' + action + '</button>'));
  assert.doesNotMatch(
    html,
    />(Sell|Swap|Fund|Earn|Card|Bitcoin|Base|Polygon|Arbitrum|Optimism|BNB)</,
  );
  assert.doesNotMatch(
    html,
    /wa\.me|Trade Support|Morsands Service Fee|Multi-Chain/,
  );
  assert.match(html, /Ethereum/);
  assert.match(html, /USD valuation unavailable/);
});
test('Receive renders the resolved Ethereum address, QR and Ethereum-only asset warning', () => {
  const html = renderToStaticMarkup(
    React.createElement(Receive, {
      isOpen: true,
      onClose() {},
      walletAddress: wallet.evm.wallet.address,
    }),
  );
  assert.match(html, new RegExp(address));
  assert.match(html, /<svg/);
  assert.match(html, /Your Ethereum Wallet Address/);
  assert.match(html, /USDT ERC-20 and USDC ERC-20/);
  const unavailable = renderToStaticMarkup(
    React.createElement(Receive, {
      isOpen: true,
      onClose() {},
      walletAddress: '',
    }),
  );
  assert.match(unavailable, /Ethereum wallet unavailable/);
  assert.doesNotMatch(unavailable, /Your Ethereum Wallet Address/);
});
test('Buy explicitly unavailable, no legacy provider iframe or desk fallback', () => {
  const html = renderToStaticMarkup(
    React.createElement(Actions, {
      disabled: false,
      onSend() {},
      onReceive() {},
    }),
  );
  assert.match(html, /Buy temporarily unavailable/);
  assert.match(html, /<button disabled=""[^>]*>Buy<\/button>/);
  assert.doesNotMatch(html, /iframe|wa\.me|apiKey/);
});
