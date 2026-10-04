# A3 Apple and device sign-in

Apple is the primary button. Face ID / Touch ID uses Privy's existing passkey login API; it never calls passkey signup. Email remains under “Other ways to sign in”. Unsupported browsers keep Apple and email available. Cancelled or failed device/OAuth flows show a safe retry/fallback message without provider internals.

Settings offers authenticated `linkApple` and `linkPasskey` operations. These add a method to the signed-in Privy account. They do not create a user, request wallet creation, merge users, or unlink recovery methods. Already-linked methods are shown as connected. Credential enrolment must be completed by the account owner.

The original Privy application, Ethereum/Solana `createOnLogin: off`, automatic migration disabled, wallet selection and all Send gates are unchanged. Tron remains explicit and is not created by authentication. Privy manages restoration of valid sessions; no new token storage, forced logout, repeated OTP effect or session lifetime override is added. Pages, authentication and APIs remain outside the PWA static cache.

## Controlled Production validation

- Reuse the existing Apple provider configuration. Verify Apple OAuth with the owner; stored configuration alone is not proof of a working login.
- Enable Passkeys in the original Privy application's Authentication → Login methods. This is a separate configuration change, not credential enrolment or MFA enrolment.
- Keep `A3_CONTROLLED_RELEASE=true` while the existing owner's linking and continuity tests are pending. Both Apple and email enforce existing-user-only login; device login cannot sign up. Outside the controlled release restriction Apple can sign up new users, retaining the existing no-automatic-wallet-creation policy.
- While signed in via the existing email account, open Settings and connect Apple. Compare the existing Privy identity and deterministic Ethereum/Tron addresses before logging out.
- Sign out, use Apple, and compare the same identity and addresses. Stop and roll back for any unexpected identity, wallet change or duplicate. Do not automatically merge users.
- While signed in, set up Face ID / Touch ID. The owner completes the device prompt. Sign out, use that method, and compare identity and addresses again.
- Confirm email OTP fallback, valid-session reopen, iPhone Safari, installed PWA, iPad and Mac Safari. Platform biometrics/screen lock are device-controlled; capability detection cannot prove that a usable credential exists on that device.
- Check users/wallet counts and auth/runtime/CSP errors after each controlled flow. Do not sign or transfer assets as part of this auth test.

Rollback the deployment immediately on inaccessible login, Privy initialization failure, identity/wallet mismatch or duplicate user. Restore any newly changed Privy login-method configuration separately if needed; deployment rollback does not revert Privy settings. Preserve email fallback and existing credentials.

Automated coverage validates callback routing, no enrolment on mount, existing-user signup restrictions, linked-method guards, unsupported-device fallback and safe errors. Real Apple OAuth, credential enrolment and Apple-device continuity remain owner-interactive tests, not automated PASS claims.
