# RC2 existing-account continuity Preview

Base: `59037bff13966a5f510d68e8893a42014d64475a`. Branch: `release/a3-rc2`.

This Preview is for a single owner-controlled existing wallet user. It is not release approval. Production, DNS, Privy configuration, Buy/Swap visibility and Tron creation/send gates are unchanged.

The prior Preview lock is lifted only when all four build conditions hold: Vercel Preview environment, exact RC2 branch, `A3_RC_CONTINUITY_ENABLED=true`, and original App ID `cmlkt2n7x00wp0cl6diua9vtf`. Other Previews remain locked. RC2 has an enforced authentication-compatible CSP and remains behind Vercel Authentication. Automatic Git deployments for RC2 are disabled so deployment is explicit and inspected for Preview classification.

All RC2 login methods use the SDK modal with `disableSignup: true`. Existing client settings keep Ethereum/Solana creation off and automatic migration disabled. Deterministic embedded-wallet selection is unchanged. Branch-only Preview environment overrides remove inherited provider secrets and keep Tron creation/send, Buy and Swap disabled. No Privy App Secret is needed for this EVM continuity login.

The owner must add only the exact successful protected Preview origin to the original Privy app. Never add a wildcard. This is an owner action, not an automated configuration change.

Before RC2 authentication, the owner signs into the untouched current Production Morsands wallet using the chosen existing wallet-user account. Its Receive address becomes the independent reference. Read-only inspection must confirm that the same existing Privy user and embedded EVM record match that address. Stop on any mismatch; do not create, reassign or migrate wallets.

After the owner confirms the exact Preview origin was added, validate the same account on RC2. Require equality of Production Receive, existing Privy embedded EVM and RC2 selected/portfolio/Receive addresses; same DID; no new user or wallet; no migration; no automatic Tron creation. No financial transaction is part of this test.

Keep detailed account evidence local and private. Public summaries may state that an existing controlled account, same DID and historical EVM address were verified only after the checks actually pass. Never include account email, DID, full wallet address, tokens or credentials in public PR text.

After Ethereum continuity passes, report `ETHEREUM CONTINUITY — PASSED` and `TRON FIRST-CREATION TEST — AWAITING OWNER APPROVAL`. A first Tron creation requires a separate explicit owner instruction.
