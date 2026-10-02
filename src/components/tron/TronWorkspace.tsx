'use client';
import AssetIcon from '../ui/AssetIcon';
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
import BalanceCard from '../BalanceCard';
import ActionButtons from '../ActionButtons';
import { AssetList } from '../TokenList';
import ActivityView from '../ui/ActivityView';
import type { WalletView } from '../ui/WalletShell';
import { friendlyError } from '../ui/TransferStatus';
export default function TronWorkspace({
  view = 'wallet',
}: {
  view?: WalletView;
}) {
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
      view={view}
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
  view = 'wallet',
  status,
  owner,
  driver,
  config,
  prices,
  renderBuy,
}: {
  renderBuy?(close: () => void, refresh: () => void): React.ReactNode;
  prices: PricesMap;
  view?: WalletView;
  status: string;
  owner?: TronIdentity;
  driver: TronDriver;
  config: { creation: boolean; send: boolean; reads: boolean };
}) {
  const [setup, setSetup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<'send' | 'receive' | 'buy' | null>(
    null,
  );
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
    <div className="tron-workspace">
      <div className="page-heading">
        <div>
          <p className="eyebrow">A3 WALLET / TRON</p>
          <h1>{view === 'activity' ? 'Your activity.' : 'Your wallet.'}</h1>
        </div>
        {owner && (
          <button className="btn-ghost" onClick={refresh}>
            Refresh Tron <span aria-hidden>↻</span>
          </button>
        )}
      </div>
      {status === 'missing' && (
        <section className="setup-panel">
          <span className="setup-mark" aria-hidden>
            <AssetIcon symbol="TRX" size={42} />
          </span>
          <p className="eyebrow">A NEW NETWORK. YOUR SAME ACCOUNT.</p>
          <h2>Add Tron to A3.</h2>
          <p>Receive and send USDT TRC-20 with a compatible Tron address.</p>
          <p>
            Add a Tron address to your existing A3 account for USDT TRC-20.
          </p>
          <p className="muted">
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
            <p role="status" className="notice">
              Tron setup awaits live validation.
            </p>
          )}
        </section>
      )}
      {status !== 'ready' && status !== 'missing' && (
        <p role="status" className="empty-state">
          {status === 'loading'
            ? 'Loading your Tron wallet…'
            : status === 'ambiguous'
              ? 'Multiple embedded Tron wallets found. Selection requires verification; sending is blocked.'
              : 'Tron wallet unavailable. Refresh or sign in again.'}
        </p>
      )}
      {owner && (
        <>
          <div
            className={
              view === 'wallet' ? 'portfolio-layout' : 'activity-page'
            }
          >
            {view === 'wallet' && (
              <div className="portfolio-primary">
                <BalanceCard
                  network="Tron"
                  totalUsdValue={
                    usdtUsd !== undefined && trxUsd !== undefined
                      ? usdtUsd + trxUsd
                      : undefined
                  }
                  isLoading={!balances}
                  unavailable={
                    balances?.usdt.status === 'unavailable' ||
                    balances?.trx.status === 'unavailable'
                  }
                />
                <ActionButtons
                  onReceive={() => setModal('receive')}
                  onBuy={renderBuy ? () => setModal('buy') : undefined}
                  onSend={() => setModal('send')}
                  disabled={false}
                  sendDisabled={
                    !config.send || balances?.usdt.status !== 'ready'
                  }
                />
                {!config.send && (
                  <p role="status" className="notice">
                    Tron sending awaits live validation.
                  </p>
                )}
                <AssetList
                  network="Tron"
                  rows={[
                    {
                      symbol: 'USDT',
                      name: 'Tether USD',
                      standard: 'TRC-20',
                      amount: value('usdt'),
                      usd: usdtUsd,
                    },
                    {
                      symbol: 'TRX',
                      name: 'Tron',
                      standard: 'Network resources',
                      amount: value('trx'),
                      usd: trxUsd,
                    },
                  ]}
                />
                {balances?.activated === false && (
                  <p className="notice">
                    Network resource required. This address has not been
                    activated on Tron.
                  </p>
                )}
                <p className="portfolio-footnote">
                  USDT on Tron.
                  <br />
                  TRX may be needed for network resources when you send.
                </p>
              </div>
            )}
            <aside className="portfolio-secondary">
              <ActivityView
                network="Tron"
                state={
                  activity === undefined
                    ? 'loading'
                    : activity === null
                      ? 'unavailable'
                      : 'ready'
                }
                rows={(activity || []).map((row) => ({
                  hash: row.hash,
                  direction:
                    row.from === owner.address ? 'Sent' : 'Received',
                  amount: displayUnits(row.units),
                  asset: 'USDT',
                  timestamp: row.timestamp,
                  status: 'Indexed confirmed',
                  explorer: tronExplorer('transaction', row.hash),
                }))}
                limit={view === 'wallet' ? 5 : undefined}
                onRefresh={refresh}
                note="USDT TRC-20 only. Latest 20 indexed transfers. Indexing may lag; submitted transfers use separate network confirmation checks."
              />
              {view === 'wallet' && (
                <div className="network-context">
                  <p className="eyebrow">YOUR NETWORK</p>
                  <h3>Tron</h3>
                  <p>
                    For USDT, choose TRON / TRC-20 at the sending wallet or
                    exchange.
                  </p>
                  <span>No A3 transfer fee. Network costs use TRX.</span>
                </div>
              )}
            </aside>
          </div>
          {modal === 'buy' && renderBuy?.(() => setModal(null), refresh)}
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
              availableBalance={
                balances?.usdt.status === 'ready'
                  ? displayUnits(balances.usdt.units)
                  : undefined
              }
              onClose={() => setModal(null)}
              onConfirmed={refresh}
            />
          )}
        </>
      )}
      {error && (
        <p role="alert" className="text-amber-300">
          {friendlyError(error)}
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
          <p>
            Add a Tron address to your existing A3 account for USDT TRC-20.
          </p>
          <p>
            Your current account and Ethereum wallet stay the same. Tron
            sends may need TRX for network costs.
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
    </div>
  );
}
