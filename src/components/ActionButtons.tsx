'use client';
export default function ActionButtons({
  onSend,
  onReceive,
  disabled,
}: {
  onSend: () => void;
  onReceive: () => void;
  disabled: boolean;
}) {
  return (
    <div>
      <nav aria-label="Wallet actions" className="grid grid-cols-3 gap-3">
        <button
          disabled
          aria-describedby="buy-unavailable"
          className="btn-primary py-3 disabled:opacity-40"
        >
          Buy
        </button>
        {[
          { label: 'Send', action: onSend },
          { label: 'Receive', action: onReceive },
        ].map(({ label, action }) => (
          <button
            key={label}
            onClick={action}
            disabled={disabled}
            className="btn-primary py-3 disabled:opacity-40"
          >
            {label}
          </button>
        ))}
      </nav>
      <p
        id="buy-unavailable"
        role="status"
        className="text-xs text-surface-400 mt-3"
      >
        Buy temporarily unavailable. The purchase provider integration is being
        updated.
      </p>
    </div>
  );
}
