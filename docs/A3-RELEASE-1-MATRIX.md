# A3 Release 1 scope and readiness

2 October 2026. Latest owner scope lock governs. Decisions below are release intent, not activation approval.

| Feature | Release decision | Current readiness / gate |
|---|---|---|
| Privy login / existing account | INCLUDE IN RELEASE 1 | BLOCKED: recovery and existing DID/wallet continuity. |
| Ethereum portfolio | INCLUDE IN RELEASE 1 | PARTIAL: synthetic/live read probes pass; owner-account mapping/provider capacity required. |
| Ethereum Receive / QR / Copy | INCLUDE IN RELEASE 1 | PARTIAL: deterministic UI/address checks pass; existing-account and physical-device verification required. |
| Ethereum Send (ETH, USDT, USDC) | INCLUDE IN RELEASE 1 | PARTIAL: simulation/validation/lifecycle tests pass; existing signer and physical-device path unverified. No real transfers performed. |
| Ethereum Activity | INCLUDE IN RELEASE 1 if configured | BLOCKED: server-only Etherscan key and authenticated end-to-end check. |
| Tron portfolio / Receive / USDT TRC-20 | KEEP GATED until continuity validated; intended for Release 1 | PARTIAL: synthetic validation and public read connectivity pass; recovered auth and read-provider configuration missing. |
| Tron Send | KEEP GATED until signer/resource path validated; intended for Release 1 | BLOCKED: ownership/signing/resource/expiry/receipt path needs controlled validation. No new wallets or signatures. |
| Tron Activity | INCLUDE IN RELEASE 1 if provider configured | BLOCKED: authenticated provider setup. Unavailable is never displayed as empty. |
| TRX | INCLUDE IN RELEASE 1 where operationally required | Network-resource/balance context; no newly promised native TRX Send feature. Current Tron Send implementation is USDT TRC-20. |
| PWA / mobile / iPad | INCLUDE IN RELEASE 1 | PARTIAL: automated responsive/cache checks pass; physical Safari install/lifecycle sign-off missing. |
| Buy / Transak | KEEP GATED / POST-LAUNCH | Hidden from live dashboard; code preserved; not a launch blocker. Future MoonPay evaluation separate. |
| Ethereum Swap / 0x | KEEP GATED / POST-LAUNCH | Hidden from live dashboard; execution disabled; not a launch blocker. |
| Tron Swap | EXCLUDE FROM RELEASE 1 | Not implemented. |
| Cross-chain | EXCLUDE FROM RELEASE 1 | Not implemented; never treat different networks as interchangeable. |
| Admin | KEEP GATED, separate operational tool | Preview platform issue and verified owner DID remain; neither is a customer Release 1 dependency. |

Compatible external recipients (Trust Wallet, Ledger, exchanges and other valid addresses) are ordinary on-chain Send destinations. No vendor whitelist or WalletConnect is needed. Match recipient asset/network and receiving-service requirements.

## Updated readiness

| Area | Status | A3-08 change |
|---|---|---|
| Release scope | READY | Buy/Swap hidden; future work preserved. |
| Protected Wallet Preview | READY for locked smoke | New Preview, noindex/CSP/gates/PWA validated; no live auth claim. |
| Protected Landing Preview | READY after hosted evidence | Public app routes and footer implemented; production publication still excluded. |
| Existing-account continuity | BLOCKED | Prepared precise recovery handoff; requires Privy/owner. |
| Core chain correctness | PARTIAL | Deterministic tests and non-customer read probes pass; signer/authenticated gates remain. |
| Activity providers | BLOCKED | Exact Preview configuration documented; no Production credentials copied. |
| Security/CSP | PARTIAL | Locked Preview enforced; live authenticated CSP, distributed abuse controls and dependency acceptance remain. |
| Legal / deletion | PARTIAL | Pages and request boundary implemented; operator review, mailboxes, retention and actual deletion processing need approval/verification. |
| Physical devices | BLOCKED | Short owner checklist ready; no physical tests claimed. |
| Apple / Google organization accounts | READY (owner-confirmed) | Existing organizations with published apps; creation removed from blockers. |
| Native distribution | PARTIAL | Expo projects exist but need alignment, signed builds, SDK/permissions and device validation. No store submission. |
| Admin Preview / owner DID | BLOCKED operationally | First-deployment platform rule; allowlist remains empty. |
| Buy / Swap | READY to remain excluded | No Release 1 configuration/execution dependency. |

## Lean release outcome

The owner's scope lock is the lean release: core wallet + PWA, with activity where configured and Tron only when continuity/signing prerequisites pass. This removes Transak onboarding, Buy KYC/payment, 0x approvals/execution and financial session state for those dormant features from the customer launch critical path. Admin is separate. It does not waive core wallet, privacy/deletion or physical-device requirements. Do not silently ship unvalidated Tron to satisfy the feature list; return the remaining gate to the owner.

Store submission is a separate channel gate: native signing/package and store review do not establish web-wallet safety, and a working PWA does not establish store readiness.

**PRODUCTION NO-GO** pending remaining core/manual gates. No activation or Production deployment authorised/performed by this report.
