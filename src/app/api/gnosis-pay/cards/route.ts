import { NextRequest, NextResponse } from 'next/server';

const GP_API = 'https://api.gnosispay.com';

function gpHeaders(jwt: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${jwt}`,
  };
}

async function safeJson(res: Response) {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { message: text }; }
}

// GET  /api/gnosis-pay/cards          — list active cards (jwt in x-gp-jwt header)
// POST /api/gnosis-pay/cards?type=virtual   { jwt }
// POST /api/gnosis-pay/cards?type=physical  { jwt, shippingAddress }

export async function GET(req: NextRequest) {
  const jwt = req.headers.get('x-gp-jwt') || '';
  if (!jwt) return NextResponse.json({ error: 'JWT required' }, { status: 401 });

  try {
    const res = await fetch(`${GP_API}/api/v1/cards?status_code=1000`, {
      headers: gpHeaders(jwt),
    });
    return NextResponse.json(await safeJson(res), { status: res.status });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Request failed' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') || 'virtual';

  try {
    const body = await req.json();
    const { jwt, shippingAddress } = body;

    if (!jwt) return NextResponse.json({ error: 'JWT required' }, { status: 401 });

    if (type === 'virtual') {
      const res = await fetch(`${GP_API}/api/v1/cards/virtual`, {
        method: 'POST',
        headers: gpHeaders(jwt),
      });
      return NextResponse.json(await safeJson(res), { status: res.status });
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
      return NextResponse.json(await safeJson(res), { status: res.status });
    }

    return NextResponse.json({ error: 'Unknown card type' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Request failed' },
      { status: 500 }
    );
  }
}
