'use client';
import { useState, useEffect, useCallback } from 'react';

export interface TokenPrice {
  usd: number;
  usd_24h_change: number;
}

export type PricesMap = Record<string, TokenPrice>;

const REFRESH_INTERVAL = 60 * 1000; // 60 seconds

export function usePrices() {
  const [prices, setPrices] = useState<PricesMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      const response = await fetch('/api/prices');
      if (!response.ok) throw new Error('Failed to fetch prices');
      const data = await response.json();
      if (data.prices) {
        setPrices(data.prices);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('usePrices error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return { prices, isLoading, lastUpdated, refetch: fetchPrices };
}
