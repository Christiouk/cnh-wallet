'use client';

import Image from 'next/image';
import { COMPANY } from '@/lib/constants';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Image src="/brand/a3-portal-symbol-gradient-1024.png" alt="A3 Wallet" width={72} height={72} className="mx-auto mb-4" priority unoptimized />
        <p className="text-surface-400 text-sm">{COMPANY.walletName}</p>
        <div className="flex items-center justify-center gap-1 mt-3">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
