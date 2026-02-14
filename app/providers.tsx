'use client';

import React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';

export default function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  // Avoid crashing build if env var missing
  if (!appId) {
    return (
      <div style={{ padding: 24, color: 'white', background: 'black' }}>
        Missing NEXT_PUBLIC_PRIVY_APP_ID
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#ffffff',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
