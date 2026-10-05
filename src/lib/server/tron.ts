import 'server-only';
import { PrivyClient } from '@privy-io/node';
import { TronWeb } from 'tronweb';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { ApiError, jsonFetch } from './http';
import {
  TRON_USDT,
  tronHex,
  validTronAddress,
  validateTransaction,
  type TronIdentity,
  type SendIntent,
} from '../tron/core';
import { callPayload, type TronTransport } from '../tron/provider';

const EXISTING_APP_ID = 'cmlkt2n7x00wp0cl6diua9vtf';
export function tronConfiguration() {
  const auth =
    Boolean(process.env.PRIVY_APP_SECRET) &&
    process.env.NEXT_PUBLIC_PRIVY_APP_ID === EXISTING_APP_ID;
  const provider = Boolean(process.env.TRONGRID_API_KEY);
  return {
    creation: auth && process.env.A3_TRON_CREATION_ENABLED === 'true',
    send:
      auth &&
      provider &&
      (process.env.A3_TRON_INTENT_SECRET?.length ?? 0) >= 32 &&
      process.env.A3_TRON_SEND_ENABLED === 'true',
    reads: auth && provider,
  };
}
export async function tronUser(
  request: Request,
  needsWallet = true,
): Promise<TronIdentity> {
  if (
    !process.env.PRIVY_APP_SECRET ||
    process.env.NEXT_PUBLIC_PRIVY_APP_ID !== EXISTING_APP_ID
  )
    throw new ApiError(
      503,
      'TRON_UNCONFIGURED',
      'Tron access is not configured',
    );
  const bearer = request.headers.get('authorization');
  if (!bearer?.startsWith('Bearer ') || bearer.length > 8192)
    throw new ApiError(401, 'UNAUTHORIZED', 'Sign in to access Tron');
  const client = new PrivyClient({
    appId: EXISTING_APP_ID,
    appSecret: process.env.PRIVY_APP_SECRET,
    timeout: 6000,
    maxRetries: 0,
  });
  let did: string;
  try {
    did = (await client.utils().auth().verifyAccessToken(bearer.slice(7)))
      .user_id;
  } catch {
    throw new ApiError(401, 'UNAUTHORIZED', 'Sign in again to access Tron');
  }
  const user = await client.users()._get(did);
  if (user.id !== did)
    throw new ApiError(403, 'ACCOUNT_MISMATCH', 'Account verification failed');
  const wallets = user.linked_accounts.filter(
    (a) =>
      a.type === 'wallet' &&
      a.chain_type === 'tron' &&
      a.connector_type === 'embedded' &&
      ['privy', 'privy-v2'].includes(String(a.wallet_client_type)),
  );
  if (!needsWallet && wallets.length === 0) {
    const evm = user.linked_accounts.filter(a => a.type === 'wallet'
      && a.chain_type === 'ethereum' && a.connector_type === 'embedded'
      && ['privy', 'privy-v2'].includes(String(a.wallet_client_type)));
    if (evm.length !== 1 || !('address' in evm[0]) || !/^0x[0-9a-f]{40}$/i.test(evm[0].address))
      throw new ApiError(409, 'EVM_WALLET_UNAVAILABLE', 'Finish Ethereum wallet setup before enabling Tron.');
    return { did, walletId: '', address: '' };
  }
  if (wallets.length !== 1)
    throw new ApiError(
      409,
      'WALLET_UNAVAILABLE',
      'Tron wallet selection requires verification',
    );
  const wallet = wallets[0];
  if (
    wallet.type !== 'wallet' ||
    !('id' in wallet) ||
    !wallet.id ||
    !validTronAddress(wallet.address)
  )
    throw new ApiError(409, 'WALLET_UNAVAILABLE', 'Tron wallet unavailable');
  return { did, walletId: wallet.id, address: wallet.address };
}
export const tronTransport: TronTransport = async (operation, args) => {
  if (!process.env.TRONGRID_API_KEY)
    throw new ApiError(
      503,
      'TRON_UNCONFIGURED',
      'Tron provider is not configured',
    );
  let path: string;
  let payload: Record<string, unknown> | undefined;
  const owner = String(args.owner ?? '');
  switch (operation) {
    case 'account':
      tronHex(owner);
      path = `/v1/accounts/${owner}?only_confirmed=true`;
      break;
    case 'activity':
      tronHex(owner);
      path = `/v1/accounts/${owner}/transactions/trc20?only_confirmed=true&limit=20&contract_address=${TRON_USDT.contract}`;
      break;
    case 'balance':
    case 'decimals':
      path = '/walletsolidity/triggerconstantcontract';
      payload = {
        owner_address: tronHex(owner),
        contract_address: tronHex(TRON_USDT.contract),
        function_selector:
          operation === 'balance' ? 'balanceOf(address)' : 'decimals()',
        parameter:
          operation === 'balance'
            ? tronHex(owner).slice(2).padStart(64, '0')
            : '',
        visible: false,
      };
      break;
    case 'parameters':
      path = '/wallet/getchainparameters';
      payload = {};
      break;
    case 'resources':
      path = '/wallet/getaccountresource';
      payload = { address: tronHex(owner), visible: false };
      break;
    case 'simulate':
    case 'build':
      path =
        operation === 'simulate'
          ? '/wallet/triggerconstantcontract'
          : '/wallet/triggersmartcontract';
      payload = {
        ...callPayload(owner, String(args.recipient), String(args.units)),
        ...(operation === 'build' ? { fee_limit: args.feeLimit } : {}),
      };
      break;
    case 'broadcast':
      path = '/wallet/broadcasttransaction';
      payload = args;
      break;
    case 'receipt':
      if (!/^[a-f0-9]{64}$/i.test(String(args.hash)))
        throw new Error('Invalid hash');
      path = '/walletsolidity/gettransactioninfobyid';
      payload = { value: args.hash };
      break;
    default:
      throw new Error('Unsupported Tron operation');
  }
  return jsonFetch('https://api.trongrid.io' + path, {
    method: payload ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      'TRON-PRO-API-KEY': process.env.TRONGRID_API_KEY,
    },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });
};
function secret() {
  const value = process.env.A3_TRON_INTENT_SECRET;
  if (!value || value.length < 32)
    throw new ApiError(
      503,
      'TRON_UNCONFIGURED',
      'Tron sending is not configured',
    );
  return value;
}
export function sealIntent(intent: SendIntent) {
  const data = Buffer.from(JSON.stringify(intent)).toString('base64url');
  return (
    data + '.' + createHmac('sha256', secret()).update(data).digest('base64url')
  );
}
export function openIntent(
  ticket: unknown,
  owner: TronIdentity,
  forSigning = true,
): SendIntent {
  if (
    typeof ticket !== 'string' ||
    ticket.length > 10_000 ||
    !/^[\w-]+\.[\w-]+$/.test(ticket)
  )
    throw new ApiError(400, 'INVALID_INTENT', 'Invalid transfer review');
  const [data, mac] = ticket.split('.');
  const expected = createHmac('sha256', secret()).update(data).digest();
  const actual = Buffer.from(mac, 'base64url');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    throw new ApiError(400, 'INVALID_INTENT', 'Invalid transfer review');
  const intent = JSON.parse(
    Buffer.from(data, 'base64url').toString(),
  ) as SendIntent;
  if (
    intent.did !== owner.did ||
    intent.walletId !== owner.walletId ||
    intent.address !== owner.address
  )
    throw new ApiError(403, 'ACCOUNT_MISMATCH', 'Wallet context changed');
  if (forSigning) validateTransaction(intent, owner);
  return intent;
}
export async function attachSignature(intent: SendIntent, signature: unknown) {
  if (typeof signature !== 'string' || !/^0x[\da-f]{128}$/i.test(signature))
    throw new ApiError(400, 'INVALID_SIGNATURE', 'Invalid Tron signature');
  const tron = new TronWeb({ fullHost: 'https://api.trongrid.io' });
  for (const recovery of ['1b', '1c']) {
    const signed = {
      ...intent.transaction,
      signature: [signature.slice(2) + recovery],
    };
    try {
      if (
        (await tron.trx.ecRecover(
          signed as Parameters<typeof tron.trx.ecRecover>[0],
        )) === intent.address
      )
        return signed;
    } catch {
      /* Try the other recovery bit; never broadcast an unverified signer. */
    }
  }
  throw new ApiError(
    400,
    'INVALID_SIGNATURE',
    'Signature does not belong to the selected Tron wallet',
  );
}
