'use client';
import { useMemo, useState } from 'react';
import { SwapPanel, type SwapDriver } from '@/components/swap/Swap';
import { ASSETS, type Intent, type QuoteView } from '@/lib/swap/core';
import { CURATED_TOKENS } from '@/lib/tokens';
import { parseUnits } from 'viem';
import WalletShell from '@/components/ui/WalletShell';
import ActionButtons from '@/components/ActionButtons';
import BalanceCard from '@/components/BalanceCard';
const address = '0x1111111111111111111111111111111111111111';
export default function Fixture() {
  const [network, setNetwork] = useState<'ethereum' | 'tron'>('ethereum');
  const [scenario, setScenario] = useState('ready');
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState(false);
  const [refreshes, setRefreshes] = useState(0);
  const driver = useMemo<SwapDriver>(() => {
    let view: QuoteView;
    let approved = false;
    let pendingApproval = false;
    let reset = scenario === 'usdt-reset';
    return {
      api: async <T,>(
        action: string,
        fields: Record<string, unknown> = {},
      ) => {
        if (scenario === 'loading' && action === 'price')
          return new Promise<T>(() => {});
        await new Promise((r) => setTimeout(r, 50));
        if (action === 'availability')
          return { enabled: scenario !== 'unavailable' } as T;
        if (scenario === 'provider-error')
          throw new Error('Swap provider unavailable');
        if (scenario === 'no-liquidity')
          throw new Error('No liquidity available');
        if (scenario === 'gas-error' && action !== 'price')
          throw new Error('Insufficient ETH for network gas');
        if (action === 'price') {
          const i = fields as Intent;
          const bought = parseUnits(
            i.buyAsset === 'ETH' ? '0.148' : '498.5',
            ASSETS[i.buyAsset].decimals,
          );
          view = {
            id: 'synthetic-only',
            intent: i,
            address,
            buyAmount: bought.toString(),
            minimum: ((bought * 99n) / 100n).toString(),
            networkCost: '1500000000000000',
            providerFee: '0',
            expiresAt:
              Date.now() + (scenario === 'expired' ? -2000 : 60000),
            approval:
              i.sellAsset === 'ETH' ? 'none' : reset ? 'reset' : 'approve',
            phase: 'price',
            balance: '1000000000',
          };
          return view as T;
        }
        if (action === 'prepare') {
          pendingApproval = view.intent.sellAsset !== 'ETH' && !approved;
          view = {
            ...view,
            phase: pendingApproval ? 'approval' : 'firm',
            approval: pendingApproval
              ? reset
                ? 'reset'
                : 'approve'
              : 'none',
            approvalAmount: reset
              ? '0'
              : parseUnits(
                  view.intent.amount,
                  ASSETS[view.intent.sellAsset].decimals,
                ).toString(),
            expiresAt: Date.now() + 30000,
          };
          return view as T;
        }
        if (action === 'authorize')
          return {
            transaction: {
              chainId: 1,
              from: address,
              to: address,
              data: '0x',
              value: '0',
              gas: '100000',
              gasPrice: '1',
              nonce: 0,
            },
            expiresAt: Date.now() + 30000,
          } as T;
        if (action === 'receipt') {
          if (scenario === 'pending') return { status: 'confirming' } as T;
          if (scenario === 'failed') return { status: 'failed' } as T;
          if (pendingApproval) {
            if (reset) reset = false;
            else approved = true;
            pendingApproval = false;
            return { status: 'approval-confirmed' } as T;
          }
          return { status: 'confirmed' } as T;
        }
        throw new Error('Fixture operation unsupported');
      },
      sign: async () => {
        await new Promise((r) =>
          setTimeout(r, scenario === 'signing' ? 3000 : 50),
        );
        if (scenario === 'rejected') throw new Error('User rejected');
        return '0x' + 'a'.repeat(64);
      },
    };
  }, [scenario]);
  const balances = CURATED_TOKENS.map((t) => ({
    ...t,
    balance: '1000000',
    formattedBalance:
      scenario === 'large'
        ? '999,999,999.123456'
        : scenario === 'small'
          ? '0.000001'
          : '2,500.00',
  }));
  return (
    <WalletShell
      network={network}
      onNetworkChange={(n) => {
        setNetwork(n);
        setOpened(false);
        setOpen(false);
      }}
      view="wallet"
      onViewChange={() => {}}
      account={{ ethereum: address }}
      onLogout={() => {}}
    >
      <div className="page-heading">
        <div>
          <p className="eyebrow">LOCAL SYNTHETIC FIXTURE · NO SIGNING</p>
          <h1>Your wallet.</h1>
        </div>
      </div>
      <label htmlFor="scenario">Swap scenario</label>
      <select
        id="scenario"
        value={scenario}
        onChange={(e) => {
          setScenario(e.target.value);
          setOpened(false);
          setOpen(false);
        }}
      >
        {[
          'ready',
          'unavailable',
          'large',
          'small',
          'loading',
          'expired',
          'usdt-reset',
          'provider-error',
          'no-liquidity',
          'gas-error',
          'signing',
          'pending',
          'rejected',
          'failed',
        ].map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      <BalanceCard
        network={network === 'ethereum' ? 'Ethereum' : 'Tron'}
        totalUsdValue={0}
        isLoading={false}
      />
      <ActionButtons
        disabled={false}
        onReceive={() => {}}
        onSend={() => {}}
        onBuy={() => {}}
        onSwap={
          network === 'ethereum'
            ? () => {
                setOpened(true);
                setOpen(true);
              }
            : undefined
        }
      />
      <p>
        Ethereum refreshes: <span data-refreshes>{refreshes}</span>
      </p>
      {opened && (
        <SwapPanel
          key={scenario}
          isOpen={open}
          address={address}
          balances={balances}
          driver={driver}
          onClose={() => setOpen(false)}
          onRefresh={() => setRefreshes((n) => n + 1)}
        />
      )}
    </WalletShell>
  );
}
