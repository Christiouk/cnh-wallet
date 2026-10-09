// A3-POST-01: opt in only after Apple/passkey verification. Release 1 uses email.
export function deferredAuthEnabled(): boolean {
  return process.env.NEXT_PUBLIC_A3_POST01_AUTH_ENABLED === 'true';
}
