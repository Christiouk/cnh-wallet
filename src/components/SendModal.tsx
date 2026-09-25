'use client';
import { useEffect, useRef, useState } from 'react';
import { useSendTransaction } from '@privy-io/react-auth';
import { formatUnits } from 'viem';
import { useEmbeddedWallets } from '@/hooks/useEmbeddedWallets';
import { CURATED_TOKENS } from '@/lib/tokens';
import {
  buildSend,
  submitSend,
  type SendInput,
  type SendStage,
} from '@/lib/wallet/send';
import Modal from './Modal';

async function readSend(input: object, signal?: AbortSignal) {
  const response = await fetch('/api/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal,
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error?.message || 'Ethereum provider unavailable');
  return data;
}
export default function SendModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { evm, user } = useEmbeddedWallets();
  const { sendTransaction } = useSendTransaction();
  const sender = evm.status === 'ready' ? evm.wallet.address : '';
  const identity = `${user?.id}:${sender}`;
  const currentIdentity = useRef(identity);
  currentIdentity.current = identity;
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const locked = useRef(false);
  const [symbol, setSymbol] = useState('ETH');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [intent, setIntent] = useState<SendInput | null>(null);
  const [stage, setStage] = useState<SendStage | 'form'>('form');
  const [cost, setCost] = useState('');
  const [hash, setHash] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [poll, setPoll] = useState(0);
  useEffect(() => {
    if (!hash) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let tries = 0;
    async function check() {
      if (controller.signal.aborted) return;
      setStage('confirming');
      try {
        const data = await readSend(
          { action: 'receipt', hash },
          controller.signal,
        );
        if (controller.signal.aborted) return;
        if (data.status === 'confirmed' || data.status === 'failed') {
          setStage(data.status);
          setError(
            data.status === 'failed'
              ? 'The transaction reverted on Ethereum.'
              : '',
          );
          return;
        }
        if (data.status !== 'confirming') throw new Error();
        setError('');
      } catch {
        if (controller.signal.aborted) return;
        setError(
          'Confirmation temporarily unavailable. Check the explorer before taking further action.',
        );
      }
      if (++tries < 40) timer = setTimeout(check, 3000);
      else
        setError(
          'Confirmation is still pending. Check the explorer or check again below.',
        );
    }
    timer = setTimeout(check, 1000);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [hash, poll]);

  async function review() {
    if (locked.current || !sender) return;
    locked.current = true;
    setBusy(true);
    setError('');
    const scope = identity;
    try {
      const input = { sender, recipient: recipient.trim(), symbol, amount };
      buildSend(input);
      const preview = await readSend({ action: 'preview', ...input });
      if (!alive.current || currentIdentity.current !== scope) return;
      if (!/^\d+$/.test(preview.estimatedNetworkCost) || preview.chainId !== 1)
        throw new Error('Invalid network estimate');
      setCost(preview.estimatedNetworkCost);
      setIntent(input);
      setStage('review');
    } catch (e) {
      if (alive.current)
        setError(e instanceof Error ? e.message : 'Unable to review transfer');
    } finally {
      locked.current = false;
      if (alive.current) setBusy(false);
    }
  }
  async function confirm() {
    if (!intent || locked.current || !sender || sender !== intent.sender)
      return;
    locked.current = true;
    setBusy(true);
    setError('');
    const scope = identity;
    try {
      // Recheck immediately before the single signing request; never sign on failed reads.
      const preview = await readSend({ action: 'preview', ...intent });
      if (!alive.current || currentIdentity.current !== scope) return;
      if (!/^\d+$/.test(preview.estimatedNetworkCost) || preview.chainId !== 1)
        throw new Error('Invalid network estimate');
      if (BigInt(preview.estimatedNetworkCost) > BigInt(cost)) {
        setCost(preview.estimatedNetworkCost);
        setError(
          'Estimated network cost increased. Review it and confirm again.',
        );
        return;
      }
      setStage('requesting-signature');
      const result = await submitSend(intent, sendTransaction);
      if (!alive.current) return;
      if (!/^0x[0-9a-f]{64}$/i.test(result.hash))
        throw new Error(
          'Provider did not return a valid hash. Check Activity before retrying.',
        );
      setHash(result.hash);
      setStage('submitted');
    } catch {
      if (alive.current) {
        setStage('failed');
        setError(
          'The signing request was rejected or could not be completed. Check your wallet and Activity before starting another transfer.',
        );
      }
    } finally {
      locked.current = false;
      if (alive.current) setBusy(false);
    }
  }
  function reset() {
    if (locked.current) return;
    setStage('form');
    setIntent(null);
    setHash('');
    setCost('');
    setAmount('');
    setRecipient('');
    setError('');
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send">
      <div className="space-y-4">
        <p className="badge-info">Ethereum mainnet · Chain ID 1</p>
        {stage === 'form' ? (
          <>
            <label className="block">
              Asset
              <select
                className="input-field mt-1"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                disabled={busy}
              >
                {CURATED_TOKENS.map((t) => (
                  <option key={t.symbol}>{t.symbol}</option>
                ))}
              </select>
            </label>
            <label className="block">
              Recipient
              <input
                className="input-field mt-1"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                disabled={busy}
              />
            </label>
            <label className="block">
              Amount
              <input
                className="input-field mt-1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                disabled={busy}
              />
            </label>
            <button
              className="btn-primary w-full"
              disabled={busy || !sender}
              onClick={review}
            >
              {busy ? 'Checking balances and network cost…' : 'Review transfer'}
            </button>
          </>
        ) : (
          <>
            <p role="status" className="font-semibold capitalize">
              {stage.replace('-', ' ')}
            </p>
            {intent && (
              <dl className="space-y-2 text-sm">
                <dt>Recipient receives</dt>
                <dd className="break-all">
                  {intent.amount} {intent.symbol}
                </dd>
                <dt>Recipient</dt>
                <dd className="break-all font-mono">{intent.recipient}</dd>
                <dt>From</dt>
                <dd className="break-all font-mono">{intent.sender}</dd>
                <dt>Estimated network cost (includes 20% buffer)</dt>
                <dd>
                  {cost ? formatUnits(BigInt(cost), 18) : 'Unavailable'} ETH
                </dd>
              </dl>
            )}
            <p className="text-xs text-surface-400">
              The full entered amount goes to the recipient. Ethereum network
              cost is additional; the final cost is set when you sign.
            </p>
            {stage === 'review' && (
              <div className="flex gap-3">
                <button className="btn-ghost" onClick={reset} disabled={busy}>
                  Edit
                </button>
                <button
                  className="btn-primary"
                  onClick={confirm}
                  disabled={busy || !sender}
                >
                  {busy ? 'Checking…' : 'Confirm and sign'}
                </button>
              </div>
            )}
            {hash && (
              <div className="text-sm break-all">
                <p>Transaction hash</p>
                <a
                  className="text-brand-400 underline"
                  href={`https://etherscan.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {hash}
                </a>
              </div>
            )}
            {stage === 'confirmed' && (
              <p>
                Confirmed in an Ethereum block. Additional confirmations improve
                finality.
              </p>
            )}
            {stage === 'confirming' && (
              <button
                className="btn-ghost"
                onClick={() => setPoll((p) => p + 1)}
              >
                Check confirmation
              </button>
            )}
            {(stage === 'confirmed' || stage === 'failed') && (
              <button className="btn-ghost" onClick={reset}>
                New transfer
              </button>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="text-amber-300 text-sm">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
