'use client';
import { useEffect, useMemo, useRef } from 'react';
import { usePrivy, useUser } from '@privy-io/react-auth';
import {
  useCreateWallet,
  useSignRawHash,
} from '@privy-io/react-auth/extended-chains';
import { enableTron } from '@/lib/tron/creation';
import {
  identity,
  selectTron,
  validateTransaction,
  type SendQuote,
  type TronIdentity,
} from '@/lib/tron/core';

export type TronApi = <T>(
  action: string,
  fields?: Record<string, unknown>,
) => Promise<T>;
export type TronDriver = {
  api: TronApi;
  enable(): Promise<void>;
  sign(quote: SendQuote): Promise<string>;
  current(): TronIdentity;
};
export function useTronWallet() {
  const { ready, authenticated, user, getAccessToken } = usePrivy();
  const { refreshUser } = useUser();
  const { createWallet } = useCreateWallet();
  const { signRawHash } = useSignRawHash();
  const current = useRef({
    ready,
    authenticated,
    user,
    getAccessToken,
    refreshUser,
    createWallet,
    signRawHash,
  });
  current.current = {
    ready,
    authenticated,
    user,
    getAccessToken,
    refreshUser,
    createWallet,
    signRawHash,
  };
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const driver = useMemo<TronDriver>(() => {
    const api: TronApi = async (action, fields = {}) => {
      const did = current.current.user?.id;
      const token = await current.current.getAccessToken();
      if (!token || !did || did !== current.current.user?.id || !alive.current)
        throw new Error('Account changed. Sign in again.');
      const response = await fetch('/api/tron', {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, ...fields }),
        signal: AbortSignal.timeout(30_000),
      });
      const value = await response.json();
      if (did !== current.current.user?.id || !alive.current)
        throw new Error('Account changed');
      if (!response.ok)
        throw new Error(value.error?.message || 'Tron temporarily unavailable');
      return value;
    };
    const active = () => {
      if (
        !alive.current ||
        !current.current.ready ||
        !current.current.authenticated ||
        !current.current.user
      )
        throw new Error('Account changed');
      return identity(current.current.user);
    };
    return {
      api,
      current: active,
      async enable() {
        const did = current.current.user?.id;
        if (!did || !alive.current) throw new Error('Sign in again');
        await api('create');
        if (!navigator.locks)
          throw new Error(
            'This browser cannot safely coordinate Tron setup. Use a current browser.',
          );
        await enableTron(
          {
            current: async () => {
              if (!alive.current || current.current.user?.id !== did)
                throw new Error('Account changed');
              const fresh = await current.current.refreshUser();
              if (!alive.current || current.current.user?.id !== did)
                throw new Error('Account changed');
              return fresh;
            },
            create: async () => {
              if (!alive.current || current.current.user?.id !== did)
                throw new Error('Account changed');
              return (await current.current.createWallet({ chainType: 'tron' }))
                .user;
            },
            attempted: (id) =>
              localStorage.getItem(`a3:tron-setup:${id}`) !== null,
            markAttempt: (id) =>
              localStorage.setItem(`a3:tron-setup:${id}`, 'requested'),
            lock: async (id, run) =>
              await navigator.locks.request(
                `a3:tron-setup:${id}`,
                async () => await run(),
              ),
          },
          did,
          true,
        );
      },
      async sign(quote) {
        validateTransaction(quote.intent, active());
        const fresh = await current.current.refreshUser();
        validateTransaction(quote.intent, identity(fresh));
        validateTransaction(quote.intent, active());
        const result = await current.current.signRawHash({
          address: quote.intent.address,
          chainType: 'tron',
          hash: `0x${quote.intent.transaction.txID}`,
        });
        validateTransaction(quote.intent, active());
        return result.signature;
      },
    };
  }, []);
  return {
    userId: user?.id,
    selection: selectTron(user, ready, authenticated),
    driver,
  };
}
