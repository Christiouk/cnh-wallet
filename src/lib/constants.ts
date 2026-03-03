export const CONTACT = {
  email: 'support@morsands.com',
  support: 'support@morsands.com',
  whatsapp: '+33673356282',
  whatsappUrl: 'https://wa.me/33673356282',
} as const;

export const COMPANY = {
  name: 'Morsands',
  walletName: 'Morsands Wallet',
  tagline: 'Your Keys. Your Assets. Your Future.',
  network: 'Multi-Chain',
} as const;

export const FEE = {
  // 1% service fee on all transfers
  percentage: 1.0,
  basisPoints: 100, // 1% = 100 basis points
  recipientAddress: '0x4Fb6aF0DFF8Ae1536d5Be114b3f4D3c7055df11F',
  label: 'Morsands Service Fee (1%)',
} as const;
