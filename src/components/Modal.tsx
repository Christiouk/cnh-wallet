'use client';
import { useEffect, useRef } from 'react';
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  suspendFocusTrap = false,
}: {
  isOpen: boolean;
  onClose(): void;
  title: string;
  children: React.ReactNode;
  suspendFocusTrap?: boolean;
}) {
  const paused = useRef(suspendFocusTrap);
  paused.current = suspendFocusTrap;
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = panel.current;
    dialog?.focus();
    const focusable = () =>
      [
        ...(dialog?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),[tabindex="0"]',
        ) || []),
      ].filter((e) => !e.hidden && e.getClientRects().length > 0);
    const keydown = (event: KeyboardEvent) => {
      if (paused.current) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        close.current();
      }
      if (event.key === 'Tab') {
        const items = focusable(),
          first = items[0],
          last = items[items.length - 1];
        if (!first) {
          event.preventDefault();
          dialog?.focus();
          return;
        }
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === dialog)
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last || document.activeElement === dialog)
        ) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const keepFocus = (event: FocusEvent) => {
      if (!paused.current && dialog && !dialog.contains(event.target as Node))
        dialog.focus();
    };
    document.addEventListener('keydown', keydown);
    document.addEventListener('focusin', keepFocus);
    return () => {
      document.removeEventListener('keydown', keydown);
      document.removeEventListener('focusin', keepFocus);
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [isOpen]);
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-heading">
          <div>
            <p className="eyebrow">A3 WALLET</p>
            <h2>{title}</h2>
          </div>
          <button className="close-modal" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
