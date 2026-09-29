'use client';
export default function ActionButtons({
  onSend,
  onReceive,
  onBuy,
  disabled,
  sendDisabled = disabled,
}: {
  onSend(): void;
  onReceive(): void;
  onBuy?(): void;
  disabled: boolean;
  sendDisabled?: boolean;
}) {
  return (
    <nav
      aria-label="Wallet actions"
      className={`wallet-actions${onBuy ? ' has-buy' : ''}`}
    >
      <button
        className="btn-primary"
        onClick={onReceive}
        disabled={disabled}
      >
        <span aria-hidden>↙</span>Receive
      </button>
      <button
        className="btn-secondary"
        onClick={onSend}
        disabled={sendDisabled}
      >
        <span aria-hidden>↗</span>Send
      </button>
      {onBuy && (
        <button
          className="btn-secondary"
          onClick={onBuy}
          disabled={disabled}
        >
          <span aria-hidden>+</span>Buy
        </button>
      )}
    </nav>
  );
}
