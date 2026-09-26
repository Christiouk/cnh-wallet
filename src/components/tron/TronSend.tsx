'use client';
import { useEffect, useRef, useState } from 'react';
import {
  displayUnits,
  parseUsdt,
  tronExplorer,
  validTronAddress,
  validateTransaction,
  type Confirmation,
  type SendQuote,
  type TronIdentity,
} from '@/lib/tron/core';
import type { TronDriver } from '@/hooks/useTronWallet';
import Modal from '../Modal';
type Stage =
  | 'form'
  | 'review'
  | 'signing'
  | 'submitted'
  | 'confirming'
  | 'confirmed'
  | 'failed';
export default function TronSend({
  owner,
  driver,
  onClose,
  onConfirmed,
}: {
  owner: TronIdentity;
  driver: TronDriver;
  onClose(): void;
  onConfirmed(): void;
}) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<SendQuote>();
  const [stage, setStage] = useState<Stage>('form');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hash, setHash] = useState('');
  const alive = useRef(true);
  const locked = useRef(false);
  const key = `a3:tron-pending:${owner.did}:${owner.walletId}:${owner.address}`;
  const poll = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    alive.current = true;
    try {
      const saved = sessionStorage.getItem(key);
      if (saved) {
        const pending = JSON.parse(saved) as SendQuote;
        if (
          pending.intent.address === owner.address &&
          pending.intent.did === owner.did &&
          pending.intent.walletId === owner.walletId
        ) {
          setQuote(pending);
          setHash(pending.intent.transaction.txID);
          setStage('confirming');
        }
      }
    } catch {
      setStage('failed');
      setError(
        'Pending transfer record unavailable. Check Activity before another send.',
      );
    }
    return () => {
      alive.current = false;
      clearTimeout(poll.current);
    };
  }, [key, owner.address, owner.did, owner.walletId]);
  useEffect(() => {
    if ((stage !== 'submitted' && stage !== 'confirming') || !quote) return;
    let cancelled = false;
    let tries = 0;
    const check = async () => {
      try {
        const result = await driver.api<{ status: Confirmation }>('confirm', {
          ticket: quote.ticket,
        });
        if (cancelled || !alive.current) return;
        if (result.status === 'confirmed' || result.status === 'failed') {
          setStage(result.status);
          setError(
            result.status === 'failed'
              ? 'The network rejected this transfer. A network fee may still have been charged.'
              : '',
          );
          sessionStorage.removeItem(key);
          if (result.status === 'confirmed') onConfirmed();
          return;
        }
        setStage('confirming');
      } catch {
        if (!cancelled && alive.current)
          setError(
            'Confirmation temporarily unavailable. Keep this transaction hash; do not send again.',
          );
      }
      if (!cancelled && ++tries < 40) poll.current = setTimeout(check, 3000);
      else if (!cancelled)
        setError(
          'Confirmation is taking longer. Reopen this transfer to check again, or view it on Tronscan. Do not send again.',
        );
    };
    poll.current = setTimeout(check, stage === 'submitted' ? 1500 : 3000);
    return () => {
      cancelled = true;
      clearTimeout(poll.current);
    };
  }, [stage, quote, driver, key, onConfirmed]);
  const review = async (event: React.FormEvent) => {
    event.preventDefault();
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      if (!validTronAddress(recipient))
        throw new Error('Enter a valid Tron address beginning with T');
      parseUsdt(amount);
      const result = await driver.api<SendQuote>('prepare', {
        recipient,
        amount,
      });
      validateTransaction(result.intent, owner);
      if (
        result.intent.recipient !== recipient ||
        result.intent.units !== parseUsdt(amount).toString() ||
        result.applicationFee !== '0'
      )
        throw new Error('Review does not match your transfer');
      if (!alive.current) return;
      setQuote(result);
      setStage('review');
    } catch (e) {
      if (alive.current)
        setError(e instanceof Error ? e.message : 'Unable to prepare transfer');
    } finally {
      locked.current = false;
      if (alive.current) setBusy(false);
    }
  };
  const send = async () => {
    if (locked.current || !quote) return;
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      validateTransaction(quote.intent, owner);
      validateTransaction(quote.intent, driver.current());
      // Storage must work before requesting authorization. Retain hash across modal closes/reloads.
      sessionStorage.setItem(key, JSON.stringify(quote));
      setStage('signing');
      const signature = await driver.sign(quote);
      if (!alive.current) return;
      validateTransaction(quote.intent, driver.current());
      setHash(quote.intent.transaction.txID);
      setStage('submitted');
      try {
        await driver.api('broadcast', { ticket: quote.ticket, signature });
      } catch {
        if (alive.current)
          setError(
            'Submission could not be verified. Checking the original hash; do not send again.',
          );
      }
      if (alive.current) setStage('confirming');
    } catch (e) {
      // No broadcast call has begun in this catch path.
      sessionStorage.removeItem(key);
      if (alive.current) {
        setStage('failed');
        setError(e instanceof Error ? e.message : 'Authorization failed');
      }
    } finally {
      locked.current = false;
      if (alive.current) setBusy(false);
    }
  };
  return (
    <Modal
      isOpen
      onClose={() => {
        if (!busy) onClose();
      }}
      title="Send USDT · Tron"
    >
      <div className="space-y-4">
        {stage === 'form' && (
          <form onSubmit={review} className="space-y-4">
            <label className="block">
              Tron recipient
              <input
                className="input-field mt-2 w-full"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value.trim())}
                autoComplete="off"
                spellCheck={false}
                placeholder="T…"
              />
            </label>
            <label className="block">
              Amount in USDT
              <input
                className="input-field mt-2 w-full"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </label>
            <p className="text-sm">
              The recipient receives the full amount. A3 fee: 0 USDT. Tron
              network costs are paid separately in TRX.
            </p>
            <button className="btn-primary w-full" disabled={busy}>
              {busy ? 'Checking transfer…' : 'Review transfer'}
            </button>
          </form>
        )}
        {quote && stage !== 'form' && (
          <>
            <p className="text-2xl font-semibold">
              {displayUnits(quote.intent.units)} USDT
            </p>
            <p className="text-sm">Tron · USDT TRC-20</p>
            <p className="break-all text-sm">To: {quote.intent.recipient}</p>
            <p className="text-sm">A3 fee: 0 USDT</p>
            <p className="text-sm">
              Network budget: up to{' '}
              {displayUnits(
                String(quote.intent.feeLimit + quote.intent.bandwidthFee),
              )}{' '}
              TRX ({displayUnits(String(quote.intent.feeLimit))} TRX energy
              limit plus bandwidth reserve). Actual cost may be lower; failed
              execution can consume resources.
            </p>
          </>
        )}
        {stage === 'review' && (
          <>
            <button
              className="btn-primary w-full"
              onClick={send}
              disabled={busy}
            >
              Confirm and authorize
            </button>
            <button
              className="btn-ghost w-full"
              onClick={() => setStage('form')}
            >
              Edit transfer
            </button>
          </>
        )}
        {stage !== 'form' && stage !== 'review' && (
          <p role="status">
            {
              (
                {
                  signing: 'Requesting authorization…',
                  submitted: 'Submitted — awaiting network confirmation',
                  confirming: 'Confirming on Tron…',
                  confirmed: 'Transfer confirmed',
                  failed: 'Transfer failed',
                } as const
              )[stage]
            }
          </p>
        )}
        {hash && (
          <>
            <p className="font-mono text-xs break-all">{hash}</p>
            <a
              className="text-blue-300 underline"
              href={tronExplorer('transaction', hash)}
              target="_blank"
              rel="noreferrer"
            >
              View transaction on Tronscan
            </a>
          </>
        )}
        {error && (
          <p role="alert" className="text-amber-300 text-sm">
            {error}
          </p>
        )}
        {(stage === 'confirmed' || stage === 'failed') && (
          <button className="btn-ghost w-full" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </Modal>
  );
}
