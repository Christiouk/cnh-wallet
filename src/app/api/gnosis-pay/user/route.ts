import { NextRequest, NextResponse } from 'next/server';

const GP_API = 'https://api.gnosispay.com';
const PARTNER_ID = process.env.GNOSIS_PAY_PARTNER_ID || 'cmm9pckni0007xs2grsqk1xmc';

function gpHeaders(jwt: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${jwt}`,
  };
}

// POST /api/gnosis-pay/user?action=signup   { jwt, authEmail }
// POST /api/gnosis-pay/user?action=terms    { jwt, terms, version }
// GET  /api/gnosis-pay/user?action=profile  (jwt in Authorization header)
// GET  /api/gnosis-pay/user?action=kyc      (jwt in Authorization header)
// POST /api/gnosis-pay/user?action=phone    { jwt, phoneNumber }
// POST /api/gnosis-pay/user?action=verify   { jwt, code }

export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  const jwt = req.headers.get('x-gp-jwt') || '';

  if (!jwt) return NextResponse.json({ error: 'JWT required' }, { status: 401 });

  if (action === 'profile') {
    const res = await fetch(`${GP_API}/api/v1/user`, {
      headers: gpHeaders(jwt),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  if (action === 'kyc') {
    const res = await fetch(`${GP_API}/api/v1/kyc/integration`, {
      headers: gpHeaders(jwt),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  if (action === 'terms') {
    const res = await fetch(`${GP_API}/api/v1/user/terms`, {
      headers: gpHeaders(jwt),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  if (action === 'safe-status') {
    const res = await fetch(`${GP_API}/api/v1/safe/deploy`, {
      headers: gpHeaders(jwt),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');
  const body = await req.json();
  const { jwt, ...payload } = body;

  if (!jwt) return NextResponse.json({ error: 'JWT required' }, { status: 401 });

  if (action === 'signup') {
    const res = await fetch(`${GP_API}/api/v1/auth/signup`, {
      method: 'POST',
      headers: gpHeaders(jwt),
      body: JSON.stringify({ authEmail: payload.authEmail, partnerId: PARTNER_ID }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  if (action === 'terms') {
    const res = await fetch(`${GP_API}/api/v1/user/terms`, {
      method: 'POST',
      headers: gpHeaders(jwt),
      body: JSON.stringify({ terms: payload.terms, version: payload.version }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  if (action === 'phone') {
    const res = await fetch(`${GP_API}/api/v1/verification`, {
      method: 'POST',
      headers: gpHeaders(jwt),
      body: JSON.stringify({ phoneNumber: payload.phoneNumber }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  if (action === 'verify') {
    const res = await fetch(`${GP_API}/api/v1/verification/check`, {
      method: 'POST',
      headers: gpHeaders(jwt),
      body: JSON.stringify({ code: payload.code }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  if (action === 'deploy-safe') {
    const res = await fetch(`${GP_API}/api/v1/safe/deploy`, {
      method: 'POST',
      headers: gpHeaders(jwt),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
