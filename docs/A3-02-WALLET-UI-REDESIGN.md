# A3-02 — Full Wallet UI Redesign

## A. Branch / HEAD

- Repository: Christiouk/cnh-wallet.
- Exact source: `ef151a88cd4e44fb9bb45f3175e9f9b914984436`.
- Branch: `feat/a3-02-wallet-ui-redesign`.
- Final commit and clean-tree evidence are recorded in the task output report.
- Local branch only. No push, merge, deployment, production configuration change,
  live authentication, wallet creation or real transaction was performed.

## B. UX Architecture

A compact header contains the approved A3 lockup, a real Ethereum/Tron selector,
plus an account control. Wallet, Activity and Settings are the only navigation
items; they form a bottom navigation bar on mobile. Addresses live in Receive and
Account, rather than permanently occupying the header.

The wallet opens with its selected network, current-network total, Receive/Send
and a compact asset list. Desktop has a separate recent-activity/context column;
mobile stacks the same content. Dedicated Activity retains the provider's full
supported result set. Settings has identity, addresses, network status, existing
help/privacy/deletion links and Sign out. There are no invented controls.

Network switching continues to mount the corresponding existing Ethereum or Tron
controller. Settings hides, rather than unmounts, wallet content, so background
confirmation checks keep running. Changing networks and identities retains the
existing controller scoping and cleanup.

## C. Visual System

Obsidian, Graphite, Granite, Pale Mineral, restrained Sage and Bronze. Manrope
headings and Inter body typography use system fallbacks. Fonts are requested via
Google Fonts with swap, consistent with the existing external-font approach; no
proprietary font files or new runtime dependencies are added.

Mineral workspace, dark header and sheets, a restrained green balance surface,
editorial rows and generous spacing replace the old glass-card dashboard. Motion
is limited to short sheet entrances and interaction feedback; reduced motion
removes it. Large totals adapt typography; token quantities retain full precision
and gain integer grouping without numerical conversion.

Existing approved horizontal lockup, login asset, loading symbol, favicon and PWA
icons are unchanged byte-for-byte. No logo was redrawn, regenerated or recoloured.

## D. Login

Desktop uses a quiet brand/sign-in split; 390px and 320px stack the same interface.
The supplied login artwork and YOUR ASSETS. YOUR CONTROL. remain prominent.
Unsupported institutional-encryption wording was removed.

Apple, Google and Email call the exact existing OAuth/login callbacks. Tests
verify each callback independently. Privy's provider configuration, App ID lookup,
login methods, automatic-wallet policy and migration policy are byte-identical to
the baseline. No live OAuth or authenticated account was used for testing.

## E. Ethereum

- Portfolio: ETH, USDT ERC-20 and USDC ERC-20 only, from the existing balance hook.
  Loading, zero, unavailable and missing USD pricing remain distinct. Missing
  pricing no longer promotes a fallback ETH zero into the portfolio total.
- Receive: selected EVM address, exact-value labelled QR, full address, Copy,
  Etherscan and explicit Ethereum-only warning.
- Send: asset selection, available balance, recipient, amount, review, network
  estimate and the existing single-transfer signing boundary. No A3 fee.
- Activity: integrated rows with direction, amount where known, network, UTC time,
  status and explorer. The latest-25 normal-transaction limit and lack of ERC-20
  or internal-transfer indexing remain explicit. Failure is never empty history.

## F. Tron

- Portfolio: only USDT TRC-20 and TRX, with existing reads and pricing semantics.
- Enable: explicit Add Tron/Enable Tron and consent screen; no automatic creation.
  Existing creation gate, duplicate protections and identity/EVM continuity checks
  remain unchanged. Gated setup and send remain visibly unavailable.
- Receive: exact selected Tron address, QR/Copy, Tronscan and TRON / TRC-20 warning.
- Send: existing USDT preparation, validation, resource preflight, authorization,
  broadcast, pending recovery and confirmation. Available USDT is visible.
- Resources: existing Network resource required failures remain actionable; TRX
  costs are clearly network costs. Existing energy/bandwidth budgets remain shown.
- Activity: latest 20 indexed USDT transfers, with indexer limitations, indexing
  lag and the separate submitted-transaction confirmation path stated clearly.

## G. Transaction UX

Review, Requesting approval/authorization, Submitted, Confirming, Confirmed and
Failed have distinct text and indicators. A submitted hash is never presented as
success. Confirmation retains amount, asset, recipient, network, hash and explorer.
Failure retains existing recovery actions, with unknown SDK/provider errors
replaced by safe user-facing copy instead of arbitrary technical messages.

Ethereum's controller is exposed as a dependency-injected component for fixtures;
production still supplies the same read function and Privy signer. The actual
validation, preview recheck, fee-increase confirmation, locking, identity checks,
single-signature call and receipt polling are preserved. Tron's transaction
controller changes are presentation-only.

Modal focus trapping yields while Privy signing is requested, allowing the SDK's
own approval dialog to receive focus. This handoff was tested with a disconnected
external-focus probe; live Privy approval remains a separate release check.

## H. Responsive

Browser checks passed at 1600, 1440, 1280, 768, 430, 390, 375 and 320 pixels for
both network contexts (16 home-layout checks). No horizontal document overflow or
broken images was found. Additional 320px checks covered Receive, Send, account,
settings, large totals, tiny balances, long email, full addresses and hashes.

A 320×480 viewport with a focused amount field simulated the space taken by a
mobile keyboard. Sheets stay scrollable within the dynamic viewport, and inputs
use 16px text. A native iOS/Android keyboard was not exercised on physical hardware.

## I. Accessibility / PWA

Eleven axe-core 4.13.0 scans covering home, both Receive sheets, Ethereum review,
Tron review/resources, account, settings and desktop/mobile login report zero
violations against WCAG 2 A/AA, WCAG 2.1 AA and best-practice rules. Gradient
contrast remains a manual-review item, not an automated certification. The
palette's dark/light foregrounds and focus outlines were visually checked.

Keyboard tests cover initial modal focus, Tab/Shift-Tab containment, Escape and
focus restoration. Network names, transfer statuses and directions use text as
well as colour/icons. QRs have accessible titles; addresses are selectable and
copy success/failure is announced. Reduced motion was emulated during validation.

The existing manifest, A3/A3 Wallet names, icon bytes, references and viewport
metadata are unchanged. The baseline worker cached navigation and arbitrary
responses; it did not meet the requested static-only boundary. It now caches an
explicit list of 11 public static files, excludes navigation, API/RSC, query-string,
external and arbitrary-image requests, and deletes the prior page caches.

A local production-mode browser confirmed an active worker in a secure localhost
context, the 11 static cache entries and no cached page. Manifest and icon routes
returned 200. Native OS installation UI was not tested. Offline account pages are
intentionally unavailable; sensitive wallet content is never an offline fallback.

## J. Functional Regression

Unchanged byte-for-byte: all `src/lib`, `src/hooks`, `src/app/api`, the Privy
provider, root layout/metadata, manifest, dependency manifest/lockfile and approved
brand/icon files. This preserves deterministic EVM/Tron selection, no first-wallet
fallback, explicit creation, continuity protections, provider limits, ownership
checks, token allowlists, chain isolation, Send validation and no application fee.

Existing financial and server tests remain present. UI assertions were updated
only for the explicitly requested absence of Buy and revised approval copy. A
new lifecycle test ensures Settings cannot unmount confirmation state.

The protected repositories remain clean and unchanged:

- morsands-site: `6d2c83b1505b57000161b5500411b61b801027b3`.
- a3-admin: `63fd4b2228d3280df02f1cb8a305f17b5be464ac`.

## K. Branding Audit

Active product UI now says A3 Wallet. The remaining visible legacy login terms
reference and unsupported encryption claim were removed. No Buy placeholder,
Sell, Swap, Cards, Earn, Bitcoin, staking, desk or financial-chat execution is
introduced.

Retained compatibility references are the existing `wallet.morsands.com` metadata
base, `www.morsands.com` support/privacy/deletion destinations, package name and
historical documentation. Existing legal records and support domains are not
rewritten. Privy's hosted UI configuration is intentionally unchanged.

## L. Tests

- Baseline: 46 tests passed before editing.
- Final automated suite: 55 tests, all passing (nine added).
- Lint and TypeScript checks pass.
- Production build passes. The inherited optional Privy
  `@farcaster/mini-app-solana` resolution warning remains; no Solana dependency was
  added merely to hide it. First-load JS is approximately 1.02 MB including the
  existing wallet SDK tree; no bundle-size reduction is claimed.
- Dependency audit: unchanged 23 moderate, zero high, zero critical findings. The
  affected direct dependency is Privy React through transitive dependencies. No
  forced downgrade or lockfile change was applied.
- Browser: 16 network/viewport checks, 11 accessibility scans, Send review and
  status flows, pending recovery, invalid recipient, insufficient balance, resource
  failure, explicit/gated setup, QR/copy, keyboard focus and long-value layouts.
- Browser application errors: none after fixing the SSR/client date-format
  mismatch with explicit UTC display. The inherited optional SDK warning remains.
- PWA tests cover static-only caching and old-cache cleanup, plus real local
  production worker registration/cache inspection.
- Both `/dev/a3-02` and the earlier `/dev/a3-05` return 404 in production mode.
- Asset hashes and protected repositories verified; `git diff --check` passes.

### Disconnected visual fixtures

Run locally with `A3_UI_FIXTURE_MODE=1 npm run dev -- --hostname 127.0.0.1`, then
visit `/dev/a3-02`. It requires development mode, the explicit opt-in, localhost
Host and absence of Vercel. The route uses real application components with
synthetic identities/balances and disconnected read/sign/create adapters. It does
not mount a Privy provider or call wallet APIs. No fixture flag was configured in
production. The fixture toolbar and Next development indicator are not product UI.

Scenarios include mixed, zero, loading, unavailable, large, small, missing/gated
Tron, resources, pending, confirmed, failed, rejected, login and authentication
loading. Screenshots and machine-readable evidence live in the task's `outputs`
directory, outside the runtime application.

## M. Remaining Blockers

No known UI implementation blocker remains. Production release still needs the
separate authenticated Privy/login/recovery check, existing Tron live creation and
transfer validation, dependency-advisory review and broader real-device/Safari
checks. Existing A3-05 provider/creation gates were not changed. Fixture results
are not proof of production transaction availability or native-device installation.

## N. Recommendation

Ready as the UI foundation for **A3-06 — Buy + Swap**, subject to that task's
provider validation and product decisions. A3-06 was not started. This is not a
production deployment approval. No production changes.
