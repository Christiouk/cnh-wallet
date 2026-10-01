# A3-06B — Ethereum-only Swap

Base: `c743cac4a53711120317bbc0f08ba6586a23582a` (A3-06A). Branch: `feat/a3-06b-ethereum-swap`.

Local implementation and controlled validation only. No push, merge, deployment, production configuration change, customer account/wallet creation, real approval or real Swap. A3 Admin, the landing repository, Privy configuration, DNS and the existing Buy integration are unchanged.

## Provider discovery — 29 September 2026

The existing Vercel `morsands` project, linked to `Christiouk/cnh-wallet`, has server-side `ZEROX_API_KEY` entries in Development, Preview and Production. Read-only discovery used existing authorization; the tested key was held transiently in memory, never printed or persisted. No credentials or enable flags were added locally or changed on Vercel.

All six directed ETH/USDT/USDC indicative-price probes returned HTTP 200 and `liquidityAvailable: true`, using a deterministic synthetic taker. This verifies the tested credential for read-only 0x v2 access, not trading readiness or the validity of every environment's separate value. One read-only ETH→USDC firm response passed the actual structural validator against the current on-chain registry. It was neither signed nor submitted. Evidence is in `outputs/A3-06B` outside the repository.

| Pair, both directions | Implementation | Current price discovery | Signed execution |
| --- | --- | --- | --- |
| ETH ↔ USDT | IMPLEMENTED | HTTP 200, liquidity available | UNVERIFIED / live UI BLOCKED |
| ETH ↔ USDC | IMPLEMENTED | HTTP 200, liquidity available | UNVERIFIED / live UI BLOCKED |
| USDT ↔ USDC | IMPLEMENTED | HTTP 200, liquidity available | UNVERIFIED / live UI BLOCKED |

Only Ethereum mainnet (chain 1) and the three fixed canonical assets are allowed. Tron Swap, bridges, cross-chain routes, arbitrary assets, Sell, Earn, Card and advanced trading are absent.

## Official API and contract references

- [0x v2 quickstart](https://docs.0x.org/docs/introduction/quickstart/swap-tokens-with-0x-swap-api): fixed `https://api.0x.org/swap/allowance-holder/price` and `/quote`; headers `0x-version: v2` and server-only `0x-api-key`. No v1 or historical 1inch code.
- [v2 migration](https://docs.0x.org/docs/upgrading/upgrading-to-swap-v2) and [contract model](https://docs.0x.org/docs/core-concepts/contracts): allowance spender differs from execution logic. Never approve Settler.
- [Current official Settler repository](https://github.com/0xProject/0x-settler): Ethereum Cancun AllowanceHolder `0x0000000000001ff3684f28c67538d4d072c22734`; deployment registry `0x00000000000004533fe15556b1e086bb1a72ceae`. Read `ownerOf(2)` and require deployed code to resolve the current taker Settler. Do not pin the observed Settler or automatically accept previous/next deployments. A pause, invalid registry response or unexpected deployment blocks execution.
- [AllowanceHolder interface](https://github.com/0xProject/0x-settler/blob/master/src/allowanceholder/IAllowanceHolder.sol) and [taker interface](https://github.com/0xProject/0x-settler/blob/master/src/interfaces/ISettlerTakerSubmitted.sol): the adapter decodes `exec` and `execute`. Simulations decode Holder's returned bytes and the inner boolean; empty router returns fail. `executeWithPermit`, Permit2 and typed-data permit signing are unsupported.
- [Price reference](https://docs.0x.org/api-reference/evm-ap-is/swap/allowanceholder-getprice): omitting `slippageBps` uses the documented 100 bps (1%) default. No user-adjustable slippage or invented impact threshold.
- [API issue semantics](https://docs.0x.org/docs/introduction/api-issues): unresolved balance, allowance, invalid sources or incomplete firm simulation block execution.
- [Tether contract source](https://github.com/tethercoin/USDT/blob/main/TetherToken.sol): zero-reset handling and nonstandard approval return. Read-only mainnet calls in this task independently confirmed empty successful return data for synthetic USDT approvals of zero and one USDT. These were `eth_call`, with no state changes. Nonzero-existing-allowance reset behavior is covered deterministically; its signed end-to-end sequence remains unverified.

The observed current ETH firm quote uses AllowanceHolder with a zero-address token and exact native amount. The validator supports that form and the documented direct-current-Settler native form. Both require exact transaction ETH value, the current registry-derived Settler, the intended recipient and matching output protection. Neither requires an ETH approval.

## Authentication, intent and transaction validation

`POST /api/swap` is a narrow authenticated interface: availability, price, prepare, authorize and receipt. It reuses A3-06A's server-side Privy authentication and deterministic embedded-wallet resolver without calling Transak. The existing Privy application is unchanged. External, absent or ambiguous wallets fail closed.

The browser supplies only sell asset, buy asset and decimal amount for a price. Later operations use an opaque owner-bound session ID and, for receipt checks, a transaction hash. The server resolves token contracts/decimals, user DID, embedded wallet ID/address, chain and taker/recipient. Unknown fields, arbitrary calldata, token addresses, takers, routers, provider URLs or RPC methods are rejected.

The indicative response contains presentation data only. The server checks exact pair/amount, canonical spender, response consistency, positive output, liquidity and fee policy. A price lasts 60 seconds. Approval and firm reviews last 30 seconds. Editing intent clears the displayed quote. Approval confirmation always precedes a fresh firm quote and an explicit updated review.

Before issuance the server checks chain 1, balances, ETH gas, live allowance, current Settler and exact expected calldata structure. Holder's operator and target must both equal current Settler; its token and temporary spend ceiling must match the intended sale. Inner `execute` must encode the user's own recipient, selected buy asset and the exact validated minimum. Unknown selectors/models fail closed. The adapter does not independently decode every DEX action; it relies on the current registered Settler's enforcement within the validated Holder spend cap and output floor, plus successful RPC simulation. This is a bounded model validator, not a formal audit of all downstream pools.

RPC simulation and gas estimation run before review and again immediately before issuance. Gas receives a 20% estimate buffer; the required native balance includes sale value plus gas. Increased network cost or a changed pending nonce requires a new review. RPC errors never become zero balances. A client guard rechecks account, chain, component identity, panel visibility and expiry before opening the Privy transaction request. A modal already open in the wallet cannot provide an on-chain expiry guarantee: 0x's accepted execute ABI has no deadline parameter. Release validation must include long user delays and provider/RPC changes.

## Allowances, fees and lifecycle

Approvals are locally constructed for the canonical token and official AllowanceHolder only. The amount is exactly the sale amount, never unlimited. Existing sufficient allowance is reused. USDT with insufficient nonzero allowance requires a zero approval, confirmed receipt, then exact approval, confirmed receipt, then a fresh firm Swap quote. USDC can directly set the exact required amount. Users are told unused permissions remain if they abandon after approval. The code never creates a Settler approval.

There is zero A3 fee, partner fee or spread. No fee parameters are sent and a nonzero provider-reported integrator fee is rejected. The review shows 0x provider fees and estimated network cost where available. Expected and minimum output are shown separately; a minimum weaker than the documented 1% default is rejected. Price impact is omitted because reliable impact data was not established. The displayed indicative rate is the quote's output divided by input, not an independent market-price claim.

The UI distinguishes fetching, indicative quote, permission/reset review, requesting approval, submitted, approval confirmed, fresh firm review, requesting Swap signature, confirming, confirmed, failed and expired. Submission never means completion. Receipt verification independently fetches the chain transaction and receipt and matches sender, target, calldata, value, pinned nonce, hash and successful status. Approval receipts cannot confirm a Swap, including repeated/concurrent checks. A single successful mined receipt is treated as confirmed, not finalized; reorg/finality handling remains a release consideration.

Confirmation shows the actual transaction hash/explorer link and clearly labels output as the quoted amount, not an invented actual receipt. Only Ethereum balances and chain/indexer Activity refresh. Existing Activity does not fully decode all ERC-20/internal Swap legs; no synthetic history is added. Closing/reopening the panel retains pending tracking in the mounted Ethereum workspace. Refreshing the page, signing out or switching networks loses that UI session; check Activity/explorer before another attempt. No local-storage Swap history is introduced.

## Limits and configuration

Same-origin POSTs, authenticated identities, strict keys, 2 KB request bodies, bounded decimal amounts, 20 operations/user/minute and 40 requests/IP/minute limit abuse. Upstream requests have 10-second timeouts, no redirects, no caching and a 512 KB response limit before parsing. The client has a 35-second timeout. Errors are controlled messages; raw provider responses, private URLs and secrets do not reach the UI. Existing service-worker exclusions keep APIs outside caches.

In-process maps are capped at 2,048 entries. Sessions last up to 24 hours for receipt checks; review validity remains 60/30 seconds. Authorize is a single-use state transition with a concurrent-operation lock. Transactions carry a fixed pending nonce, and receipt matching rejects prior transactions with a different nonce. A cold start fails closed on unknown sessions. These are **single-process controls**, not distributed session/rate guarantees. Multi-instance release requires an atomic shared TTL store and shared rate enforcement; production is deliberately blocked in code.

| Variable | Purpose / present task |
| --- | --- |
| `ZEROX_API_KEY` | Server-only existing 0x credential; no local value installed |
| `ETHEREUM_RPC_URL` | Server mainnet RPC supporting balances, allowance, code, registry, simulation, gas, tx and receipt |
| `A3_SWAP_ENABLED` | Explicit opt-in; false in template, unconfigured locally |
| `A3_SWAP_VERIFIED` | Explicit operator validation gate; false in template, unconfigured locally |
| `A3_SWAP_ORIGIN` | Exact HTTPS wallet origin, no trailing slash |
| Existing Privy server configuration | Existing application and secret; unchanged |

There is no invented `ZEROX_ENVIRONMENT` or sandbox chain. This integration uses Ethereum mainnet even when the app runs in a preview environment. Vercel production is hard-blocked regardless of flags. Keep the flags off in all live environments pending the release work; the gated UI says **Swap currently unavailable**. Self-hosted production operators must also keep them off, since `VERCEL_ENV` identifies only Vercel deployments.

Controlled development fixtures require loopback, development mode, `A3_UI_FIXTURE_MODE=1` and no Vercel environment. `/dev/a3-06b` is 404 in production builds. Its deterministic identities, quotes and signer do not call Privy/0x or broadcast transactions.

## Validation and readiness

- 89 deterministic tests pass (67 inherited, 22 additional), covering six pairs, auth/embedded identity, input injection, wrong chain/router/spender, amount/recipient/minimum tampering, simulation formats, exact/zero-reset approvals, receipt sequencing, replay, expiry, balance/gas errors, rate limits, provider errors, user rejection and close-during-authorization.
- Lint and explicit typecheck pass. Production build passes with the inherited optional `@farcaster/mini-app-solana` module warning; no new dependency was added.
- Fresh dependency audit: 23 moderate, zero high or critical; inherited dependency tree unchanged. This is not a clean audit and remains release follow-up.
- Responsive checks: 84 combinations across all 13 requested phone/tablet sizes plus 1440×1000 desktop, covering both networks' actions and Swap entry/estimate/approval/firm review. No horizontal overflow, broken local asset icons or undersized tested controls.
- 34 axe runs across entry/review/approval and 13 loading, balance, expiry, permission, pending, confirmed and failure scenarios at phone/tablet widths: zero violations. Pending close/reopen and signature-request state also verified. No browser errors. Automated Chromium emulation does not replace real iOS/Android/Privy-wallet testing.
- Production-mode boundary checks and static client-secret scan are recorded with validation outputs. No real wallet signing, approval or trade was performed.

**DEVELOPMENT:** ready for deterministic local review and further controlled integration work.

**STAGING:** UI/security fixtures and read-only provider discovery validated. Mainnet-fork simulations, real-device Privy signing behavior, transaction replacement/delay handling and the complete signed flow remain UNVERIFIED. A normal multi-instance Vercel preview needs shared atomic sessions/rate controls before it is a reliable transaction staging environment. No enablement is recommended yet.

**PRODUCTION:** BLOCKED. Keep all execution gates off. Complete the above validation, distributed controls and independent transaction-path security review before a separately authorized release. No production changes were made.
