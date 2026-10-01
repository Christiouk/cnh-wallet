import type { Token, TokenBalance } from '../tokens';

export type PortfolioState =
  | { status: 'loading' | 'unavailable' }
  | { status: 'rpc-error'; message: string }
  | { status: 'ready'; balances: TokenBalance[] };

// All-or-nothing: do not present a partial portfolio total as the user's balance.
export function parsePortfolioResponse(data: unknown, tokens: readonly Token[]): PortfolioState {
  if (!data || typeof data !== 'object' || !('balances' in data) || !Array.isArray(data.balances)) {
    return { status: 'rpc-error', message: 'Unable to load balances. Please try again.' };
  }
  const balances: TokenBalance[] = [];
  for (const token of tokens) {
    const matches = data.balances.filter((value: unknown) => {
      if (!value || typeof value !== 'object') return false;
      const row = value as Record<string, unknown>;
      return row.symbol === token.symbol && (token.address === null
        ? row.address === null
        : typeof row.address === 'string' && row.address.toLowerCase() === token.address.toLowerCase());
    });
    const result = matches.length === 1 ? matches[0] as Record<string, unknown> : undefined;
    if (!result || result.error || typeof result.balance !== 'string' || !/^\d+$/.test(result.balance)) {
      return { status: 'rpc-error', message: 'Some balances are unavailable. Please try again.' };
    }
    balances.push({ ...token, balance: result.balance, formattedBalance: '' });
  }
  return { status: 'ready', balances };
}
