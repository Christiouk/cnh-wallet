# Core wallet asset artwork

A3-02A reviewed the existing `eth.svg`, `usdt.svg` and `usdc.svg`. Their historical origin was not recorded, so these three files are now normalized to identifiable upstream originals. `trx.svg` fills the missing Tron artwork. No runtime icon package or remote image requests are used.

Source: [Spot / Cryptocurrency Icons](https://github.com/spothq/cryptocurrency-icons/tree/1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color), pinned commit `1a63530be6e374711a8554f31b17e4cb92c25fa5`. This established open-source icon library supplies recognisable Ethereum diamond, Tether T, USD Coin dollar/rings and Tron triangular marks in their identity colours. These are library renditions, not a claim that A3 authored the marks or that the issuers endorse A3.

The upstream [CC0 licence](./LICENSE-cryptocurrency-icons.md) is included. SVG bytes are unmodified; the UI sizes them without recolouring. Brand/trademark ownership remains with the respective owners.

| Asset | Local file | Pinned source | SHA-256 |
| --- | --- | --- | --- |
| Ethereum / ETH | `eth.svg` | [SVG](https://raw.githubusercontent.com/spothq/cryptocurrency-icons/1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/eth.svg) | `1f94df8533f61806f7b17eaf9cd28678cdba66e1d82a9ca8f9fb38d35a907e9c` |
| Tether / USDT | `usdt.svg` | [SVG](https://raw.githubusercontent.com/spothq/cryptocurrency-icons/1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/usdt.svg) | `cddba428a029844888b59bae59c6400ee684b0d51dfc490a4374eef6bb63ea16` |
| USD Coin / USDC | `usdc.svg` | [SVG](https://raw.githubusercontent.com/spothq/cryptocurrency-icons/1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/usdc.svg) | `7281e8cadfe9abc14e98b15b05cdc24cc24d68533a51e746141d4d98f2ca2bc8` |
| Tron / TRX | `trx.svg` | [SVG](https://raw.githubusercontent.com/spothq/cryptocurrency-icons/1a63530be6e374711a8554f31b17e4cb92c25fa5/svg/color/trx.svg) | `5b6b648320b6e99b8e60d447271f753dc9989183e3a07f0300ee44d0743130f0` |

Used by `src/components/ui/AssetIcon.tsx`, with adjacent readable asset/network labels. The core icon map only resolves these four same-origin paths. Ethereum and Tron network icons reuse ETH and TRX respectively. The static service-worker allowlist includes all four; authenticated pages, APIs and provider requests remain excluded.

Other historical token files in this directory are not used by this core icon map.
