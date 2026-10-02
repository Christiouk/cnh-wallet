# A3-08 Dependency Review

Fresh npm audits, 2 October 2026. No dependency versions changed. Each repo has 23 moderate package findings, zero high/critical. These are propagation of two advisory roots, not 23 distinct exploit mechanisms. All listed packages are in the production dependency graph; none is dismissed as build-only or false positive.

Root A: decode-uri-component <=0.4.2 denial of service from malformed input; installed 0.2.2 via query-string 7.1.3 / WalletConnect. Fixed 0.5.0 is ESM-only while the consumer is CommonJS. No compatible drop-in patch established.

Root B: uuid <11.1.1 buffer-bound checking in v3/v5/v6. Installed 8.3.2/9.0.1 via MetaMask utilities/SDK. Patch is a major upgrade; no patched 8/9 release found. A3 does not directly invoke these vulnerable APIs. Optional connector paths increase the graph, while A3 selects embedded wallets. This lowers observed practical exposure but is not proof of unreachability.

No safe bounded package patch was identified. Do not globally force ESM or uuid major overrides, downgrade Privy to npm audit’s suggested older version, or migrate frameworks just to remove counts. Track upstream compatible SDK updates and repeat account-continuity tests before adopting them. Owner/security acceptance or a validated compatible fix is required for the retained risks.

| Repo | Package | Direct/transitive | Relevance | Patch decision |
|---|---|---|---|---|
| wallet | `@gemini-wallet/core` | Transitive | Runtime graph; inherited through @metamask/rpc-errors | Compatible upstream dependency repair required; retained |
| wallet | `@metamask/rpc-errors` | Transitive | Runtime graph; inherited through @metamask/utils | Compatible upstream dependency repair required; retained |
| wallet | `@metamask/sdk` | Transitive | Runtime graph; inherited through @metamask/sdk-communication-layer,uuid | Compatible upstream dependency repair required; retained |
| wallet | `@metamask/sdk-communication-layer` | Transitive | Runtime graph; inherited through uuid | Compatible upstream dependency repair required; retained |
| wallet | `@metamask/utils` | Transitive | Runtime graph; inherited through uuid | Compatible upstream dependency repair required; retained |
| wallet | `@privy-io/react-auth` | Direct Privy SDK | Runtime graph; inherited through x402 | Compatible upstream dependency repair required; retained |
| wallet | `@reown/appkit` | Transitive | Runtime graph; inherited through @reown/appkit-controllers,@reown/appkit-pay,@reown/appkit-scaffold-ui,@reown/appkit-ui,@reown/appkit-utils,@walletconnect/universal-provider | Compatible upstream dependency repair required; retained |
| wallet | `@reown/appkit-controllers` | Transitive | Runtime graph; inherited through @walletconnect/universal-provider | Compatible upstream dependency repair required; retained |
| wallet | `@reown/appkit-pay` | Transitive | Runtime graph; inherited through @reown/appkit-controllers,@reown/appkit-ui,@reown/appkit-utils | Compatible upstream dependency repair required; retained |
| wallet | `@reown/appkit-scaffold-ui` | Transitive | Runtime graph; inherited through @reown/appkit-controllers,@reown/appkit-ui,@reown/appkit-utils | Compatible upstream dependency repair required; retained |
| wallet | `@reown/appkit-ui` | Transitive | Runtime graph; inherited through @reown/appkit-controllers | Compatible upstream dependency repair required; retained |
| wallet | `@reown/appkit-utils` | Transitive | Runtime graph; inherited through @reown/appkit-controllers,@walletconnect/universal-provider | Compatible upstream dependency repair required; retained |
| wallet | `@wagmi/connectors` | Transitive | Runtime graph; inherited through @gemini-wallet/core,@metamask/sdk,@walletconnect/ethereum-provider | Compatible upstream dependency repair required; retained |
| wallet | `@walletconnect/core` | Transitive | Runtime graph; inherited through @walletconnect/utils | Compatible upstream dependency repair required; retained |
| wallet | `@walletconnect/ethereum-provider` | Transitive | Runtime graph; inherited through @reown/appkit,@walletconnect/sign-client,@walletconnect/universal-provider,@walletconnect/utils | Compatible upstream dependency repair required; retained |
| wallet | `@walletconnect/sign-client` | Transitive | Runtime graph; inherited through @walletconnect/core,@walletconnect/utils | Compatible upstream dependency repair required; retained |
| wallet | `@walletconnect/universal-provider` | Transitive | Runtime graph; inherited through @walletconnect/sign-client,@walletconnect/utils | Compatible upstream dependency repair required; retained |
| wallet | `@walletconnect/utils` | Transitive | Runtime graph; inherited through query-string | Compatible upstream dependency repair required; retained |
| wallet | `decode-uri-component` | Transitive | Runtime graph; advisory root | Module-format breaking 0.x upgrade; retained |
| wallet | `query-string` | Transitive | Runtime graph; inherited through decode-uri-component | Compatible upstream dependency repair required; retained |
| wallet | `uuid` | Transitive | Runtime graph; advisory root | Major uuid upgrade; retained |
| wallet | `wagmi` | Transitive | Runtime graph; inherited through @wagmi/connectors | Compatible upstream dependency repair required; retained |
| wallet | `x402` | Transitive | Runtime graph; inherited through wagmi | Compatible upstream dependency repair required; retained |
| admin | `@gemini-wallet/core` | Transitive | Runtime graph; inherited through @metamask/rpc-errors | Compatible upstream dependency repair required; retained |
| admin | `@metamask/rpc-errors` | Transitive | Runtime graph; inherited through @metamask/utils | Compatible upstream dependency repair required; retained |
| admin | `@metamask/sdk` | Transitive | Runtime graph; inherited through @metamask/sdk-communication-layer,uuid | Compatible upstream dependency repair required; retained |
| admin | `@metamask/sdk-communication-layer` | Transitive | Runtime graph; inherited through uuid | Compatible upstream dependency repair required; retained |
| admin | `@metamask/utils` | Transitive | Runtime graph; inherited through uuid | Compatible upstream dependency repair required; retained |
| admin | `@privy-io/react-auth` | Direct Privy SDK | Runtime graph; inherited through x402 | Compatible upstream dependency repair required; retained |
| admin | `@reown/appkit` | Transitive | Runtime graph; inherited through @reown/appkit-controllers,@reown/appkit-pay,@reown/appkit-scaffold-ui,@reown/appkit-ui,@reown/appkit-utils,@walletconnect/universal-provider | Compatible upstream dependency repair required; retained |
| admin | `@reown/appkit-controllers` | Transitive | Runtime graph; inherited through @walletconnect/universal-provider | Compatible upstream dependency repair required; retained |
| admin | `@reown/appkit-pay` | Transitive | Runtime graph; inherited through @reown/appkit-controllers,@reown/appkit-ui,@reown/appkit-utils | Compatible upstream dependency repair required; retained |
| admin | `@reown/appkit-scaffold-ui` | Transitive | Runtime graph; inherited through @reown/appkit-controllers,@reown/appkit-ui,@reown/appkit-utils | Compatible upstream dependency repair required; retained |
| admin | `@reown/appkit-ui` | Transitive | Runtime graph; inherited through @reown/appkit-controllers | Compatible upstream dependency repair required; retained |
| admin | `@reown/appkit-utils` | Transitive | Runtime graph; inherited through @reown/appkit-controllers,@walletconnect/universal-provider | Compatible upstream dependency repair required; retained |
| admin | `@wagmi/connectors` | Transitive | Runtime graph; inherited through @gemini-wallet/core,@metamask/sdk,@walletconnect/ethereum-provider | Compatible upstream dependency repair required; retained |
| admin | `@walletconnect/core` | Transitive | Runtime graph; inherited through @walletconnect/utils | Compatible upstream dependency repair required; retained |
| admin | `@walletconnect/ethereum-provider` | Transitive | Runtime graph; inherited through @reown/appkit,@walletconnect/sign-client,@walletconnect/universal-provider,@walletconnect/utils | Compatible upstream dependency repair required; retained |
| admin | `@walletconnect/sign-client` | Transitive | Runtime graph; inherited through @walletconnect/core,@walletconnect/utils | Compatible upstream dependency repair required; retained |
| admin | `@walletconnect/universal-provider` | Transitive | Runtime graph; inherited through @walletconnect/sign-client,@walletconnect/utils | Compatible upstream dependency repair required; retained |
| admin | `@walletconnect/utils` | Transitive | Runtime graph; inherited through query-string | Compatible upstream dependency repair required; retained |
| admin | `decode-uri-component` | Transitive | Runtime graph; advisory root | Module-format breaking 0.x upgrade; retained |
| admin | `query-string` | Transitive | Runtime graph; inherited through decode-uri-component | Compatible upstream dependency repair required; retained |
| admin | `uuid` | Transitive | Runtime graph; advisory root | Major uuid upgrade; retained |
| admin | `wagmi` | Transitive | Runtime graph; inherited through @wagmi/connectors | Compatible upstream dependency repair required; retained |
| admin | `x402` | Transitive | Runtime graph; inherited through wagmi | Compatible upstream dependency repair required; retained |

Sources: [decode-uri-component advisory](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr), [uuid advisory](https://github.com/advisories/GHSA-w5hq-g745-h8pq).
