// Foundation only; no signer, fee collector, RPC or submission implementation.
export type TransactionIntent = (
  | { network: 'ethereum'; chainId: 'eip155:1' }
  | { network: 'tron'; chainId: 'tron:mainnet' }
) & {
  id: string;
  userId: string;
  asset: { symbol: string; contract: string | null; decimals: number };
  sender: { address: string; walletId?: string };
  destination: string;
  amountBaseUnits: string;
  networkCost?: { asset: 'ETH' | 'TRX'; amountBaseUnits: string; energy?: string; bandwidth?: string; sponsored: boolean };
}

export type TransactionState =
  | { status: 'draft' | 'review' | 'awaiting-signature'; intent: TransactionIntent }
  | { status: 'submitted'; intent: TransactionIntent; hash: string; submittedAt: number }
  | { status: 'confirmed'; intent: TransactionIntent; hash: string; confirmedAt: number }
  | { status: 'failed'; intent: TransactionIntent; hash?: string; reason: string };
