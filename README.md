# A3 core wallet foundation

Branch-only migration from Morsands. No production deployment is included.

The active product is Ethereum mainnet with ETH, USDT ERC-20 and USDC ERC-20. Privy authentication and deterministic embedded-wallet selection are preserved. Send submits one full-amount transaction with no application fee, checks balances/network cost first, and separates submission from receipt confirmation. Receive shows the same resolved Ethereum address. Buy explicitly reports unavailable while the Transak integration awaits a supported server-created session flow.

Removed: Card/Gnosis Pay, Earn/Aave, Bitcoin/Leather, Sell, Fund, Swap/1inch and transaction-desk execution. Tron and Admin are not implemented here.

## Local checks

Use Node 24 and `npm ci`, then `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, `npm audit`. React 19 test-renderer emits a deprecation warning. Privy's optional Farcaster/Solana peer can emit a build warning; it is outside this wallet's active feature scope. Remaining advisories must be triaged before release.

Use `.env.example` for configuration names. Preserve the existing Privy App ID and creation policy. Do not copy secrets into public environment variables. A configured Ethereum mainnet RPC is needed for balances/Send checks; server-only ETHERSCAN_API_KEY is needed for Activity. Missing providers fail explicitly. History is limited to normal Ethereum transactions, excluding incoming token and internal transfers.

See [security boundary and deployment blockers](docs/A3-04-security.md). Authenticated continuity, signing, recovery, full CSP enforcement and provider integration remain release checks. No real transfers, purchases or wallet creation are part of automated tests; fixtures are synthetic.
