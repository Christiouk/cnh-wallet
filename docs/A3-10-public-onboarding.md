# A3-10 public email onboarding

Production email login now allows signup even when the legacy `A3_CONTROLLED_RELEASE` flag remains true. RC continuity remains existing-user-only. Deferred Apple/passkey flows and their configuration are unchanged; email uses the Privy modal and is the Release 1 signup path.

Production config enables the installed Privy SDK's Ethereum `createOnLogin: 'all-users'` mode. In this SDK, this mode skips users who already have either a legacy or current embedded EVM wallet. It creates a wallet only when an embedded EVM wallet is absent, including for an external-wallet-only user. The alternative `users-without-wallets` mode excludes external-wallet-only users, so it would not meet the requirement that every A3 user has an embedded EVM wallet. No app effect calls createWallet, no createAdditional option is enabled, and no additional-wallet or migration API is used. Non-Production creation stays off.

Wallet selection still requires exactly one embedded EVM record and its matching connected wallet. Multiple records fail closed instead of picking one or creating another. Automatic migration remains disabled, automatic Solana creation remains off, and no automatic Tron creation exists.

Tron setup remains an explicit authenticated user action with a confirmation dialog. Both the server's setup preflight and the client's locked creation flow require exactly one existing embedded Ethereum wallet before creating a missing Tron wallet. The existing cross-tab lock, fresh-user checks, persistent attempt marker and post-creation continuity checks remain in place. `A3_TRON_CREATION_ENABLED` enables this explicit setup; it is independent from the still-disabled Tron Send gate.

## Validation and rollback

Record the active Production deployment and both controlled accounts before deployment. Test the existing walletless email account without deleting it. Verify the same user receives exactly one EVM wallet, then have the owner explicitly enable Tron and verify exactly one Tron wallet on that user. Recheck the historical owner's identity and both addresses, and confirm the accounts share no wallets. Test an owner-supplied email absent from Privy to establish self-service signup without dashboard intervention; an existing dashboard-created user alone cannot prove this end-to-end.

Do not treat generic login errors as proof of the signup policy alone. The pre-change browser also showed expired/outdated Cloudflare Turnstile warnings. Reload the current application and observe the actual email OTP result; do not disable CAPTCHA or reduce authentication protections to mask a failure.

Roll back immediately for duplicate/replacement EVM wallets, historical owner identity/address changes, or broad authentication failure. Restore `A3_TRON_CREATION_ENABLED` to its recorded previous value as part of rollback. A deployment rollback does not remove any created users/wallets; never delete or merge them automatically.

No Preview, DNS change, funding, transfer, Buy, Swap, Earn, Admin or post-launch auth work is part of this onboarding change.

References: https://docs.privy.io/basics/react/advanced/automatic-wallet-creation and the installed `@privy-io/react-auth` automatic-creation implementation and type definitions.
