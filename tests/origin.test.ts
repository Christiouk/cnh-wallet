import { test } from 'node:test';
import assert from 'node:assert/strict';
import { guard, ApiError } from '../src/lib/server/http';

test('same-origin requests survive Next internal-host routing', () => {
  const request = new Request('http://localhost:3437/api/balances', {
    headers: { host: '127.0.0.1:3437', origin: 'http://127.0.0.1:3437' },
  });
  assert.doesNotThrow(() => guard(request, 'proxy-regression'));
});

test('cross-origin and spoofed forwarded-host requests stay rejected', () => {
  const request = new Request('https://internal.example/api/tron', {
    headers: {
      host: 'wallet-preview.example',
      origin: 'https://attacker.example',
      'x-forwarded-host': 'attacker.example',
    },
  });
  assert.throws(() => guard(request, 'proxy-rejection'),
    (error: unknown) => error instanceof ApiError && error.status === 403);
});

test('explicit approved origin still overrides request authority', () => {
  const request = new Request('https://internal.example/api/swap', {
    headers: { host: 'other.example', origin: 'https://other.example' },
  });
  assert.throws(() => guard(request, 'explicit-origin', 60, 'https://approved.example'),
    (error: unknown) => error instanceof ApiError && error.status === 403);
});
