# A3-0X-EXECUTION-GATE

2 October 2026. A3-08; no Production changes.

## POST-LAUNCH / GATED — not a Release 1 blocker

Swap is absent from the live dashboard. The completed implementation and deterministic test fixtures remain; execution stays disabled. A3-07 read-only price/quote evidence is historical and is not signing validation. No approvals or swaps were performed in A3-08.

Future controlled validation requires server-only `ZEROX_API_KEY`, an exact `A3_SWAP_ORIGIN`, and separately approved `A3_SWAP_ENABLED=true` / `A3_SWAP_VERIFIED=true` in an isolated Preview. Production is explicitly denied in the current implementation. Do not use NEXT_PUBLIC credentials.

Before any future release:

- Preserve chain ID 1 and the ETH/USDT/USDC allowlist. This integration calls the Ethereum **mainnet** 0x v2 AllowanceHolder API; it does not have a testnet switch. Synthetic tests do not prove funded execution.
- Verify the selected existing Privy EVM wallet and chain immediately before signing. Confirm recipient, sell amount, minimum output, transaction target/value/calldata and approved AllowanceHolder. Never approve Settler or a provider-supplied arbitrary spender.
- Price lifetime is 60 seconds; firm quote lifetime is 30 seconds in current code. Recheck server expiry and transaction identity at authorisation; no retry may reuse an expired quote.
- Check exact token allowance; approve only the required amount; verify receipt and allowance before continuing. Approval is a separate on-chain action with separate network cost.
- Implement shared single-use sessions, atomic state transitions and durable ambiguity handling. A UI busy flag or process-local Map cannot protect multiple Vercel instances.
- Test account/network changes, duplicate tabs, replay, replacement/revert, timeout, rejection and disconnect. A hash is pending, never success. Reconcile receipts before allowing a new attempt.
- Rollback means disabling both execution flags and removing entry points. It cannot reverse a submitted transaction or revoke an existing allowance automatically. Preserve pending-state reconciliation during rollback.

Current process-local state is acceptable only while execution stays disabled. Shared state, funded execution, provider and regional/store review are post-launch Swap gates, not Release 1 gates.
