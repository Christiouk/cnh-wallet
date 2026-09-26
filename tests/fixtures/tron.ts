import { utils } from 'tronweb';
import {
  TRON_USDT,
  tronHex,
  transferData,
  type TronIdentity,
  type SendIntent,
  type UnsignedTron,
} from '../../src/lib/tron/core';
// Public deterministic fixture addresses only. Never connected to a live signer/provider.
export const OWNER: TronIdentity = {
  did: 'did:privy:a3-synthetic',
  walletId: 'synthetic-tron',
  address: 'TJRabPrwbZy45sbavfcjinPJC18kjpRTv8',
};
export const RECIPIENT = 'TMVQGm1qAQYVdetCeGRRkTWYYrLXuHK2HC';
export function fixtureTransaction(
  owner = OWNER.address,
  recipient = RECIPIENT,
  units = '1250000',
  feeLimit = 12_000_000,
): UnsignedTron {
  const now = Date.now();
  const tx = {
    raw_data: {
      contract: [
        {
          type: 'TriggerSmartContract',
          parameter: {
            type_url: 'type.googleapis.com/protocol.TriggerSmartContract',
            value: {
              owner_address: tronHex(owner),
              contract_address: tronHex(TRON_USDT.contract),
              data: transferData(recipient, units),
            },
          },
        },
      ],
      ref_block_bytes: '1234',
      ref_block_hash: '1234567890abcdef',
      timestamp: now,
      expiration: now + 180_000,
      fee_limit: feeLimit,
    },
  };
  const pb = utils.transaction.txJsonToPb(tx);
  return {
    ...tx,
    txID: utils.transaction.txPbToTxID(pb).replace(/^0x/, ''),
    raw_data_hex: utils.transaction.txPbToRawDataHex(pb),
  };
}
export function fixtureIntent(): SendIntent {
  const transaction = fixtureTransaction();
  return {
    ...OWNER,
    recipient: RECIPIENT,
    units: '1250000',
    feeLimit: 12_000_000,
    bandwidthFee: 1_000_000,
    network: 'tron:mainnet',
    expires: transaction.raw_data.expiration,
    transaction,
  };
}
export const uint = (value: number | bigint) => ({
  result: { result: true },
  constant_result: [BigInt(value).toString(16).padStart(64, '0')],
});
