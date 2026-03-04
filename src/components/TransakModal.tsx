'use client';

// Morsands — Transak On-Ramp Modal
// Opens the Transak widget for fiat-to-crypto purchases.
// Revenue: Transak pays partner fee share on every completed order (configured in Transak Partner Dashboard).

import { useEffect, useRef } from 'react';

interface TransakModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress?: string;
}

// Staging key for development — replace with live key from Transak Partner Dashboard
// Set NEXT_PUBLIC_TRANSAK_API_KEY in your environment variables
const TRANSAK_API_KEY =
  process.env.NEXT_PUBLIC_TRANSAK_API_KEY || '1a2b3c4d-0000-0000-0000-staging00001';

export default function TransakModal({ isOpen, onClose, walletAddress }: TransakModalProps) {
  const transakRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Dynamically import to avoid SSR issues
    import('@transak/ui-js-sdk').then(({ Transak }) => {
      const config: any = {
        apiKey: TRANSAK_API_KEY,
        environment: process.env.NEXT_PUBLIC_TRANSAK_ENV === 'PRODUCTION' ? 'PRODUCTION' : 'STAGING',
        productsAvailed: 'BUY',
        network: 'ethereum',
        defaultCryptoCurrency: 'ETH',
        cryptoCurrencyList: 'ETH,USDC,USDT,WBTC,DAI',
        defaultFiatCurrency: 'GBP',
        fiatCurrency: undefined,
        themeColor: '3FA5FF', // Morsands brand blue
        exchangeScreenTitle: 'Buy Crypto',
        hideMenu: true,
        disableWalletAddressForm: !!walletAddress,
        ...(walletAddress ? { walletAddress } : {}),
      };

      const transak = new Transak(config);
      transakRef.current = transak;
      transak.init();

      // Close modal when user closes Transak widget
      Transak.on(Transak.EVENTS.TRANSAK_WIDGET_CLOSE, () => {
        onClose();
      });

      // Log successful orders (can be used for analytics / webhook confirmation)
      Transak.on(Transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (orderData: any) => {
        console.log('[Morsands] Transak order successful:', orderData);
        transak.close();
        onClose();
      });
    });

    return () => {
      if (transakRef.current) {
        transakRef.current.close();
        transakRef.current = null;
      }
    };
  }, [isOpen, walletAddress, onClose]);

  // Transak renders its own full-screen overlay — no custom UI needed
  return null;
}
