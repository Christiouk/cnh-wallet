'use client';

import { useEffect, useState } from 'react';
import { CURATED_TOKENS } from '../lib/tokens';
import { formatBalance } from '../lib/utils';
import { parsePortfolioResponse, type PortfolioState } from '../lib/wallet/balances';

export function usePortfolioBalances(userId: string | undefined, address: string) {
  const [revision, setRevision] = useState(0);
  const key = userId && address ? `${userId}:ethereum:${address}:${revision}` : null;
  const [scope, setScope] = useState({ key, generation: 0 });
  // Invalidate on every identity transition, including A -> logout -> A.
  // Adjust during render so an old result cannot flash before effect cleanup.
  if (scope.key !== key) setScope({ key, generation: scope.generation + 1 });
  const generation = scope.generation;
  const [result, setResult] = useState<{ key: string; generation: number; state: PortfolioState } | null>(null);
  // A previous user's/network's balance is never returned during an effect transition.
  const state: PortfolioState = !key ? { status: 'unavailable' }
    : scope.key === key && result?.key === key && result.generation === generation
      ? result.state : { status: 'loading' };

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    let cancelled = false;
    async function load() {
      let next: PortfolioState;
      try {
        const response = await fetch('/api/balances', {
          method: 'POST', signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ walletAddress: address, tokens: CURATED_TOKENS.map(({ symbol, address }) => ({ symbol, address })) }),
        });
        if (!response.ok) throw new Error('Balance request failed');
        next = parsePortfolioResponse(await response.json(), CURATED_TOKENS);
        if (next.status === 'ready') {
          next = { ...next, balances: next.balances.map(token => ({ ...token, formattedBalance: formatBalance(token.balance, token.decimals) })) };
        }
      } catch {
        next = { status: 'rpc-error', message: 'Unable to load balances. Please try again.' };
      }
      if (!cancelled) setResult({ key: key!, generation, state: next });
    }
    void load();
    return () => { cancelled = true; controller.abort(); };
  }, [key, address, generation]);

  return { state, refresh: () => setRevision(value => value + 1) };
}
