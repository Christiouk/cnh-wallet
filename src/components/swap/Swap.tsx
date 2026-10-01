'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePrivy, useSendTransaction } from '@privy-io/react-auth';
import { formatUnits } from 'viem';
import { useEmbeddedWallets } from '@/hooks/useEmbeddedWallets';
import {
  ASSETS,
  check,
  input,
  same,
  type Asset,
  type QuoteView,
  type Transaction,
} from '@/lib/swap/core';
import type { TokenBalance } from '@/lib/tokens';
import Modal from '../Modal';
import AssetIcon from '../ui/AssetIcon';
export type SwapDriver = {
  api<T>(action: string, fields?: Record<string, unknown>): Promise<T>;
  sign(tx: Transaction, expiresAt: number): Promise<string>;
};
export default function Swap({
  isOpen,
  onClose,
  onRefresh,
  balances,
}: {
  onClose(): void;
  onRefresh(): void;
  balances: TokenBalance[];
  isOpen: boolean;
}) {
  const { getAccessToken } = usePrivy();
  const { sendTransaction } = useSendTransaction();
  const { evm, user } = useEmbeddedWallets();
  const wallet = evm.status === 'ready' ? evm.wallet : undefined;
  const identity = `${user?.id}:${wallet?.address}`,
    current = useRef(identity);
  current.current = identity;
  const visible = useRef(isOpen);
  visible.current = isOpen;
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const api = useCallback(
    async <T,>(
      action: string,
      fields: Record<string, unknown> = {},
    ): Promise<T> => {
      const token = await getAccessToken();
      if (!token) throw new Error('Sign in to Swap');
      const r = await fetch('/api/swap', {
        method: 'POST',
        cache: 'no-store',
        signal: AbortSignal.timeout(35000),
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, ...fields }),
      });
      const result = await r.json();
      if (!r.ok)
        throw new Error(
          result?.error?.message || 'Swap currently unavailable',
        );
      return result;
    },
    [getAccessToken],
  );
  const sign = useCallback(
    async (tx: Transaction, expiresAt: number) => {
      check(
        wallet &&
          alive.current &&
          visible.current &&
          current.current === identity &&
          same(tx.from, wallet.address) &&
          tx.chainId === 1,
        'Wallet changed',
      );
      await wallet.switchChain(1);
      const provider = await wallet.getEthereumProvider();
      check(
        BigInt(await provider.request({ method: 'eth_chainId' })) === 1n,
        'Ethereum mainnet required',
      );
      const accounts = await provider.request({ method: 'eth_accounts' });
      check(
        Array.isArray(accounts) &&
          accounts.some((a) => same(a, wallet.address)),
        'Wallet changed',
      );
      check(
        alive.current &&
          visible.current &&
          current.current === identity &&
          expiresAt > Date.now(),
        'Quote expired',
      );
      const result = await sendTransaction(
        {
          from: tx.from,
          to: tx.to,
          data: tx.data,
          value: BigInt(tx.value),
          gasLimit: BigInt(tx.gas),
          gasPrice: BigInt(tx.gasPrice),
          nonce: tx.nonce,
          chainId: 1,
        },
        { address: wallet.address },
      );
      return result.hash;
    },
    [wallet, identity, sendTransaction],
  );
  return (
    <SwapPanel
      key={identity}
      isOpen={isOpen}
      address={wallet?.address || ''}
      balances={balances}
      driver={{ api, sign }}
      onClose={onClose}
      onRefresh={onRefresh}
    />
  );
}
const states: Record<string, string> = {
  quoting: 'Fetching quote',
  price: 'Quote ready',
  approval: 'Approval required',
  approving: 'Approving',
  'approval-confirmed': 'Approval confirmed',
  firm: 'Review Swap',
  signing: 'Requesting Swap signature',
  submitted: 'Submitted',
  confirming: 'Confirming on Ethereum',
  confirmed: 'Swap confirmed',
  failed: 'Transaction failed',
  expired: 'Quote expired',
};
export function SwapPanel({
  isOpen = true,
  address,
  balances,
  driver,
  onClose,
  onRefresh,
}: {
  isOpen?: boolean;
  address: string;
  balances: TokenBalance[];
  driver: SwapDriver;
  onClose(): void;
  onRefresh(): void;
}) {
  const [sell, setSell] = useState<Asset>('USDT'),
    [buy, setBuy] = useState<Asset>('ETH'),
    [amount, setAmount] = useState('');
  const [view, setView] = useState<QuoteView>(),
    [stage, setStage] = useState('form'),
    [error, setError] = useState(''),
    [hash, setHash] = useState(''),
    [available, setAvailable] = useState<boolean>(),
    [busy, setBusy] = useState(false),
    [clock, setClock] = useState(Date.now());
  const visible = useRef(isOpen);
  visible.current = isOpen;
  const lock = useRef(false),
    alive = useRef(true),
    refresh = useRef(onRefresh);
  refresh.current = onRefresh;
  const api = driver.api;
  useEffect(() => {
    alive.current = true;
    let active = true;
    api<{ enabled: boolean }>('availability')
      .then((r) => {
        if (active) setAvailable(r.enabled);
      })
      .catch(() => {
        if (active) setAvailable(false);
      });
    return () => {
      active = false;
      alive.current = false;
    };
  }, [api]);
  useEffect(() => {
    const t = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const waiting = ['submitted', 'confirming'].includes(stage),
    signing = ['signing', 'approving'].includes(stage);
  const expired =
    !!view &&
    ['price', 'approval', 'firm'].includes(stage) &&
    clock >= view.expiresAt;
  const statusCheck = useCallback(async () => {
    if (!view || !hash || lock.current) return;
    lock.current = true;
    try {
      const r = await api<{ status: string }>('receipt', {
        id: view.id,
        hash,
      });
      if (!alive.current) return;
      check(
        [
          'confirming',
          'confirmed',
          'failed',
          'approval-confirmed',
        ].includes(r.status),
      );
      setStage(r.status);
      if (r.status === 'confirmed') refresh.current();
      if (r.status === 'failed')
        setError(
          'The transaction reverted on Ethereum. No Swap completion is claimed.',
        );
    } catch {
      if (alive.current)
        setError(
          'Confirmation unavailable. Check the explorer before retrying.',
        );
    } finally {
      lock.current = false;
    }
  }, [api, view, hash]);
  useEffect(() => {
    if (!waiting) return;
    let count = 0;
    const t = setInterval(() => {
      if (++count <= 24) void statusCheck();
      else clearInterval(t);
    }, 5000);
    return () => clearInterval(t);
  }, [waiting, statusCheck]);
  const showError = (e: unknown) => {
    const message = e instanceof Error ? e.message : '';
    const safe =
      /^(Swap currently unavailable|No liquidity available|Insufficient sell-asset balance|Insufficient ETH for network gas|Enter a valid token amount|Unsupported asset pair|Quote expired|Swap session expired|Wallet changed|Please wait before retrying|Swap provider unavailable)/;
    return safe.test(message)
      ? message
      : 'Swap unavailable. Please try again or check Activity.';
  };
  async function run(action: 'price' | 'prepare' | 'authorize') {
    if (lock.current || busy) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      if (action === 'price') {
        const i = input({ sellAsset: sell, buyAsset: buy, amount });
        setStage('quoting');
        const next = await api<QuoteView>('price', i);
        check(same(next.address, address));
        if (!alive.current) return;
        setView(next);
        setStage('price');
      } else if (action === 'prepare') {
        const next = await api<QuoteView>('prepare', { id: view!.id });
        check(same(next.address, address));
        if (!alive.current) return;
        setHash('');
        setView(next);
        setStage(next.phase);
      } else {
        const approving = stage === 'approval';
        const result = await api<{
          transaction: Transaction;
          expiresAt: number;
        }>('authorize', { id: view!.id });
        check(
          alive.current &&
            visible.current &&
            same(result.transaction.from, address) &&
            result.transaction.chainId === 1 &&
            result.expiresAt > Date.now(),
          'Quote expired',
        );
        setStage(approving ? 'approving' : 'signing');
        const txHash = await driver.sign(
          result.transaction,
          result.expiresAt,
        );
        if (!alive.current) return;
        check(/^0x[0-9a-f]{64}$/i.test(txHash));
        setHash(txHash);
        setStage('submitted');
      }
    } catch (e) {
      if (alive.current) {
        setError(
          action === 'authorize'
            ? 'The request was rejected or could not be completed. Check Activity before starting again.'
            : showError(e),
        );
        setStage(action === 'authorize' ? 'failed' : 'form');
        if (action !== 'authorize') setView(undefined);
      }
    } finally {
      lock.current = false;
      if (alive.current) setBusy(false);
    }
  }
  const reset = () => {
    setView(undefined);
    setHash('');
    setStage('form');
    setError('');
  };
  const fmt = (value: string, asset: Asset) =>
    formatUnits(BigInt(value), ASSETS[asset].decimals);
  const balance = balances.find((t) => t.symbol === sell);
  const label = (a: Asset) =>
    `${a} · Ethereum${a === 'ETH' ? '' : ' / ERC-20'}`;
  const intent = view?.intent;
  return (
    <Modal
      isOpen={isOpen}
      title="Swap"
      onClose={() => {
        if (!signing) onClose();
      }}
      suspendFocusTrap={signing}
    >
      <div className="swap-sheet buy-sheet">
        <div className="network-banner">
          <strong>Network · Ethereum</strong>
          <span>Crypto → crypto · Powered by 0x</span>
        </div>
        {available === false && (
          <p className="notice" role="status">
            Swap currently unavailable
          </p>
        )}
        {available === undefined && (
          <p role="status">Checking Swap availability…</p>
        )}
        {stage === 'form' || stage === 'quoting' ? (
          <>
            <label htmlFor="swap-sell" className="field-label">
              You pay
            </label>
            <div className="swap-asset-field">
              <AssetIcon symbol={sell} />
              <select
                id="swap-sell"
                value={sell}
                disabled={busy}
                onChange={(e) => {
                  const a = e.target.value as Asset;
                  setSell(a);
                  if (buy === a) setBuy(a === 'ETH' ? 'USDT' : 'ETH');
                  reset();
                }}
              >
                {Object.keys(ASSETS).map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </div>
            <p>{label(sell)}</p>
            <p className="muted">
              Balance: {balance ? balance.formattedBalance : 'Unavailable'}
            </p>
            <label htmlFor="swap-amount" className="field-label">
              Amount
            </label>
            <input
              id="swap-amount"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              value={amount}
              disabled={busy}
              onChange={(e) => {
                setAmount(e.target.value);
                reset();
              }}
            />
            <span className="swap-direction" aria-hidden>
              ↓
            </span>
            <label htmlFor="swap-buy" className="field-label">
              You receive
            </label>
            <div className="swap-asset-field">
              <AssetIcon symbol={buy} />
              <select
                id="swap-buy"
                value={buy}
                disabled={busy}
                onChange={(e) => {
                  setBuy(e.target.value as Asset);
                  reset();
                }}
              >
                {Object.keys(ASSETS)
                  .filter((a) => a !== sell)
                  .map((a) => (
                    <option key={a}>{a}</option>
                  ))}
              </select>
            </div>
            <p>{label(buy)}</p>
            <button
              className="btn-primary w-full"
              disabled={!available || busy || !amount}
              onClick={() => run('price')}
            >
              {stage === 'quoting' ? 'Fetching quote…' : 'Get estimate'}
            </button>
          </>
        ) : (
          <>
            <div role="status">
              <h3>{expired ? 'Quote expired' : states[stage]}</h3>
            </div>
            {intent && (
              <>
                <div className="buy-asset">
                  <AssetIcon symbol={intent.sellAsset} />
                  <div>
                    <strong>
                      {intent.amount} {intent.sellAsset}
                    </strong>
                    <p>{label(intent.sellAsset)}</p>
                  </div>
                </div>
                <span aria-hidden>↓</span>
                <div className="buy-asset">
                  <AssetIcon symbol={intent.buyAsset} />
                  <div>
                    <strong>
                      {fmt(view!.buyAmount, intent.buyAsset)}{' '}
                      {intent.buyAsset}
                    </strong>
                    <p>
                      {stage === 'confirmed'
                        ? 'Quoted amount · actual receipt may differ'
                        : 'Expected receive'}{' '}
                      · {label(intent.buyAsset)}
                    </p>
                  </div>
                </div>
                <dl className="buy-review">
                  <div>
                    <dt>Indicative rate</dt>
                    <dd>
                      1 {intent.sellAsset} ≈{' '}
                      {(
                        Number(fmt(view!.buyAmount, intent.buyAsset)) /
                        Number(intent.amount)
                      ).toLocaleString('en-GB', {
                        maximumSignificantDigits: 8,
                      })}{' '}
                      {intent.buyAsset}
                    </dd>
                  </div>
                  <div>
                    <dt>Minimum received</dt>
                    <dd>
                      {view!.minimum === '0'
                        ? 'Available with firm quote'
                        : `${fmt(view!.minimum, intent.buyAsset)} ${intent.buyAsset}`}
                    </dd>
                  </div>
                  <div>
                    <dt>Estimated network cost</dt>
                    <dd>
                      {view!.networkCost
                        ? `${formatUnits(BigInt(view!.networkCost), 18)} ETH`
                        : 'Unavailable'}
                    </dd>
                  </div>
                  <div>
                    <dt>0x provider fee</dt>
                    <dd>{view!.providerFee}</dd>
                  </div>
                </dl>
              </>
            )}
            {stage === 'price' && (
              <>
                <p className="muted">
                  Indicative estimate. Approval, if needed, comes before a
                  fresh executable quote. Final details require your review.
                </p>
                <button
                  className="btn-primary w-full"
                  disabled={busy || expired}
                  onClick={() => run('prepare')}
                >
                  {busy ? 'Preparing…' : 'Review Swap'}
                </button>
              </>
            )}
            {stage === 'approval' && (
              <>
                <p>
                  {view!.approval === 'reset'
                    ? 'USDT requires resetting the existing permission to zero first. After confirmation, approve only this Swap’s amount.'
                    : `A token permission of ${fmt(view!.approvalAmount!, intent!.sellAsset)} ${intent!.sellAsset} is required for this Swap.`}{' '}
                  This is permission for 0x AllowanceHolder, not a payment
                  to A3. Unused permission remains if you stop after
                  approval.
                </p>
                <button
                  className="btn-primary w-full"
                  disabled={busy || expired}
                  onClick={() => run('authorize')}
                >
                  {view!.approval === 'reset'
                    ? 'Reset USDT permission'
                    : `Approve ${intent!.sellAsset}`}
                </button>
              </>
            )}
            {stage === 'approval-confirmed' && (
              <button
                className="btn-primary w-full"
                disabled={busy}
                onClick={() => run('prepare')}
              >
                {busy ? 'Checking allowance…' : 'Continue to fresh quote'}
              </button>
            )}
            {stage === 'firm' && (
              <>
                <p className="muted">
                  Review these updated amounts. Quote expires shortly; stale
                  quotes cannot be signed.
                </p>
                <button
                  className="btn-primary w-full"
                  disabled={busy || expired}
                  onClick={() => run('authorize')}
                >
                  Confirm Swap
                </button>
              </>
            )}
            {hash && (
              <div className="buy-destination">
                <span className="field-label">
                  Ethereum transaction hash
                </span>
                <code>{hash}</code>
                <a
                  className="explorer-link"
                  href={`https://etherscan.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on Etherscan ↗
                </a>
              </div>
            )}
            {waiting && (
              <>
                <p>
                  Submitted is not confirmed. Waiting for an Ethereum
                  receipt.
                </p>
                <button className="btn-secondary" onClick={statusCheck}>
                  Check confirmation
                </button>
              </>
            )}
            {stage === 'confirmed' && (
              <p role="status">
                Confirmed on Ethereum. Balances and Activity refreshed. No
                separate Swap history entry was added.
              </p>
            )}
            {!busy && !waiting && !signing && (
              <button className="btn-secondary w-full" onClick={reset}>
                {expired ? 'Get a fresh estimate' : 'New estimate'}
              </button>
            )}
          </>
        )}
        {error && (
          <p className="notice" role="alert">
            {error}
          </p>
        )}
        <p className="muted">
          No A3 Swap fee or spread. 0x provider fees and Ethereum network
          costs may apply. Slippage uses the provider’s documented 1%
          default; the minimum is shown above.
        </p>
        <button
          className="btn-ghost w-full"
          disabled={signing}
          onClick={onClose}
        >
          Return to wallet
        </button>
      </div>
    </Modal>
  );
}
