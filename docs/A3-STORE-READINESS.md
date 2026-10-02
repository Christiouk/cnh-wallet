# A3-STORE-READINESS

2 October 2026. A3-08; no Production changes.

## Product and account facts

Owner confirms Apple Developer and Google Play developer accounts already exist as **organizations**, both with other published applications. Account creation/enrolment is **not a blocker**. Console permissions, legal entity match and A3-specific app records remain to be checked during packaging; no accounts were changed or applications submitted.

Release 1: non-custodial Ethereum/Tron Send/Receive, supported assets, portfolio/activity, QR/copy, PWA. Buy/Swap are post-launch, Admin is operational. Do not describe A3 as a crypto seller, payment-card processor, fiat custodian or exchange. General privacy/security processing still occurs.

## APPLE

Completed foundation: responsive legal/support/deletion pages and approved attribution; Settings deletion-request entry; mobile/iPad layouts; existing organization account confirmed by owner.

Intended public URLs (new routes prepared, **not yet published to production**):

- Privacy: `https://www.morsands.com/privacy`
- Support: `https://www.morsands.com/support`
- Terms: `https://www.morsands.com/terms`
- Deletion: `https://www.morsands.com/account-deletion`
- Cookies / company: `/cookies`, `/legal` on that same origin.

Missing: signed A3 archive, App Store Connect app/bundle association and provisioning evidence; validated OAuth/deep-link and existing-account continuity; iPhone/iPad physical checks; reviewed App Privacy answers; actual deletion processing/status; approved public legal URLs; screenshots/icons; review contact and fully reviewable demo/access plan without customer credentials; export compliance/SDK privacy manifests and required-reason API audit. Do not assert the existing native config's encryption declaration is correct without cryptography review.

Wallet apps are subject to Apple's cryptocurrency rules and organization requirement. The confirmed organization account addresses enrolment, not approval of this app. Minimum functionality and all other rules still apply; a bare website wrapper is not automatically eligible. Review region/product scope with legal counsel. Buy/Swap must remain absent from reviewer and customer release builds.

Sources: [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) and [review access](https://developer.apple.com/app-store/review/). The email request boundary is not proof of compliance with [Apple account deletion requirements](https://developer.apple.com/support/offering-account-deletion-in-your-app); complete a safe direct initiation/processing flow or obtain an applicable exception, without guessing one.

## GOOGLE

Completed foundation: same public legal-route implementation, Settings deletion request and external deletion resource, responsive layouts, organization account confirmed by owner.

Missing: signed AAB, verified Play app/package association, current target SDK, Data Safety form and privacy/deletion links, content rating, financial/blockchain declarations, permissions inventory, screenshots/feature graphic, reviewer access instructions, internal/closed testing and device sign-off. Check the existing organization's actual track requirements; do not impose new-personal-account testing rules without evidence.

As checked 2 October 2026, new Android phone/tablet submissions and updates require **API 36+**. Verify generated manifest/build output rather than infer target API from Expo's minimum SDK. [Android target requirement](https://developer.android.com/google/play/requirements/target-sdk).

Google's current country-specific exchange/software-wallet policy explicitly says non-custodial wallets are outside its scope. Confirm the final app's actual custody/signing design and fill the applicable Financial Features Declaration accurately; this is not a blanket exemption from other Google policies or local law. Do not claim a licence or register A3 as an exchange based on dormant Swap code. [Google wallet policy](https://support.google.com/googleplay/android-developer/answer/16329703?hl=en).

Deletion must include account-associated data and a usable external request resource; identity verification and justified retention must be transparent. [Google deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en).

## Privacy / Data Safety inputs — not pre-filled declarations

| Observed data flow | Declaration work still required |
|---|---|
| Privy email/social login, user ID, linked wallet IDs/addresses | Confirm exact SDK collection/sharing, linkage and retention, required vs optional. |
| Blockchain balances, recipients, amounts, hashes | Classify financial/transaction information and public records; identify provider processing. |
| IP/browser/request metadata via hosting and providers | Confirm logs, retention, diagnostics/device identifiers and purpose. |
| Support/privacy emails | Contact information and user-provided message content. |
| Required session storage / PWA static cache / font requests | Inventory actual browser/native runtime behaviour; do not label all storage tracking. |
| Buy KYC / payment-card / fiat information | Not collected for Release 1; no Buy UI or integration activation. |
| Native permissions/SDKs | Re-audit the actual packaged app; web inventory cannot substitute for Expo SDK behaviour. |

Complete linked/not-linked, tracking, required/optional, collection/sharing definitions from each store's current form and provider disclosures. Do not answer “no data collected”.

## Native package inventory

| Platform | Classification | Evidence |
|---|---|---|
| iOS | EXISTS BUT NEEDS UPDATE | Separate `Christiouk/a3-wallet` Expo project, `app.config.ts`, iOS bundle identifier `com.brazhelpsolutions.a3wallet`, tablet support flag; not the integrated cnh-wallet RC. |
| Android | EXISTS BUT NEEDS UPDATE | Same Expo project defines Android package `com.brazhelpsolutions.a3wallet`; no verified AAB/signing/target API evidence. |

Read-only inventory at local commit `92b274de918317810288429a2b3fdb4bb6ca0bab`; GitHub HEAD tree also contains Expo source. No `ios/`, `android/`, `eas.json`, signed distribution artifact or store upload was established in reviewed source. Generated native directories are not required for Expo source to exist, but their absence gives no distribution proof. The project uses Expo 54 / React Native 0.81 and has a separate application implementation; portrait lock, broad audio/video/camera/notification/biometric permissions and legacy Manus integration need review. No changes were made to that separate repo.

## Smallest safe packaging recommendation

Keep the responsive cnh-wallet/PWA release as the product source. First run a small compatibility spike for a minimal native shell using the current wallet, system-browser authentication with validated callbacks and tightly scoped navigation. Reuse existing organization/package ownership only after verifying it. Evaluate the existing Expo shell versus a thin Capacitor wrapper; do not migrate to the older parallel wallet implementation or fork Send/Receive business logic. Privy embedded-wallet session, secure storage, recovery, signing, external links and PWA/native lifecycle must be proven on real devices before choosing the shell. A generic WebView wrapper is not a store-readiness shortcut. Remove unused native permissions/SDKs; do not implement a large native rewrite in A3-08.

## Submission blockers

Actual native package and signing validation; existing-account continuity; core Send/Receive and Tron signer/resources; physical devices; deletion processing and legal approval; accurate privacy/declarations; production publication of approved legal URLs in a separately authorised launch. Organization-account creation, Transak, 0x execution and live Admin are **not** Release 1 blockers. PWA availability does not prove either store will accept the app.
