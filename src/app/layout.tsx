import type { Metadata } from 'next';
import './globals.css';
import PrivyProviderWrapper from '@/providers/PrivyProviderWrapper';

export const metadata: Metadata = {
  title: 'CNH Wallet | CNH Financial',
  description: 'Secure digital asset management by CNH Financial',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface">
        <PrivyProviderWrapper>{children}</PrivyProviderWrapper>
      </body>
    </html>
  );
}
