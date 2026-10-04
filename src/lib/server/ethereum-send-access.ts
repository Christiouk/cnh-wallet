import { PrivyClient } from '@privy-io/node';
import { isAddress, zeroAddress } from 'viem';
import { ApiError } from './http';

const APP_ID = 'cmlkt2n7x00wp0cl6diua9vtf';
export type SendValidation = { address: string; nonce: number; expiresAt: number };

// Temporary, server-only access for one owner-approved native self-transfer.
// An absent, malformed or expired configuration never opens the public gate.
export function sendValidationConfig(): SendValidation | null {
  try {
    const c = JSON.parse(process.env.A3_ETHEREUM_SEND_VALIDATION || 'null');
    if (!c || !isAddress(c.address) || c.address.toLowerCase() === zeroAddress ||
        !Number.isSafeInteger(c.nonce) || c.nonce < 0 ||
        !Number.isSafeInteger(c.expiresAt) || c.expiresAt <= Date.now() ||
        c.expiresAt > Date.now() + 24 * 60 * 60 * 1000) return null;
    return { address: c.address, nonce: c.nonce, expiresAt: c.expiresAt };
  } catch { return null; }
}

type VerifiedUser = { id: string; linked_accounts: Array<{
  type: string; chain_type?: string; connector_type?: string;
  wallet_client_type?: string; address?: string;
}> };
type IdentityReader = (token: string) => Promise<{ did: string; user: VerifiedUser }>;
const readIdentity: IdentityReader = async (token) => {
  const client = new PrivyClient({ appId: APP_ID, appSecret: process.env.PRIVY_APP_SECRET!, timeout: 6000, maxRetries: 0 });
  const did = (await client.utils().auth().verifyAccessToken(token)).user_id;
  return { did, user: await client.users()._get(did) };
};

export async function ownerSendValidation(request: Request, read: IdentityReader = readIdentity) {
  const config = sendValidationConfig();
  if (!config) throw new ApiError(503, 'SEND_DISABLED', 'Ethereum sending awaits final validation');
  const bearer = request.headers.get('authorization');
  if (!process.env.PRIVY_APP_SECRET || process.env.NEXT_PUBLIC_PRIVY_APP_ID !== APP_ID ||
      !bearer?.startsWith('Bearer ') || bearer.length > 8192)
    throw new ApiError(403, 'SEND_DISABLED', 'Ethereum sending awaits final validation');
  try {
    const { did, user } = await read(bearer.slice(7));
    const wallets = user.linked_accounts.filter(a => a.type === 'wallet' &&
      a.chain_type === 'ethereum' && a.connector_type === 'embedded' &&
      ['privy', 'privy-v2'].includes(a.wallet_client_type || ''));
    if (user.id !== did || wallets.length !== 1 ||
        wallets[0].address?.toLowerCase() !== config.address.toLowerCase()) throw new Error();
    return config;
  } catch {
    throw new ApiError(403, 'SEND_DISABLED', 'Ethereum sending awaits final validation');
  }
}
