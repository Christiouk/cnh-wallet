import 'server-only';
import { PrivyClient } from '@privy-io/node';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import { ApiError, jsonFetch } from './http';
import {
  buyInput,
  resolveBuyWallet,
  orderStatus,
  widgetUrl,
  METHODS,
  type BuyInput,
  type BuyOwner,
  type PaymentOption,
  type BuyStatus,
} from '../buy/core';
const APP_ID = 'cmlkt2n7x00wp0cl6diua9vtf';
const API = 'https://api-stg.transak.com';
// Do not forward partner headers to a redirect target.
const transakFetch = (url: string, init: RequestInit = {}) =>
  jsonFetch(url, { ...init, redirect: 'error' });
export function configuration() {
  const e = process.env;
  let origin = '';
  try {
    const u = new URL(e.TRANSAK_REFERRER_ORIGIN || '');
    if (u.protocol === 'https:' && u.origin === e.TRANSAK_REFERRER_ORIGIN)
      origin = u.origin;
  } catch {}
  const enabled =
    e.A3_BUY_STAGING_ENABLED === 'true' &&
    e.TRANSAK_ENVIRONMENT === 'staging' &&
    e.VERCEL_ENV !== 'production' &&
    !!e.TRANSAK_API_KEY &&
    !!e.TRANSAK_API_SECRET &&
    (e.A3_BUY_TICKET_SECRET?.length || 0) >= 32 &&
    !!origin &&
    e.NEXT_PUBLIC_PRIVY_APP_ID === APP_ID &&
    !!e.PRIVY_APP_SECRET;
  return {
    enabled,
    origin,
    verified: (e.A3_BUY_VERIFIED_PAIRS || '').split(','),
  };
}
export async function buyUser(
  request: Request,
  network: 'ethereum' | 'tron',
) {
  const bearer = request.headers.get('authorization');
  if (!bearer?.startsWith('Bearer ') || bearer.length > 8192)
    throw new ApiError(401, 'UNAUTHORIZED', 'Sign in to buy crypto');
  if (
    !process.env.PRIVY_APP_SECRET ||
    process.env.NEXT_PUBLIC_PRIVY_APP_ID !== APP_ID
  )
    throw new ApiError(503, 'BUY_UNAVAILABLE', 'Buy currently unavailable');
  const client = new PrivyClient({
    appId: APP_ID,
    appSecret: process.env.PRIVY_APP_SECRET,
    timeout: 6000,
    maxRetries: 0,
  });
  let did: string;
  try {
    did = (await client.utils().auth().verifyAccessToken(bearer.slice(7)))
      .user_id;
  } catch {
    throw new ApiError(401, 'UNAUTHORIZED', 'Sign in again to buy crypto');
  }
  const user = await client.users()._get(did);
  if (user.id !== did)
    throw new ApiError(
      403,
      'ACCOUNT_MISMATCH',
      'Account verification failed',
    );
  return resolveBuyWallet(did, user.linked_accounts, network);
}
export function requirePair(network: string, asset: string) {
  const config = configuration();
  if (!config.enabled || !config.verified.includes(`${network}:${asset}`))
    throw new ApiError(503, 'BUY_UNAVAILABLE', 'Buy currently unavailable');
  return config;
}
// Cache only the partner token in server memory. No widget URL is retained.
let access: { value: string; expires: number; key: string } | undefined;
let refreshing: Promise<string> | undefined;
async function accessToken() {
  const key = process.env.TRANSAK_API_KEY!;
  if (access && access.key === key && access.expires > Date.now() + 60000)
    return access.value;
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const result = await transakFetch(
      `${API}/partners/api/v2/refresh-token`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': key,
          'api-secret': process.env.TRANSAK_API_SECRET!,
        },
        body: JSON.stringify({ apiKey: key }),
      },
    );
    if (
      typeof result?.data?.accessToken !== 'string' ||
      !Number.isFinite(result?.data?.expiresAt) ||
      result.data.expiresAt * 1000 <= Date.now() + 60000
    )
      throw new Error('Invalid access response');
    access = {
      key,
      value: result.data.accessToken,
      expires: result.data.expiresAt * 1000,
    };
    return access.value;
  })();
  try {
    return await refreshing;
  } finally {
    refreshing = undefined;
  }
}
const headers = () => ({ 'x-api-key': process.env.TRANSAK_API_KEY! });
export async function options(
  network: string,
  asset: string,
): Promise<PaymentOption[]> {
  requirePair(network, asset);
  const [fiat, crypto] = await Promise.all([
    transakFetch(`${API}/fiat/public/v1/currencies/fiat-currencies`, {
      headers: headers(),
    }),
    transakFetch(`${API}/cryptocoverage/api/v1/public/crypto-currencies`, {
      headers: headers(),
    }),
  ]);
  const gbp = fiat?.response?.find(
    (r: any) =>
      r.symbol === 'GBP' &&
      r.isAllowed === true &&
      r.supportingCountries?.includes('GB'),
  );
  const coin = crypto?.response?.find(
    (r: any) =>
      r.symbol === asset &&
      r.network?.name === network &&
      r.isAllowed === true &&
      !r.kycCountriesNotSupported?.includes('GB'),
  );
  if (!coin || !gbp || !Array.isArray(gbp.paymentOptions))
    throw new ApiError(
      503,
      'UNSUPPORTED_PAIR',
      'This asset is currently unavailable through Transak',
    );
  const restrictions = coin.network.fiatCurrenciesNotSupported;
  if (!Array.isArray(restrictions)) throw new Error('Missing coverage');
  const result = gbp.paymentOptions
    .filter(
      (m: any) =>
        Object.hasOwn(METHODS, m.id) &&
        m.isActive === true &&
        m.limitCurrency === 'GBP' &&
        Number.isFinite(m.minAmount) &&
        Number.isFinite(m.maxAmount) &&
        m.minAmount > 0 &&
        m.maxAmount >= m.minAmount &&
        (!m.supportedCountryCode?.length ||
          m.supportedCountryCode.includes('GB')) &&
        !restrictions.some(
          (r: any) =>
            r === 'GBP' ||
            (r.fiatCurrency === 'GBP' &&
              (!r.paymentMethod || r.paymentMethod === m.id)),
        ),
    )
    .map((m: any) => ({
      id: m.id,
      name: METHODS[m.id],
      min: m.minAmount,
      max: m.maxAmount,
    }));
  if (!result.length)
    throw new ApiError(
      503,
      'BUY_UNAVAILABLE',
      'No payment methods are currently available',
    );
  return result;
}
export async function providerQuote(input: BuyInput) {
  const methods = await options(input.network, input.asset);
  const method = methods.find((m) => m.id === input.paymentMethod);
  if (
    !method ||
    Number(input.amount) < method.min ||
    Number(input.amount) > method.max
  )
    throw new ApiError(
      400,
      'AMOUNT_LIMIT',
      'Amount is outside the current provider limits',
    );
  const query = new URLSearchParams({
    partnerApiKey: process.env.TRANSAK_API_KEY!,
    fiatCurrency: 'GBP',
    cryptoCurrency: input.asset,
    network: input.network,
    isBuyOrSell: 'BUY',
    fiatAmount: input.amount,
    paymentMethod: input.paymentMethod,
    quoteCountryCode: 'GB',
  });
  const { response: r } = await transakFetch(
    `${API}/api/v1/pricing/public/quotes?${query}`,
    { headers: headers() },
  );
  if (
    !r ||
    r.fiatCurrency !== 'GBP' ||
    r.cryptoCurrency !== input.asset ||
    r.network !== input.network ||
    r.isBuyOrSell !== 'BUY' ||
    r.paymentMethod !== input.paymentMethod ||
    r.fiatAmount !== Number(input.amount) ||
    !Number.isFinite(r.cryptoAmount) ||
    r.cryptoAmount <= 0 ||
    !Number.isFinite(r.totalFee) ||
    r.totalFee < 0 ||
    !Array.isArray(r.feeBreakdown)
  )
    throw new ApiError(
      502,
      'QUOTE_UNAVAILABLE',
      'Quote unavailable. Please try again',
    );
  if (
    r.feeBreakdown.some(
      (f: any) =>
        (f.id === 'partner_fee' || f.ids?.includes('partner_fee')) &&
        f.value !== 0,
    )
  )
    throw new ApiError(503, 'PARTNER_FEE', 'Buy currently unavailable');
  return {
    cryptoAmount: r.cryptoAmount as number,
    totalFee: r.totalFee as number,
  };
}
type Ticket = {
  kind: 'quote' | 'flow';
  input: BuyInput;
  owner: BuyOwner;
  id: string;
  exp: number;
  created: number;
};
export function signTicket(data: Ticket) {
  const encoded = Buffer.from(JSON.stringify(data)).toString('base64url');
  return `${encoded}.${createHmac('sha256', process.env.A3_BUY_TICKET_SECRET!).update(encoded).digest('base64url')}`;
}
export function readTicket(value: unknown, kind: Ticket['kind']): Ticket {
  try {
    if (typeof value !== 'string' || value.length > 4096) throw new Error();
    const [encoded, signature, extra] = value.split('.');
    const expected = createHmac('sha256', process.env.A3_BUY_TICKET_SECRET!)
      .update(encoded)
      .digest();
    const supplied = Buffer.from(signature, 'base64url');
    if (
      extra ||
      expected.length !== supplied.length ||
      !timingSafeEqual(expected, supplied)
    )
      throw new Error();
    const data = JSON.parse(Buffer.from(encoded, 'base64url').toString());
    if (
      data.kind !== kind ||
      !Number.isFinite(data.exp) ||
      data.exp <= Date.now()
    )
      throw new Error();
    buyInput(data.input);
    return data;
  } catch {
    throw new ApiError(
      409,
      'SESSION_EXPIRED',
      'Session expired. Start a new Buy flow',
    );
  }
}
export function bindOwner(ticket: Ticket, owner: BuyOwner) {
  if (
    ticket.owner.did !== owner.did ||
    ticket.owner.walletId !== owner.walletId ||
    ticket.owner.address !== owner.address
  )
    throw new ApiError(
      409,
      'ACCOUNT_CHANGED',
      'Your wallet changed. Start a new Buy flow',
    );
}
export async function quote(input: BuyInput, owner: BuyOwner) {
  const estimate = await providerQuote(input);
  const now = Date.now(),
    expiresAt = now + 120000;
  return {
    ...estimate,
    address: owner.address,
    expiresAt,
    ticket: signTicket({
      kind: 'quote',
      input,
      owner,
      id: randomUUID(),
      exp: expiresAt,
      created: now,
    }),
  };
}
// Staging replay guard. Production is disabled; multi-instance launch requires a durable atomic store.
const consumedQuotes = new Map<string, number>();
export async function session(
  ticket: Ticket,
  owner: BuyOwner,
  request: Request,
) {
  bindOwner(ticket, owner);
  const config = requirePair(ticket.input.network, ticket.input.asset);
  // Vercel overwrites this header. Never forward a browser-supplied x-user-ip/x-forwarded-for.
  const ip =
    process.env.VERCEL === '1'
      ? request.headers.get('x-vercel-forwarded-for')
      : process.env.A3_BUY_DEV_USER_IP;
  if (!ip || !isIP(ip))
    throw new ApiError(
      503,
      'BUY_UNAVAILABLE',
      'Secure checkout is unavailable',
    );
  const clock = Date.now();
  for (const [key, expiry] of consumedQuotes)
    if (expiry <= clock) consumedQuotes.delete(key);
  if (ticket.exp <= clock || consumedQuotes.has(ticket.id))
    throw new ApiError(
      409,
      'SESSION_EXPIRED',
      'Session expired. Request a new quote',
    );
  if (consumedQuotes.size >= 4096)
    throw new ApiError(429, 'RATE_LIMITED', 'Please wait before retrying');
  consumedQuotes.set(ticket.id, ticket.exp);
  await providerQuote(ticket.input); // Recheck limits, availability and zero partner fee at launch.
  if (ticket.exp <= Date.now())
    throw new ApiError(
      409,
      'SESSION_EXPIRED',
      'Session expired. Request a new quote',
    );
  const id = randomUUID(),
    now = Date.now();
  const result = await transakFetch(
    'https://api-gateway-stg.transak.com/api/v2/auth/session',
    {
      method: 'POST',
      headers: {
        ...headers(),
        'content-type': 'application/json',
        'access-token': await accessToken(),
        'x-user-ip': ip,
      },
      body: JSON.stringify({
        widgetParams: {
          apiKey: process.env.TRANSAK_API_KEY,
          referrerDomain: config.origin,
          productsAvailed: 'BUY',
          fiatCurrency: 'GBP',
          fiatAmount: Number(ticket.input.amount),
          cryptoCurrencyCode: ticket.input.asset,
          network: ticket.input.network,
          paymentMethod: ticket.input.paymentMethod,
          walletAddress: owner.address,
          disableWalletAddressForm: true,
          partnerOrderId: id,
          redirectURL: `${config.origin}/buy/return?network=${ticket.input.network}`,
          isFeeCalculationHidden: false,
        },
      }),
    },
  );
  return {
    widgetUrl: widgetUrl(result?.data?.widgetUrl),
    expiresAt: now + 300000,
    ticket: signTicket({
      ...ticket,
      kind: 'flow',
      id,
      created: now,
      exp: now + 86400000,
    }),
  };
}
export async function status(
  ticket: Ticket,
  owner: BuyOwner,
): Promise<{ status: BuyStatus }> {
  bindOwner(ticket, owner);
  requirePair(ticket.input.network, ticket.input.asset);
  try {
    const q = new URLSearchParams({
      'filter[status]': JSON.stringify([
        'AWAITING_PAYMENT_FROM_USER',
        'PAYMENT_DONE_MARKED_BY_USER',
        'PROCESSING',
        'PENDING_DELIVERY_FROM_TRANSAK',
        'ON_HOLD_PENDING_DELIVERY_FROM_TRANSAK',
        'COMPLETED',
        'CANCELLED',
        'FAILED',
        'REFUNDED',
        'EXPIRED',
      ]),
      limit: '2',
      skip: '0',
      'filter[partnerOrderId]': ticket.id,
      'filter[walletAddress]': owner.address,
      'filter[productsAvailed]': '["BUY"]',
    });
    const result = await transakFetch(
      `${API}/partners/api/v2/orders?${q}`,
      {
        headers: { ...headers(), 'access-token': await accessToken() },
      },
    );
    // No order, multiple orders, omitted correlation or unknown state never imply success.
    if (!Array.isArray(result?.data) || result.data.length !== 1)
      return { status: 'unavailable' };
    return {
      status: orderStatus(result.data[0], ticket.input, owner, ticket.id),
    };
  } catch {
    return { status: 'unavailable' };
  }
}
