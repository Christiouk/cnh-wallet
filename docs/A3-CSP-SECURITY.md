# A3-08 CSP and security review

Locked Wallet Preview receives an enforced resource policy, including self-only default, base URI, object/frame ancestor denial, self manifest/worker and explicit Google font/Vercel Preview toolbar origins. Inline scripts/styles remain needed by the current Next build; this is not a nonce-based strict CSP claim. Live authenticated resource directives remain report-only pending recovered-account testing. Production base/object/frame restrictions remain enforced; manifest self is added.

Observed locked Preview origins before the change: its own deployment, fonts.googleapis.com and vercel.live. fonts.gstatic.com is allowed for returned font files; Vercel toolbar connections include vercel.com and *.pusher.com/wss. The preview policy does not allow Privy authentication; Preview login remains deliberately locked.

Live-auth candidates currently in report-only code: auth.privy.io (script), *.privy.io / *.privy.systems and wss://*.privy.io (connect), *.privy.io and challenges.cloudflare.com (frame), challenges.cloudflare.com (script), and existing WalletConnect domain patterns inherited by the SDK. These are a current-code inventory, not a validated minimal origin list. Inspect actual email/Apple/Google login, recovery, refresh, account changes and signing after recovery; remove unused origins and consider self-hosted fonts/nonces then. Do not enable external-wallet control.

0x, Ethereum RPC/history/price APIs and TronGrid are server-side requests, so their origins do not belong in browser connect-src just because an adapter calls them. Transak checkout opens outside the page; no iframe allowance is required for dormant Buy code. Buy/Swap CSP execution validation is post-launch.

Preview metadata uses its own VERCEL_URL (local fallback preview.invalid), noindex meta/header and disabled launch CTAs; Landing robots disallows Preview crawling. Production destination strings remain unchanged in source. New legal routes are app-public, but hosted previews remain protected. No production robots, DNS or aliases were changed.

Remaining: authenticated Privy CSP verification, rate-limit distribution for exposed core APIs, dependency risk acceptance/compatible upstream repair, safe deletion processing and native runtime review. No claim of zero data collection or verified custody policy. Secret checks inspect committed source/public artifacts without printing values.
