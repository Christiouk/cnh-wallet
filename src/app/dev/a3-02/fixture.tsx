'use client';
import { useMemo, useState } from 'react';
import { TronWeb, utils } from 'tronweb';
import WalletShell, { type WalletView } from '@/components/ui/WalletShell';
import { EthereumPanel } from '@/components/Dashboard';
import { BuyPanel, type BuyDriver } from '@/components/buy/Buy';
import { SwapPanel, type SwapDriver } from '@/components/swap/Swap';
import { EthereumSend } from '@/components/SendModal';
import { LoginView } from '@/components/LoginScreen';
import LoadingScreen from '@/components/LoadingScreen';
import ActivityView from '@/components/ui/ActivityView';
import { TronPanel } from '@/components/tron/TronWorkspace';
import { CURATED_TOKENS } from '@/lib/tokens';
import type { A3Network } from '@/lib/wallet/networks';
import {
  parseUsdt,
  TRON_USDT,
  tronHex,
  transferData,
  type SendQuote,
  type UnsignedTron,
} from '@/lib/tron/core';
import type { TronDriver } from '@/hooks/useTronWallet';
const evmAddress = '0x1111111111111111111111111111111111111111';
const owner = {
  did: 'did:privy:a3-ui-synthetic',
  walletId: 'synthetic-tron',
  address: TronWeb.address.fromHex('41' + 'a1'.repeat(20)),
};
const tronRecipient = TronWeb.address.fromHex('41' + 'b2'.repeat(20));
const hash = '0x' + 'a'.repeat(64);
const prices = {
  ETH: { usd: 3200, usd_24h_change: 0 },
  USDT: { usd: 1, usd_24h_change: 0 },
  USDC: { usd: 1, usd_24h_change: 0 },
  TRX: { usd: 0.32, usd_24h_change: 0 },
};
const gatedBuy: BuyDriver = async () => {
  throw new Error('BUY_UNAVAILABLE');
};
const gatedSwap: SwapDriver = {
  api: async <T,>() => ({ enabled: false }) as T,
  sign: async () => {
    throw new Error('Synthetic fixture cannot sign');
  },
};
export default function Fixture() {
  const [network, setNetwork] = useState<A3Network>('ethereum');
  const [view, setView] = useState<WalletView>('wallet');
  const [scenario, setScenario] = useState('mixed');
  const [enabled, setEnabled] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [notice, setNotice] = useState('');
  const driver = useMemo<TronDriver>(() => {
    let confirms = 0;
    return {
      current: () => owner,
      enable: async () => {
        await new Promise((r) => setTimeout(r, 500));
        setEnabled(true);
      },
      sign: async () => {
        await new Promise((r) => setTimeout(r, 1800));
        if (scenario === 'rejected')
          throw new Error('Authorization cancelled');
        return '0x' + '1'.repeat(128);
      },
      api: async <T,>(
        action: string,
        fields: Record<string, unknown> = {},
      ): Promise<T> => {
        if (scenario === 'loading') return new Promise<T>(() => {});
        if (action === 'balances')
          return {
            trx:
              scenario === 'unavailable'
                ? { status: 'unavailable' }
                : {
                    status: 'ready',
                    units:
                      scenario === 'resources'
                        ? '0'
                        : scenario === 'zero'
                          ? '0'
                          : scenario === 'small'
                            ? '1'
                            : '18000000',
                  },
            usdt: {
              status: 'ready',
              units:
                scenario === 'zero'
                  ? '0'
                  : scenario === 'large'
                    ? '987654321123456'
                    : scenario === 'small'
                      ? '1'
                      : '4850000000',
            },
            activated: true,
          } as T;
        if (action === 'activity') {
          if (scenario === 'unavailable') throw new Error('unavailable');
          return (
            scenario === 'zero'
              ? []
              : [
                  {
                    hash: 'b'.repeat(64),
                    from: tronRecipient,
                    to: owner.address,
                    units: '25000000',
                    timestamp: Date.UTC(2026, 8, 25, 10, 30),
                  },
                ]
          ) as T;
        }
        if (action === 'prepare') {
          if (scenario === 'resources')
            throw new Error(
              'Network resource required. Fund this Tron address with TRX before sending.',
            );
          const recipient = String(fields.recipient),
            units = parseUsdt(String(fields.amount)).toString(),
            now = Date.now();
          const raw_data = {
            contract: [
              {
                type: 'TriggerSmartContract',
                parameter: {
                  type_url:
                    'type.googleapis.com/protocol.TriggerSmartContract',
                  value: {
                    owner_address: tronHex(owner.address),
                    contract_address: tronHex(TRON_USDT.contract),
                    data: transferData(recipient, units),
                  },
                },
              },
            ],
            ref_block_bytes: '1234',
            ref_block_hash: '1234567890abcdef',
            timestamp: now,
            expiration: now + 180000,
            fee_limit: 12000000,
          };
          const pb = utils.transaction.txJsonToPb({ raw_data });
          const transaction: UnsignedTron = {
            raw_data,
            txID: utils.transaction.txPbToTxID(pb).replace(/^0x/, ''),
            raw_data_hex: utils.transaction.txPbToRawDataHex(pb),
          };
          return {
            intent: {
              ...owner,
              recipient,
              units,
              feeLimit: 12000000,
              bandwidthFee: 1000000,
              network: 'tron:mainnet',
              expires: raw_data.expiration,
              transaction,
            },
            ticket: 'local-fixture-no-authority',
            applicationFee: '0',
            energy: 120000,
            bandwidth: 1000,
          } as SendQuote as T;
        }
        if (action === 'broadcast') {
          await new Promise((r) => setTimeout(r, 1600));
          return { status: 'submitted' } as T;
        }
        if (action === 'confirm')
          return {
            status:
              ++confirms < 2 || scenario === 'pending'
                ? 'pending'
                : scenario === 'failed'
                  ? 'failed'
                  : 'confirmed',
          } as T;
        throw new Error('Unsupported fixture action');
      },
    };
  }, [scenario]);

  const status =
    (scenario === 'missing' && !enabled) || scenario === 'gated'
      ? 'missing'
      : 'ready';
  const tokens = CURATED_TOKENS.map((token, index) => ({
    ...token,
    balance:
      scenario === 'zero'
        ? '0'
        : scenario === 'small'
          ? token.symbol === 'ETH'
            ? '1000000000000'
            : '1'
          : scenario === 'large' && token.symbol === 'USDT'
            ? '987654321123456'
            : ['1240000000000000000', '4850000000', '500000000'][index],
    formattedBalance: '',
  }));
  const eth = useMemo(() => {
    let confirmations = 0;
    return {
      read: async (input: object) => {
        const operation = input as { action: string };
        await new Promise((r) => setTimeout(r, 300));
        if (operation.action === 'preview') {
          if (scenario === 'zero')
            throw new Error('Insufficient balance for this transfer');
          if (scenario === 'unavailable')
            throw new Error('Unable to load balances. Please try again.');
          return { estimatedNetworkCost: '420000000000000', chainId: 1 };
        }
        return {
          status:
            scenario === 'pending' || ++confirmations < 2
              ? 'confirming'
              : scenario === 'failed'
                ? 'failed'
                : 'confirmed',
        };
      },
      sign: async () => {
        await new Promise((r) => setTimeout(r, 1000));
        if (scenario === 'rejected') throw new Error('Fixture rejected');
        return { hash };
      },
    };
  }, [scenario]);
  const reset = (value: string) => {
    setScenario(value);
    setEnabled(false);
    setGeneration((n) => n + 1);
    setView('wallet');
    setNotice('');
    sessionStorage.removeItem(
      `a3:tron-pending:${owner.did}:${owner.walletId}:${owner.address}`,
    );
  };
  return (
    <>
      <aside
        className="fixture-toolbar"
        aria-label="Local visual test controls"
      >
        <span>Synthetic local preview · no live accounts or transfers</span>
        <label>
          Fixture
          <select
            aria-label="Fixture scenario"
            value={scenario}
            onChange={(e) => reset(e.target.value)}
          >
            {[
              'mixed',
              'zero',
              'loading',
              'unavailable',
              'large',
              'small',
              'missing',
              'gated',
              'resources',
              'pending',
              'confirmed',
              'failed',
              'rejected',
              'login',
              'auth-loading',
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <span role="status">{notice}</span>
      </aside>
      {scenario === 'login' ? (
        <LoginView
          onEmail={() => setNotice('Email sign-in callback — fixture only')}
          onApple={() => setNotice('Apple sign-in callback — fixture only')}
          onDevice={() =>
            setNotice('Face ID / Touch ID sign-in callback — fixture only')
          }
        />
      ) : scenario === 'auth-loading' ? (
        <LoadingScreen />
      ) : (
        <WalletShell
          network={network}
          onNetworkChange={(n) => {
            setNetwork(n);
            setView('wallet');
          }}
          view={view}
          onViewChange={setView}
          account={{
            email:
              scenario === 'large'
                ? 'a.very.long.synthetic.account.identity.for.layout.testing@example.test'
                : 'hello@example.test',
            ethereum: evmAddress,
            tron: status === 'ready' ? owner.address : undefined,
          }}
          onLogout={() => reset('login')}
        >
          {network === 'ethereum' ? (
            <EthereumPanel
              key={`eth:${generation}`}
              view={view}
              walletAddress={evmAddress}
              tokens={tokens}
              prices={prices}
              loading={scenario === 'loading'}
              unavailable={scenario === 'unavailable'}
              error={
                scenario === 'unavailable'
                  ? 'Unable to load balances. Please try again.'
                  : undefined
              }
              onRefresh={() => setGeneration((n) => n + 1)}
              activity={
                <ActivityView
                  network="Ethereum"
                  state={
                    scenario === 'loading'
                      ? 'loading'
                      : scenario === 'unavailable'
                        ? 'unavailable'
                        : 'ready'
                  }
                  rows={
                    scenario === 'zero'
                      ? []
                      : [
                          {
                            hash,
                            direction: 'Received',
                            amount: '0.24',
                            asset: 'ETH',
                            timestamp: Date.UTC(2026, 8, 25, 10, 30),
                            status: 'confirmed',
                            explorer: `https://etherscan.io/tx/${hash}`,
                          },
                          {
                            hash: '0x' + 'b'.repeat(64),
                            direction: 'Sent',
                            amount: '0.08',
                            asset: 'ETH',
                            timestamp: Date.UTC(2026, 8, 24, 14, 15),
                            status: 'confirmed',
                            explorer: `https://etherscan.io/tx/0x${'b'.repeat(64)}`,
                          },
                        ]
                  }
                  onRefresh={() => {}}
                  limit={view === 'wallet' ? 5 : undefined}
                  note="Latest 25 normal Ethereum transactions. Token transfers and internal transfers are not indexed. Contract activity may have no determinable asset or amount."
                />
              }
              renderBuy={(close) => (
                <BuyPanel
                  network="ethereum"
                  address={evmAddress}
                  driver={gatedBuy}
                  onClose={close}
                  onRefresh={() => {}}
                />
              )}
              renderSwap={(open, close) => (
                <SwapPanel
                  isOpen={open}
                  address={evmAddress}
                  balances={tokens}
                  driver={gatedSwap}
                  onClose={close}
                  onRefresh={() => {}}
                />
              )}
              renderSend={(open, close) => (
                <EthereumSend
                  isOpen={open}
                  onClose={close}
                  sender={evmAddress}
                  identity="synthetic-ethereum"
                  balances={tokens}
                  read={eth.read}
                  sendTransaction={eth.sign}
                />
              )}
            />
          ) : (
            <TronPanel
              key={`tron:${generation}:${enabled}`}
              status={status}
              owner={status === 'ready' ? owner : undefined}
              driver={driver}
              renderBuy={(close) => (
                <BuyPanel
                  network="tron"
                  address={owner.address}
                  driver={gatedBuy}
                  onClose={close}
                  onRefresh={() => {}}
                />
              )}
              config={{
                creation: scenario !== 'gated',
                send: scenario !== 'gated',
                reads: true,
              }}
              prices={prices}
              view={view}
            />
          )}
        </WalletShell>
      )}
      <span hidden id="synthetic-tron-recipient">
        {tronRecipient}
      </span>
    </>
  );
}
