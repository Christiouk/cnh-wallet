'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import Modal from '../Modal';
import AssetIcon from '../ui/AssetIcon';
import {
  STATUS_TEXT,
  type BuyNetwork,
  type BuyAsset,
  type BuyOptions,
  type BuyQuote,
  type BuySession,
  type BuyStatus,
} from '@/lib/buy/model';
export type CheckoutWindow = {
  opener: unknown;
  closed: boolean;
  close(): void;
  location: { replace(url: string): void };
};
export type BuyDriver = <T>(
  action: string,
  fields: Record<string, unknown>,
) => Promise<T>;
const messages: Record<string, string> = {
  BUY_UNAVAILABLE: 'Buy currently unavailable',
  PROVIDER_UNAVAILABLE:
    'Transak is temporarily unavailable. Please try again later.',
  QUOTE_UNAVAILABLE: 'Quote unavailable. Please try again.',
  UNSUPPORTED_PAIR: 'This asset and network are currently unavailable.',
  TRON_NOT_ENABLED: 'Enable Tron first',
  WALLET_UNAVAILABLE: 'Your wallet selection needs verification.',
  SESSION_EXPIRED: 'Session expired. Start a new Buy flow.',
  AMOUNT_LIMIT: 'Amount is outside the current provider limits.',
  UNAUTHORIZED: 'Sign in again to buy crypto.',
  ACCOUNT_CHANGED: 'Your wallet changed. Start a new Buy flow.',
};
export default function Buy({
  network,
  address,
  onClose,
  onRefresh,
}: {
  network: BuyNetwork;
  address: string;
  onClose(): void;
  onRefresh(): void;
}) {
  const { getAccessToken } = usePrivy();
  const driver = useCallback<BuyDriver>(
    async (action, fields) => {
      const token = await getAccessToken();
      if (!token) throw new Error('UNAUTHORIZED');
      const response = await fetch('/api/buy', {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, ...fields }),
      });
      const value = await response.json();
      if (!response.ok)
        throw new Error(value?.error?.code || 'PROVIDER_UNAVAILABLE');
      return value;
    },
    [getAccessToken],
  );
  return (
    <BuyPanel
      network={network}
      address={address}
      driver={driver}
      onClose={onClose}
      onRefresh={onRefresh}
    />
  );
}
export function BuyPanel({
  network,
  address,
  driver,
  onClose,
  onRefresh,
  openCheckout,
}: {
  network: BuyNetwork;
  address: string;
  driver: BuyDriver;
  onClose(): void;
  onRefresh(): void;
  openCheckout?(): CheckoutWindow | null;
}) {
  const [asset, setAsset] = useState<BuyAsset>('USDT');
  const [options, setOptions] = useState<BuyOptions>();
  const [method, setMethod] = useState('');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<BuyQuote>();
  const [flow, setFlow] = useState<string>();
  const [status, setStatus] = useState<BuyStatus>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const pending = useRef(false);
  const generation = useRef(0);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;
  const context =
    network === 'tron'
      ? 'Tron · TRC-20'
      : asset === 'ETH'
        ? 'Ethereum · Native ETH'
        : 'Ethereum · ERC-20';
  const friendly = (e: unknown) =>
    messages[e instanceof Error ? e.message : ''] ||
    'Secure checkout is unavailable. Please try again later.';
  useEffect(() => {
    const n = ++generation.current;
    setOptions(undefined);
    setQuote(undefined);
    setError('');
    setMethod('');
    driver<BuyOptions>('options', { network, asset })
      .then((value) => {
        if (generation.current !== n) return;
        if (value.address !== address) {
          setError(messages.ACCOUNT_CHANGED);
          return;
        }
        setOptions(value);
        setMethod(value.methods[0]?.id || '');
      })
      .catch((e) => {
        if (generation.current === n) setError(friendly(e));
      });
    return () => {
      generation.current = n + 1;
    };
  }, [network, asset, address, driver]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const checkStatus = useCallback(async () => {
    if (!flow || pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      const result = await driver<{ status: BuyStatus }>('status', {
        ticket: flow,
      });
      setStatus(result.status);
    } catch {
      setStatus('unavailable');
    } finally {
      onRefreshRef.current();
      pending.current = false;
      setBusy(false);
    }
  }, [driver, flow]);
  useEffect(() => {
    if (!flow) return;
    const returned = () => {
      if (document.visibilityState === 'visible') void checkStatus();
    };
    window.addEventListener('focus', returned);
    document.addEventListener('visibilitychange', returned);
    return () => {
      window.removeEventListener('focus', returned);
      document.removeEventListener('visibilitychange', returned);
    };
  }, [flow, checkStatus]);
  const payment = options?.methods.find((m) => m.id === method);
  const validAmount =
    /^(?:0|[1-9]\d{0,8})(?:\.\d{1,2})?$/.test(amount) &&
    Number(amount) > 0 &&
    !!payment &&
    Number(amount) >= payment.min &&
    Number(amount) <= payment.max;
  const expired = !!quote && now >= quote.expiresAt;
  const money = (value: number) =>
    new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(value);
  async function review() {
    if (!validAmount || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError('');
    const n = generation.current;
    try {
      const value = await driver<BuyQuote>('quote', {
        network,
        asset,
        amount,
        paymentMethod: method,
      });
      if (generation.current !== n) return;
      if (value.address !== address) throw new Error('ACCOUNT_CHANGED');
      setQuote(value);
    } catch (e) {
      if (generation.current === n) setError(friendly(e));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  async function launch() {
    if (!quote || expired || pending.current) return;
    // Open synchronously on the user gesture so mobile browsers do not block checkout.
    const tab = openCheckout
      ? openCheckout()
      : window.open('about:blank', '_blank');
    if (!tab) {
      setError(
        'Allow a new tab for secure Transak checkout, then try again.',
      );
      return;
    }
    const n = generation.current;
    tab.opener = null;
    pending.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await driver<BuySession>('session', {
        ticket: quote.ticket,
      });
      const url = new URL(result.widgetUrl);
      if (
        url.origin !== 'https://global-stg.transak.com' ||
        !url.searchParams.get('sessionId') ||
        result.expiresAt <= Date.now() ||
        tab.closed ||
        generation.current !== n
      )
        throw new Error('SESSION_EXPIRED');
      setFlow(result.ticket);
      setStatus('started');
      setQuote(undefined);
      tab.location.replace(result.widgetUrl); // URL is never saved in storage or rendered as a reusable link.
    } catch (e) {
      tab.close();
      setQuote(undefined);
      setError(friendly(e));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <Modal
      isOpen
      onClose={() => {
        if (!busy) {
          if (flow) onRefresh();
          onClose();
        }
      }}
      title={`Buy ${asset}`}
    >
      <div className="buy-sheet">
        <div className="buy-asset">
          <AssetIcon symbol={asset} />
          <div>
            <strong>
              {asset === 'USDT'
                ? 'Tether USD'
                : asset === 'USDC'
                  ? 'USD Coin'
                  : 'Ethereum'}
            </strong>
            <p>{context}</p>
          </div>
        </div>
        <div className="buy-destination">
          <span className="field-label">Destination · Your A3 wallet</span>
          <code>{address}</code>
        </div>
        {flow ? (
          <>
            <div className="buy-status" role="status">
              <h3>{STATUS_TEXT[status || 'started']}</h3>
              <p>
                {status === 'completed'
                  ? 'Provider confirmation is separate from on-chain activity. Your wallet updates when the transfer is indexed.'
                  : status === 'unavailable'
                    ? 'Order status is unavailable. Check Transak for confirmation; returning here does not confirm a payment.'
                    : 'Complete checkout in the Transak tab, then return here. Your wallet will refresh.'}
              </p>
            </div>
            <button
              className="btn-primary w-full"
              disabled={busy}
              onClick={checkStatus}
            >
              {busy ? 'Checking…' : 'Check status & refresh wallet'}
            </button>
            <p className="muted">
              Closing checkout does not necessarily cancel an order. Check
              Transak before starting another purchase.
            </p>
          </>
        ) : (
          <>
            {!quote && (
              <>
                <label className="field-label" htmlFor="buy-asset">
                  Asset
                </label>
                <select
                  id="buy-asset"
                  value={asset}
                  disabled={busy}
                  onChange={(e) => setAsset(e.target.value as BuyAsset)}
                >
                  {(network === 'tron'
                    ? ['USDT']
                    : ['USDT', 'ETH', 'USDC']
                  ).map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
                {options && (
                  <>
                    <label className="field-label" htmlFor="buy-payment">
                      Payment method
                    </label>
                    <select
                      id="buy-payment"
                      value={method}
                      disabled={busy}
                      onChange={(e) => setMethod(e.target.value)}
                    >
                      {options.methods.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                    <label className="field-label" htmlFor="buy-amount">
                      You pay · GBP
                    </label>
                    <input
                      id="buy-amount"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0.00"
                      value={amount}
                      disabled={busy}
                      aria-describedby="buy-limits"
                      onChange={(e) => setAmount(e.target.value)}
                    />
                    <p id="buy-limits" className="muted">
                      {payment &&
                        `Current provider limits: ${money(payment.min)}–${money(payment.max)}`}
                    </p>
                  </>
                )}
                {!options && !error && (
                  <p role="status">Checking Buy availability…</p>
                )}
                <button
                  className="btn-primary w-full"
                  disabled={!validAmount || busy}
                  onClick={review}
                >
                  {busy ? 'Getting quote…' : 'Review purchase'}
                </button>
              </>
            )}
            {quote && (
              <>
                <dl className="buy-review">
                  <div>
                    <dt>You pay</dt>
                    <dd>{money(Number(amount))}</dd>
                  </div>
                  <div>
                    <dt>You receive approximately</dt>
                    <dd>
                      {quote.cryptoAmount.toLocaleString('en-GB', {
                        maximumFractionDigits: 8,
                      })}{' '}
                      {asset}
                    </dd>
                  </div>
                  <div>
                    <dt>Provider fees included</dt>
                    <dd>{money(quote.totalFee)}</dd>
                  </div>
                </dl>
                <p className="muted">
                  Estimate for the UK market. Transak confirms your
                  eligibility, fees and final amount at checkout. No A3 fee
                  or spread.
                </p>
                {expired && (
                  <p role="status" className="notice">
                    Session expired. Request a new quote.
                  </p>
                )}
                <button
                  className="btn-primary w-full"
                  disabled={busy || expired}
                  onClick={launch}
                >
                  {busy
                    ? 'Opening secure checkout…'
                    : 'Continue to Transak'}
                </button>
                <button
                  className="btn-secondary w-full"
                  disabled={busy}
                  onClick={() => setQuote(undefined)}
                >
                  {expired ? 'Get a new quote' : 'Edit purchase'}
                </button>
              </>
            )}
          </>
        )}
        {error && (
          <p className="notice" role="alert">
            {error}
          </p>
        )}
        <p className="buy-provider">
          Powered by Transak
          <span>
            Secure checkout opens in a new tab. Identity and payment checks
            are handled by Transak.
          </span>
        </p>
        <button
          className="btn-ghost w-full"
          disabled={busy}
          onClick={() => {
            if (flow) onRefresh();
            onClose();
          }}
        >
          Return to wallet
        </button>
      </div>
    </Modal>
  );
}
