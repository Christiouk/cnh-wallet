export interface Token {
  symbol: string;
  name: string;
  address: string | null; // null for native tokens
  decimals: number;
  logoUrl: string;
  isNative: boolean;
  chainId: 1;
  network: 'ethereum';
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
    network: 'ethereum',
    coingeckoId: 'ethereum',
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    decimals: 6,
    logoUrl: '/tokens/usdt.svg',
    isNative: false,
    chainId: 1,
    network: 'ethereum',
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
    network: 'ethereum',
    coingeckoId: 'usd-coin',
  },
];

export const COINGECKO_IDS = CURATED_TOKENS.filter((t) => t.coingeckoId).map(
  (t) => t.coingeckoId as string,
);

export interface TokenBalance extends Token {
  balance: string;
  formattedBalance: string;
  usdValue?: string;
  usdPrice?: number;
  priceChange24h?: number;
}
