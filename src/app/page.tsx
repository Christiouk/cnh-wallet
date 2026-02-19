'use client';

import { usePrivy } from '@privy-io/react-auth';
import Dashboard from '@/components/Dashboard';
import LoadingScreen from '@/components/LoadingScreen';

export default function Home() {
  const { ready, authenticated, login } = usePrivy();

  if (!ready) return <LoadingScreen />;
  if (authenticated) return <Dashboard />;

  return (
    <div className="bg-[#0a1428] text-white min-h-screen font-sans">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#0a1428]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Your new logo will go here — see below */}
            <img src="/logo.png" alt="CNH Wallet" className="h-10" />
            <span className="text-2xl font-bold tracking-tighter">CNH Wallet</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium">
            <a href="#flow" className="hover:text-emerald-400 transition">How it Works</a>
            <a href="#features" className="hover:text-emerald-400 transition">Features</a>
            <a href="#security" className="hover:text-emerald-400 transition">Security</a>
            <a href="https://www.cnh.financial" className="hover:text-emerald-400 transition">Main Site</a>
          </div>
          <button onClick={login} className="bg-emerald-500 hover:bg-emerald-600 px-8 py-3 rounded-2xl font-semibold transition">
            Launch Wallet
          </button>
        </div>
      </nav>

      {/* Hero - Premium version */}
      <section className="min-h-[95vh] flex items-center relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h1 className="text-6xl md:text-7xl font-bold leading-none tracking-tighter">
              Your Keys.<br />
              Your CNH.<br />
              Your Control.
            </h1>
            <p className="text-2xl text-gray-300">
              True self-custody + operational eWallet in one beautiful app.<br />
              Receive instantly. Sell to CNH or bank in seconds.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button onClick={login} className="bg-emerald-500 hover:bg-emerald-600 px-12 py-6 rounded-3xl text-xl font-semibold flex items-center gap-3 transition">
                🚀 Launch CNH Wallet Now
              </button>
              <a href="#flow" className="border-2 border-white/30 hover:border-white px-12 py-6 rounded-3xl text-xl font-medium transition">See the Flow ↓</a>
            </div>
            <div className="flex gap-8 text-sm pt-6 text-emerald-400">
              <div>🔒 100% Self-Custody</div>
              <div>🇨🇳 CNH Stablecoin Native</div>
              <div>✅ Audited by Certik</div>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="relative hidden md:block">
            <div className="absolute -inset-8 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-[4rem]"></div>
            <div className="relative bg-[#111827] rounded-3xl p-6 shadow-2xl border border-white/10">
              <div className="bg-black rounded-2xl overflow-hidden">
                <div className="h-12 bg-zinc-900 flex items-center px-4">
                  <div className="text-emerald-400 text-xs font-mono">CNH Wallet • Receive / Sell</div>
                </div>
                <div className="h-96 bg-gradient-to-b from-zinc-950 to-black flex items-center justify-center text-emerald-400 text-sm">
                  [Phone screen preview here — QR + Sell button]
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The CNH Flow */}
      <section id="flow" className="py-24 bg-[#111827]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl font-bold text-center mb-6">From Receive to Sell — In One App</h2>
          <p className="text-center text-gray-400 text-xl mb-16">Self-custody for your assets. Operational eWallet for daily CNH/fiat moves.</p>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: "📥", title: "Receive Instantly", desc: "QR, deep links, fiat on-ramp (CNH supported)" },
              { icon: "🔒", title: "Hold Securely", desc: "You own the keys • Biometric + MPC" },
              { icon: "🔄", title: "Swap & Grow", desc: "Best rates • Staking • NFTs • Cross-chain" },
              { icon: "💸", title: "Sell & Cash Out", desc: "One-tap to CNH or bank • Zero custody risk" }
            ].map((step, i) => (
              <div key={i} className="bg-white/5 hover:bg-white/10 p-10 rounded-3xl text-center transition-all">
                <div className="text-6xl mb-8">{step.icon}</div>
                <h3 className="text-2xl font-semibold mb-4">{step.title}</h3>
                <p className="text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick CTA */}
      <div className="py-20 bg-gradient-to-r from-emerald-600 to-teal-600 text-center">
        <div className="max-w-xl mx-auto px-6">
          <h2 className="text-5xl font-bold mb-8">Ready to own your crypto?</h2>
          <button onClick={login} className="bg-white text-black px-16 py-7 rounded-3xl text-2xl font-semibold hover:scale-105 transition">
            Launch CNH Wallet Now →
          </button>
        </div>
      </div>

      <footer className="bg-black py-12 text-center text-gray-500 text-sm">
        © 2026 CNH Financial • All rights reserved
      </footer>
    </div>
  );
}
