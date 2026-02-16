export interface Token {
  symbol: string;
  name: string;
  address: string | null; // null for native ETH
  decimals: number;
  logoUrl: string;
  isNative: boolean;
}

export const CURATED_TOKENS: Token[] = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    address: null,
    decimals: 18,
    logoUrl: '/tokens/eth.svg',
    isNative: true,
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    decimals: 6,
    logoUrl: '/tokens/usdt.svg',
    isNative: false,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    decimals: 6,
    logoUrl: '/tokens/usdc.svg',
    isNative: false,
  },
  {
    symbol: 'WETH',
    name: 'Wrapped Ether',
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    decimals: 18,
    logoUrl: '/tokens/weth.svg',
    isNative: false,
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    decimals: 8,
    logoUrl: '/tokens/wbtc.svg',
    isNative: false,
  },
];

export interface TokenBalance extends Token {
  balance: string;
  formattedBalance: string;
  usdValue?: string;
}
