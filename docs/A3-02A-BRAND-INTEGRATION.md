# A3-02A — approved wallet brand integration

Source: completed A3-05 `ad00a7a3ebb17d13f7e4fad48f75f826cb3d931b`. Branch: `feat/a3-02a-brand-integration`. The A3-03/A3-04/A3-05 foundation is retained. This is visual branding, not the full A3-02 wallet redesign.

A3_Wallet_Brand_Asset_Pack.zip was read and checked against its supplied extracted directory. README.md and CODEX_IMPLEMENTATION.md were followed. All seven installed assets are byte-identical to the approved files. No artwork was recreated, recolored, cropped or regenerated. Supplied SVG wordmark fonts were not modified. No wallpaper or social pack was copied into the wallet.

## Installed assets

| Supplied file | Destination / use |
| --- | --- |
| portal/a3-wallet-horizontal-light.svg | public/brand/a3-wallet-horizontal-light.svg — dark portal header |
| portal/a3-portal-symbol-gradient-1024.png | public/brand/a3-portal-symbol-gradient-1024.png — loading screen |
| login/a3-login-logo-light-transparent.png | public/brand/a3-login-logo-light-transparent.png — dark login screen |
| app-icons/favicon.ico | public/favicon.ico |
| app-icons/icon-192x192.png | public/icons/icon-192x192.png |
| app-icons/icon-512x512.png | public/icons/icon-512x512.png |
| app-icons/apple-touch-icon-180x180.png | public/icons/apple-touch-icon.png |

Login retains Apple, Google and email buttons and their exact handlers. Portal preserves the Ethereum/Tron selector and wallet actions. Header wrapping supports 320px without changing controls. Product labels, page title, app metadata and social metadata say A3 Wallet. Social preview uses the supplied app icon instead of duplicating the website social pack. Approved mineral tones replace the old blue palette and decorative login glow.

Manifest name is A3 Wallet, short_name A3, with supplied 192/512 icons and Obsidian theme/background. Apple touch metadata points to the supplied 180px icon. Icons use purpose=any; no unsupported maskable safe-area claim is introduced. Redundant old brand icons were removed from active public assets.

Service-worker fetch strategy and precache list are unchanged. Cache names are versioned to refresh old installed branding. A pre-existing registration race was fixed: registration runs immediately when load already completed, otherwise on the load event. A regression test covers both timings, listener cleanup and development exclusion. No broader caching redesign was attempted.

## Retained references and functional boundary

- Existing Morsands terms-of-service text on login is unchanged pending separate legal review.
- CNH Financial attribution remains. No legal entity change is claimed.
- wallet.morsands.com remains the metadata base URL; no domain changes.
- Internal package/lockfile names, historical documentation, tests and compatibility references remain unchanged.
- Privy provider file, App ID configuration, auth flow, wallet creation/selection/continuity, Ethereum/Tron hooks, server APIs, token definitions, balances, activity, Send and Receive files are unchanged from A3-05.
- Dashboard differs only in its two footer brand strings. Login click handlers compare equal to baseline. No dependencies or environment files changed.
- No live users/wallets were created, no transaction was executed, and A3 Admin was not modified.

## Local validation

46 tests passed (45 existing regressions plus PWA registration timing). Lint, typecheck and production build passed. Existing optional Privy `@farcaster/mini-app-solana` build warning remains.

Actual Login/Header/Dashboard/Loading components were rendered with synthetic disconnected dependencies and production CSS for visual checks; no authentication bypass or new fixture route was added to the application. Desktop, 390px and 320px screenshots show the supplied artwork without broken assets or document overflow. Ethereum and Tron selector options, selected Tron header, Buy/Send/Receive labels and existing unavailable states were checked. Functional Send/Receive behavior is covered by the unchanged regression suite; visual-review controls are deliberately disconnected.

Local production build served manifest/icons/favicon with HTTP 200. Service worker activated with the new cache versions. Name, short_name, theme, start_url, standalone mode, scope and icon dimensions were checked. No physical-device installation or live Privy login was attempted. The build retains its missing-configuration gate because live Privy configuration was not supplied or changed for this task.

Ready for a separately scoped full A3-02 Wallet UI Redesign. No production deployment, merge, DNS, Vercel configuration, Privy or Admin change.
