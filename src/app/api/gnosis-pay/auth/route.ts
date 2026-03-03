import { NextRequest, NextResponse } from 'next/server';

const GP_API = 'https://api.gnosispay.com';

// GET /api/gnosis-pay/auth?action=nonce
// POST /api/gnosis-pay/auth  { message, signature, ttlInSeconds }
export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get('action');

  if (action === 'nonce') {
    try {
      const res = await fetch(`${GP_API}/api/v1/auth/nonce`, {
        headers: { 'Content-Type': 'application/json' },
      });
      // Gnosis Pay returns a plain text hex nonce, not JSON
      const nonce = await res.text();
      return NextResponse.json({ nonce: nonce.trim() }, { status: res.status });
    } catch (err: unknown) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Failed to fetch nonce' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, signature, ttlInSeconds = 86400 } = body;

    if (!message || !signature) {
      return NextResponse.json({ error: 'message and signature required' }, { status: 400 });
    }

    const res = await fetch(`${GP_API}/api/v1/auth/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, signature, ttlInSeconds }),
    });

    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await res.json()
      : { token: await res.text() };

    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Authentication failed' },
      { status: 500 }
    );
  }
}
