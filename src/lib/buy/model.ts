export type BuyNetwork = 'ethereum' | 'tron';
export type BuyAsset = 'ETH' | 'USDT' | 'USDC';
export type BuyInput = {
  network: BuyNetwork;
  asset: BuyAsset;
  amount: string;
  paymentMethod: string;
};
export type BuyOwner = { did: string; walletId: string; address: string };
export const PAIRS = [
  'ethereum:ETH',
  'ethereum:USDT',
  'ethereum:USDC',
  'tron:USDT',
];
export const METHODS: Record<string, string> = {
  gbp_bank_transfer: 'Bank transfer',
  pm_open_banking: 'Open Banking',
  credit_debit_card: 'Credit or debit card',
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
};
export type PaymentOption = {
  id: string;
  name: string;
  min: number;
  max: number;
};
export type BuyOptions = { address: string; methods: PaymentOption[] };
export type BuyQuote = {
  ticket: string;
  address: string;
  cryptoAmount: number;
  totalFee: number;
  expiresAt: number;
};
export type BuySession = {
  widgetUrl: string;
  ticket: string;
  expiresAt: number;
};
export type BuyStatus =
  | 'started'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'expired'
  | 'unavailable';
export const STATUS_TEXT: Record<BuyStatus, string> = {
  started: 'Purchase started',
  processing: 'Purchase processing',
  completed: 'Transak reports purchase completed',
  failed: 'Checkout failed',
  cancelled: 'Checkout cancelled',
  expired: 'Session expired',
  unavailable: 'Purchase submitted through Transak',
};
