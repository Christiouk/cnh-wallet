'use client';
import { useMemo, useState } from 'react';
import { BuyPanel, type BuyDriver } from '@/components/buy/Buy';
import WalletShell from '@/components/ui/WalletShell';
import ActionButtons from '@/components/ActionButtons';
import BalanceCard from '@/components/BalanceCard';
import type { BuyNetwork } from '@/lib/buy/model';
const addresses = {
  ethereum: '0x1111111111111111111111111111111111111111',
  tron: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
};
export default function Fixture() {
  const [network, setNetwork] = useState<BuyNetwork>('tron');
  const [scenario, setScenario] = useState('ready');
  const [open, setOpen] = useState(false);
  const [refreshes, setRefreshes] = useState(0);
  const driver = useMemo<BuyDriver>(
    () =>
      async <T,>(action: string) => {
        await new Promise((r) => setTimeout(r, 80));
        if (scenario === 'unavailable') throw new Error('BUY_UNAVAILABLE');
        if (scenario === 'provider-error')
          throw new Error('PROVIDER_UNAVAILABLE');
        if (scenario === 'missing-tron')
          throw new Error('TRON_NOT_ENABLED');
        if (action === 'options')
          return {
            address: addresses[network],
            methods: [
              {
                id: 'gbp_bank_transfer',
                name: 'Bank transfer',
                min: 25,
                max: 10000,
              },
              {
                id: 'credit_debit_card',
                name: 'Credit or debit card',
                min: 30,
                max: 5000,
              },
            ],
          } as T;
        if (action === 'quote') {
          if (scenario === 'quote-error')
            throw new Error('QUOTE_UNAVAILABLE');
          return {
            address: addresses[network],
            ticket: 'synthetic-quote',
            expiresAt: Date.now() + (scenario === 'expired' ? -1 : 120000),
            cryptoAmount: 620.12,
            totalFee: 8.2,
          } as T;
        }
        if (action === 'session')
          return {
            ticket: 'synthetic-flow',
            expiresAt: Date.now() + 300000,
            widgetUrl:
              'https://global-stg.transak.com/?sessionId=synthetic-never-opened',
          } as T;
        if (action === 'status')
          return {
            status: [
              'processing',
              'completed',
              'failed',
              'cancelled',
            ].includes(scenario)
              ? scenario
              : 'unavailable',
          } as T;
        throw new Error('PROVIDER_UNAVAILABLE');
      },
    [network, scenario],
  );
  return (
    <WalletShell
      network={network}
      onNetworkChange={(n) => {
        setNetwork(n);
        setOpen(false);
      }}
      view="wallet"
      onViewChange={() => {}}
      account={{ ethereum: addresses.ethereum, tron: addresses.tron }}
      onLogout={() => {}}
    >
      <div className="page-heading">
        <div>
          <p className="eyebrow">LOCAL FIXTURE · SYNTHETIC DATA ONLY</p>
          <h1>Your wallet.</h1>
        </div>
      </div>
      <label htmlFor="scenario">Buy scenario</label>
      <select
        id="scenario"
        value={scenario}
        onChange={(e) => {
          setScenario(e.target.value);
          setOpen(false);
        }}
      >
        {[
          'ready',
          'unavailable',
          'provider-error',
          'missing-tron',
          'quote-error',
          'expired',
          'processing',
          'completed',
          'cancelled',
          'failed',
        ].map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      <BalanceCard
        network={network === 'tron' ? 'Tron' : 'Ethereum'}
        totalUsdValue={0}
        isLoading={false}
      />
      <ActionButtons
        disabled={false}
        onReceive={() => {}}
        onSend={() => {}}
        onBuy={() => setOpen(true)}
      />
      <p>
        Selected network refreshes: <span data-refreshes>{refreshes}</span>
      </p>
      {open && (
        <BuyPanel
          key={`${network}:${scenario}`}
          network={network}
          address={addresses[network]}
          driver={driver}
          onClose={() => setOpen(false)}
          onRefresh={() => setRefreshes((n) => n + 1)}
          openCheckout={() => ({
            opener: null,
            closed: false,
            close() {},
            location: { replace() {} },
          })}
        />
      )}
    </WalletShell>
  );
}
