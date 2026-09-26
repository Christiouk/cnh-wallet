'use client';
import { useCallback, useEffect, useState } from 'react';
import { useTronWallet, type TronDriver } from '@/hooks/useTronWallet';
import { usePrices, type PricesMap } from '@/hooks/usePrices';
import {
  displayUnits,
  tronExplorer,
  type TronBalances,
  type TronActivity,
  type TronIdentity,
} from '@/lib/tron/core';
import TronReceive from './TronReceive';
import TronSend from './TronSend';
import Modal from '../Modal';
export default function TronWorkspace() {
  const { userId, selection, driver } = useTronWallet();
  const { prices } = usePrices();
  const [config, setConfig] = useState({
    creation: false,
    send: false,
    reads: false,
  });
  useEffect(() => {
    let active = true;
    fetch('/api/tron', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((value) => {
        if (active) setConfig(value);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return (
    <TronPanel
      key={`${userId}:${selection.status === 'ready' ? selection.wallet.address : selection.status}`}
      status={selection.status}
      owner={
        selection.status === 'ready' && userId && selection.wallet.id
          ? {
              did: userId,
              walletId: selection.wallet.id,
              address: selection.wallet.address,
            }
          : undefined
      }
      driver={driver}
      config={config}
      prices={prices}
    />
  );
}
export function TronPanel({
  status,
  owner,
  driver,
  config,
  prices,
}: {
  prices: PricesMap;
  status: string;
  owner?: TronIdentity;
  driver: TronDriver;
  config: { creation: boolean; send: boolean; reads: boolean };
}) {
  const [setup, setSetup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<'send' | 'receive' | null>(null);
  const [balances, setBalances] = useState<TronBalances>();
  const [activity, setActivity] = useState<TronActivity[] | null>();
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((n) => n + 1), []);
  const ownerDid = owner?.did,
    ownerId = owner?.walletId,
    ownerAddress = owner?.address;
  useEffect(() => {
    let active = true;
    setBalances(undefined);
    setActivity(undefined);
    if (!ownerAddress || !config.reads) {
      if (ownerAddress) {
        setBalances({
          usdt: { status: 'unavailable' },
          trx: { status: 'unavailable' },
          activated: null,
        });
        setActivity(null);
      }
      return;
    }
    driver
      .api<TronBalances>('balances')
      .then((value) => {
        if (active) setBalances(value);
      })
      .catch(() => {
        if (active)
          setBalances({
            usdt: { status: 'unavailable' },
            trx: { status: 'unavailable' },
            activated: null,
          });
      });
    driver
      .api<TronActivity[]>('activity')
      .then((value) => {
        if (active) setActivity(value);
      })
      .catch(() => {
        if (active) setActivity(null);
      });
    return () => {
      active = false;
    };
  }, [ownerDid, ownerId, ownerAddress, config.reads, driver, revision]); // Identity primitives keep reads scoped to one account.
  const value = (asset: 'usdt' | 'trx') => {
    const balance = balances?.[asset];
    return !balance
      ? 'Loading…'
      : balance.status === 'unavailable'
        ? 'Unavailable'
        : displayUnits(balance.units);
  };
  const usd = (asset: 'usdt' | 'trx') => {
    const balance = balances?.[asset];
    const price = prices[asset.toUpperCase()]?.usd;
    if (
      balance?.status !== 'ready' ||
      typeof price !== 'number' ||
      !Number.isFinite(price) ||
      price <= 0
    )
      return undefined;
    return Number(displayUnits(balance.units)) * price;
  };
  const usdtUsd = usd('usdt'),
    trxUsd = usd('trx');
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h2 className="text-xl font-semibold">Tron wallet</h2>
        {owner && (
          <button className="btn-ghost" onClick={refresh}>
            Refresh Tron
          </button>
        )}
      </div>
      {status === 'missing' && (
        <section className="glass-card p-6 space-y-4">
          <h3 className="text-lg">Enable Tron</h3>
          <p>Add a Tron address to your existing A3 account for USDT TRC-20.</p>
          <p className="text-sm text-surface-400">
            Your existing Ethereum wallet stays the same.
          </p>
          <button
            className="btn-primary"
            disabled={!config.creation}
            onClick={() => setSetup(true)}
          >
            Enable Tron
          </button>
          {!config.creation && (
            <p role="status">Tron setup awaits live validation.</p>
          )}
        </section>
      )}
      {status !== 'ready' && status !== 'missing' && (
        <p role="status">
          {status === 'loading'
            ? 'Loading your Tron wallet…'
            : status === 'ambiguous'
              ? 'Multiple embedded Tron wallets found. Selection requires verification; sending is blocked.'
              : 'Tron wallet unavailable. Refresh or sign in again.'}
        </p>
      )}
      {owner && (
        <>
          <section className="glass-card p-6 space-y-4">
            <p className="text-surface-400">Tron portfolio</p>
            <p className="text-3xl font-bold">
              {usdtUsd !== undefined && trxUsd !== undefined
                ? `≈ $${(usdtUsd + trxUsd).toFixed(2)}`
                : 'USD valuation unavailable'}
            </p>
            <p className="font-mono text-xs break-all">{owner.address}</p>
            <div className="flex gap-3">
              <button
                className="btn-primary"
                onClick={() => setModal('receive')}
              >
                Receive
              </button>
              <button
                className="btn-secondary"
                disabled={!config.send || balances?.usdt.status !== 'ready'}
                onClick={() => setModal('send')}
              >
                Send
              </button>
            </div>
            {!config.send && (
              <p className="text-sm text-surface-400">
                Tron sending awaits live validation.
              </p>
            )}
          </section>
          <section
            className="glass-card p-6 space-y-4"
            aria-label="Tron assets"
          >
            <div className="flex justify-between gap-4">
              <span>
                USDT <small>TRC-20</small>
              </span>
              <div className="text-right">
                <p>{value('usdt')} USDT</p>
                <small>
                  {usdtUsd === undefined
                    ? 'USD value unavailable'
                    : `≈ $${usdtUsd.toFixed(2)}`}
                </small>
              </div>
            </div>
            <div className="flex justify-between gap-4">
              <span>TRX</span>
              <div className="text-right">
                <p>{value('trx')} TRX</p>
                <small>
                  {trxUsd === undefined
                    ? 'USD value unavailable'
                    : `≈ $${trxUsd.toFixed(2)}`}
                </small>
              </div>
            </div>
            <p className="text-sm text-surface-400">
              TRX may be used for Tron network resources. A wallet holding only
              USDT may need TRX before sending.
            </p>
            {balances?.activated === false && (
              <p className="text-amber-300">
                Network resource required. This address has not been activated
                on Tron.
              </p>
            )}
          </section>
          <section className="glass-card p-6 space-y-4">
            <h3 className="font-semibold">Tron activity · USDT TRC-20</h3>
            {activity === undefined ? (
              <p>Loading activity…</p>
            ) : activity === null ? (
              <p>Activity temporarily unavailable</p>
            ) : activity.length === 0 ? (
              <p>No recent USDT transfers found by the indexer.</p>
            ) : (
              <ul className="space-y-4">
                {activity.map((row, index) => (
                  <li key={`${row.hash}:${index}`} className="text-sm">
                    <a
                      href={tronExplorer('transaction', row.hash)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-300 underline"
                    >
                      {row.from === owner.address ? 'Sent' : 'Received'}{' '}
                      {displayUnits(row.units)} USDT
                    </a>
                    <p>
                      {new Date(row.timestamp).toLocaleString()} · Indexed
                      confirmed
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-surface-400">
              Latest 20 indexed transfers. Indexing may lag; submitted transfers
              use separate network confirmation checks.
            </p>
          </section>
          {modal === 'receive' && (
            <TronReceive
              address={owner.address}
              onClose={() => setModal(null)}
            />
          )}
          {modal === 'send' && (
            <TronSend
              owner={owner}
              driver={driver}
              onClose={() => setModal(null)}
              onConfirmed={refresh}
            />
          )}
        </>
      )}
      {error && (
        <p role="alert" className="text-amber-300">
          {error}
        </p>
      )}
      <Modal
        isOpen={setup}
        onClose={() => {
          if (!busy) setSetup(false);
        }}
        title="Enable Tron"
      >
        <div className="space-y-4">
          <p>Add a Tron address to your existing A3 account for USDT TRC-20.</p>
          <p>
            Your current account and Ethereum wallet stay the same. Tron sends
            may need TRX for network costs.
          </p>
          <button
            className="btn-primary w-full"
            disabled={busy}
            onClick={async () => {
              if (busy) return;
              setBusy(true);
              setError('');
              try {
                await driver.enable();
                setSetup(false);
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : 'Tron setup unavailable',
                );
                setSetup(false);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? 'Setting up Tron…' : 'Confirm Enable Tron'}
          </button>
        </div>
      </Modal>
    </main>
  );
}
