'use client';

import { usePrivy } from '@privy-io/react-auth';
import Dashboard from '@/components/Dashboard';
import LoadingScreen from '@/components/LoadingScreen';

export default function Home() {
  const { ready, authenticated, login } = usePrivy();

  if (!ready) return <LoadingScreen />;
  if (authenticated) return <Dashboard />;

  return (
    <div className="bg-[#0a0f1c] text-white min-h-screen font-sans overflow-hidden">
      {/* Navbar - Clean & Professional */}
      <nav className="sticky top-0 z-50 bg-[#0a0f1c]/95 backdrop-blur-md border-b border-white/10">
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

      {/* Hero - Premium with Realistic Phone */}
      <section className="min-h-[95vh] flex items-center relative pt-12">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h1 className="text-6xl md:text-7xl font-bold leading-none tracking-tighter">
              Your Keys.<br />
              Your CNH.<br />
              Your Control.
            </h1>
            <p className="text-2xl text-slate-400 max-w-lg">
              True self-custody wallet + operational eWallet.<br />
              Receive instantly. Sell to CNH or bank in seconds.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={login} className="bg-emerald-600 hover:bg-emerald-700 px-12 py-6 rounded-3xl text-xl font-semibold transition">
                🚀 Launch CNH Wallet Now
              </button>
              <a href="#flow" className="border border-slate-600 hover:border-slate-400 px-12 py-6 rounded-3xl text-xl transition">See the Flow ↓</a>
            </div>
            <div className="flex gap-8 text-sm text-slate-400">
              <div>🔒 100% Self-Custody</div>
              <div>🇨🇳 CNH Stablecoin Native</div>
              <div>✅ Audited Security</div>
            </div>
          </div>

          {/* Realistic Phone Mockup */}
          <div className="relative flex justify-center">
            <div className="w-[340px] h-[670px] bg-black rounded-[58px] p-3 shadow-2xl border-8 border-[#1e2937] relative overflow-hidden">
              {/* Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-full z-10"></div>
              
              {/* Status bar */}
              <div className="h-11 bg-zinc-950 flex items-end justify-between px-8 text-[10px] text-slate-400">
                <div>9:41</div>
                <div className="flex gap-2">
                  <span>5G</span>
                  <span>100%</span>
                </div>
              </div>

              {/* App Screen - Receive tab */}
              <div className="h-[calc(100%-44px)] bg-[#0f172a] flex flex-col">
                <div className="px-6 pt-8 text-center">
                  <div className="inline-flex bg-emerald-600 text-white text-xs px-4 py-1 rounded-full mb-6">Receive</div>
                  <div className="bg-white/10 rounded-3xl p-6 mb-8">
                    <div className="text-5xl mb-4">📥</div>
                    <div className="font-mono text-sm text-emerald-400">0x7a9...f3d2</div>
                    <div className="mt-6 w-40 h-40 mx-auto bg-white rounded-2xl flex items-center justify-center text-6xl">QR</div>
                  </div>
                </div>
              </div>

              {/* Bottom tab bar */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-zinc-900 text-xs flex rounded-3xl px-2 py-1 gap-8 text-slate-400">
                <div className="text-emerald-400">Receive</div>
                <div>Sell</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <div className="border-y border-slate-800 py-6 bg-[#0a0f1c]">
        <div className="max-w-7xl mx-auto px-6 flex justify-center gap-12 text-sm text-slate-500">
          <div>Powered by Privy</div>
          <div>Audited by Certik</div>
          <div>20+ Blockchains</div>
          <div>150k+ Users</div>
        </div>
      </div>

      {/* The CNH Flow */}
      <section id="flow" className="py-24 bg-[#111827]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl font-bold text-center mb-6 tracking-tight">From Receive to Sell — In One App</h2>
          <p className="text-center text-slate-400 text-xl mb-16">Self-custody for your assets. Operational eWallet for daily CNH/fiat moves.</p>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Receive Instantly", desc: "QR, deep links, fiat on-ramp (CNH supported)", icon: "📥" },
              { step: "02", title: "Hold Securely", desc: "You control the keys • Biometric + MPC", icon: "🔒" },
              { step: "03", title: "Swap & Grow", desc: "Best rates • Staking • NFTs • Cross-chain", icon: "🔄" },
              { step: "04", title: "Sell & Cash Out", desc: "One-tap to CNH or bank • Zero custody risk", icon: "💸" }
            ].map((item, i) => (
              <div key={i} className="group bg-[#1e2937] hover:bg-[#334155] p-10 rounded-3xl transition-all border border-transparent hover:border-emerald-900">
                <div className="text-6xl mb-8 opacity-80 group-hover:scale-110 transition">{item.icon}</div>
                <div className="text-emerald-400 text-sm mb-2 font-mono">{item.step}</div>
                <h3 className="text-2xl font-semibold mb-4">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-[#0a0f1c]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-5xl font-bold text-center mb-16">Built for Real Use</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              ["Multi-Chain Support", "ETH, BSC, Solana, Tron, +15 more"],
              ["Instant Fiat On/Off-ramps", "CNH stablecoin • Bank • Card"],
              ["Built-in DEX Aggregator", "Always the best rates"],
              ["Hardware Wallet Ready", "Ledger • Trezor support"],
              ["NFT & Staking", "View, send, earn rewards"],
              ["24/7 Security Monitoring", "MPC + Biometric + Audits"]
            ].map(([title, desc], i) => (
              <div key={i} className="bg-[#1e2937] p-8 rounded-3xl border border-slate-800 hover:border-slate-600 transition">
                <h3 className="text-xl font-semibold mb-3">{title}</h3>
                <p className="text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-24 bg-[#111827]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-bold mb-6">Your Keys. Never Ours.</h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">True self-custody with enterprise-grade security. We never see or touch your private keys.</p>
        </div>
      </section>

      {/* Final CTA */}
      <div className="py-28 bg-gradient-to-r from-slate-900 to-black text-center">
        <div className="max-w-xl mx-auto px-6">
          <h2 className="text-5xl font-bold mb-8 tracking-tight">Ready to take control?</h2>
          <button onClick={login} className="bg-white text-black px-16 py-7 rounded-3xl text-2xl font-semibold hover:bg-slate-100 transition">
            Launch CNH Wallet Now →
          </button>
          <p className="mt-6 text-slate-400">Takes 10 seconds • No KYC for self-custody mode</p>
        </div>
      </div>

      <footer className="bg-black py-12 text-center text-slate-500 text-sm">
        © 2026 CNH Financial • All rights reserved<br />
        <a href="https://www.cnh.financial" className="hover:text-white">Main Site</a> • 
        <a href="https://portal.cnh.financial" className="hover:text-white ml-4">Client Portal</a>
      </footer>
    </div>
  );
}
