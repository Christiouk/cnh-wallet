# A3-02A — Mobile/tablet priority and canonical asset icons

## Scope

Refinement of A3-02 on `feat/a3-02-wallet-ui-redesign`, based on `ff8562b61dfd5525452d3f2221eb738171870e22`. Local implementation only. No push, deployment, production configuration change, live sign-in, wallet creation or transaction.

## Mobile and tablet design

- Phones and split-view widths up to 700px use the compact header and bottom navigation. Portrait tablets up to 1100px use the same three destinations: Wallet, Activity and Settings.
- Portrait tablets have generous horizontal spacing, a full-width balance/action area, and a two-column activity/context section where useful. Send and Receive are 60px high on portrait tablets.
- Landscape widths above 800px expand to portfolio/actions on the left and activity/network context on the right. No new product destinations or card mosaics.
- Network selector is 48px high, confirmation/Copy controls at least 54px, asset choices at least 72px and navigation at least 56px. Existing close/account controls remain at least 44px.
- Sheets retain dynamic viewport height limits, internal scrolling, visible focus, Escape dismissal and focus restoration. Reduced-motion behaviour is retained.

## Asset and network identification

Local SVGs for ETH, USDT, USDC and TRX are rendered through the small shared `AssetIcon` component. All four sources and checksums are in [the asset provenance record](../public/tokens/README.md). Previously unattributed Ethereum/Tether/USD Coin files were reviewed and normalized to a pinned, recognizable upstream icon set; Tron was added. No dependency was installed.

Portfolio rows now show token name first, followed by symbol, network and ERC-20/TRC-20 where applicable. Network switching retains the accessible native selector and adds the selected network's artwork beside its name. Text labels carry chain identity independently of the icons or colour.

Ethereum Send presents three large choices with artwork, symbol, Ethereum/native-or-ERC-20 context and exact available quantities. Those choices call the existing selected-symbol state setter. Tron Send remains USDT-only and shows a fixed USDT / Tron / TRC-20 asset row. TRX remains visible as a holding/resource asset; no TRX send functionality was added.

Receive preserves network-level addresses and QR payloads. It displays network and supported asset context, canonical icons, QR, full selectable address, Copy, then the existing network warning. There is no artificial per-token address or new asset-selection behaviour.

## Preservation checks

Ethereum and Tron controller source before their JSX rendering was compared with the base commit and is unchanged, excluding the removed presentation-only selected-balance lookup. No changes to hooks, financial libraries, API routes, provider contracts, wallet selection, Privy, fees or resource calculations. `morsands-site` and `a3-admin` remain untouched.

The service worker only adds the Tron SVG to its existing public static allowlist and increments the cache revision to retire previous icon bytes. Navigation, account pages, API requests, query-bearing requests and third-party requests remain excluded. Cache tests cover the prior revision's deletion and all four core SVG entries.

## Validation

Results and visual evidence are recorded in the companion A3-02A mobile report under the workspace outputs directory. Screenshots use deterministic local fixtures and real presentation components with disconnected adapters. They do not show a real account or live balances.

Native device keyboards, iOS Safari, Privy signing dialogs and production network behaviour are not certified by Chromium viewport emulation. The keyboard check shrinks the viewport and checks that focused recipient/amount inputs remain visible and scrollable.

### Final results

- 56 automated tests passed; lint, typecheck and production build passed.
- 180 screen checks across 18 viewport sizes, two networks and five screens; zero horizontal overflow, broken images or primary targets below 44×44.
- Phones: 320×800, 360×800, 375×812, 390×844, 393×852, 430×932, 412×915. iPad portrait: 768×1024, 820×1180, 834×1194, 1024×1366. iPad landscape: 1024×768, 1180×820, 1194×834, 1366×1024. Split view: 507×1024 and 694×768. Desktop: 1440×1000.
- 30 balance/state checks; keyboard-height recipient/amount entry; invalid recipient; pending transfer; Tron resource warning; long account details; Copy and focus behaviour passed.
- After preventing ERC-20/TRC-20 labels from breaking at their hyphen, repeated 30 phone/tablet screen checks and four large/tiny-balance picker checks passed.
- 15 axe scans: no violations. No browser errors and no wallet API requests from the disconnected fixture.
- Production-mode local verification: four SVG responses HTTP 200, exactly 12 public static cache entries, development fixture blocked with 404. No production deployment.
- Existing optional Privy/Farcaster Solana build warning remains; dependencies were unchanged.

Evidence in workspace outputs: `A3-02A-mobile-report.md`, `A3-02A-mobile-browser-validation.json`, `A3-02A-mobile-pwa-validation.json` and the matching PNGs. Viewport captures cover both networks' Wallet, Receive, Send, Activity and Settings at 320×800, 820×1180 and 1180×820; `.full.png` companions retain full-page views.
