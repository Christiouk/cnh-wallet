'use client';

import { useState } from 'react';
import { CONTACT } from '@/lib/constants';
import { copyToClipboard } from '@/lib/utils';

export default function ContactPanel() {
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = async () => {
    const success = await copyToClipboard(CONTACT.email);
    if (success) {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-6 py-4 border-b border-surface-800/50">
        <h2 className="text-base font-semibold text-white">Contact</h2>
      </div>

      <div className="divide-y divide-surface-800/30">
        {/* Email */}
        <div className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-surface-500">Email</p>
              <p className="text-sm font-medium text-white">{CONTACT.email}</p>
            </div>
          </div>
          <button
            onClick={handleCopyEmail}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              copiedEmail
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-surface-800/60 text-surface-300 hover:text-white hover:bg-surface-700/60 border border-surface-700/30'
            }`}
          >
            {copiedEmail ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* WhatsApp */}
        <div className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <p className="text-xs text-surface-500">Live Chat</p>
              <p className="text-sm font-medium text-white">{CONTACT.whatsapp}</p>
            </div>
          </div>
          <a
            href={CONTACT.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-800/60 text-surface-300 hover:text-white hover:bg-surface-700/60 border border-surface-700/30 transition-all duration-200"
          >
            Open
          </a>
        </div>

        {/* Support */}
        <div className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-surface-500">Support</p>
              <p className="text-sm font-medium text-white">{CONTACT.support}</p>
            </div>
          </div>
          <a
            href={`mailto:${CONTACT.support}`}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-800/60 text-surface-300 hover:text-white hover:bg-surface-700/60 border border-surface-700/30 transition-all duration-200"
          >
            Email
          </a>
        </div>
      </div>
    </div>
  );
}
