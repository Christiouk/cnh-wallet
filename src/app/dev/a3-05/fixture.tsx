'use client';
import { useMemo, useState } from 'react';
import { utils } from 'tronweb';
import { TronPanel } from '@/components/tron/TronWorkspace';
import {
  parseUsdt,
  TRON_USDT,
  tronHex,
  transferData,
  type SendQuote,
  type UnsignedTron,
} from '@/lib/tron/core';
import type { TronDriver } from '@/hooks/useTronWallet';
const owner = {
  did: 'did:privy:a3-browser-fixture',
  walletId: 'fixture-tron',
  address: 'TJRabPrwbZy45sbavfcjinPJC18kjpRTv8',
};
export default function Fixture() {
  const [network, setNetwork] = useState('tron');
  const [scenario, setScenario] = useState('ready');
  const [enabled, setEnabled] = useState(false);
  const [generation, setGeneration] = useState(0);
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
        if (scenario === 'rejected') throw new Error('Authorization cancelled');
        return '0x' + '1'.repeat(128);
      },
      api: async <T,>(
        action: string,
        fields: Record<string, unknown> = {},
      ): Promise<T> => {
        if (action === 'balances')
          return {
            trx:
              scenario === 'balance-error'
                ? { status: 'unavailable' }
                : {
                    status: 'ready',
                    units: scenario === 'resources' ? '0' : '200000000',
                  },
            usdt: { status: 'ready', units: '25000000' },
            activated: true,
          } as T;
        if (action === 'activity') {
          if (scenario === 'balance-error') throw new Error('unavailable');
          return [] as T;
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
                  type_url: 'type.googleapis.com/protocol.TriggerSmartContract',
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
    scenario === 'missing' && !enabled
      ? 'missing'
      : scenario === 'ambiguous'
        ? 'ambiguous'
        : 'ready';
  return (
    <>
      <aside className="p-3 bg-amber-950 text-amber-200 text-sm">
        Synthetic local fixture · No live Privy connection, wallets or transfers
      </aside>
      <div className="max-w-6xl mx-auto p-4 flex flex-wrap gap-4">
        <label>
          Network{' '}
          <select
            aria-label="Network"
            className="bg-surface-800 p-2"
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
          >
            <option value="ethereum">Ethereum</option>
            <option value="tron">Tron</option>
          </select>
        </label>
        <label>
          Fixture{' '}
          <select
            aria-label="Fixture scenario"
            className="bg-surface-800 p-2"
            value={scenario}
            onChange={(e) => {
              setScenario(e.target.value);
              setEnabled(false);
              setGeneration((n) => n + 1);
              sessionStorage.clear();
            }}
          >
            {[
              'ready',
              'missing',
              'ambiguous',
              'balance-error',
              'resources',
              'rejected',
              'pending',
              'failed',
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      {network === 'tron' ? (
        <TronPanel
          key={`${scenario}:${generation}:${enabled}`}
          status={status}
          owner={status === 'ready' ? owner : undefined}
          driver={driver}
          config={{ creation: true, send: true, reads: true }}
          prices={{
            USDT: { usd: 1, usd_24h_change: 0 },
            TRX: { usd: 0.32, usd_24h_change: 0 },
          }}
        />
      ) : (
        <main className="p-6">
          <h1>Ethereum fixture</h1>
          <p>0x1111111111111111111111111111111111111111</p>
          <p>ETH · USDT ERC-20 · USDC</p>
        </main>
      )}
    </>
  );
}
