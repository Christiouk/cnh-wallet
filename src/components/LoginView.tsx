'use client';
import { deferredAuthEnabled } from '@/lib/auth-release';
import Image from 'next/image';
import { COMPANY } from '@/lib/constants';

export function LoginView({
  onEmail,
  onApple,
  onDevice,
  preview = false,
  deviceSupported = true,
  busy = false,
  message,
}: {
  onEmail(): void;
  onApple(): void;
  onDevice(): void;
  preview?: boolean;
  deviceSupported?: boolean;
  busy?: boolean;
  message?: string;
}) {
  return (
    <main className="login-page">
      <div className="login-top">
        <span>A3 WALLET</span>
        <a href="https://a3wallet.com/support">Need help? ↗</a>
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
              : 'Sign in or create your A3 account.'}
          </p>
          <div className="login-methods">
            {deferredAuthEnabled() ? <>
            <button
              className="btn-primary"
              onClick={onApple}
              disabled={preview || busy}
            >
              Continue with Apple
            </button>
            <button
              className="btn-secondary"
              onClick={onDevice}
              aria-describedby="device-sign-in-help"
              disabled={preview || busy || !deviceSupported}
            >
              Use Face ID / Touch ID
            </button>
            <p id="device-sign-in-help" className="small muted">
              {deviceSupported
                ? 'Set up in Settings after signing in. Your device may use its screen lock instead.'
                : 'Not available in this browser. You can still sign in with Apple or email.'}
            </p>
            <details className="login-fallback">
              <summary>Other ways to sign in</summary>
              <button className="btn-secondary" onClick={onEmail} disabled={preview}>
                Continue with Email <span aria-hidden>↗</span>
              </button>
            </details>
            </> : <button className="btn-primary" onClick={onEmail} disabled={preview || busy}>
              Continue with Email <span aria-hidden>↗</span>
            </button>}
            {message && <p className="notice" role="alert">{message}</p>}
          </div>
          <p className="login-privacy">
            Authentication powered by Privy.
            <br />
            <a
              href="https://a3wallet.com/privacy"
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
  return <LoginView preview onEmail={() => {}} onApple={() => {}} onDevice={() => {}} />;
}
