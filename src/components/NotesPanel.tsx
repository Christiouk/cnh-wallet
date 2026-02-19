'use client';

interface NotesPanelProps {
  referenceCode: string;
}

export default function NotesPanel({ referenceCode }: NotesPanelProps) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="px-6 py-4 border-b border-surface-800/50">
        <h2 className="text-base font-semibold text-white">Self-Custody Wallet</h2>
      </div>

      <div className="p-5 space-y-3">
        <div className="flex items-start gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
          <p className="text-sm text-surface-300 leading-relaxed">
            Large-value Buy / Sell / Swap transactions are executed via <strong className="text-white">CNH Desk</strong> (manual back-office review for compliance).
          </p>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
          <p className="text-sm text-surface-300 leading-relaxed">
            Keep your email access safe — we do not hold backups or any of your private information.
          </p>
        </div>

        <div className="flex items-start gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
          <p className="text-sm text-surface-300 leading-relaxed">
            For compliance, always confirm network &amp; recipient details.
          </p>
        </div>
      </div>

      <div className="pt-2 mt-2 border-t border-surface-800/50">
        <p className="text-xs text-surface-500 px-6 pb-5">
          Ref: <span className="font-mono text-surface-400">{referenceCode}</span>
        </p>
      </div>
    </div>
  );
}
