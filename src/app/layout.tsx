import type { Metadata, Viewport } from 'next';
import './globals.css';
import PrivyProviderWrapper from '@/providers/PrivyProviderWrapper';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';

export const metadata: Metadata = {
  title: 'CNH Wallet | CNH Financial',
  description: 'Secure digital asset management by CNH Financial',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CNH Wallet',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f1729',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* iOS PWA meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CNH Wallet" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        {/* iOS splash screens */}
        <link rel="apple-touch-startup-image" href="/icons/icon-512x512.png" />
        {/* Prevent text size adjustment on orientation change */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="min-h-screen bg-surface">
        <PrivyProviderWrapper>{children}</PrivyProviderWrapper>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
