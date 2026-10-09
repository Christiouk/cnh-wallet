import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';

export const metadata: Metadata = {
  title: 'A3 Wallet',
  description:
    'A3 Wallet — a self-custody wallet. YOUR ASSETS. YOUR CONTROL.',
  metadataBase: new URL(process.env.VERCEL_ENV === 'preview' ? `https://${process.env.VERCEL_URL || 'preview.invalid'}` : 'https://wallet.a3wallet.com'),
  ...(process.env.VERCEL_ENV === 'preview' ? { robots: { index: false, follow: false } } : {}),
  applicationName: 'A3 Wallet',
  manifest: '/manifest.json',
  openGraph: {
    title: 'A3 Wallet',
    description: 'A self-custody wallet. YOUR ASSETS. YOUR CONTROL.',
    siteName: 'A3 Wallet',
    type: 'website',
    images: [{ url: '/icons/icon-512x512.png', width: 512, height: 512, alt: 'A3 Wallet' }],
  },
  twitter: {
    card: 'summary',
    title: 'A3 Wallet',
    description: 'A self-custody wallet. YOUR ASSETS. YOUR CONTROL.',
    images: ['/icons/icon-512x512.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'A3 Wallet',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#0B0D0F',
  width: 'device-width',
  initialScale: 1,
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
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="A3 Wallet" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        {/* iOS splash screens */}
        <link rel="apple-touch-startup-image" href="/icons/icon-512x512.png" />
        {/* Prevent text size adjustment on orientation change */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="min-h-screen bg-surface">
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
