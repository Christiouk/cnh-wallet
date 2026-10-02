# TRON FIRST-CREATION TEST — READY FOR OWNER APPROVAL

This is a prepared controlled procedure, not authorization or an executed creation.

Action after explicit approval: enable the creation prerequisite only in the protected testing configuration and invoke the existing Enable Tron action once for the SAME verified existing Privy user. The driver calls createWallet({chainType: 'tron'}) only after an explicit confirmation, authenticated server gate, fresh user lookup, per-user browser lock and persistent attempt marker. It then checks user identity and unchanged EVM wallet associations.

Ethereum remains untouched: no EVM creation, replacement, reassignment, import, migration, signing, transfer or deletion. Snapshot the existing DID and EVM association privately immediately before creation and compare afterward.

Expected Tron address: one new Privy-generated valid Tron Base58Check address beginning with T, associated with that same existing user. **Its exact address cannot be known before Privy generates it; no address will be invented or preselected.** Record the returned address privately after creation and verify deterministic selection and same-user ownership.

Expected aggregate result, if no unrelated changes occur: 14 existing users, 13 original EVM wallet records unchanged, 1 new Tron wallet record, 14 total wallet records. Compare record identities as well as counts. Stop on any unexpected DID/EVM change, duplicate, migration, missing result or more than one new record. An uncertain creation must be rediscovered, not retried automatically.

No transaction or funds are involved in creation. No TRX funding, activation payment, USDT transfer, approval, signing or resource spending is part of this step. An unfunded/generated Tron address may not yet be activated on-chain; do not fund it automatically to make a balance query succeed.

Execution prerequisites still outstanding: explicit owner approval; an available signed-in verified account; safely provisioned server-only Preview Privy authentication for the existing app (currently the Preview App Secret is deliberately blank); A3_TRON_CREATION_ENABLED in that test configuration only. Leave A3_TRON_SEND_ENABLED=false and all Buy/Swap gates off. No Production environment or Privy dashboard wallet policy changes. Do not print/copy secrets into reports. Configuration setup must not itself create a wallet.

After creation and continuity pass, obtain separate approval for any resource funding or signer transaction. Test USDT TRC-20 contract/network, TRX resource estimates, fee cap, transaction expiry, exact wallet/hash, cancellation, ambiguous submission and confirmed receipt using deterministic fixtures before any real action. Creation success alone is not Tron signing/resource readiness.
