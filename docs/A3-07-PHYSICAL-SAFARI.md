# A3 RC1 physical Safari release checklist

Status: NOT PERFORMED. Automated Chromium screenshots do not satisfy this gate.

Run separately on an actual iPhone (Safari and installed PWA), iPad portrait and iPad landscape. Record device model, iOS/iPadOS version, browser/PWA mode, RC commit/deployment, pass/fail and evidence for each item. Never use customer funds for a test. Keep Buy/Swap/Tron Send gates closed until their separate approvals are complete.

- [ ] Owner-authenticated protected Preview opens; no production domain is assigned.
- [ ] After Privy recovery and approved isolation, existing-account login returns the same DID and existing embedded addresses; no signup, migration or automatic wallet creation.
- [ ] Email/OTP and Send keyboards leave fields, validation and primary controls visible; zoom/text size and safe areas remain usable.
- [ ] Network switch labels assets and addresses correctly; Ethereum and Tron QR codes encode the full displayed address; copy/paste reproduces it exactly.
- [ ] Receive, Send, Buy and Swap sheets open/close, scroll, trap focus, dismiss via the intended controls and return to the right network.
- [ ] Send amount/recipient validation and review remain legible; resources-required, unavailable, rejected and pending states are honest. No mainnet signing or broadcast in this checklist.
- [ ] Rotate iPad while a form/sheet is open; orientation preserves state and touch targets.
- [ ] Install PWA from Safari, launch standalone, verify icon/name/safe areas, logout/reopen, and verify no cached account data offline.
- [ ] With separately verified Transak staging only, a user gesture opens checkout; a blocked popup has a useful recovery path; cancellation/back/return restores the right wallet/network and refreshes without claiming unconfirmed success.
- [ ] Back/forward navigation, background/resume and connection loss leave no stale executable quote or misleading transaction status.
- [ ] VoiceOver labels, focus order, contrast and touch targets checked manually.

Sign-off requires every applicable row passed on all three device/orientation combinations. Provider-dependent rows remain BLOCKED until the required staging configuration exists; do not mark them N/A merely to pass the gate.
