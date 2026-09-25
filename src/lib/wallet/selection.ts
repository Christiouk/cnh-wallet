import type { ConnectedWallet, User } from '@privy-io/react-auth';

// Derive the shape from the pinned SDK. Linked accounts use chainType;
// useWallets() returns connected EVM wallets with type + CAIP-2 chainId.
export type LinkedWallet = Extract<User['linkedAccounts'][number], { type: 'wallet' }>;
export type WalletChain = 'ethereum' | 'tron';
export type WalletSelection<T> =
  | { status: 'ready'; wallet: T }
  | { status: 'loading' | 'unauthenticated' | 'missing' | 'ambiguous' | 'unavailable' | 'unsupported-chain' };

export interface WalletContext {
  ready: boolean;
  authenticated: boolean;
  user: Pick<User, 'id' | 'linkedAccounts'> | null;
}

function isEmbedded(client?: string, connector?: string): boolean {
  return (client === 'privy' || client === 'privy-v2') && connector === 'embedded';
}

export function getWalletForChain(context: WalletContext, chain: string): WalletSelection<LinkedWallet> {
  if (chain !== 'ethereum' && chain !== 'tron') return { status: 'unsupported-chain' };
  if (!context.ready) return { status: 'loading' };
  if (!context.authenticated) return { status: 'unauthenticated' };
  if (!context.user) return { status: 'loading' };
  const candidates = context.user.linkedAccounts.filter(
    (account): account is LinkedWallet => account.type === 'wallet'
      && account.chainType === chain
      && isEmbedded(account.walletClientType, account.connectorType)
  );
  if (candidates.length === 0) return { status: 'missing' };
  // Never pick by array position, creation time, or index. Multiple accounts
  // need an explicitly verified continuity mapping before selecting any one.
  if (candidates.length !== 1) return { status: 'ambiguous' };
  const [wallet] = candidates;
  if (!wallet.address) return { status: 'unavailable' };
  return { status: 'ready', wallet };
}

export function getEmbeddedTronWallet(context: WalletContext) {
  return getWalletForChain(context, 'tron');
}

export function getEmbeddedEvmWallet(
  context: WalletContext,
  connected: readonly ConnectedWallet[],
  walletsReady: boolean
): WalletSelection<ConnectedWallet> {
  const account = getWalletForChain(context, 'ethereum');
  if (account.status !== 'ready') return account;
  if (!walletsReady) return { status: 'loading' };
  const candidates = connected.filter(wallet => wallet.type === 'ethereum'
    && wallet.linked
    && isEmbedded(wallet.walletClientType, wallet.connectorType)
    && wallet.address.toLowerCase() === account.wallet.address.toLowerCase());
  if (candidates.length === 0) return { status: 'unavailable' };
  if (candidates.length !== 1) return { status: 'ambiguous' };
  const [wallet] = candidates;
  return { status: 'ready', wallet };
}

export function walletStateMessage(status: WalletSelection<unknown>['status']): string | null {
  switch (status) {
    case 'ready': return null;
    case 'loading': return 'Loading your existing wallet…';
    case 'unauthenticated': return 'Sign in to access your wallet.';
    case 'missing': return 'Your embedded wallet was not found. No new wallet has been created.';
    case 'ambiguous': return 'Multiple embedded wallets were found. Wallet selection requires verification.';
    case 'unsupported-chain': return 'This network is not supported by the wallet portfolio.';
    case 'unavailable': return 'Your existing wallet is currently unavailable. Please try again.';
  }
}
