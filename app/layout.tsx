'use client';

import { PrivyProvider } from '@privy-io/react-auth';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PrivyProvider
          appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
          config={{ loginMethods: ['email', 'google', 'apple'] }}
        >
          {children}
        </PrivyProvider>
      </body>
    </html>
  );
}
