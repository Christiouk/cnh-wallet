# A3-03 — Privy continuity and A3 v1 foundation

25 September 2026. Branch: `chore/a3-03-privy-continuity`. Starting commit: `22b2f272dae5af604578df335b7286e783ad49b3`.

## Boundary and source of truth

The fetched `origin/main` and Vercel morsands production deployment `dpl_BpzECLGWhP5uHtCpL6YLhdYxuRUA` both match the starting commit. Authoritative repository: Christiouk/cnh-wallet. Vercel project: morsands (`prj_CLCry1lvk4FqrJUsTYFjvJeKzgc8`). Domain: wallet.morsands.com. Public production Privy App ID: `cmlkt2n7x00wp0cl6diua9vtf`.

Changes are local branch work only. No push, merge, deployment, Vercel/DNS/domain/environment/provider change, wallet creation, identity mutation or blockchain transaction. A branch push could trigger Vercel preview deployment, so it is deliberately not part of this no-deployment task. No A3-04 implementation has begun.

The Privy provider and LoginScreen are unchanged. The provider still takes `NEXT_PUBLIC_PRIVY_APP_ID`, passes no explicit client ID, and retains its existing `users-without-wallets` Ethereum creation policy. The selector never calls any creation API. Keeping that existing policy is not a claim that creation can never occur for a new user; eliminating all automatic creation would change onboarding and requires a separate decision. Existing-user continuity tests must verify no additional wallet appears.

## Deterministic selection contract

`src/lib/wallet/selection.ts` is a pure read-only selector. Types derive from the installed Privy React SDK 3.13.1, rather than a second invented account schema:

- `User.linkedAccounts`: wallet records have `type: 'wallet'`, `chainType`, address, walletClientType, optional connectorType and nullable/optional wallet ID. EVM wallet IDs are not guaranteed on all legacy accounts; an address remains necessary for continuity comparison.
- `useWallets()`: connected EVM signers expose `type: 'ethereum'`, CAIP-2 `chainId`, address, linked status and provider methods. The current connected EVM network is not the wallet's chain family.
- The SDK declaration recognizes `privy` and `privy-v2` for embedded linked wallets. Its connected-EVM wallet-client union contains `privy`; no fabricated Tron ConnectedWallet is used.

Selection requires ready/authenticated user data, exact chain family, an embedded Privy client marker and `connectorType: 'embedded'`. A unique EVM linked account must match exactly one linked embedded EVM signer by case-insensitive address. Original address casing is returned unchanged. No account is selected from `user.wallet` (the SDK calls this the first verified wallet), an external wallet, a cross-app account, a smart wallet or an array position. Tron selection reads its own linked account and never becomes an EVM signer.

Missing metadata fails closed; it is not silently treated as embedded. This conservative rule needs validation on controlled legacy production users. Multiple embedded wallets or duplicate matching connectors yield `ambiguous`, even when one has index zero. Picking the oldest/index-zero wallet would assert an unverified migration mapping. If production users have multiple embedded wallets, establish a verified per-user mapping before adding a selection policy.

States: ready, loading, unauthenticated, missing, ambiguous, unavailable and unsupported-chain. `useEmbeddedWallets` reads Privy data only and centralizes Dashboard, Send, Swap, Earn and Card selection. The last two retain their historical code, but no longer use first-wallet fallback. All existing SDK transaction calls remain explicitly addressed; Swap now binds its previously implicit signer and Ethereum chain to the selected EVM wallet. Fee math/order is untouched.

`getNetworkWalletState` separates account existence from product readiness. Unsupported legacy network choices cannot borrow the Ethereum address. Tron remains deferred even if a linked Tron wallet already exists. No UI flow creates or enables Tron.

## Authentication evidence and required verification

| Path | Confirmed from source | Still unverified |
|---|---|---|
| Email | `usePrivy().login()` opens modal; provider includes email | Dashboard enabled method, delivery, existing user ID and wallet continuity |
| Apple | `useLoginWithOAuth().initOAuth({provider: 'apple'})` | Service ID/team/grouping, allowed origins/redirects, enabled provider, provider subject to existing user mapping |
| Google | `initOAuth({provider: 'google'})` | OAuth client/redirects, enabled provider, subject to existing user mapping |
| Session | SDK ready/authenticated state drives UI; logout already exists | Effective default client, session lifetime, recovery/MFA and re-login behavior |

All three paths initialize the same configured Privy application. That alone does not prove different provider credentials resolve to the same user. A same email string is not proof of linked accounts. Verify the user's linked provider records; use authenticated account linking when adding methods rather than assuming accounts should merge.

The dashboard was inaccessible during A3-00 and no new authenticated dashboard evidence was supplied for A3-03. Do not mark login or account continuity as production-tested. Privy documents automatic wallet creation for modal login, not custom OAuth/whitelabel flows; missing-wallet handling must not “repair” this by silently creating a new EVM wallet.

Before deployment, capture a minimal controlled-user baseline: app ID, user ID, existing EVM address/wallet ID where available, chain family and linked provider identifiers. Keep private user records out of Git. For each authorized login method test logout/re-login, cancellation/retry, session hydration, external-wallet connection, multiple-wallet state and recovery. Compare exact identities before/after; assert no added EVM wallet and no automatic Tron wallet. Verify original domain access before considering new origins. No production configuration or wallet mutation is needed merely to record the baseline.

Official references: [automatic creation](https://docs.privy.io/basics/react/advanced/automatic-wallet-creation), [account linking](https://docs.privy.io/user-management/users/linking-accounts), [app clients](https://docs.privy.io/basics/get-started/dashboard/app-clients).

## Future Tron creation: A3-05 only

The installed `@privy-io/react-auth/extended-chains` declaration exposes:

```ts
import { useCreateWallet } from '@privy-io/react-auth/extended-chains';
const { createWallet } = useCreateWallet();
const { user, wallet } = await createWallet({ chainType: 'tron' });
```

This is documentation only, not mounted application code. The pinned SDK returns an updated React `User` plus the API-types `Wallet` object. Re-read the updated `user.linkedAccounts` through the selector; do not assume the returned API wallet has the ConnectedWallet model. Type-only tests verify that the pinned hook accepts Tron without invoking it. Current official docs likewise describe this extended-chain API and user-owned client creation. [Create a wallet](https://docs.privy.io/wallets/wallets/create/create-a-wallet)

Future intentional creation must require an authenticated/hydrated user, explicit user action and a missing Tron state. Re-fetch linked accounts immediately before creation, serialize attempts per user/chain, block double clicks/cross-tab duplication, and re-fetch after an uncertain response before allowing retry. The installed hook exposes no idempotency-key argument: a UI flag alone is not a cross-device guarantee. Validate provider duplicate-creation behavior and implement authoritative per-user coordination if necessary. If a wallet exists, use it; if multiple exist, stop. Never invoke EVM `createAdditional`, wallet import, migration or recovery as a fallback. The original EVM address must compare unchanged.

Creation, Tron signing, RPC, resource sponsorship and transactions are deferred. The SDK also exposes `useSignRawHash` for extended chains; it is not imported into application runtime here. [Tron recipe](https://docs.privy.io/recipes/tron/transatron)

## Network, balances and transaction state

`src/lib/wallet/networks.ts` declares the A3 product boundary separately from legacy Privy transport configuration:

| Network | Product state | Assets |
|---|---|---|
| Ethereum, eip155:1 | Core foundation | ETH, USDT ERC-20, USDC ERC-20 |
| Tron, tron:mainnet | Deferred to A3-05 | USDT TRC-20; TRX for resource mechanics |
| Base/Polygon/Arbitrum/Optimism/BNB/Bitcoin | Unsupported in the A3 core model | No claim of A3 functionality |

The old token list, Header choices and Privy supportedChains remain physically present for A3-04 classification. Selecting an unsupported Header network now produces an explicit unavailable portfolio, clears the core address and disables core actions; it does not show Ethereum balances under that network. Historical Earn and Bitcoin components remain mounted according to their old conditions and are not made part of the A3 model.

`usePortfolioBalances` scopes results to user + Ethereum address + refresh revision. It cancels requests and ignores late results after user/network changes or unmount. Unavailable selection returns no portfolio. `parsePortfolioResponse` requires a complete set of correctly identified token balances: malformed, missing, duplicate or error rows fail explicitly. A valid numeric zero remains a successful balance. Portfolio UI shows unavailable, not zero, on failures. API error rows return `balance: null`; empty ERC-20 responses fail instead of masquerading as zero. Real RPC `0x0` remains zero.

This is the narrow core balance-state fix, not a complete RPC security redesign. RPC chain attestation, rate limiting, full API schemas, price freshness and historical Earn/Bitcoin error handling remain A3-04 work. Etherscan V1 activity remains broken as documented in A3-00.

`transactions.ts` defines a chain-correlated intent and draft/review/awaiting-signature/submitted/confirmed/failed states. It includes asset contract and decimals, user/sender identity, destination, base-unit amount, resource/network-cost estimate, transaction hash and timestamps. It is not yet a submission engine. No application-level transfer fee is a requirement of the new model. Future runtime validation, signer revalidation during long operations, simulations, receipts and retries belong in A3-04/05.

## Feature and file inventory

These are target classifications, not assertions that every core feature is production-ready. No major feature file is deleted in A3-03.

| Classification | Files/components | Treatment |
|---|---|---|
| ACTIVE A3 CORE | `src/providers/PrivyProviderWrapper.tsx`, `src/components/LoginScreen.tsx`, `src/app/page.tsx` | Preserve application identity/login and validate real provider mappings. |
| ACTIVE A3 CORE | `src/hooks/useEmbeddedWallets.ts`, `src/lib/wallet/selection.ts` | Read-only wallet identity/selection boundary. |
| ACTIVE A3 CORE | `src/components/Dashboard.tsx`, `BalanceCard.tsx`, `TokenList.tsx`, `src/hooks/usePortfolioBalances.ts`, `src/lib/wallet/balances.ts`, `src/app/api/balances/route.ts` | Portfolio and explicit balance states. |
| ACTIVE A3 CORE | `src/hooks/usePrices.ts`, `src/app/api/prices/route.ts`, `src/components/PriceTicker.tsx` | Price infrastructure; scope ticker symbols to supported assets later. |
| ACTIVE A3 CORE | `src/components/ReceiveModal.tsx`, `SendModal.tsx`, `SwapModal.tsx`, `TransakModal.tsx` | Retain infrastructure; harden transaction and provider boundaries before release. |
| ACTIVE A3 CORE | `src/components/TransactionHistory.tsx`, `src/app/api/transactions/route.ts` | Replace deprecated Etherscan V1 and add token history in A3-04. |
| ACTIVE A3 CORE | `src/lib/wallet/networks.ts`, `transactions.ts`, `src/lib/tokens.ts`, `src/lib/utils.ts` | Separate new Ethereum/Tron model from legacy token inventory. |
| ACTIVE A3 CORE | `src/components/Header.tsx`, `ActionButtons.tsx` | Retain shell; remove legacy network choices and Sell/Fund/Card navigation in A3-04. |
| ACTIVE A3 CORE | `src/components/Modal.tsx`, `LoadingScreen.tsx`, `ServiceWorkerRegistration.tsx`, `src/app/layout.tsx`, `globals.css`, `public/manifest.json`, `public/sw.js` | Shared UI/PWA; future brand/cache changes, no redesign here. |
| DEFERRED | Tron creation/receive/send/history/resources; automated Sell; optional external-wallet funding | No runtime creation or financial implementation in this task. |
| REMOVE IN A3-04 | `src/app/card/page.tsx`, `src/hooks/useGnosisPay.ts`, all three `src/app/api/gnosis-pay/*/route.ts` | Remove navigation and direct route/API access, then archive; hiding navigation alone is insufficient. |
| REMOVE IN A3-04 | `src/components/EarnPanel.tsx`, `BitcoinPanel.tsx` | Unmount from Dashboard, remove related selectors/imports, then archive. |
| REMOVE IN A3-04 | `src/components/TradeModal.tsx`, Sell handler/state in Dashboard, Sell icon/action in ActionButtons | Remove WhatsApp order generation and all transaction-entry links, not just the label. |
| REMOVE IN A3-04 | Fund action/icon/`useFundWallet` in ActionButtons; unsupported Header networks | Keep Buy and Receive as the only funding actions; no disconnected-looking supported-network menu. |
| REMOVE IN A3-04 | Transaction-execution contact links, desk fields in `src/lib/constants.ts` and `.env.example` | Remove financial desk semantics; support contact can remain separately. |
| ARCHIVE / HISTORICAL | `src/components/NotesPanel.tsx`, `ContactPanel.tsx`, `SupportTickets.tsx` and desk/reference helpers | Keep history; redesign support separately if needed, never as execution infrastructure. |
| ARCHIVE / HISTORICAL | Existing Morsands logos/icons, `public/tokens/btc.png` and non-core token icons; old brand fields in constants | Replace/archive through brand work; do not delete asset history now. |

Build/config files, package manifests, Tailwind/PostCSS, test tooling and this document support ACTIVE A3 CORE. Existing optional Gnosis env names are historical, not a dependency of the new wallet model. No live variables were read or changed in this task.

## Sell and Fund decisions

Sell returns only after an automated off-ramp has validated partner/jurisdiction coverage, user eligibility, fees, finality and reconciliation. A3-04 should remove Sell from ActionButtons and Dashboard handlers/modals, disable every desk execution entry and archive TradeModal; ordinary customer support must not silently remain a trade desk.

The pinned Privy SDK supports funding conveniences including external-wallet transfer and provider on-ramps (funding-method types include external, MoonPay and Coinbase on-ramp). These may offer a guided transfer/amount experience, but this repository only calls `fundWallet({address})`, without demonstrating unique provider coverage or Tron support. There is no established need for a third top-level funding action. Remove Fund in A3-04; evaluate any useful provider experience within Buy or Receive later. Do not remove Privy itself because the Fund button is redundant.

## Complete fee dependency map and removal recommendation

| Location | Current fee dependency |
|---|---|
| `src/lib/constants.ts` | `FEE` recipientAddress, percentage=1 and basisPoints=100 are the effective code source. |
| `src/components/SendModal.tsx` | Local CNH_FEE constants; Number-based 1%/99% calculation; fee transaction first, recipient second; fee hash, confirmation, progress, success and explorer UI. Two gas payments and a retry can collect another fee. |
| `src/components/SwapModal.tsx` | Quote hardcodes 99/100; execution uses FEE.basisPoints, sends fee before approval/swap; USD estimate uses FEE.percentage; progress and UI hardcode 1%. Removing only FEE.percentage leaves incorrect quotes/execution. |
| `src/components/EarnPanel.tsx` | Withdraw first, then a separate 1% ERC-20 transfer; hardcoded 0.01/1% display. Whole feature is out of scope for A3 v1. |
| `src/components/TradeModal.tsx` | USD percentage/net calculation and WhatsApp message/fee labels; no automated settlement. Whole execution flow must leave A3. |
| `src/components/BitcoinPanel.tsx` | Imports FEE but does not implement fee collection; archive with Leather functionality. |
| `.env.example`; existing Vercel CNH_FEE_PERCENT/CNH_FEE_WALLET entries | Names suggest runtime controls, but current code uses constants instead. Do not rely on changing env values to disable fees. Live entries untouched. |
| `src/components/TransakModal.tsx` | Comment describes provider partner revenue; actual commercial fee setting is external to this code and unverified. It is separate from the application transfer-fee transaction. |

A3-04: make Send a single transfer of the entered amount, budget network gas separately, remove the fee transaction and fee-specific UI/hash/retry assumptions. Make Swap quote and execute the full entered amount, remove every fee step and 99% calculation, and separately disclose validated provider/network costs. Archive Earn/Trade and remove their fee imports. Remove FEE configuration only after all consumers are gone; retire unused env names through a separately authorized configuration change. Add tests proving no application fee-recipient transaction, full recipient/swap amount, insufficient-gas handling, cancellation, provider rejection and safe retry. Do not keep the unsafe two-transfer model as a product requirement. Consider fees later only with an independently reviewed atomic/provider-level mechanism.

## Validation and known limitations

Baseline: `npm ci --ignore-scripts`, TypeScript and production build succeeded. Original `npm run lint` prompted for configuration rather than running a check. No test script/suite existed.

Added pinned ESLint 8.57.1 + eslint-config-next 14.2.35 and react-test-renderer 18.3.1 for reproducible local checks. The runtime direct dependency versions remain unchanged. Adding tooling also resolves four shared transitive packages to newer compatible versions: call-bind, es-object-atoms, hasown, is-core-module. Lock metadata/order is retained for other existing packages. Clean `npm ci --ignore-scripts` verifies lock consistency. No wallet SDK, Next or React upgrade is included.

Tests cover existing EVM selection, external-wallet exclusion/order invariance, ambiguity, EVM/Tron separation, missing wallets, readiness/logout, unmatched/unlinked/duplicate connectors, non-mutation, unsupported/deferred networks, SDK Tron input compatibility, real zero versus bad balance data, API error/null responses and async account-switch/late-response cleanup. Only mocked RPC and synthetic users are used. No production authentication, wallet creation, signing, financial action, native/PWA browser or recovery test was performed.

Lint reports two pre-existing Swap hook dependency warnings, reproduced against the exact original Swap source using the new linter. Keep them visible for the A3-04 quote-lifecycle repair rather than suppressing them. Build also reports stale Browserslist data. A3-00 dependency vulnerabilities, fee-first behavior, missing 1inch integration, deprecated history and other broader security findings remain open. This branch is a foundation, not a production release approval.

Final local validation: 15/15 tests passed; `npm run typecheck` passed; `npm run lint` passed with the two baseline warnings above; `npm run build` passed (11 static pages generated); `git diff --check` passed. The React review covered effect cleanup, identity-scoped async state, hook usage, status accessibility and explicit signer selection.
