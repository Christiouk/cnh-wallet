'use client';
export default function ActionButtons({
  onSend,
  onReceive,
  disabled,
  sendDisabled = disabled,
}: {
  onSend(): void;
  onReceive(): void;
  disabled: boolean;
  sendDisabled?: boolean;
}) {
  return (
    <nav aria-label="Wallet actions" className="wallet-actions">
      <button className="btn-primary" onClick={onReceive} disabled={disabled}>
        <span aria-hidden>↙</span>Receive
      </button>
      <button
        className="btn-secondary"
        onClick={onSend}
        disabled={sendDisabled}
      >
        <span aria-hidden>↗</span>Send
      </button>
    </nav>
  );
}
