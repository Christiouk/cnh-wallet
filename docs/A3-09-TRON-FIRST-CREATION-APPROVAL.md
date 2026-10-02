> Completed by the owner through A3 UI on 2 October 2026. Same-user/unchanged-EVM/single-Tron continuity verified read-only. Do not repeat creation. See A3-09-TRON-CONTINUITY-RESULT.md for current evidence. The procedure below is retained as the historical approval record.

# TRON FIRST-CREATION TEST — OWNER APPROVED; SETUP PENDING

On 2 October 2026, the owner explicitly approved one controlled first Tron wallet creation for the same verified existing user. Approval is recorded; creation has NOT been attempted or executed. This approval does not cover signing, funding or a financial transaction.

Approved action once execution prerequisites are satisfied: enable the creation prerequisite only in the protected testing configuration and invoke the existing Enable Tron action once for the SAME verified existing Privy user. The driver calls createWallet({chainType: 'tron'}) only after an explicit confirmation, authenticated server gate, fresh user lookup, per-user browser lock and persistent attempt marker. It then checks user identity and unchanged EVM wallet associations.

Ethereum remains untouched: no EVM creation, replacement, reassignment, import, migration, signing, transfer or deletion. Snapshot the existing DID and EVM association privately immediately before creation and compare afterward.

Expected Tron address: one new Privy-generated valid Tron Base58Check address beginning with T, associated with that same existing user. **Its exact address cannot be known before Privy generates it; no address will be invented or preselected.** Record the returned address privately after creation and verify deterministic selection and same-user ownership.

Expected aggregate result, if no unrelated changes occur: 14 existing users, 13 original EVM wallet records unchanged, 1 new Tron wallet record, 14 total wallet records. Compare record identities as well as counts. Stop on any unexpected DID/EVM change, duplicate, migration, missing result or more than one new record. An uncertain creation must be rediscovered, not retried automatically.

No transaction or funds are involved in creation. No TRX funding, activation payment, USDT transfer, approval, signing or resource spending is part of this step. An unfunded/generated Tron address may not yet be activated on-chain; do not fund it automatically to make a balance query succeed.

Execution prerequisites still outstanding: an available signed-in verified account; safely provisioned server-only Preview Privy authentication for the existing app (currently the Preview App Secret is deliberately blank); A3_TRON_CREATION_ENABLED in that test configuration only. Leave A3_TRON_SEND_ENABLED=false and all Buy/Swap gates off. No Production environment or Privy dashboard wallet policy changes. Do not print/copy secrets into reports. Configuration setup must not itself create a wallet.

After creation and continuity pass, obtain separate approval for any resource funding or signer transaction. Test USDT TRC-20 contract/network, TRX resource estimates, fee cap, transaction expiry, exact wallet/hash, cancellation, ambiguous submission and confirmed receipt using deterministic fixtures before any real action. Creation success alone is not Tron signing/resource readiness.

## Secure setup handoff after approval

1. Owner: in Vercel project `morsands`, update the existing `PRIVY_APP_SECRET` override scoped to **Preview only**, Git branch **release/a3-rc2**, with the original app's existing secret. Enter it directly in Vercel as a sensitive/encrypted server variable. Do not send it in chat, put it in a repository, change Production scope, rotate it or create a replacement app. Expected public App ID remains `cmlkt2n7x00wp0cl6diua9vtf`.
2. Once the owner confirms secure provisioning, prepare the protected Preview with `A3_TRON_CREATION_ENABLED=true` only in that branch's Preview configuration. Keep Send, Buy and Swap disabled. A new immutable deployment is required for changed environment values; the old continuity Preview does not acquire them retroactively.
3. Report the new exact Preview origin and verified protection/source. Owner adds only that origin to the original Privy application manually; no wildcard or automated origins changes. Owner signs in with the same verified existing account and leaves that session available.
4. Recheck the same DID and exact historical EVM association privately, fresh user/wallet inventory and absence of an existing Tron wallet. Then invoke the guarded Enable Tron action once. If a Tron wallet already exists, stop creation and inspect continuity instead. Never clear an uncertain-attempt marker to retry.
5. Compare the post-creation DID/EVM identity and new Tron association, record only redacted aggregate evidence, and report separately from Tron signing/resource readiness.

Current handoff: available RC2 tab is signed out. No creation request, signing request or financial transaction was sent. Existing Preview and Production remain unchanged. Owner credential setup is required because the isolated Preview intentionally has no server App Secret; this is a missing execution prerequisite, not a request to approve creation again.
