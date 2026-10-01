# A3-04 security boundary

This branch is not deployed. Existing Privy provider configuration, login providers, wallet creation policy, deterministic resolver and account mappings are unchanged.

## HTTP headers

Enforced CSP blocks framing, plugin objects and foreign base URLs. X-Frame-Options DENY reinforces framing protection. A **report-only resource policy** records violations in the browser console; there is no report collector and it does not block script execution/exfiltration. This is intentionally staged: authenticated email/Google/Apple, recovery, signing and SDK network paths have not been exercised with real users. Do not describe this as a fully enforced script CSP. Full CSP enforcement is a release hardening blocker.

Candidate origins: `auth.privy.io` / `*.privy.io` (authentication, wallet frames/API), `*.privy.systems` (wallet RPC), WalletConnect `*.walletconnect.com` / `*.walletconnect.org` HTTPS/WSS if loaded by the retained SDK, `challenges.cloudflare.com` for challenges. Images may currently use HTTPS broadly; scripts/styles retain unsafe-inline for Next/SDK compatibility. Actual Privy resource origins must be recorded in authenticated staging and narrowed before promotion; these are candidate allowances, not a claim of full validation. The retained Privy provider also lists eth.llamarpc.com, mainnet.base.org, polygon-rpc.com, arb1.arbitrum.io, mainnet.optimism.io and bsc-dataseed.binance.org as technical RPC defaults. Only Ethereum is exposed in the product. No API credentials appear in CSP. Balance/send reads, prices and history use same-origin APIs; upstream RPC, CoinGecko and Etherscan do not need browser connect allowances.

Buy deliberately loads no Transak frame or SDK. Future Transak session URLs (`global.transak.com`, `global-stg.transak.com` per provider documentation) require a reviewed frame allowance and scoped camera/microphone/payment permissions for KYC. Current Permissions-Policy disables those unused capabilities. Do not enable Transak without updating/testing both. Strict-origin-when-cross-origin retains the referrer needed for the provider's session validation.

HSTS is host-only max-age 31536000, honored by browsers only over HTTPS. No preload/includeSubDomains change, DNS change, or Vercel setting change is made. Production header behavior remains untested until an authorized deployment.

## Read APIs

Balances and Send preview/receipt enforce fixed Ethereum mainnet RPC methods. No broadcast, signing, arbitrary contract query or URL proxy exists. 2 KiB streamed JSON limit, field allowlists, address validation, fixed asset contracts, 10-second upstream timeouts, generic structured errors and no-store wallet responses. Preview simulates and estimates one transfer; no funds are moved. Application-origin checks and bounded per-process/IP rate buckets reduce casual abuse but are **not authentication or distributed rate limiting**. X-Forwarded-For trust depends on the hosting proxy; multi-instance/restart/IP rotation can bypass these quotas. Production edge quotas/authentication review is required before public rollout.

ETHEREUM_RPC_URL, ETHERSCAN_API_KEY and optional COINGECKO_API_KEY are server-only. Legacy NEXT_PUBLIC_RPC_URL is read only by server code as a migration fallback; rename in a separately authorized deployment. No environment values were copied or changed. PRIVY_APP_SECRET is unused, absent from frontend and omitted from the example.

## Dependencies and validation

Next 14 has a critical advisory without a 14.x patch. Bounded migration to 15.5.26 follows the official Next 15 guide; App Router uses React/React DOM 19.2.6, matching react-test-renderer, and QRCode React 4.2.0. No async cookies/headers/route-params APIs were present to codemod. TypeScript targets ES2020 for native BigInt. Existing Privy configuration is preserved. Audit results and remaining transitive advisories are recorded in the final report.

## External documentation

- https://nextjs.org/docs/app/guides/upgrading/version-15
- https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4
- https://docs.etherscan.io/api-reference/endpoint/txlist
- https://docs.transak.com/guides/migration-to-api-based-transak-widget-url
- https://docs.transak.com/guides/mandatory-security-changes

History intentionally covers the latest 25 normal Ethereum transactions, not a token/internal-transfer index. Missing provider/key and malformed/rejected responses are unavailable, not empty success. Token-only incoming transfers are outside coverage. Send confirmation means one successful block receipt, not economic finality; dropped/replaced transactions can remain pending. Transaction state is local component state, not a durable ledger. Closing a modal preserves it during the session; refresh/logout loses it. Check the explorer before any retry after an ambiguous signing error. No real login, signing, wallet creation, purchase or transfer was performed.

Same-major ws overrides (7.x and 8.x) and a Next-scoped PostCSS 8.x override patch transitive advisories without upgrading Next again. Revalidate/remove overrides as upstream dependencies catch up. Service-worker cache names change to purge old cached product routes/assets upon activation; API responses remain network-only.
