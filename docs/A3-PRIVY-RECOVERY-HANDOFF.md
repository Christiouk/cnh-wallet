# A3-PRIVY-RECOVERY-HANDOFF

2 October 2026. A3-08; no Production changes.

## Recovery request — prepared, not sent

Restore the owner's administrative access to the **existing** A3/Morsands Privy application `cmlkt2n7x00wp0cl6diua9vtf`. No App Secret is included here.

Ownership context: GitHub `Christiouk/cnh-wallet`; Vercel team `chris-projects-27bbf881`, project `morsands` (`prj_CLCry1lvk4FqrJUsTYFjvJeKzgc8`). Existing wallet domain `wallet.morsands.com`; public site `www.morsands.com` / `morsands.com`. Repository and Vercel project access were observed; these are supporting evidence, not a substitute for Privy's identity verification. Supply any additional ownership proof through Privy's secure channel only.

Required outcome: regain dashboard/admin access while preserving the existing App ID, all existing user DIDs, login-provider mappings, embedded EVM and Tron wallet IDs/addresses, recovery settings, signing ownership/policies and automatic-creation policy. Do not create a replacement application, user or wallet; do not import/rekey/delete wallets, rotate secrets or change allowed origins merely to complete recovery.

## Owner checks after recovery

1. Confirm App ID exactly matches above and existing users are visible. Compare existing account/email/social identifiers and EVM wallet IDs/addresses with prior owner-held records privately.
2. Inspect current creation/recovery policies; client `createOnLogin: off` must remain unchanged. Record any dashboard mismatch before changing anything.
3. Use the owner's **existing** login method and existing account after a safe authorised origin is established. Verify identical DID and wallet addresses before any transaction. Do not create a test user to prove continuity.
4. Inspect existing Tron associations. Missing/ambiguous wallets must remain blocked, never silently replaced.
5. Identify the owner's DID from that existing dashboard user record, match the account login identity and known wallet address, then independently compare the server-verified token subject from the same signed-in existing account. Do not infer the DID from a wallet address or copy another user's DID.
6. Only after both match and the owner approves live Admin access, add that exact DID to server-only `A3_ADMIN_ALLOWED_PRIVY_DIDS` in the intended Admin Vercel environment. Preview testing comes first; leave Production empty until a separate launch approval. Do not add it to NEXT_PUBLIC variables, source, reports or URLs. Verify allowed account passes and another deterministic identity is denied. Roll back by clearing the allowlist.
7. Agree a documented deletion/recovery procedure with Privy before destructive deletion. Test consequences only under a separately authorised plan; current Settings UI only prepares a request.

Until then, live Admin allowlist stays empty, authentication in protected RC previews stays locked and synthetic fixtures remain the validation source.
