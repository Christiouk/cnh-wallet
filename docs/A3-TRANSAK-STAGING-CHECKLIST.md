# A3-TRANSAK-STAGING-CHECKLIST

2 October 2026. A3-08; no Production changes.

## POST-LAUNCH / GATED — not a Release 1 blocker

The owner locked Release 1 to non-custodial Send/Receive. Buy is absent from the live Ethereum and Tron dashboards. Transak development is preserved; this checklist records future work, not launch prerequisites. No purchases, payment details, KYC documents or fiat funds were handled.

If Transak is reconsidered after launch:

1. Obtain a current partner-issued **staging** API key and secret; verify the account and API version with the provider. Historical NEXT_PUBLIC_TRANSAK values are not evidence of validity.
2. Set only server-side Preview variables: `TRANSAK_ENVIRONMENT=staging`, `TRANSAK_API_KEY`, `TRANSAK_API_SECRET`, exact `TRANSAK_REFERRER_ORIGIN`, dedicated `A3_BUY_TICKET_SECRET` (at least 32 characters). Never copy Production secrets. Keep `A3_BUY_STAGING_ENABLED=false` until validation is explicitly authorised.
3. Have the provider approve the exact Preview referrer/return domain. Verify protected-Preview redirect/cookie behaviour without weakening deployment protection.
4. Confirm partner-specific UK/GBP eligibility, payment methods and each pair independently: `ethereum:ETH`, `ethereum:USDT`, `ethereum:USDC`, `tron:USDT`. Populate `A3_BUY_VERIFIED_PAIRS` only with individually proven pairs.
5. Prove destination and network are locked in the server-created session; query-string defaults alone do not establish locking. Confirm checkout cannot replace the selected address/network.
6. Exercise cancellation, expiry, rejected session, provider timeout and return paths with provider-approved sandbox identities. A return URL is not purchase success; provider order state and on-chain receipt must be distinguished.
7. Replace process-local single-use state with the shared conditional store in A3-SHARED-STATE-DESIGN.md. Resolve indeterminate provider responses without creating another checkout blindly.
8. Repeat legal, privacy, regional eligibility, CSP, physical-device and store review before any activation. Production is blocked by current code; changing that requires a separate task.

## Future provider choice

Transak is not the committed future provider. Evaluate MoonPay hosted checkout after launch: A3 supplies a verified asset/network/destination; the provider handles payment/KYC and delivery directly to the user's wallet; return does not imply completion. Apple Pay, if supported and approved for that customer/region, belongs inside MoonPay's checkout. Do not build A3 as the Apple Pay merchant or collect card credentials, KYC documents or fiat. No MoonPay integration was implemented or vendor eligibility verified in A3-08.
