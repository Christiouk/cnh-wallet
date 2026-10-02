# TRON SEND TEST — READY FOR OWNER APPROVAL

This is a proposed controlled plan, not permission to transfer, sign, broadcast, activate or fund. Execution additionally requires a working authenticated Preview provider, a named owner-controlled destination and a fresh resource quote. No funds have moved. The agent must hand the final financial actions to the owner.

## Exact proposed transfer

- Network: Tron mainnet.
- Asset: canonical USDT TRC-20, contract TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t, 6 decimals.
- Sender: the single new embedded Tron wallet attached to the same verified existing Privy user; the historical EVM wallet is untouched.
- Test amount: **0.01 USDT = 10,000 base units**. This is the proposed practical test amount, not a protocol minimum; 0.000001 USDT is the smallest representable unit but is less useful for manual display checks. Network resource cost does not fall proportionately with token amount.
- Destination: one existing owner-controlled Tron address, different from sender and USDT contract, already activated, preferably already holding USDT. The owner must identify and verify its exact address before an executable approval; do not invent one or use an exchange deposit address with minimum-credit restrictions. A3 rejects self-transfers on Tron.
- A3 application fee: zero. No token approval transaction; one transfer call only.
- Proposed maximum network-spend budget for the USDT test: **20 TRX**, separate from the test amount and any external funding fees. This is a proposed cap, NOT a measured minimum or guarantee. Stop if the fresh conservative review exceeds it; never silently raise it to the application's higher hard ceiling.

## Activation, TRX and resources

The new address is presently unactivated with verified 0 TRX and 0 USDT in independent read-only queries. **Yes: activation and funding are required before this implementation can send.** A small native TRX deposit from an existing owner-controlled account can activate it; receiving USDT alone is not the activation procedure. Do not perform that deposit automatically.

A normal activating TRX transfer currently charges its sender an additional 1 TRX account-creation fee and, when applicable, 0.1 TRX account-creation Bandwidth fallback. These charges are separate from the TRX credited to the new wallet and any exchange withdrawal fee. The received amount can be tiny, but tiny activation-only funding does not cover the subsequent USDT test. Recheck network parameters and sending-wallet quote before owner approval. [TRON account activation](https://developers.tron.network/docs/account)

A USDT contract transfer consumes **Energy and Bandwidth**. No sponsorship, staking or rental is assumed. A3 currently requires a conservative liquid-TRX fallback even when resource quotas are present. Its minimum funded-TRX check for the precise quoted transfer is:

`ceil(simulated_energy_used × 1.2) × current_energy_price + 1,000 × current_bandwidth_price` sun.

Observed rates were 100 sun/Energy and 1,000 sun/Bandwidth byte, so the formula at that snapshot is `ceil(E × 1.2) / 10,000 + 1` TRX. **E cannot be truthfully supplied yet**: the sender is unfunded and no destination is approved. It depends on the actual transfer/recipient/contract state. Do not present a generic Energy estimate as this wallet's exact minimum. Re-simulate after funding and before signing. [TRON resource payment](https://developers.tron.network/docs/paying-for-resources), [TronWeb estimation](https://tronweb.network/docu/docs/advanced/energy-bandwidth)

Proposed funding envelope, requiring separate owner action: at most **20 TRX net** to the new wallet, plus **0.01 USDT net** for the test, from existing owner-controlled funding sources. External source fees and activation costs must be quoted and separately accepted; exchange minimum withdrawals can exceed these tiny amounts. Do not create new accounts, buy assets or move assets from the historical EVM wallet as a workaround. The exact minimum is the fresh formula above; the 20 TRX deposit is a capped working budget, with unused TRX remaining in the wallet. If that budget is insufficient, stop for a revised explicit approval.

## Expected sequence

1. Provider ready; same DID, unchanged EVM and one selected Tron wallet verified. Owner supplies/validates destination and approves the test/funding limits. Owner performs any approved funding; wait for activation and confirmed balances.
2. Prepare Preview-only signing configuration after this approval: server intent secret and Send gate; Production unchanged. A configuration change is not permission to broadcast.
3. Owner enters 0.01 USDT and the verified destination. Server reads confirmed balances, checks activation/resources, simulates, fetches current fee rates, builds the unsigned transaction and seals the exact user/wallet/recipient/value/fee/expiry.
4. Review full destination, amount and maximum network budget. Client verifies canonical contract, transfer calldata, owner, network, hash, encoded bytes and expiry; fresh account continuity checks precede signing.
5. Owner performs the final Privy authorization/signing action. It can proceed to broadcast in the same UI flow; do not click it merely to inspect a signature. Server recovers/validates the signer and broadcasts the reviewed transaction only.
6. One hash moves through submitted/confirming. A solidified receipt must show SUCCESS and the exact USDT Transfer event for the expected sender/recipient/10,000 units. Broadcast acceptance alone is not success. Confirm both balances and unchanged identity after finality.
7. On rejection, expiry, timeout or ambiguous submission, stop; inspect the same transaction hash. Never silently rebuild, re-sign or retry a payment. A failed execution may still consume fees.

Live approval is still required for funding and the real send. Creation approval does not authorize either. No physical-device or signer pass is inferred from this document.
