'use client';

import { PrivyProvider } from '@privy-io/react-auth';

export default function PrivyProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="glass-card p-8 max-w-md text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Configuration Error</h2>
          <p className="text-surface-400">
            Privy App ID is not configured. Please set the NEXT_PUBLIC_PRIVY_APP_ID environment variable.
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
        loginMethods: ['email'],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
        defaultChain: {
          id: 1,
          name: 'Ethereum',
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: {
            default: { http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://eth.llamarpc.com'] },
          },
          blockExplorers: {
            default: { name: 'Etherscan', url: 'https://etherscan.io' },
          },
        },
        supportedChains: [
          {
            id: 1,
            name: 'Ethereum',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: {
              default: { http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://eth.llamarpc.com'] },
            },
            blockExplorers: {
              default: { name: 'Etherscan', url: 'https://etherscan.io' },
            },
          },
        ],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
