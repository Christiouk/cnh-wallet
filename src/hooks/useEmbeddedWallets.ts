'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { getEmbeddedEvmWallet, getEmbeddedTronWallet } from '@/lib/wallet/selection';

// Read-only: no creation, linking, recovery, migration, or signing hooks.
export function useEmbeddedWallets() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const context = { ready, authenticated, user };
  const evm = getEmbeddedEvmWallet(context, wallets, walletsReady);
  const tron = getEmbeddedTronWallet(context);
  return { user, evm, tron, evmWallet: evm.status === 'ready' ? evm.wallet : undefined };
}
