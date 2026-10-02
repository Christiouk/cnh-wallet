# A3-PROVIDER-READINESS

2 October 2026. A3-08; no Production changes.

## Core reads

**Etherscan:** no suitable Preview key is available. Activity must remain explicitly unavailable, not empty. Owner obtains a read-only Etherscan API V2 key and adds server-only `ETHERSCAN_API_KEY` scoped to Preview **and the chosen branch** in the morsands project. Do not select Production, print the value or copy historical credentials. Redeploy that Preview and validate mainnet chainId=1, token/native history, no-history, rate limit and timeout with deterministic non-customer addresses. Record only status/counters. The key must not appear in public assets.

**TronGrid:** `TRONGRID_API_KEY` is missing/blank. The authenticated application additionally needs the existing `NEXT_PUBLIC_PRIVY_APP_ID` and recovered `PRIVY_APP_SECRET`; a read API key alone must not bypass ownership checks. Configure the read key Preview-only after provider approval. Keep `A3_TRON_CREATION_ENABLED=false`, `A3_TRON_SEND_ENABLED=false`, `A3_TRON_INTENT_SECRET` blank. Run controlled TRX balance, USDT contract `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t` balance and confirmed TRC-20 activity reads using deterministic addresses. Never call wallet creation, transaction construction/signing or broadcast as a readiness probe. Existing deterministic tests cover balances, pagination/history, timeouts/unavailable and malformed responses; live authenticated reads remain blocked by access/credentials.

**Ethereum RPC:** a public read endpoint is configured only in isolated Preview overrides. Production provider capacity/rate limits need owner approval. CoinGecko prices can fail independently; missing prices must not manufacture a zero portfolio value.

## Send compatibility

Ethereum `src/lib/wallet/send.ts` validates a nonzero EVM recipient, creates a native transfer or ERC-20 transfer to that recipient, and restricts the chain/assets. Tron `src/lib/tron/core.ts` validates Base58Check addresses, USDT contract/network, signed intent and recipient calldata. Neither contains a Trust Wallet, Ledger, exchange or vendor whitelist. They naturally support compatible external addresses, subject to network and asset support. An exchange can impose deposit minimums or other requirements; users must follow the receiving service's instructions. ERC-20 USDT and TRC-20 USDT are not interchangeable. No WalletConnect/external-wallet control was added.

## Post-launch

Transak/MoonPay Buy and 0x execution are excluded from Release 1. No payment/KYC/fiat collection is introduced. See the separate preserved-development checklists; do not configure them to unblock the Send/Receive release.

Fresh A3-08 direct read probes: Ethereum chainId 1, ETH/USDT/USDC zero balances, unactivated Tron account, empty confirmed USDT activity and USDT constant balance read all returned HTTP 200 for a deterministic non-customer address. These calls used public provider access, not an authenticated Preview account or a newly provisioned key. No signing or broadcast occurred. Constant contract reads may return an unsigned simulation envelope; it is not a transfer request. See `chain-readonly.json` in the validation output.
