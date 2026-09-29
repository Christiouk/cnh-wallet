'use client';
export default function ActionButtons({
  onSend,
  onReceive,
  onBuy,
  onSwap,
  disabled,
  sendDisabled = disabled,
}: {
  onSend(): void;
  onReceive(): void;
  onBuy?(): void;
  onSwap?(): void;
  disabled: boolean;
  sendDisabled?: boolean;
}) {
  return (
    <nav
      aria-label="Wallet actions"
      className={`wallet-actions${onSwap ? ' has-swap' : onBuy ? ' has-buy' : ''}`}
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
      {onSwap && (
        <button
          className="btn-secondary"
          onClick={onSwap}
          disabled={disabled}
        >
          <span aria-hidden>⇅</span>Swap
        </button>
      )}
    </nav>
  );
}
