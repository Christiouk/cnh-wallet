'use client';
import Image from 'next/image';
export default function LoadingScreen() {
  return (
    <main className="authentication-loading" role="status">
      <Image
        src="/brand/a3-portal-symbol-gradient-1024.png"
        alt="A3 Wallet"
        width={72}
        height={72}
        priority
        unoptimized
      />
      <h1>Opening your wallet.</h1>
      <p className="muted">Connecting securely to your account…</p>
      <span className="loading-line" />
    </main>
  );
}
