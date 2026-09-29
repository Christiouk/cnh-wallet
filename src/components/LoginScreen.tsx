'use client';

import { usePrivy, useLoginWithOAuth } from '@privy-io/react-auth';
import Image from 'next/image';
import { COMPANY } from '@/lib/constants';

export default function LoginScreen() {
  const { login } = usePrivy();
  const { initOAuth } = useLoginWithOAuth();

  return (
    <LoginView
      onEmail={login}
      onApple={() => initOAuth({ provider: 'apple' })}
      onGoogle={() => initOAuth({ provider: 'google' })}
    />
  );
}
export function LoginView({
  onEmail,
  onApple,
  onGoogle,
}: {
  onEmail(): void;
  onApple(): void;
  onGoogle(): void;
}) {
  return (
    <main className="login-page">
      <div className="login-top">
        <span>A3 WALLET</span>
        <a href="https://www.morsands.com/contact.html">Need help? ↗</a>
      </div>
      <div className="login-layout">
        <section className="login-brand">
          <Image
            src="/brand/a3-login-logo-light-transparent.png"
            alt="A3 Wallet"
            width={1800}
            height={720}
            priority
            unoptimized
          />
          <h1>
            YOUR ASSETS.
            <br />
            <span>YOUR CONTROL.</span>
          </h1>
          <p>
            A clear place for your digital assets.
            <br />
            Built around your control.
          </p>
          <span className="login-networks">
            ETHEREUM <span aria-hidden> / </span> TRON
          </span>
        </section>
        <section className="login-panel">
          <p className="eyebrow">WELCOME TO A3</p>
          <h2>
            Your wallet. <br />
            Right here.
          </h2>
          <p className="muted">Sign in to access your existing account.</p>
          <div className="login-methods">
            <button className="btn-primary" onClick={onApple}>
              Continue with Apple
            </button>
            <button className="btn-secondary" onClick={onGoogle}>
              Continue with Google
            </button>
            <div className="login-divider">
              <span>or use your email</span>
            </div>
            <button className="btn-secondary" onClick={onEmail}>
              Continue with Email <span aria-hidden>↗</span>
            </button>
          </div>
          <p className="login-privacy">
            Authentication powered by Privy.
            <br />
            <a
              href="https://www.morsands.com/privacy.html"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read our privacy policy ↗
            </a>
          </p>
        </section>
      </div>
      <footer className="login-footer">
        <span>{COMPANY.walletName}</span>
        <span>YOUR ASSETS. YOUR CONTROL.</span>
      </footer>
    </main>
  );
}
