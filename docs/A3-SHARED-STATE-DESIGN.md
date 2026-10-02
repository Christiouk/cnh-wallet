# A3-SHARED-STATE-DESIGN

2 October 2026. A3-08; no Production changes.

## Decision

Recommend **one single-region DynamoDB on-demand table** with conditional writes, expiry attributes and no global table for authoritative rate/replay/session state. This is a minimal managed key/value TTL store, not a product/customer database. Durable conditional state is required if A3 needs cross-instance single-use guarantees. No infrastructure was provisioned and no runtime adapter was implemented in this design task.

Evaluation:

| Option | Decision |
|---|---|
| Vercel KV | Retired product; new Redis uses marketplace providers. Do not design against the old KV product. |
| Upstash Redis | Small HTTP interface and useful shared rate limiting, but documented eventual consistency/async replication is not sufficient by itself for strict financial replay claims under failover. |
| Single-primary managed Redis | Atomic scripts help; eviction, durability and failover write loss still need proof. More operational assumptions than a durable conditional table. |
| Single-region DynamoDB | Selected: conditional create/update, durable item state, strong reads when reconciliation needs them, automatic cleanup. One table and least-privilege server credentials. |

## Adapter contract

`claim(id, ownerHash, requestDigest, expiresAt)`, `transition(id, expectedVersion, expectedState, nextState)`, `read(id)`, `consumeRate(subjectHash, window, limit)`; all return explicit conflict/unavailable/expired outcomes. Use conditional writes as the authority, never GET followed by an unconditional update. Namespace by environment and purpose. Hash identity/IP with a dedicated environment secret; no raw access tokens, private keys, KYC or payment information.

Keys: `buy#ticketDigest`, `swap#sessionId`, `rate#route#subjectHash#window`. Store immutable request/owner/network digests, state, version and server expiry. Keep quote validity separate from cleanup TTL. TTL deletion is asynchronous: every operation checks `expiresAt > now`; never infer validity from existence. A 24-hour replay tombstone must outlive every valid signed ticket/session. Do not recreate an expired ID; use cryptographically random new IDs.

Buy: claim before contacting the provider; transition issued → creating → ready/failed/indeterminate. Persist a provider idempotency key if the provider supports it. A timeout stays indeterminate until status reconciliation; do not release the claim to permit a blind repeat. Without provider idempotency/status guarantees, retain the gate.

Swap: atomically claim price/prepare/authorise steps and bind the exact quote/account/chain. An authorisation cannot be consumed twice. After a transaction hash, reconcile on-chain status; never resubmit on an HTTP timeout. Shared state alone cannot guarantee exactly-once blockchain execution or undo a user-signed transaction.

Rate limits: atomic count with condition below limit in a fixed server-time window; apply per-IP and per-authenticated owner limits, bounded request body, and a separate edge abuse control. For transactions involving multiple items use a transaction. A store outage, ambiguous write, region outage or capacity throttle must fail closed for sensitive actions. Do not fall back to process-local Maps. Single-region outage trades availability for safety; no automatic cross-region writer failover.

Acceptance: two independent processes race 100 claims → one success; expiry despite delayed cleanup; conflicting owner/body; interrupted provider request; lost response; throttling; restart; replay after deploy; no sensitive logs. Prove least-privilege access and deletion/retention controls before enabling.

## Release 1 consequence

Buy/Swap shared sessions are post-launch work. Core server read/proxy endpoints still need cross-instance abuse protection; Tron signing/creation must remain gated until its replay/resource/continuity controls are validated. A shared store does not turn unvalidated signing into a safe release. If all server mutations remain off, do not provision financial state solely for dormant Buy/Swap code.

Sources: [Vercel Redis](https://vercel.com/docs/redis), [Upstash consistency](https://upstash.com/docs/redis/features/consistency), [DynamoDB conditional writes](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ConditionExpressions.html), [TTL cleanup](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/TTL.html), [read consistency](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadConsistency.html). Selection and schema are A3 engineering recommendations, not provider guarantees of end-to-end financial exactly-once execution.
