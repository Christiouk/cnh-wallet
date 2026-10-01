import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ConnectedWallet } from '@privy-io/react-auth';
import type { useCreateWallet } from '@privy-io/react-auth/extended-chains';
import { getEmbeddedEvmWallet, getEmbeddedTronWallet, getWalletForChain, type LinkedWallet, type WalletContext } from '../src/lib/wallet/selection';
import { getNetworkWalletState } from '../src/lib/wallet/networks';
import { parsePortfolioResponse } from '../src/lib/wallet/balances';
import { CURATED_TOKENS } from '../src/lib/tokens';

const address = '0x1111111111111111111111111111111111111111';
function account(overrides: Partial<LinkedWallet> = {}): LinkedWallet {
  return { type: 'wallet', chainType: 'ethereum', address, walletClientType: 'privy', connectorType: 'embedded',
    imported: false, delegated: false, walletIndex: null, firstVerifiedAt: null, latestVerifiedAt: null, ...overrides };
}
let mutations = 0;
const mutate = async () => { mutations++; };
function connected(overrides: Partial<ConnectedWallet> = {}): ConnectedWallet {
  return { type: 'ethereum', address, chainId: 'eip155:1', walletClientType: 'privy', connectorType: 'embedded',
    imported: false, connectedAt: 0, linked: true, meta: { id: 'privy', name: 'Privy', icon: '' },
    isConnected: async () => true, fund: mutate, disconnect: mutate, loginOrLink: mutate, unlink: mutate,
    switchChain: mutate, sign: async () => { mutations++; return ''; },
    getEthereumProvider: async () => { mutations++; throw new Error('must not access signer'); },
    ...overrides };
}
const context = (accounts: LinkedWallet[] = [account()]): WalletContext => ({
  ready: true, authenticated: true, user: { id: 'did:privy:test-existing', linkedAccounts: accounts },
});

test('selects the existing embedded EVM signer without changing its address', () => {
  const wallet = connected();
  assert.deepEqual(getEmbeddedEvmWallet(context(), [wallet], true), { status: 'ready', wallet });
});
test('external wallet cannot replace embedded wallet, regardless of array order', () => {
  const external = connected({ walletClientType: 'metamask', connectorType: 'injected', address: '0x2222222222222222222222222222222222222222' });
  const wallet = connected();
  for (const wallets of [[external, wallet], [wallet, external]]) {
    assert.deepEqual(getEmbeddedEvmWallet(context(), wallets, true), { status: 'ready', wallet });
  }
  assert.equal(getEmbeddedEvmWallet(context(), [external], true).status, 'unavailable');
});
test('two embedded EVM accounts fail closed in either order', () => {
  const other = account({ address: '0x2222222222222222222222222222222222222222', walletIndex: 1 });
  for (const accounts of [[account(), other], [other, account()]]) {
    assert.equal(getEmbeddedEvmWallet(context(accounts), [connected()], true).status, 'ambiguous');
  }
});
test('EVM and Tron linked accounts remain distinct under the same user', () => {
  const tron = account({ chainType: 'tron', walletClientType: 'privy-v2', address: 'TTestAddressForSelectionOnly' });
  const ctx = context([tron, account()]);
  assert.deepEqual(getEmbeddedTronWallet(ctx), { status: 'ready', wallet: tron });
  assert.equal(getEmbeddedEvmWallet(ctx, [connected()], true).status, 'ready');
});
test('missing Tron does not cause creation or EVM fallback', () => {
  assert.deepEqual(getEmbeddedTronWallet(context()), { status: 'missing' });
});
test('future explicit Tron creation input is supported by the installed SDK type', () => {
  const input: Parameters<ReturnType<typeof useCreateWallet>['createWallet']>[0] = { chainType: 'tron' };
  assert.equal(input.chainType, 'tron'); // Type-only import: no SDK creation hook runs.
});
test('missing EVM does not use external or Tron wallet', () => {
  assert.equal(getEmbeddedEvmWallet(context([account({ chainType: 'tron' })]), [connected()], true).status, 'missing');
  assert.equal(getEmbeddedEvmWallet(context([account({ walletClientType: 'metamask', connectorType: 'injected' })]), [connected()], true).status, 'missing');
});
test('auth and wallet hydration are explicit; stale connected wallet alone is insufficient', () => {
  assert.equal(getEmbeddedEvmWallet({ ...context(), ready: false }, [connected()], true).status, 'loading');
  assert.equal(getEmbeddedEvmWallet({ ...context(), authenticated: false }, [connected()], true).status, 'unauthenticated');
  assert.equal(getEmbeddedEvmWallet({ ...context(), user: null }, [connected()], true).status, 'loading');
  assert.equal(getEmbeddedEvmWallet(context(), [connected()], false).status, 'loading');
  assert.equal(getEmbeddedEvmWallet(context([]), [connected()], true).status, 'missing');
});
test('unlinked, mismatched and duplicate connectors cannot become signers', () => {
  assert.equal(getEmbeddedEvmWallet(context(), [connected({ linked: false })], true).status, 'unavailable');
  assert.equal(getEmbeddedEvmWallet(context(), [connected({ address: '0x2222222222222222222222222222222222222222' })], true).status, 'unavailable');
  assert.equal(getEmbeddedEvmWallet(context(), [connected(), connected()], true).status, 'ambiguous');
});
test('selection never invokes provider, signing, linking or mutation methods', () => {
  mutations = 0;
  const ctx = context(); const wallet = connected();
  Object.freeze(wallet); Object.freeze(ctx.user!.linkedAccounts);
  for (let i = 0; i < 3; i++) {
    getEmbeddedEvmWallet(ctx, [wallet], true); getEmbeddedTronWallet(ctx);
  }
  assert.equal(mutations, 0);
  assert.equal(ctx.user!.linkedAccounts.length, 1);
});
test('unsupported chain has explicit state and never inherits an EVM address', () => {
  assert.equal(getWalletForChain(context(), 'bitcoin').status, 'unsupported-chain');
  const evm = getEmbeddedEvmWallet(context(), [connected()], true);
  for (const network of ['base', 'polygon', 'arbitrum', 'optimism', 'bsc', 'bitcoin', '__proto__']) {
    assert.deepEqual(getNetworkWalletState(network, evm, { status: 'missing' }), { status: 'unsupported-chain', network });
  }
});
test('Tron selects its own valid address when an account exists', () => {
  assert.deepEqual(getNetworkWalletState('tron', { status: 'missing' }, { status: 'ready', wallet: { address: 'TJRabPrwbZy45sbavfcjinPJC18kjpRTv8' } }), { status: 'ready', network: 'tron', address: 'TJRabPrwbZy45sbavfcjinPJC18kjpRTv8' });
  assert.deepEqual(getNetworkWalletState('tron', { status: 'missing' }, { status: 'missing' }), { status: 'missing', network: 'tron' });
});
test('real zero is valid; RPC error, absent balance, malformed result and wrong token are not zero', () => {
  const tokens = CURATED_TOKENS.slice(0, 1);
  const row = { symbol: 'ETH', address: null, balance: '0' };
  const zero = parsePortfolioResponse({ balances: [row] }, tokens);
  assert.equal(zero.status, 'ready');
  if (zero.status === 'ready') assert.equal(zero.balances[0].balance, '0');
  for (const payload of [null, {}, { balances: [] }, { balances: [{ ...row, error: 'RPC failed' }] },
    { balances: [{ ...row, balance: null }] }, { balances: [{ ...row, balance: '-1' }] },
    { balances: [{ ...row, address: '0xwrong' }] }, { balances: [row, row] }]) {
    assert.equal(parsePortfolioResponse(payload, tokens).status, 'rpc-error');
  }
});
