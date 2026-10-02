# A3-08 validation record

2 October 2026. All financial tests use deterministic fixtures or read-only non-customer addresses. No Privy login, new user/wallet, signing, purchase, swap or broadcast.

| Check | Result / evidence |
|---|---|
| Wallet tests | 95 passed, zero failed; wallet-tests.log. Includes original 93 and deletion/scope regressions. |
| Admin tests | 35 passed, zero failed; admin-tests.log. |
| Lint / typecheck | Wallet and Admin passed; corresponding logs. |
| Builds | Wallet locked Preview and normal Release 1 local builds passed; Admin optimized build and server/client capability boundary checks passed. Landing static build passed. |
| Wallet responsive fixtures | 160 screens across 16 dimensions, 32 state/error cases, 34 axe audits with zero violations; wallet-browser-validation.json. |
| Retained Buy/Swap unavailable fixtures | 48 integrated gated screens; integrated-gates.json. No activation. |
| Admin fixtures | 64 screens across 16 dimensions; 12 axe audits, zero violations; admin-browser.json. |
| Legal / footer | Seven pages (home plus six routes) × seven widths locally and on hosted Preview; 49 axe runs on each, zero violations; legal-browser.json and landing-hosted-final.json. |
| Hosted Wallet | Seven widths and axe checks, locked login, 12 HTTP routes, icons/manifest, all four fixture routes 404, noindex/own-origin metadata, enforced CSP, no Privy requests; wallet-hosted-final.json. |
| Hosted Landing | Six real public application routes, complete footer, correct attribution, no production wallet CTA, own Preview metadata; 12 route/asset/robots checks; landing-hosted-http.json. |
| Core read probes | Ethereum chain/balances and Tron account/USDT balance/activity HTTP 200; deterministic address; chain-readonly.json. Not authenticated end-to-end validation. |
| Local API / PWA | Eight Wallet read-only/error checks; 12 static cache entries only; all four fixture routes rejected in production build. Admin 12 unauthenticated/fixture-cookie denials, no-store and three icon-only cache entries. |
| Dependencies | Wallet 23 moderate, Admin 23 moderate; zero high/critical. Lockfiles unchanged. Full per-package classification in A3-DEPENDENCY-REVIEW.md. |
| Secrets / reference links | Tracked source and public artifact credential-pattern scans clean; local Landing link targets exist. Pattern scans are not proof that every possible secret format is absent. |
| RC / production | All three local and remote release/a3-rc1 hashes unchanged. Production targets/aliases/domains/protection and pre-existing environment record IDs/scopes unchanged; final-safety.json and preservation-secret-checks.json. |

Protected access used temporary deployment-specific Vercel share access for testing. Share tokens were not committed or included in report URLs. Sequential access was necessary: creating a later share link invalidated prior browser access in this account. Earlier browser SSO failures were diagnosed; final Wallet and Landing hosted results above completed successfully. No protection was disabled.

React review: lazy components are declared at module scope; no new conditional hooks; account/network keys and pending transaction lifecycle retained; server-only providers stay server-side; deletion disclosure is keyboard-native, touch-sized and has no automatic side effect.

Not performed: physical iPhone/iPad, authenticated existing-account flow, funded signing/transfers, provider checkout, native signed build/store submission, legally approved deletion completion. These are not recorded as passes.
