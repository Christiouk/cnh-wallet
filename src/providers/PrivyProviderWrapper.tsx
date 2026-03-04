'use client';

import { PrivyProvider } from '@privy-io/react-auth';

const ethereum = {
  id: 1,
  name: 'Ethereum',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://eth.llamarpc.com'] } },
  blockExplorers: { default: { name: 'Etherscan', url: 'https://etherscan.io' } },
};

const base = {
  id: 8453,
  name: 'Base',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://mainnet.base.org'] } },
  blockExplorers: { default: { name: 'Basescan', url: 'https://basescan.org' } },
};

const polygon = {
  id: 137,
  name: 'Polygon',
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  rpcUrls: { default: { http: ['https://polygon-rpc.com'] } },
  blockExplorers: { default: { name: 'Polygonscan', url: 'https://polygonscan.com' } },
};

const arbitrum = {
  id: 42161,
  name: 'Arbitrum One',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://arb1.arbitrum.io/rpc'] } },
  blockExplorers: { default: { name: 'Arbiscan', url: 'https://arbiscan.io' } },
};

const optimism = {
  id: 10,
  name: 'Optimism',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://mainnet.optimism.io'] } },
  blockExplorers: { default: { name: 'OP Etherscan', url: 'https://optimistic.etherscan.io' } },
};

const bsc = {
  id: 56,
  name: 'BNB Chain',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: { default: { http: ['https://bsc-dataseed.binance.org'] } },
  blockExplorers: { default: { name: 'BscScan', url: 'https://bscscan.com' } },
};

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
        defaultChain: ethereum,
        supportedChains: [ethereum, base, polygon, arbitrum, optimism, bsc],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
