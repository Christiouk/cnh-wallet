'use client';

interface NotesPanelProps {
  referenceCode: string;
}

export default function NotesPanel({ referenceCode }: NotesPanelProps) {
  return (
    <div className="glass-card overflow-hidden">
      <div className="px-6 py-4 border-b border-surface-800/50">
        <h2 className="text-base font-semibold text-white">Notes</h2>
      </div>

      <div className="p-5 space-y-3">
        <div className="space-y-2.5">
          <div className="flex items-start gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
            <p className="text-sm text-surface-300 leading-relaxed">
              Buy / Sell / Swap are executed via <strong className="text-white">CNH Desk</strong> (manual back office).
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
            <p className="text-sm text-surface-300 leading-relaxed">
              Send / Receive: you can still use the wallet address as normal.
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
          <p className="text-xs text-surface-500">
            Ref: <span className="font-mono text-surface-400">{referenceCode}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
