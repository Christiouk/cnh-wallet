'use client';

import { usePrivy } from '@privy-io/react-auth';
import Dashboard from '@/components/Dashboard';
import LoadingScreen from '@/components/LoadingScreen';

export default function Home() {
  const { ready, authenticated, login } = usePrivy();

  if (!ready) {
    return <LoadingScreen />;
  }

  if (authenticated) {
    return <Dashboard />;
  }

  // ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
  // BEAUTIFUL LANDING PAGE (shown to everyone who is NOT logged in)
  // ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←

  return (
    <div className="bg-[#0a1428] text-white min-h-screen font-sans overflow-hidden">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#0a1428]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-2xl">🇨🇳</div>
            <span className="text-2xl font-bold tracking-tight">CNH Wallet</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium">
            <a href="#flow" className="hover:text-emerald-400 transition">How it Works</a>
            <a href="#features" className="hover:text-emerald-400 transition">Features</a>
            <a href="#security" className="hover:text-emerald-400 transition">Security</a>
            <a href="https://www.cnh.financial" className="hover:text-emerald-400 transition">Main Site</a>
          </div>
          <button 
            onClick={login}
            className="bg-emerald-500 hover:bg-emerald-600 px-8 py-3 rounded-2xl font-semibold transition flex items-center gap-2"
          >
            Launch Wallet
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-[90vh] flex items-center bg-gradient-to-br from-[#0a1428] via-[#0f1b36] to-[#1a2338]">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center pt-20">
          <div className="space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Your Keys.<br />Your CNH.<br />Your Control.
            </h1>
            <p className="text-xl text-gray-300 max-w-lg">
              True self-custody wallet + operational eWallet.<br />
              Receive any crypto instantly. Sell to CNH or bank in seconds.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={login}
                className="bg-emerald-500 hover:bg-emerald-600 px-10 py-5 rounded-2xl text-lg font-semibold inline-flex items-center gap-3 transition"
              >
                🚀 Launch CNH Wallet Now
              </button>
              <a href="#flow" className="border border-white/40 hover:border-white px-10 py-5 rounded-2xl text-lg font-medium">
                See the Flow ↓
              </a>
            </div>
            <div className="flex gap-8 text-sm text-emerald-400">
              <div>🔒 100% Self-Custody</div>
              <div>🇨🇳 CNH Stablecoin Native</div>
              <div>🔄 Powered by Privy</div>
            </div>
          </div>

          <div className="relative hidden md:block">
            <div className="bg-gradient-to-br from-emerald-500/20 to-transparent p-8 rounded-3xl">
              <div className="bg-[#111827] rounded-3xl p-6 shadow-2xl border border-white/10">
                {/* Phone mockup */}
                <div className="bg-black rounded-2xl p-4 text-center text-xs text-emerald-400">
                  CNH Wallet • Receive / Sell
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The CNH Flow */}
      <section id="flow" className="py-24 bg-[#111827]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4">From Receive to Sell — In One App</h2>
          <p className="text-center text-gray-400 mb-16">Self-custody for your crypto. Operational eWallet for fast CNH/fiat.</p>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-white/5 rounded-3xl p-8 text-center hover:bg-white/10 transition">
              <div className="w-16 h-16 mx-auto bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 text-3xl">📥</div>
              <h3 className="text-2xl font-semibold mb-2">Receive Instantly</h3>
              <p className="text-gray-400">Any token • QR • Fiat on-ramp including CNH</p>
            </div>
            <div className="bg-white/5 rounded-3xl p-8 text-center hover:bg-white/10 transition">
              <div className="w-16 h-16 mx-auto bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 text-3xl">🔒</div>
              <h3 className="text-2xl font-semibold mb-2">Hold Securely</h3>
              <p className="text-gray-400">You control the keys • Biometric + MPC</p>
            </div>
            <div className="bg-white/5 rounded-3xl p-8 text-center hover:bg-white/10 transition">
              <div className="w-16 h-16 mx-auto bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 text-3xl">🔄</div>
              <h3 className="text-2xl font-semibold mb-2">Swap & Grow</h3>
              <p className="text-gray-400">Best rates • Staking • NFTs • Cross-chain</p>
            </div>
            <div className="bg-white/5 rounded-3xl p-8 text-center hover:bg-white/10 transition">
              <div className="w-16 h-16 mx-auto bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 text-3xl">💸</div>
              <h3 className="text-2xl font-semibold mb-2">Sell & Cash Out</h3>
              <p className="text-gray-400">One-tap to CNH or bank • Never leaves custody</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <div className="py-20 bg-gradient-to-r from-emerald-600 to-teal-600 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-4xl font-bold mb-6">Ready to own your crypto?</h2>
          <button 
            onClick={login}
            className="bg-white text-black px-12 py-6 rounded-2xl text-2xl font-semibold hover:scale-105 transition inline-flex items-center gap-3"
          >
            Launch CNH Wallet Now →
          </button>
          <p className="mt-6 text-white/80">Takes 10 seconds • No KYC for self-custody</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black py-12 text-center text-gray-500 text-sm">
        © 2026 CNH Financial • All rights reserved<br />
        <a href="https://www.cnh.financial" className="hover:text-white">Main Site</a> • 
        <a href="https://portal.cnh.financial" className="hover:text-white ml-4">Client Portal</a>
      </footer>
    </div>
  );
}
