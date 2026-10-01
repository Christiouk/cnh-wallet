import { NextResponse } from 'next/server';
import { isAddress } from 'viem';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export function failure(error: unknown) {
  const e =
    error instanceof ApiError
      ? error
      : new ApiError(
          502,
          'PROVIDER_UNAVAILABLE',
          'Provider temporarily unavailable',
        );
  return NextResponse.json(
    { error: { code: e.code, message: e.message } },
    { status: e.status, headers: { 'Cache-Control': 'no-store' } },
  );
}
export function address(value: unknown): asserts value is `0x${string}` {
  if (typeof value !== 'string' || !isAddress(value))
    throw new ApiError(400, 'INVALID_ADDRESS', 'Invalid Ethereum address');
}
export function keys(value: Record<string, unknown>, allowed: string[]) {
  if (Object.keys(value).some((key) => !allowed.includes(key)))
    throw new ApiError(400, 'INVALID_INPUT', 'Unsupported request field');
}
// Best-effort per-process protection, not a distributed quota or authentication.
const limits = new Map<string, { count: number; expires: number }>();
export function guard(
  request: Request,
  category: string,
  maximum = 60,
  // Next may construct request.url with an internal hostname behind its proxy.
  // Host is the HTTP request authority; never trust caller-supplied forwarded hosts.
  expectedOrigin = `${new URL(request.url).protocol}//${request.headers.get('host') || new URL(request.url).host}`,
) {
  const origin = request.headers.get('origin');
  if (origin && origin !== expectedOrigin)
    throw new ApiError(
      403,
      'INVALID_ORIGIN',
      'Cross-origin request rejected',
    );
  const key = `${category}:${request.headers.get('x-forwarded-for')?.split(',')[0]?.slice(0, 64) || 'unknown'}`;
  const now = Date.now();
  for (const [k, v] of limits) if (v.expires <= now) limits.delete(k);
  const bucket = limits.get(key) || { count: 0, expires: now + 60000 };
  if (bucket.count >= maximum || (!limits.has(key) && limits.size >= 4096))
    throw new ApiError(429, 'RATE_LIMITED', 'Please wait before retrying');
  bucket.count++;
  limits.set(key, bucket);
}
export async function body(
  request: Request,
  maximumBytes = 2048,
): Promise<Record<string, unknown>> {
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw new ApiError(415, 'INVALID_CONTENT_TYPE', 'Expected JSON');
  const reader = request.body?.getReader();
  if (!reader)
    throw new ApiError(400, 'INVALID_INPUT', 'Expected JSON body');
  let size = 0;
  let text = '';
  const decoder = new TextDecoder();
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > maximumBytes) {
        await reader.cancel();
        throw new ApiError(413, 'PAYLOAD_TOO_LARGE', 'Request too large');
      }
      text += decoder.decode(next.value, { stream: true });
    }
    const result = JSON.parse(text + decoder.decode());
    if (!result || typeof result !== 'object' || Array.isArray(result))
      throw new Error();
    return result;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(400, 'INVALID_INPUT', 'Invalid JSON body');
  } finally {
    reader.releaseLock();
  }
}
export async function jsonFetch(
  url: string,
  init: RequestInit = {},
): Promise<any> {
  try {
    const response = await fetch(url, {
      ...init,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error();
    return await response.json();
  } catch {
    throw new ApiError(
      502,
      'PROVIDER_UNAVAILABLE',
      'Provider temporarily unavailable',
    );
  }
}
