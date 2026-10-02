const preview = process.env.VERCEL_ENV === 'preview';
// This policy applies only to the locked Preview surface. Live authentication
// and checkout resource directives remain report-only until their flows are verified.
const lockedPreviewCsp = "default-src 'self'; script-src 'self' 'unsafe-inline' https://vercel.live; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://vercel.live https://vercel.com https://*.pusher.com wss://*.pusher.com; frame-src https://vercel.live; worker-src 'self' blob:; manifest-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'";
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // RC previews never initialize the production Privy application.
  env: { NEXT_PUBLIC_A3_RC_PREVIEW_LOCKED: process.env.VERCEL_ENV === 'preview' ? 'true' : 'false' },
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: [
      ...(process.env.VERCEL_ENV === 'preview' ? [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }] : []),
      { key: 'Content-Security-Policy', value: preview ? lockedPreviewCsp : "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; manifest-src 'self'" },
      // Stage resource restrictions without breaking untested OAuth/wallet recovery flows.
      // Promote only after authenticated staging verification; see docs/A3-04-security.md.
      { key: 'Content-Security-Policy-Report-Only', value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://auth.privy.io https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://*.privy.io https://*.privy.systems wss://*.privy.io https://*.walletconnect.com wss://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.org; frame-src https://*.privy.io https://challenges.cloudflare.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'" },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
      // Host-only policy; no includeSubDomains/preload affecting unrelated sites.
      { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
    ] }];
  },
};
module.exports = nextConfig;
