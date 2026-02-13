import './globals.css';
import type { Metadata } from 'next';
import { PrivyProvider } from '@privy-io/react-auth';

export const metadata: Metadata = {
  title: 'CNH Wallet',
  description: 'CNH Wallet',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PrivyProvider
          appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
          config={{
            loginMethods: ['email', 'wallet'],
            appearance: { theme: 'dark' },
          }}
        >
          {children}
        </PrivyProvider>
      </body>
    </html>
  );
}