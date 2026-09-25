import type { WalletSelection } from './selection';

// A3 product capabilities, deliberately separate from Privy's EVM transport list.
export const A3_NETWORKS = {
  ethereum: { chainType: 'ethereum', chainId: 'eip155:1', status: 'active', assets: ['ETH', 'USDT', 'USDC'] },
  tron: { chainType: 'tron', chainId: 'tron:mainnet', status: 'deferred', assets: ['TRX', 'USDT'] },
} as const;
export type A3Network = keyof typeof A3_NETWORKS;

export type NetworkWalletState =
  | { status: 'ready'; network: A3Network; address: string }
  | { status: Exclude<WalletSelection<unknown>['status'], 'ready'> | 'deferred'; network: string };

export function getNetworkWalletState(
  network: string,
  evm: WalletSelection<{ address: string }>,
  tron: WalletSelection<{ address: string }>
): NetworkWalletState {
  if (network !== 'ethereum' && network !== 'tron') return { status: 'unsupported-chain', network };
  const selection = network === 'ethereum' ? evm : tron;
  if (selection.status !== 'ready') return { status: selection.status, network };
  if (A3_NETWORKS[network].status === 'deferred') return { status: 'deferred', network };
  return { status: 'ready', network, address: selection.wallet.address };
}
