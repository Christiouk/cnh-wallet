'use client';
import { deferredAuthEnabled } from '@/lib/auth-release';

import { PrivyProvider } from '@privy-io/react-auth';
import { LoginView } from '@/components/LoginView';

const ethereum = {
  id: 1,
  name: 'Ethereum',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://ethereum-rpc.publicnode.com'] } },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://etherscan.io' },
  },
};

export default function PrivyProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (process.env.NEXT_PUBLIC_A3_RC_PREVIEW_LOCKED === 'true')
    return (
      <LoginView
        preview
        onEmail={() => {}}
        onApple={() => {}}
        onDevice={() => {}}
      />
    );

  if (!appId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="glass-card p-8 max-w-md text-center">
          <h2 className="text-xl font-semibold text-white mb-2">
            Configuration Error
          </h2>
          <p className="text-surface-400">
            Privy App ID is not configured. Please set the
            NEXT_PUBLIC_PRIVY_APP_ID environment variable.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#1b86f5',
          logo: undefined,
          walletChainType: 'ethereum-only',
        },
        loginMethods: deferredAuthEnabled() ? ['apple', 'passkey', 'email'] : ['email'],
        embeddedWallets: {
          solana: { createOnLogin: 'off' },
          disableAutomaticMigration: true,
          ethereum: {
            // SDK 'all-users' means all users MISSING an embedded EVM wallet,
            // including external-wallet-only users. The SDK skips existing
            // embedded wallets and never requests an additional wallet here.
            createOnLogin: process.env.NEXT_PUBLIC_A3_PUBLIC_ONBOARDING === 'true'
              ? 'all-users'
              : 'off',
          },
        },
        defaultChain: ethereum,
        supportedChains: [ethereum],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
