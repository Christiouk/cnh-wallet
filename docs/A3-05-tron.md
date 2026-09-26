# A3-05 — Tron development foundation

Status: implementation and synthetic validation only. No deployment, production configuration changes, customer wallet creation, customer data queries, or mainnet transactions. Source: `1024f2b7e9d2a540b1b63bfebdffaa48d4716775`; branch `feat/a3-05-tron-usdt`. The source commit remains the direct parent of this task's commit.

## Account continuity and SDK boundary

The lockfile resolves Privy React **3.45.0**; server identity verification uses `@privy-io/node` **0.35.0**, transaction encoding/recovery uses TronWeb **6.5.1**. Installed declarations were inspected before implementation. Client APIs are `useCreateWallet` and `useSignRawHash` from `@privy-io/react-auth/extended-chains`, plus `useUser().refreshUser()`.

Tron creation is an explicit two-step action for the already authenticated DID. The adapter refreshes linked accounts before creating, serializes same-origin browser tabs with Web Locks, and writes a persistent per-DID attempt marker **before** invoking Privy. After an uncertain response, it rediscovers only; it never clears the marker to retry automatically. Creation then verifies the same DID, the complete existing EVM address/ID set, and the returned/discovered Tron wallet. It never invokes an EVM creation, migration, export or replacement API. Client automatic EVM/Solana creation and migration are disabled. This also means brand-new users without EVM wallets remain in the existing missing-wallet state; onboarding creation is outside this task.

Selection requires exactly one embedded Tron linked wallet with a wallet ID and valid Base58Check address. External wallets cannot substitute. Loading, missing, ambiguous and unavailable states are explicit. The server independently verifies the access token with the existing app and reads the authenticated user's linked accounts before each operation. The app ID remains `cmlkt2n7x00wp0cl6diua9vtf`.

**Limit:** Web Locks and local storage coordinate tabs in one browser profile, not separate devices. The installed creation API exposes no application idempotency key. Cross-device atomic provisioning and Privy's duplicate-creation semantics require live confirmation before enabling creation; multiple discovered wallets always block selection. Clearing browser storage must not be presented as a retry remedy. Support should inspect the existing user first. No dashboard policies were changed.

Official flow reference: [Privy Tron recipe](https://docs.privy.io/recipes/tron/transatron). The implementation uses user-authorized extended-chain raw-hash signing, not delegated server signing.

## Product and receiving

The selector contains exactly Ethereum and Tron. Switching unmounts the previous network workspace and its signing context. Ethereum retains its A3-04 token/send/receive/activity implementation. Tron uses a separate address, balances, USDT activity and USDT transfer flow. Receive encodes the selected Tron address directly in its QR, validates its checksum, and warns users to select TRON/TRC-20 for USDT. Copy failures remain visible. Buy and Swap are absent from Tron.

Tron assets are centrally fixed to TRX (6 decimals) and USDT (6 decimals), contract **`TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`**. Source: [Tether's supported protocols](https://tether.to/en/supported-protocols/), [canonical token explorer](https://tronscan.org/#/token20/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t). Decimals are also checked against the contract on each balance read; a mismatch fails closed. Transak's current public catalogue independently returned the same contract and 6 decimals.

Totals remain per network. USDT/USD and optional TRX/USD prices come from the existing fixed CoinGecko price endpoint. Missing prices show unavailable, never an assumed dollar peg. Cross-network aggregation, asset grouping and the complete rebrand remain A3-02 work.

## Server interface and configuration

`GET /api/tron` returns capability booleans only. `POST /api/tron` supports a strict action set: balances, activity, create (permission check only), prepare, broadcast, confirm. Every POST requires a verified Privy bearer token. Addresses are resolved from that user, not chosen by request input. No client-provided network, contract, RPC URL, or RPC method is accepted.

Server-only variables, all empty/off in `.env.example`:

- `PRIVY_APP_SECRET`: existing application's server credential, never a new application.
- `TRONGRID_API_KEY`: mainnet TronGrid provider credential.
- `A3_TRON_INTENT_SECRET`: independent high-entropy signing secret, at least 32 characters; seals reviews, does not sign blockchain transactions.
- `A3_TRON_CREATION_ENABLED=false` and `A3_TRON_SEND_ENABLED=false`: separate explicit gates.

No secrets were copied from production or configured in Vercel. All provider requests use the fixed `https://api.trongrid.io` host, server-only credential header, no-store caching, 10-second timeouts and fixed operations. Bodies are limited to 12 KB; unknown fields and cross-origin requests are rejected. Best-effort bounded per-process quotas apply by IP and authenticated DID. A shared edge/provider quota is required before exposure at production scale; process-local rate limiting is not a global limit. Errors omit upstream response bodies and credentials. Signing payloads and authorization tokens are never logged.

## Balance and activity semantics

TRX: TronGrid `/v1/accounts/{address}?only_confirmed=true`. A successful empty account result represents an unactivated account with zero native balance. Malformed results are unavailable. USDT: solidified `balanceOf(address)` and `decimals()` calls against the canonical contract. The two asset reads settle independently; a failed USDT read cannot turn into zero or erase a valid TRX balance.

Activity: the latest 20 canonical USDT transfers from TronGrid's confirmed TRC-20 index, with validated hash, asset, decimals, addresses, amount and timestamp. Direction is relative to the selected address. Rows say **Indexed confirmed**, reflecting indexer semantics. Pagination, complete history and TRX history are deferred. Provider failure says **Activity temporarily unavailable**; only a valid empty index response shows no recent transfers. Index data can lag.

References: [TronGrid account reads](https://developers.tron.network/reference/get-account-info-by-address), [TRC-20 history](https://developers.tron.network/reference/get-trc20-transaction-info-by-account-address).

## Sending and confirmation

USDT amounts are parsed as integer base units, maximum 6 decimal places; no floats, exponent notation or rounding. One canonical `transfer(address,uint256)` sends the full entered amount, with **zero A3 application fee**. Self/contract recipients and non-Tron recipients are rejected. Preflight requires verified token/native balances, an activated account, valid simulation and current fee parameters.

The server constructs an unsigned transaction and HMAC-seals the DID, wallet ID, owner, recipient, amount, fee bounds, expiry and transaction. The client checks the review against the form, then validates contract/call/owner/recipient/amount, extra fields, expiry, fee cap, protobuf bytes and hash before invoking Privy with **chainType tron and the selected Tron address**. Fresh user discovery and context checks occur before and after authorization. The server verifies the sealed review and recovers the signing address before attaching the recovery byte. It broadcasts only the server-built transaction; there is no general signing or broadcast proxy.

Stages: form → review → requesting authorization → submitted → confirming → confirmed/failed. The original hash and review persist in session storage across modal close/reload. An uncertain broadcast response continues checking the same hash; it never silently rebuilds or signs another payment. No inclusion result is inferred from broadcast acceptance. Solidified `/walletsolidity/gettransactioninfobyid` must report successful execution **and** the exact canonical USDT Transfer event to the intended recipient for the full amount. An absent receipt is pending; malformed/unreachable confirmation is unavailable, not failed or confirmed. Polling is bounded; reopen the pending transfer or use Tronscan after the polling window. Session storage is not a cross-device transaction journal; users must check Activity before recreating a transfer after losing the browser session.

References: [simulation semantics](https://developers.tron.network/reference/triggerconstantcontract), [TRON confirmation semantics](https://developers.tron.network/docs/confirmation-semantics).

## Resources and sponsorship

The current implementation is a conservative **funded-TRX fallback**. It reads live Energy/Bandwidth fee parameters and account resources; it budgets simulation energy plus 20%, refuses an energy fee cap above 100 TRX, and reserves up to 1,000 bytes of bandwidth at the current byte price. Serialized transaction size is checked against that reserve. Sufficient TRX must cover this full conservative budget even if staked/delegated resources are available. This can reject a resource-rich but TRX-poor wallet intentionally. The review discloses both limits and that actual cost can be lower. Fees can be consumed by failed execution. Simulation is a point-in-time check, not a guaranteed outcome.

An unactivated or inadequately funded account shows **Network resource required**. An additional Privy wallet does not itself prove on-chain activation. Receiving USDT alone is not treated as proof of activation. No automatic activation, TRX purchase, energy rental or sponsor charge occurs.

As checked 2026-09-26, Privy's current recipe still documents Transatron. Its current [documentation](https://docs.transatron.io/) and [FAQ](https://docs.transatron.io/faq) describe resource handling and activation through its transfer service. A3 sponsorship requires a funded Transatron account and a server-only spender API key. The spender key can consume the prepaid sponsor balance, so production needs budgets, abuse protection, reconciliation and key rotation. Activation and resource prices are dynamic; obtain current `/api/v1/config` values and commercial terms rather than promising a fixed fee. These accounts/credentials were not available or created, so no fake sponsor is implemented. The isolated transport/preflight boundary can be extended in a separately approved task.

## Buy readiness checked 2026-09-26

No Buy implementation or live widget session was created. Current official public responses were retrieved read-only, without customer data or partner credentials:

- [Crypto catalogue](https://api.transak.com/cryptocoverage/api/v1/public/crypto-currencies): `USDTtron`, network `tron`, `isAllowed=true`, `isSuspended=false`, canonical contract, decimals 6; GB is not listed as a restricted country in that row.
- [Fiat catalogue](https://api.transak.com/fiat/public/v1/currencies/fiat-currencies): GBP supports GB and is allowed. Active payment IDs: `credit_debit_card`, `apple_pay`, `google_pay`, `gbp_bank_transfer`, `pm_open_banking`.
- [Widget parameters](https://docs.transak.com/customization/query-parameters): the server-created widget session can prefill `walletAddress` and lock it with `disableWalletAddressForm=true`, plus `cryptoCurrencyCode=USDT`, `network=tron`, `fiatCurrency=GBP`, `countryCode=GB`.

This establishes catalogue feasibility, **not guaranteed availability for A3, a particular user/device or amount**. A3-06 needs approved partner credentials, origin configuration, a successful GBP→USDT/tron quote for each intended payment method, UK user-flow/compliance approval, KYC handling, device checks for Apple/Google Pay, verified callbacks/webhooks and order reconciliation. The existing A3-04 CSP and Permissions-Policy also need a reviewed widget/KYC/payment allowance before Buy can operate. Catalogue limits were denominated in USD in the response and must not be mislabeled GBP. Do not display these methods until the actual session/quote allows them. Swap remains separately scoped and disabled.

## Admin read boundary

The separate a3-admin repository is unchanged. A future read-only extension can use: Privy DID; embedded Tron wallet ID; address; network `tron:mainnet`; selection status; USDT/TRX integer base-unit balances with independent ready/unavailable status; activation known/unknown; read timestamp; recent activity status and rows. Admin must perform its own admin allowlist verification and ownership lookup. Do not expose this wallet bearer-token endpoint as an admin-wide endpoint. No admin signing or wallet creation.

## Validation and local fixture

Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm audit`. Tests use deterministic identities and injected providers/signers; signature-recovery testing derives a public address from a fixed test key only inside a test and never uses live credentials or a network signer.

For the browser fixture, start development on loopback with `A3_TRON_FIXTURE_MODE=1` and empty Privy/Tron credentials. Visit `/dev/a3-05`. The page is denied outside development, on Vercel, or with a non-loopback Host. It has synthetic balances/prices and no live Privy/provider connection. Production mode returns 404 even if the fixture flag is set. Fixture inputs and signing success are not evidence of a live Privy transaction.

## Live validation required before enabling gates

1. Recover dashboard access and confirm the existing application/user and unchanged existing EVM address with the account holder. Never guess/create a replacement DID, wallet or application.
2. Confirm extended-chain entitlement, user signing support, automatic-creation policy and safe duplicate-creation semantics with Privy. Establish an approved isolated test application/user or other expressly authorized validation environment; the existing production app ID must not be replaced. This branch hard-pins server auth to the existing app, so an isolated test-app override would require a reviewed follow-up change.
3. Validate actual linked-wallet response metadata, explicit creation, refreshed discovery and unchanged DID/EVM mapping. Complete cross-device idempotency verification before enabling setup generally.
4. Verify TronGrid credentials/quotas and canonical mainnet read responses using an approved non-customer address. Establish separate testnet contract/provider configuration if testnet signing is desired; this branch intentionally accepts only mainnet and contains no hidden testnet override.
5. Validate actual Privy raw-hash authorization/rejection, 64-byte signature/recovery, hardware/mobile behavior, transaction expiration and receipt/event responses using approved test credentials/assets. No mainnet transfer was performed in A3-05.
6. Confirm activation/resource edge cases, changing energy prices, out-of-energy failure, polling after uncertain submission and session loss. Put shared quotas and monitoring in place.
7. Review moderate dependency findings and optional Privy Farcaster build warning before release. Any production deployment or financial test remains separately authorized work.

## Completed development checks

- 45 automated tests pass, including the existing Ethereum suite, authenticated route boundaries, sealed-intent tampering, real cryptographic fixture recovery, wrong-wallet signing rejection, explicit creation/idempotency, exact QR payload, partial balances, resource preflight and confirmation lifecycle.
- Lint passes with no warnings; TypeScript passes; production build passes. The build retains the optional Privy `@farcaster/mini-app-solana` resolution warning; no Solana product dependency was added to silence it.
- Dependency audit: 23 moderate, 0 high, 0 critical. The direct affected dependency reported is Privy React through its transitive tree. The audit's suggested downgrade to 3.6.1 was not applied because it would move away from the installed/current API baseline. These findings need release review, not an untested forced downgrade.
- Browser verification used only the local synthetic page. At 390×844: portfolio, exact address/QR, successful copy, explicit Enable Tron confirmation, network isolation, review, authorization, submitted/confirming/confirmed, resource failure, ambiguous selection and partial-unavailable states were checked. At 320×740: failed receipt and no horizontal overflow were checked. No browser runtime errors or framework error overlay were reported.
- Production-mode local smoke test: `/dev/a3-05` returns 404 even with its flag enabled; `/api/tron` reports all capabilities false with empty credentials.
- No customer login, live wallet creation, mainnet send, deployment, merge or remote production-setting change was used for these checks. a3-admin and morsands-site remain unchanged.
