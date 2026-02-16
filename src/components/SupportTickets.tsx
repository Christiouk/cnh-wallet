'use client';

import { CONTACT } from '@/lib/constants';

export default function SupportTickets() {
  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-800/50">
        <h2 className="text-base font-semibold text-white">Support Tickets</h2>
        <div className="flex items-center gap-2">
          <a
            href={CONTACT.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/15 transition-all duration-200"
          >
            New Ticket
          </a>
        </div>
      </div>

      <div className="p-8 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-surface-800/60 flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-surface-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-surface-400 mb-1">No open tickets</p>
        <p className="text-xs text-surface-600 max-w-xs">
          Need help? Create a new ticket via WhatsApp or email our support team.
        </p>
        <div className="flex items-center gap-2 mt-4">
          <a
            href={CONTACT.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
          >
            WhatsApp
          </a>
          <span className="text-surface-700">|</span>
          <a
            href={`mailto:${CONTACT.support}`}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-brand-400 hover:bg-brand-500/10 transition-colors"
          >
            Email Support
          </a>
        </div>
      </div>
    </div>
  );
}
