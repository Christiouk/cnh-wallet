'use client';

import { usePrivy } from '@privy-io/react-auth';
import { COMPANY } from '@/lib/constants';

export default function LoginScreen() {
  const { login } = usePrivy();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-500/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-700/3 rounded-full blur-[150px]" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mx-auto mb-5 shadow-glow-lg">
            <span className="text-white font-bold text-2xl">C</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{COMPANY.walletName}</h1>
          <p className="text-surface-400 text-sm">by {COMPANY.name}</p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-6">
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-white mb-1.5">Welcome</h2>
            <p className="text-sm text-surface-400">
              Sign in to access your digital asset wallet
            </p>
          </div>

          <button
            onClick={login}
            className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Sign In with Email
          </button>

          <p className="text-xs text-surface-600 text-center mt-4 leading-relaxed">
            By signing in, you agree to CNH Financial&apos;s terms of service. 
            Your wallet is secured with institutional-grade encryption.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-surface-600">
            Secured by Privy &middot; {COMPANY.network}
          </p>
        </div>
      </div>
    </div>
  );
}
