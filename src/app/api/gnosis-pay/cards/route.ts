import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

const GP_API = 'https://api.gnosispay.com';

// mTLS certificate for PSE (card data display)
const MTLS_CERT = process.env.GNOSIS_PAY_CERT || '';
const MTLS_KEY = process.env.GNOSIS_PAY_KEY || '';

function gpHeaders(jwt: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${jwt}`,
  };
}

// Build an https agent with mTLS for PSE calls
function getMtlsAgent() {
  if (!MTLS_CERT || !MTLS_KEY) return undefined;
  return new https.Agent({
    cert: MTLS_CERT.replace(/\\n/g, '\n'),
    key: MTLS_KEY.replace(/\\n/g, '\n'),
    rejectUnauthorized: true,
  });
}

// GET  /api/gnosis-pay/cards          — list active cards (jwt in x-gp-jwt header)
// POST /api/gnosis-pay/cards?type=virtual   { jwt }
// POST /api/gnosis-pay/cards?type=physical  { jwt, shippingAddress }

export async function GET(req: NextRequest) {
  const jwt = req.headers.get('x-gp-jwt') || '';
  if (!jwt) return NextResponse.json({ error: 'JWT required' }, { status: 401 });

  const res = await fetch(`${GP_API}/api/v1/cards?status_code=1000`, {
    headers: gpHeaders(jwt),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') || 'virtual';
  const body = await req.json();
  const { jwt, shippingAddress } = body;

  if (!jwt) return NextResponse.json({ error: 'JWT required' }, { status: 401 });

  if (type === 'virtual') {
    const res = await fetch(`${GP_API}/api/v1/cards/virtual`, {
      method: 'POST',
      headers: gpHeaders(jwt),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  if (type === 'physical') {
    if (!shippingAddress) {
      return NextResponse.json({ error: 'shippingAddress required for physical card' }, { status: 400 });
    }
    const res = await fetch(`${GP_API}/api/v1/order/create`, {
      method: 'POST',
      headers: gpHeaders(jwt),
      body: JSON.stringify({ shippingAddress }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json({ error: 'Unknown card type' }, { status: 400 });
}
