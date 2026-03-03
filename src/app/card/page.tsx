'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type CardType = 'virtual' | 'physical';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  walletAddress: string;
  cardType: CardType;
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
  walletAddress: '',
  cardType: 'virtual',
  addressLine1: '',
  addressLine2: '',
  city: '',
  postcode: '',
  country: '',
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
    description: 'Spend USDC, EURC and other stablecoins directly',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 15.75h3" />
      </svg>
    ),
    title: 'Apple & Google Pay',
    description: 'Add to your phone wallet instantly',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'Self-Custodial',
    description: 'Your keys, your funds — powered by Safe smart accounts',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
    title: 'Global Coverage',
    description: 'EEA, UK, Brazil, and 10+ markets',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: 'Instant Virtual Card',
    description: 'Ready to use within minutes of approval',
  },
];

export default function CardPage() {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Build order summary for email/WhatsApp
      const orderSummary = `
*Morsands Card Application*

Name: ${form.firstName} ${form.lastName}
Email: ${form.email}
Wallet: ${form.walletAddress}
Card Type: ${form.cardType === 'virtual' ? 'Virtual Card' : 'Physical Card'}
${form.cardType === 'physical' ? `
Shipping Address:
${form.addressLine1}
${form.addressLine2 ? form.addressLine2 + '\n' : ''}${form.city}, ${form.postcode}
${form.country}` : ''}
      `.trim();

      // Send via WhatsApp
      const whatsappUrl = `https://wa.me/447700000000?text=${encodeURIComponent(orderSummary)}`;

      // Also send via email
      const emailSubject = encodeURIComponent(`Morsands Card Application — ${form.firstName} ${form.lastName}`);
      const emailBody = encodeURIComponent(orderSummary);
      const emailUrl = `mailto:support@morsands.com?subject=${emailSubject}&body=${emailBody}`;

      // Open email client
      window.location.href = emailUrl;

      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again or contact support@morsands.com directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const isPhysical = form.cardType === 'physical';

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-surface/80 border-b border-surface-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
              <Image src="/logo.png" alt="Morsands" width={36} height={36} className="w-full h-full object-cover" />
            </div>
            <span className="text-lg font-bold text-white hidden sm:block">Morsands</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-800/60 hover:bg-surface-700/60 border border-surface-700/30 text-sm text-surface-300 hover:text-white transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Wallet
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-12">

        {/* Hero */}
        <div className="text-center space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold uppercase tracking-wider">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
            Powered by Gnosis Pay · Visa Network
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
            The <span className="text-brand-400">Morsands Card</span>
          </h1>
          <p className="text-lg text-surface-400 max-w-2xl mx-auto">
            Spend your crypto and stablecoins anywhere Visa is accepted. Virtual or physical — your wallet, your card.
          </p>
        </div>

        {/* Card Visual */}
        <div className="flex justify-center">
          <div className={`relative w-80 h-48 rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ${isPhysical ? 'shadow-brand-600/30' : 'shadow-brand-500/20'}`}>
            {/* Card background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] via-[#0d1f3c] to-[#061020]" />
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-600/20 via-transparent to-brand-400/10" />
            {/* Decorative circles */}
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-brand-500/10 blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-brand-600/10 blur-2xl" />
            {/* Card content */}
            <div className="relative h-full p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <Image src="/logo.png" alt="Morsands" width={32} height={32} className="rounded-lg opacity-90" />
                <div className="text-right">
                  <p className="text-xs text-surface-500 font-medium">
                    {isPhysical ? 'PHYSICAL' : 'VIRTUAL'}
                  </p>
                  <p className="text-xs text-brand-400 font-semibold">VISA</p>
                </div>
              </div>
              {/* Chip */}
              <div className="w-10 h-7 rounded-md bg-gradient-to-br from-yellow-400/80 to-yellow-600/80 flex items-center justify-center">
                <div className="w-7 h-5 rounded-sm border border-yellow-300/40 grid grid-cols-2 gap-px p-0.5">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-yellow-300/30 rounded-sm" />
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-mono text-surface-300 tracking-widest">•••• •••• •••• ••••</p>
                <div className="flex items-end justify-between mt-1">
                  <p className="text-xs text-surface-500">MORSANDS WALLET</p>
                  <p className="text-xs text-surface-500">VALID THRU ••/••</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="glass-card p-4 space-y-2">
              <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400">
                {feature.icon}
              </div>
              <p className="text-sm font-semibold text-white">{feature.title}</p>
              <p className="text-xs text-surface-500 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Order Form */}
        <div className="max-w-2xl mx-auto">
          {submitted ? (
            <div className="glass-card p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">Application Submitted</h2>
              <p className="text-surface-400 text-sm">
                Your card application has been sent to our team at <span className="text-white">support@morsands.com</span>. We will review your request and contact you within 1–2 business days.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-colors"
              >
                Return to Wallet
              </Link>
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <div className="px-6 py-5 border-b border-surface-800/50">
                <h2 className="text-lg font-bold text-white">Apply for Your Card</h2>
                <p className="text-sm text-surface-500 mt-0.5">Complete the form below — our team will process your application within 1–2 business days.</p>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Card Type Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Card Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['virtual', 'physical'] as CardType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, cardType: type }))}
                        className={`p-4 rounded-xl border text-left transition-all duration-150 ${
                          form.cardType === type
                            ? 'bg-brand-500/10 border-brand-500/40 text-white'
                            : 'bg-surface-800/40 border-surface-700/30 text-surface-400 hover:border-surface-600/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {type === 'virtual' ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                            </svg>
                          )}
                          <span className="text-sm font-semibold capitalize">{type}</span>
                        </div>
                        <p className="text-xs text-surface-500">
                          {type === 'virtual' ? 'Instant · Apple/Google Pay ready' : 'Delivered to your address · 5–10 days'}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Personal Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-surface-400 uppercase tracking-wider">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      required
                      placeholder="Chris"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800/60 border border-surface-700/40 text-white text-sm placeholder-surface-600 focus:outline-none focus:border-brand-500/50 focus:bg-surface-800/80 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      required
                      placeholder="Holanda"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800/60 border border-surface-700/40 text-white text-sm placeholder-surface-600 focus:outline-none focus:border-brand-500/50 focus:bg-surface-800/80 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800/60 border border-surface-700/40 text-white text-sm placeholder-surface-600 focus:outline-none focus:border-brand-500/50 focus:bg-surface-800/80 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Wallet Address</label>
                  <input
                    type="text"
                    name="walletAddress"
                    value={form.walletAddress}
                    onChange={handleChange}
                    required
                    placeholder="0x..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800/60 border border-surface-700/40 text-white text-sm font-mono placeholder-surface-600 focus:outline-none focus:border-brand-500/50 focus:bg-surface-800/80 transition-all"
                  />
                </div>

                {/* Shipping Address — only for physical */}
                {isPhysical && (
                  <div className="space-y-4 pt-2 border-t border-surface-800/40">
                    <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider pt-1">Shipping Address</p>
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        name="addressLine1"
                        value={form.addressLine1}
                        onChange={handleChange}
                        required={isPhysical}
                        placeholder="Address line 1"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800/60 border border-surface-700/40 text-white text-sm placeholder-surface-600 focus:outline-none focus:border-brand-500/50 focus:bg-surface-800/80 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        name="addressLine2"
                        value={form.addressLine2}
                        onChange={handleChange}
                        placeholder="Address line 2 (optional)"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800/60 border border-surface-700/40 text-white text-sm placeholder-surface-600 focus:outline-none focus:border-brand-500/50 focus:bg-surface-800/80 transition-all"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        required={isPhysical}
                        placeholder="City"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800/60 border border-surface-700/40 text-white text-sm placeholder-surface-600 focus:outline-none focus:border-brand-500/50 focus:bg-surface-800/80 transition-all"
                      />
                      <input
                        type="text"
                        name="postcode"
                        value={form.postcode}
                        onChange={handleChange}
                        required={isPhysical}
                        placeholder="Postcode / ZIP"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800/60 border border-surface-700/40 text-white text-sm placeholder-surface-600 focus:outline-none focus:border-brand-500/50 focus:bg-surface-800/80 transition-all"
                      />
                    </div>
                    <input
                      type="text"
                      name="country"
                      value={form.country}
                      onChange={handleChange}
                      required={isPhysical}
                      placeholder="Country"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-surface-800/60 border border-surface-700/40 text-white text-sm placeholder-surface-600 focus:outline-none focus:border-brand-500/50 focus:bg-surface-800/80 transition-all"
                    />
                  </div>
                )}

                {error && (
                  <p className="text-sm text-red-400 bg-red-500/5 border border-red-500/15 rounded-lg px-4 py-2.5">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Submitting…
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                      </svg>
                      Apply for {isPhysical ? 'Physical' : 'Virtual'} Card
                    </>
                  )}
                </button>

                <p className="text-xs text-surface-600 text-center">
                  By applying you agree to our terms. Cards are issued via Gnosis Pay · Visa network. Subject to KYC verification.
                </p>
              </form>
            </div>
          )}
        </div>

        {/* Powered by note */}
        <div className="text-center pb-6">
          <p className="text-xs text-surface-700">
            Morsands Card is issued via{' '}
            <a href="https://gnosispay.com" target="_blank" rel="noopener noreferrer" className="text-surface-500 hover:text-surface-400 underline underline-offset-2">
              Gnosis Pay
            </a>
            {' '}· Visa network · Regulated by FCA (Monavate Limited, FRN: 901097)
          </p>
        </div>
      </main>
    </div>
  );
}
