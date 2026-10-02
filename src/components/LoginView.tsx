'use client';
import Image from 'next/image';
import { COMPANY } from '@/lib/constants';

export function LoginView({
  onEmail,
  onApple,
  onGoogle,
  preview = false,
}: {
  onEmail(): void;
  onApple(): void;
  onGoogle(): void;
  preview?: boolean;
}) {
  return (
    <main className="login-page">
      <div className="login-top">
        <span>A3 WALLET</span>
        <a href="https://www.morsands.com/support">Need help? ↗</a>
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
          <p className="muted">
            {preview
              ? 'Release candidate preview. Sign-in is paused until existing-account continuity is verified. No wallet or financial operations are enabled here.'
              : 'Sign in to access your existing account.'}
          </p>
          <div className="login-methods">
            <button
              className="btn-primary"
              onClick={onApple}
              disabled={preview}
            >
              Continue with Apple
            </button>
            <button
              className="btn-secondary"
              onClick={onGoogle}
              disabled={preview}
            >
              Continue with Google
            </button>
            <div className="login-divider">
              <span>or use your email</span>
            </div>
            <button
              className="btn-secondary"
              onClick={onEmail}
              disabled={preview}
            >
              Continue with Email <span aria-hidden>↗</span>
            </button>
          </div>
          <p className="login-privacy">
            Authentication powered by Privy.
            <br />
            <a
              href="https://www.morsands.com/privacy"
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

export function PreviewLogin() {
  return <LoginView preview onEmail={() => {}} onApple={() => {}} onGoogle={() => {}} />;
}
