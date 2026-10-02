# Ethereum core validation and controlled signer procedure

## Evidence already completed

The 97-test wallet suite passes. It covers ETH (18 decimals), USDT and USDC (6 decimals), canonical contracts/chain 1, malformed provider data, zero versus unavailable, identity-change invalidation, explicit embedded signer selection, duplicate-click prevention, balance/gas simulation failures, increased-fee reconfirmation, rejecting invalid amounts/recipients, and receipt hash/status/block validation. The Send boundary calls Privy sendTransaction once with the resolved address and chain 1. ERC-20 sends use transfer, not approve; no fee-transfer transaction is added. Real signing is not inferred from mocks.

Live follow-on is pending the owner's signed-in RC2 browser session. Do not log in as another account. Compare raw ETH/USDT/USDC balances at an identified block through a read-only mainnet provider; record block and equality, not private amounts in GitHub. Verify loading, refresh, failure and retry without replacing errors with zero. Portfolio is requested with the deterministically selected wallet address and scoped by DID/address.

Receive: compare full displayed address and copied text locally with the verified reference. Decode the QR on a second device and require exact address equality; confirm Ethereum and ERC-20 labels. QR scan must not submit a transfer. Test clipboard rejection in synthetic tests and real copy on iOS/Android. Do not overwrite a real account's state to induce errors.

Activity: this RC2 has no Etherscan key; honest ACTIVITY_UNAVAILABLE is expected, not empty success. Configured history requires a separately supplied Preview-only key and live comparison. Current route reads normal Ethereum transactions; full USDT/USDC token-transfer history is not established and must not be promised as complete.

## Exact proposed minimal real signer test — NOT AUTHORIZED / NOT EXECUTED

Purpose: establish that the actual existing embedded signer can send and obtain an on-chain receipt. Privy's application sendTransaction path may sign and broadcast together; no automated click may cross that boundary under this task.

- Environment: protected RC2, original app, same verified user and historical embedded EVM wallet.
- Network: Ethereum mainnet, chain ID 1.
- Asset/amount: ETH, 0.000001 ETH (1,000,000,000,000 wei).
- Sender: verified existing embedded EVM address.
- Recipient: that exact same owner-controlled address (self-transfer); no new address or user is needed. Confirm the full address privately before approval.
- Data: none. No token approval, ERC-20 transfer, fee transfer, Buy or Swap.
- Maximum network fee proposed: 0.0001 ETH. Stop before signing if the displayed total network fee exceeds this cap or the account lacks the amount plus fee. Re-estimate immediately before confirmation; increased cost requires fresh review.
- Owner first approves these exact parameters, then reviews and performs the final Privy signing/transaction action themselves. Capture only redacted outcome in shared documentation.
- On rejection, timeout or ambiguous result: stop and inspect nonce/Activity/explorer; never blindly resend.
- Pass: same sender, chain, recipient and value; one transaction hash; receipt status 1 and mined block; no new user/wallet. A self-transfer returns the value to the same address but consumes gas. This is not a no-cost test.

An ETH pass proves the signer/native transfer path, not the live USDT/USDC execution path. Their calldata/decimals/error paths remain synthetically validated until a separately approved token test is run. No transaction is requested now merely to open this document.
