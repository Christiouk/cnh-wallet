'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';
import { useGnosisPay, GnosisPayStep } from '@/hooks/useGnosisPay';

type CardType = 'virtual' | 'physical';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  cardType: CardType;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  country: string;
}

const INITIAL_FORM: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  cardType: 'virtual',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  postcode: '',
  country: 'GB',
};

const STEP_LABELS: Record<GnosisPayStep, string> = {
  idle: '',
  connecting: 'Connecting wallet...',
  signing: 'Sign the authentication message in your wallet...',
  authenticating: 'Verifying signature with Gnosis Pay...',
  'checking-user': 'Checking your account...',
  'signing-up': 'Creating your Gnosis Pay account...',
  'accepting-terms': 'Accepting terms of service...',
  kyc: 'Identity verification required',
  phone: 'Phone verification',
  'verifying-phone': 'Verifying phone number...',
  'deploying-safe': 'Deploying your Safe smart account...',
  'waiting-safe': 'Waiting for Safe deployment (this takes ~1 minute)...',
  'ordering-card': 'Placing your card order...',
  success: 'Card ordered successfully!',
  error: 'Something went wrong',
};

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
    title: '80M+ Merchants',
    description: 'Spend anywhere Visa is accepted worldwide',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Stablecoin Powered',
    description: 'Spend EURe, GBPe, or USDC from your Safe',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3h3m-3 3h3" />
      </svg>
    ),
    title: 'Apple & Google Pay',
    description: 'Add to your phone wallet for contactless payments',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'Self-Custodial',
    description: 'Your funds stay in your Safe — never held by us',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
    title: 'Global Coverage',
    description: 'Use in 180+ countries with no foreign transaction fees',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: 'Instant Virtual',
    description: 'Virtual card activated immediately — no waiting',
  },
];

export default function CardPage() {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const { state, startCardApplication, reset } = useGnosisPay();
  const { ready, authenticated, login } = usePrivy();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const shippingAddress = form.cardType === 'physical' ? {
      line1: form.addressLine1,
      line2: form.addressLine2,
      city: form.city,
      postcode: form.postcode,
      country: form.country,
    } : undefined;
    await startCardApplication(form.email, form.cardType, shippingAddress);
  };

  const isProcessing = !['idle', 'success', 'error', 'kyc'].includes(state.step);

  // Wallet connection gate — show connect screen if not authenticated
  if (ready && !authenticated) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <Image src="/morsands_icon_final.png" alt="Morsands" width={64} height={64} className="rounded-2xl mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-3">Connect Your Wallet</h1>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            To apply for the Morsands Card, you need to connect your wallet first.
            Your wallet address is used to link the card to your Safe smart account via Gnosis Pay.
          </p>
          <button onClick={login}
            className="w-full py-3.5 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18-3a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3m18 0V6" />
            </svg>
            Connect Wallet to Apply
          </button>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
            ← Back to Wallet
          </Link>
        </div>
      </div>
    );
  }

  // Success screen
  if (state.step === 'success') {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Card Ordered Successfully</h1>
          <p className="text-slate-400 mb-2">
            {form.cardType === 'virtual'
              ? 'Your virtual Morsands Card is now active. Open the Gnosis Pay app to view your card details.'
              : 'Your physical Morsands Card has been ordered and will arrive within 5–10 business days.'}
          </p>
          <p className="text-slate-500 text-sm mb-8">Powered by Gnosis Pay · Visa · Monavate (FCA FRN: 901097)</p>
          <div className="flex gap-3 justify-center">
            <Link href="/" className="px-6 py-3 rounded-xl bg-[#1a2035] text-slate-300 hover:bg-[#1e2640] transition-colors text-sm font-medium">
              Return to Wallet
            </Link>
            <a href="https://app.gnosispay.com" target="_blank" rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors text-sm font-medium">
              Open Gnosis Pay App
            </a>
          </div>
        </div>
      </div>
    );
  }

  // KYC iframe screen
  if (state.step === 'kyc' && state.kycUrl) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex flex-col">
        <div className="flex items-center gap-4 p-4 border-b border-white/10">
          <button onClick={reset} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </button>
          <h1 className="text-white font-semibold">Identity Verification</h1>
        </div>
        <div className="flex-1 p-4">
          <p className="text-slate-400 text-sm mb-4">
            Complete identity verification to proceed with your card application. This is a one-time process required by Gnosis Pay.
          </p>
          <iframe src={state.kycUrl} className="w-full rounded-xl border border-white/10"
            style={{ height: 'calc(100vh - 160px)' }} title="Identity Verification" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/morsands_icon_final.png" alt="Morsands" width={32} height={32} className="rounded-lg" />
          <span className="font-semibold text-white">Morsands Wallet</span>
        </Link>
        <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Wallet
        </Link>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3b82f6]/10 border border-[#3b82f6]/20 text-[#60a5fa] text-xs font-medium mb-6">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            Powered by Gnosis Pay · Visa
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">The Morsands Card</h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Spend your crypto anywhere in the world. A self-custodial Visa debit card linked directly to your Safe smart account.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Card Visual + Features */}
          <div>
            <div className={`relative rounded-2xl p-6 aspect-[1.586/1] flex flex-col justify-between overflow-hidden shadow-2xl ${
              form.cardType === 'virtual'
                ? 'bg-gradient-to-br from-[#1a2035] via-[#1e2a4a] to-[#0d1829]'
                : 'bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]'
            }`}>
              <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/10 to-transparent" />
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#3b82f6]/5 rounded-full -translate-y-24 translate-x-24 blur-3xl" />
              <div className="relative flex items-start justify-between">
                <Image src="/morsands_icon_final.png" alt="Morsands" width={40} height={40} className="rounded-lg" />
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest">
                    {form.cardType === 'virtual' ? 'Virtual' : 'Physical'}
                  </div>
                  <div className="text-xs text-slate-400 font-medium mt-0.5">Morsands</div>
                </div>
              </div>
              <div className="relative">
                <div className="w-10 h-7 rounded bg-gradient-to-br from-yellow-400/80 to-yellow-600/80 mb-4 flex items-center justify-center">
                  <div className="grid grid-cols-2 gap-0.5 w-6 h-5">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-yellow-700/40 rounded-sm" />
                    ))}
                  </div>
                </div>
                <div className="text-sm font-mono text-slate-300 tracking-widest mb-3">•••• •••• •••• ••••</div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">Card Holder</div>
                    <div className="text-sm text-white font-medium">
                      {form.firstName || form.lastName ? `${form.firstName} ${form.lastName}`.trim() : 'YOUR NAME'}
                    </div>
                  </div>
                  <svg className="w-10 h-6 text-slate-400" viewBox="0 0 48 30" fill="none">
                    <circle cx="18" cy="15" r="13" fill="currentColor" fillOpacity="0.4" />
                    <circle cx="30" cy="15" r="13" fill="currentColor" fillOpacity="0.4" />
                    <path d="M24 5.5a13 13 0 010 19" stroke="currentColor" strokeOpacity="0.6" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex items-start gap-2.5 p-3 rounded-xl bg-[#1a2035]/60 border border-white/5">
                  <div className="text-[#3b82f6] mt-0.5 shrink-0">{f.icon}</div>
                  <div>
                    <div className="text-xs font-semibold text-white">{f.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{f.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Form */}
          <div className="bg-[#111827] rounded-2xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold text-white mb-1">Apply for Your Card</h2>
            <p className="text-slate-500 text-sm mb-6">
              Connect your wallet to start the application. Identity verification is required by Gnosis Pay.
            </p>

            {isProcessing && (
              <div className="mb-6 p-4 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/20">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="text-[#60a5fa] text-sm">{STEP_LABELS[state.step]}</span>
                </div>
              </div>
            )}

            {state.step === 'error' && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  <div>
                    <div className="text-red-400 text-sm font-medium">Error</div>
                    <div className="text-red-300/70 text-xs mt-0.5">{state.error}</div>
                  </div>
                </div>
                <button onClick={reset} className="mt-3 text-xs text-red-400 hover:text-red-300 underline">Try again</button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Card Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['virtual', 'physical'] as CardType[]).map((type) => (
                    <button key={type} type="button"
                      onClick={() => setForm(f => ({ ...f, cardType: type }))}
                      className={`py-2.5 px-4 rounded-xl text-sm font-medium transition-all border ${
                        form.cardType === type
                          ? 'bg-[#3b82f6] border-[#3b82f6] text-white'
                          : 'bg-[#1a2035] border-white/10 text-slate-400 hover:border-white/20'
                      }`}>
                      {type === 'virtual' ? '⚡ Virtual' : '📦 Physical'}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-600 mt-1.5">
                  {form.cardType === 'virtual'
                    ? 'Activated instantly · Free · Works with Apple/Google Pay'
                    : 'Delivered in 5–10 business days · Chip & PIN'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">First Name</label>
                  <input type="text" required value={form.firstName}
                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    className="w-full bg-[#1a2035] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#3b82f6]/50 transition-colors"
                    placeholder="First name" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Last Name</label>
                  <input type="text" required value={form.lastName}
                    onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                    className="w-full bg-[#1a2035] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#3b82f6]/50 transition-colors"
                    placeholder="Last name" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
                <input type="email" required value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full bg-[#1a2035] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#3b82f6]/50 transition-colors"
                  placeholder="you@example.com" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone Number</label>
                <input type="tel" required value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full bg-[#1a2035] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#3b82f6]/50 transition-colors"
                  placeholder="+44 7700 000000" />
                <p className="text-[11px] text-slate-600 mt-1">Used as 2FA for online payments</p>
              </div>

              {form.cardType === 'physical' && (
                <div className="space-y-3 pt-2 border-t border-white/10">
                  <div className="text-xs font-medium text-slate-400">Shipping Address</div>
                  <input type="text" required value={form.addressLine1}
                    onChange={e => setForm(f => ({ ...f, addressLine1: e.target.value }))}
                    className="w-full bg-[#1a2035] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#3b82f6]/50 transition-colors"
                    placeholder="Address line 1" />
                  <input type="text" value={form.addressLine2}
                    onChange={e => setForm(f => ({ ...f, addressLine2: e.target.value }))}
                    className="w-full bg-[#1a2035] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#3b82f6]/50 transition-colors"
                    placeholder="Address line 2 (optional)" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" required value={form.city}
                      onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                      className="w-full bg-[#1a2035] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#3b82f6]/50 transition-colors"
                      placeholder="City" />
                    <input type="text" required value={form.postcode}
                      onChange={e => setForm(f => ({ ...f, postcode: e.target.value }))}
                      className="w-full bg-[#1a2035] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#3b82f6]/50 transition-colors"
                      placeholder="Postcode" />
                  </div>
                  <select value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                    className="w-full bg-[#1a2035] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#3b82f6]/50 transition-colors">
                    <option value="GB">United Kingdom</option>
                    <option value="PT">Portugal</option>
                    <option value="LU">Luxembourg</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="ES">Spain</option>
                    <option value="IT">Italy</option>
                    <option value="NL">Netherlands</option>
                    <option value="BE">Belgium</option>
                    <option value="BR">Brazil</option>
                    <option value="US">United States</option>
                  </select>
                </div>
              )}

              <button type="submit" disabled={isProcessing}
                className="w-full py-3.5 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2">
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                    </svg>
                    Apply for {form.cardType === 'virtual' ? 'Virtual' : 'Physical'} Card
                  </>
                )}
              </button>

              <p className="text-[11px] text-slate-600 text-center leading-relaxed">
                By applying you agree to Gnosis Pay&apos;s Terms of Service. Identity verification (KYC) is required.
                Powered by Gnosis Pay · Visa · Monavate (FCA FRN: 901097).
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
