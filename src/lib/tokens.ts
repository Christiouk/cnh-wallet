export interface Token {
  symbol: string;
  name: string;
  address: string | null; // null for native tokens
  decimals: number;
  logoUrl: string;
  isNative: boolean;
  chainId?: number;
  coingeckoId?: string;
}

export const CURATED_TOKENS: Token[] = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    address: null,
    decimals: 18,
    logoUrl: '/tokens/eth.svg',
    isNative: true,
    chainId: 1,
    coingeckoId: 'ethereum',
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    decimals: 8,
    logoUrl: '/tokens/wbtc.svg',
    isNative: false,
    chainId: 1,
    coingeckoId: 'wrapped-bitcoin',
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    decimals: 6,
    logoUrl: '/tokens/usdt.svg',
    isNative: false,
    chainId: 1,
    coingeckoId: 'tether',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    decimals: 6,
    logoUrl: '/tokens/usdc.svg',
    isNative: false,
    chainId: 1,
    coingeckoId: 'usd-coin',
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    decimals: 18,
    logoUrl: '/tokens/dai.svg',
    isNative: false,
    chainId: 1,
    coingeckoId: 'dai',
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    decimals: 18,
    logoUrl: '/tokens/weth.svg',
    isNative: false,
    chainId: 1,
    coingeckoId: 'weth',
  },
  {
    symbol: 'LINK',
    name: 'Chainlink',
    address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    decimals: 18,
    logoUrl: '/tokens/link.svg',
    isNative: false,
    chainId: 1,
    coingeckoId: 'chainlink',
  },
  {
    symbol: 'UNI',
    name: 'Uniswap',
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    decimals: 18,
    logoUrl: '/tokens/uni.svg',
    isNative: false,
    chainId: 1,
    coingeckoId: 'uniswap',
  },
];

export const COINGECKO_IDS = CURATED_TOKENS
  .filter(t => t.coingeckoId)
  .map(t => t.coingeckoId as string);

export interface TokenBalance extends Token {
  balance: string;
  formattedBalance: string;
  usdValue?: string;
  usdPrice?: number;
  priceChange24h?: number;
}
