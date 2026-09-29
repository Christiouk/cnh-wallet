# A3-06A — Buy Crypto / Transak

Implementation baseline: `3ca62f191b6f3d065ca8480b1114ae95d7b69e9f`.
Branch: `feat/a3-06a-buy-transak`. Local implementation only; no deployment, push, merge, configuration changes, purchase or customer wallet creation.

## Discovery — 29 September 2026

Read-only Vercel REST discovery matched `morsands` (`prj_CLCry1lvk4FqrJUsTYFjvJeKzgc8`) to GitHub `Christiouk/cnh-wallet`. The connector's initial project list omitted this older project; a complete authenticated project listing resolved it. The connector's get-project operation also returned an argument/schema error, so existing CLI authentication was used for read-only REST metadata. Credential values were never printed or copied into this project.

| Existing variable | Scopes | Configured | Reused by A3-06A |
| --- | --- | --- | --- |
| NEXT_PUBLIC_TRANSAK_API_KEY | Development, Preview, Production | Yes | No |
| NEXT_PUBLIC_TRANSAK_ENV | Development, Preview, Production | Yes | No |

No other Transak variables were returned for this project. No local runtime env file or Transak process configuration was present. Historical public configuration does not establish credential validity, environment, partner approval or production readiness. Adjacent projects `a3-wallet-portal` and `cnh-portal` point to different repositories and are not the production wallet source.

## Official contract checked

- [Create Widget URL](https://docs.transak.com/api/public/create-widget-url): backend POST to `https://api-gateway-stg.transak.com/api/v2/auth/session`, `data.widgetUrl`, five-minute single-use URL. Requires `x-api-key`, partner `access-token`, and originating `x-user-ip`.
- [Partner access token](https://docs.transak.com/guides/how-to-create-partner-access-token): backend refresh-token POST using API key and API secret; token expiry supplied by provider.
- [Customization parameters](https://docs.transak.com/customization/query-parameters): required API key/referrerDomain in `widgetParams`; fixed fiatCurrency/fiatAmount, cryptoCurrencyCode/network/paymentMethod, walletAddress plus disableWalletAddressForm. No defaultNetwork, multiple networks, editable destination, or SELL product.
- [Managed redirection](https://docs.transak.com/integration/web/website-redirection): provider-controlled new-tab checkout with a return URL. A3 retains `strict-origin-when-cross-origin`, does not use noreferrer or a nested iframe. Camera/payment permissions are managed by Transak's own top-level document.
- [Mandatory security changes](https://docs.transak.com/guides/mandatory-security-changes): backend-only API calls, approved server egress IPs, originating-user IP forwarding and same-origin frontend boundary. Domain approval alone is insufficient.
- [Pricing](https://docs.transak.com/api/public/get-price), [fiat catalogue](https://docs.transak.com/api/public/get-fiat-currencies), [crypto catalogue](https://docs.transak.com/api/public/get-crypto-currencies), [orders](https://docs.transak.com/api/public/get-orders), [order states](https://docs.transak.com/guides/track-order-status).
- [Vercel request headers](https://vercel.com/docs/headers/request-headers): platform `x-vercel-forwarded-for` is used only when running on Vercel. A self-hosted staging tester must supply the actual tester public IP through server configuration; arbitrary client IP headers are not forwarded.

## Public coverage versus A3 approval

Unauthenticated GET requests to both production public catalogue endpoints returned **HTTP 403** in this session. Current reference documentation requires an API-key header even on these public catalogue APIs. Documentation examples are not current catalogue responses and have not been substituted for live validation. Previous A3-05 catalogue observations are historical, not current approval.

| Pair | Implementation | Current public GB/GBP catalogue | A3 partner verified | Operational state |
| --- | --- | --- | --- | --- |
| Ethereum ETH | SUPPORTED by boundary/fixtures | UNVERIFIED (403) | No | BLOCKED |
| Ethereum USDT ERC-20 | SUPPORTED by boundary/fixtures | UNVERIFIED (403) | No | BLOCKED |
| Ethereum USDC ERC-20 | SUPPORTED by boundary/fixtures | UNVERIFIED (403) | No | BLOCKED |
| Tron USDT TRC-20 | SUPPORTED by boundary/fixtures | UNVERIFIED (403) | No | BLOCKED |
| Tron TRX | Not implemented in Buy allowlist | UNVERIFIED (403) | No | BLOCKED |

Official payment identifiers are `gbp_bank_transfer`, `pm_open_banking`, `credit_debit_card`, `apple_pay`, `google_pay`. Their current GBP availability, A3 partner enablement, limits and device-specific availability remain **UNVERIFIED**. At runtime, only active GBP methods supporting GB, with finite GBP limits and no asset/network restriction, are offered. Every quote and launch checks current staging catalogues and pricing. Fixtures use explicitly synthetic limits and quotes; they are never production defaults.

## Architecture and safety

`Buy` obtains the existing Privy access token. Same-origin `POST /api/buy` supports options, quote, session and status. Every operation verifies the token and retrieves the authoritative user from the unchanged Privy application. Exactly one embedded Privy wallet must exist for the requested chain; missing/ambiguous/external wallets fail closed. Tron missing produces “Enable Tron first” and the existing explicit setup flow remains the only creation path. No Buy operation creates, signs with or changes a wallet.

The browser may send only a pair, decimal GBP amount and supported payment-method ID for a quote. Address, order ID, return URL, country assertion and completion status are rejected as input. The UI cross-checks the server-resolved destination against the visible selected wallet. A two-minute A3 review ticket binds user DID, wallet ID, exact address, pair, amount and payment method. HMAC verification, expiry and fresh identity resolution are required for launch. This is A3 review expiry, not an invented provider quote lifetime.

The server obtains/caches the partner access token, creates `widgetParams`, and uses only the returned session URL. All provider hosts are fixed staging HTTPS endpoints; redirect following is disabled. A single, fixed staging checkout host and a sessionId are required in the response. The URL is returned once to the initiating UI, opened immediately, and never stored. Provider-enforced single-use/five-minute validity is documented; it still requires actual staging confirmation. The UI will not reopen the URL and requires a fresh quote after a failed launch.

A bounded in-process quote consumption map rejects duplicate/concurrent launches within one server instance. **This is not distributed replay protection.** Before any multi-instance release, replace it with a durable atomic TTL consume operation. Rate limiting and access-token caching are also per process. Production is explicitly blocked by VERCEL_ENV and only staging provider endpoints exist. Do not remove that block until shared replay/rate controls and partner validation are complete.

The frontend has a single pending operation, ignores obsolete quote responses and closes a pending checkout tab if the wallet/component changed. A synchronous blank tab avoids mobile popup blocking, its opener is removed, then it navigates to the short-lived provider URL. No KYC forms, uploaded documents, card details, swap approvals, fee recipients or trading functions are handled by A3.

## Quotes and return

Quotes are provider responses, not A3 exchange-rate calculations. Amount/pair/payment identity must match; malformed/unavailable quotes block launch. GBP estimates and provider total fees are displayed, with final price/eligibility confirmed by Transak. Non-zero provider-reported partner fees block this implementation. No A3 fee/spread is added. GB is a quote-market hint, not a KYC country assertion; widget countryCode and personal information are not supplied.

The flow ticket is held in component memory for authenticated status checks (24-hour signed expiry); it is not a widget URL. On focus/visibility return or manual status check, only the selected network refreshes. Ethereum refreshes balances plus remounts its chain activity fetch; Tron refreshes its balances/activity through its existing revision path. No provider event adds an Activity entry.

Order lookup is filtered by the server-generated partnerOrderId and wallet, then every returned record is independently checked against the ticket. A single exact match can yield started/processing/completed/failed/cancelled/expired. Unknown, missing or mismatched records yield the safe “Purchase submitted through Transak” fallback with status unavailable. `COMPLETED` is displayed as a **Transak report**, separately from indexed chain activity. The status filter's provider response shape and partnerOrderId echo must be confirmed with real staging credentials; absent correlation never becomes success.

The `/buy/return` page ignores status/order/destination/redirect parameters. Its only accepted hint is a bounded network view (`tron`, otherwise `ethereum`), used to open the corresponding A3 wallet if the original tab was lost. It does not authorize a purchase or claim completion. The original tab retains the status ticket; a page reload/closed original tab loses order tracking, but balances and Activity still come from chain providers. The original tab should be used for status checks; the fallback opens the correct network with normal fresh reads. No permanent purchase history or webhook persistence is introduced.

Ethereum Activity retains its existing normal-transaction indexer limitation: ERC-20 deposits are not guaranteed to appear in the current Activity list. Balances refresh independently; no token transfer is fabricated. A token-transfer indexer enhancement requires separate work.

## Configuration procedure — staging only, not performed

1. Obtain **A3's staging** partner key/secret from the authorised Transak dashboard, confirm managed On-Ramp and GBP/GB approval, zero partner fee and supported payment methods. Do not assume the historical NEXT_PUBLIC variables are valid.
2. Arrange Transak-approved static server egress IPs and an exact approved HTTPS frontend origin. Confirm the forwarded tester IP matches the browser's actual public IP (including any proxy/CDN). An unapproved deployment/domain will not work.
3. Independently inspect current key-authenticated staging and production public catalogues, record network/asset identities, chain IDs, token contracts, payment restrictions and GBP limits. Staging Ethereum may use a test chain; test balances must never be represented as production holdings. Keep test orders separate from actual-chain Activity.
4. Validate each intended fixed widget combination and disabled destination editing with Transak's staging tools/partner support, using synthetic test destinations; obtain evidence before adding a pair to the server allowlist. Validate payment availability including Apple Pay/Google Pay on suitable actual devices. Do not add TRX without a separate verified implementation change.
5. In an isolated approved staging environment only, configure the existing Privy app identity/secret and the server-only variables below. Use the existing account/wallet when testing A3; do not create a new Privy identity or customer wallet. This task leaves all values empty/off locally and changes no Vercel variables.
6. Exercise auth → quote → locked session → managed checkout → return → independently verified status → selected-chain refresh with sandbox credentials only. Never enter production payment details or use customer funds. Check missing/cancelled/failed/delayed orders and provider token refresh failures. Verify order filtering/correlation and referrer/user-IP receipt with Transak.
7. Validate actual iPhone/iPad Safari tab handoff, return after background suspension, bank-app handoff, keyboard scrolling, camera and payment sheets. Browser viewport emulation does not prove native wallet/payment sheets work.
8. Keep production blocked. Before any release, implement distributed replay/rate controls, review remaining dependencies, complete live partner/locking evidence and agree order-tracking persistence requirements.

| Server variable | Purpose | Current local state |
| --- | --- | --- |
| A3_BUY_STAGING_ENABLED | Explicit staging gate | Off/unset |
| TRANSAK_ENVIRONMENT | Must be staging | Unset |
| TRANSAK_API_KEY | Partner identifier / x-api-key | Unset |
| TRANSAK_API_SECRET | Backend partner credential | Unset |
| TRANSAK_REFERRER_ORIGIN | Exact approved HTTPS origin | Unset |
| A3_BUY_TICKET_SECRET | Independent random signing secret, at least 32 characters | Unset |
| A3_BUY_VERIFIED_PAIRS | Comma-separated independently verified pair IDs | Empty |
| A3_BUY_DEV_USER_IP | Actual tester IP, non-Vercel staging only | Unset |

All conceptual names are A3 server configuration names; Transak's actual wire headers/body names are documented above. No NEXT_PUBLIC credential is used. No sample credential is a working default.

## Verification

- Automated suite: 67 tests, including new input/auth/origin, deterministic wallets, session creation/locks/replay/expiry, mismatched provider orders, provider errors/fees/limits, and UI error/review/status/refresh coverage.
- Browser fixtures: 78 responsive checks (actions/entry/review × both chains × 13 viewports), 28 axe WCAG 2 A/AA + 2.1 AA/best-practice audits with zero violations, ten error/status scenarios, no browser errors. Screenshots were visually inspected at phone and tablet sizes.
- Viewports: 320×800, 360×800, 375×812, 390×844, 430×932; 768×1024, 820×1180, 834×1194, 1024×1366; 1024×768, 1180×820, 1194×834, 1366×1024.
- Browser evidence: `outputs/A3-06A` at the workspace root, including `browser-validation.json`. The fixture is development-only, explicitly enabled, loopback-only and forbidden on Vercel/production. Its checkout sink never navigates to Transak.
- Dependency audit: 23 moderate, 0 high, 0 critical; inherited Privy/wallet connector dependency tree. No dependency or lockfile changes.
- Lint, explicit TypeScript check and production build passed. The inherited optional `@farcaster/mini-app-solana` build warning remains. Local production smoke: fixture 404, API GET 405, unauthenticated session 401, foreign origin 403; no-store responses. Forged return parameters cannot change the destination link or claim completion. Two additional return-page viewport/axe checks passed.
- Live API/widget/catalogue coverage remains blocked as described above. No staging session or real purchase was made.

Ready for local fixture review. Ready to begin **controlled staging validation after configuration and prerequisites**, not currently operational staging. **Not production-ready.** A3-06B Swap may proceed as a separate discovery/safety-design task once this Buy review is accepted; Swap implementation is not part of this branch.
