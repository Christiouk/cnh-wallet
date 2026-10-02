# A3-09 — Tron creation continuity and read validation

2 October 2026. **TRON CREATION CONTINUITY — PASSED for same-user identity, unchanged historical EVM record/address and exactly one new Tron record.**

Read-only Privy inspection confirmed the same 14 user IDs and all 13 original EVM wallet IDs. There are now 14 wallet records: 13 EVM plus one Tron. The previously verified user has exactly two wallet associations: the exact historical EVM address supplied by the owner and the exact new Tron address supplied by the owner. The sole new Tron wallet record is linked to that same existing user and dated today. No new user, second EVM wallet, duplicate Tron record or replacement wallet record was observed. Full identifiers are kept out of repository documentation.

Migration limitation: the existing EVM record, address and user association remain unchanged and A3 automatic migration is disabled. The dashboard inspected does not expose a conclusive before/after migration-mode audit trail. Do not claim a separately verified migration-history pass from stable record IDs alone.

Ethereum continuity remains PASSED on the owner's three-way proof, reinforced by exact Privy address/record equality after Tron creation. The available Preview tab is signed out; a new live check of connected-signer selection remains pending. Source and automated selection checks pass and are distinct from an authenticated runtime observation.

## Reads

Confirmed root cause: TRONGRID_API_KEY is empty in Preview for branch release/a3-rc2. The deployed adapter deliberately refuses provider access without this server key. Creation does not require TronGrid; therefore creation can pass while balances remain unavailable. Keep this distinction and do not change provider failures into zero or silently introduce a keyless runtime fallback.

Independent public TronGrid mainnet diagnostics, 2 October 2026:
- Account query: HTTP 200, success=true, no activated account; verified 0 TRX and activated=false.
- Canonical USDT balanceOf: after one rate-limited attempt and a later bounded retry, HTTP 200 with a validated 256-bit zero result; decimals() independently returned 6. Verified 0 USDT at that read time.
- USDT TRC-20 activity: HTTP 200, success=true, zero indexed transfers. This does not represent a complete native TRX history.
- Resource query: no allocated resource fields for the inactive address. No sponsorship is assumed.
- Live chain parameters: Energy 100 sun/unit; Bandwidth 1,000 sun/byte; system-contract account-creation fee 1,000,000 sun; account-creation Bandwidth fallback 100,000 sun. Requery before any approval/funding.

These public diagnostic reads are NOT a pass for the deployed authenticated Preview path. The owner was asked to save a TronGrid mainnet API key directly in the branch-specific Preview environment. Then redeploy Preview only, verify reads via the same user, and test zero display alongside provider failure/unavailable. No secrets in chat or repository. Send remains disabled. The 97-test web suite, lint and typecheck pass in this continuation, including zero/partial failure/malformed provider/uncertain creation cases.

## Receive

Owner reports Tron Receive, QR and Copy visible. Source passes the selected Tron address unchanged to QRCodeSVG and clipboard, labels USDT as TRC-20 and TRX as a native asset, and warns against sending USDT ERC-20. Existing automated UI tests confirm these boundaries. Actual rendered QR decoding and clipboard equality for the owner's signed-in Preview remain pending because the accessible tab is signed out; the owner has been asked to leave Receive open. Do not mark source tests as live-device proof.

## Remaining Release 1 work

Tron Send plan is in release-pack/TRON-SEND-VALIDATION.md. Neither funding nor signing/broadcast is authorized or performed. Ethereum real signer test still awaits its separate controlled approval and owner final action. Physical iPhone/iPad/Android rows remain NOT RUN. Native sources and validation bundles are not customer wallet builds; full Xcode and Java remain unavailable on this host. Legal/deletion completion and native dependency/integration security gates remain open. Buy/Swap stay hidden and post-launch; Admin is separate. No Production changes.
