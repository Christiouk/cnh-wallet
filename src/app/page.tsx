'use client';

import { usePrivy } from '@privy-io/react-auth';
import Dashboard from '@/components/Dashboard';
import LoadingScreen from '@/components/LoadingScreen';

export default function Home() {
  const { ready, authenticated, login } = usePrivy();

  if (!ready) return <LoadingScreen />;
  if (authenticated) return <Dashboard />;

  return (
    <div className="bg-gradient-to-br from-[#1f2937] via-[#111827] to-black text-white min-h-screen font-sans overflow-hidden">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <span className="text-3xl font-bold tracking-tighter">CNH</span>
            <span className="text-2xl font-light text-slate-400">Crypto</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium">
            <a href="#flow" className="hover:text-white transition">How it Works</a>
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#security" className="hover:text-white transition">Security</a>
            <a href="https://www.cnh.financial" className="hover:text-white transition">Main Site</a>
          </div>
          <button onClick={login} className="bg-emerald-600 hover:bg-emerald-700 px-8 py-3 rounded-2xl font-semibold transition">
            Launch Wallet
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-[95vh] flex items-center relative">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center pt-12">
          <div className="space-y-8">
            <h1 className="text-6xl md:text-7xl font-bold leading-none tracking-tighter">
              Your Keys.<br />
              Your CNH.<br />
              Your Control.
            </h1>
            <p className="text-2xl text-slate-300 max-w-lg">
              True self-custody wallet + operational eWallet in one beautiful app.<br />
              Receive instantly. Sell to CNH or bank in seconds.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={login} className="bg-emerald-600 hover:bg-emerald-700 px-12 py-6 rounded-3xl text-xl font-semibold transition">
                🚀 Launch CNH Wallet Now
              </button>
              <a href="#flow" className="border border-slate-600 hover:border-slate-400 px-12 py-6 rounded-3xl text-xl transition">See the Flow ↓</a>
            </div>
            <div className="flex gap-8 text-sm text-slate-400 pt-6">
              <div>🔒 100% Self-Custody</div>
              <div>🇨🇳 CNH Stablecoin Native</div>
              <div>✅ Audited by Certik</div>
            </div>
          </div>

          {/* Clean Phone Mockup */}
          <div className="relative hidden md:block">
            <div className="w-[320px] h-[620px] mx-auto bg-black rounded-[52px] p-4 shadow-2xl border-[14px] border-[#1f2937]">
              <div className="bg-[#0f172a] h-full rounded-3xl overflow-hidden relative">
                <div className="h-11 bg-black flex items-center px-6 text-xs text-emerald-400">
                  CNH Wallet • Receive / Sell
                </div>
                <div className="pt-12 text-center">
                  <div className="text-7xl mb-8">📥</div>
                  <div className="text-emerald-400 font-mono text-sm mb-6">0x7a9...f3d2</div>
                  <div className="mx-auto w-48 h-48 bg-white rounded-2xl flex items-center justify-center text-8xl shadow-inner">QR</div>
                  <div className="mt-10 text-emerald-400 text-xs">Tap to copy address</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The CNH Flow */}
      <section id="flow" className="py-24 bg-black/70">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl font-bold text-center mb-6">From Receive to Sell — In One App</h2>
          <p className="text-center text-slate-400 text-xl mb-16">Self-custody for your assets. Operational eWallet for daily CNH/fiat moves.</p>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: "📥", title: "Receive Instantly", desc: "QR, deep links, fiat on-ramp (CNH supported)" },
              { icon: "🔒", title: "Hold Securely", desc: "You control the keys • Biometric + MPC" },
              { icon: "🔄", title: "Swap & Grow", desc: "Best rates • Staking • NFTs • Cross-chain" },
              { icon: "💸", title: "Sell & Cash Out", desc: "One-tap to CNH or bank • Zero custody risk" }
            ].map((step, i) => (
              <div key={i} className="bg-[#1f2937] hover:bg-[#374151] p-10 rounded-3xl text-center transition-all">
                <div className="text-6xl mb-8">{step.icon}</div>
                <h3 className="text-2xl font-semibold mb-4">{step.title}</h3>
                <p className="text-slate-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <div className="py-28 bg-gradient-to-r from-emerald-900/30 to-transparent text-center">
        <div className="max-w-xl mx-auto px-6">
          <h2 className="text-5xl font-bold mb-8">Ready to own your crypto?</h2>
          <button onClick={login} className="bg-white text-black px-16 py-7 rounded-3xl text-2xl font-semibold hover:scale-105 transition">
            Launch CNH Wallet Now →
          </button>
          <p className="mt-6 text-slate-400">Takes 10 seconds • No KYC for self-custody</p>
        </div>
      </div>

      <footer className="bg-black py-12 text-center text-slate-500 text-sm">
        © 2026 CNH Financial • All rights reserved
      </footer>
    </div>
  );
}
