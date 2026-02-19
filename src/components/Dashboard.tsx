'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import Header from './Header';
import BalanceCard from './BalanceCard';
import ActionButtons from './ActionButtons';
import TokenList from './TokenList';
import ContactPanel from './ContactPanel';
import NotesPanel from './NotesPanel';
import SupportTickets from './SupportTickets';
import ReceiveModal from './ReceiveModal';
import SendModal from './SendModal';
import TradeModal from './TradeModal';
import { CURATED_TOKENS, TokenBalance } from '@/lib/tokens';
import { formatBalance, generateReferenceCode } from '@/lib/utils';

export default function Dashboard() {
  const { user } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();

  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showReceive, setShowReceive] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [showBuy, setShowBuy] = useState(false);
  const [showSell, setShowSell] = useState(false);
  // === LIVE CNH STABLECOIN PRICE WIDGET ===
  const [cnhPrice, setCnhPrice] = useState<number | null>(null);
  const [cnhChange, setCnhChange] = useState<number | null>(null);

  useEffect(() => {
    const fetchCNHPrice = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/coins/axcnh');
        const data = await res.json();
        setCnhPrice(data.market_data.current_price.usd);
        setCnhChange(data.market_data.price_change_percentage_24h);
      } catch (err) {
        console.error('CNH price fetch failed', err);
      }
    };

    fetchCNHPrice();
    const interval = setInterval(fetchCNHPrice, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);
  // Get wallet address from Privy
  const walletAddress = (() => {
    // Try embedded wallet first from useWallets
    if (walletsReady && wallets.length > 0) {
      const embedded = wallets.find((w) => w.walletClientType === 'privy');
      if (embedded) return embedded.address;
      return wallets[0].address;
    }
    // Fallback: try user linked accounts
    if (user?.linkedAccounts) {
      const walletAccount = user.linkedAccounts.find(
        (account: any) => account.type === 'wallet'
      );
      if (walletAccount && 'address' in walletAccount) {
        return (walletAccount as any).address as string;
      }
    }
    return '';
  })();

  const userEmail = user?.email?.address || '';
  const referenceCode = generateReferenceCode(walletAddress || userEmail);

  const fetchBalances = useCallback(async () => {
    if (!walletAddress) return;

    try {
      setError(null);
      const response = await fetch('/api/balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          tokens: CURATED_TOKENS.map((t) => ({
            symbol: t.symbol,
            address: t.address,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch balances');
      }

      const data = await response.json();

      const balances: TokenBalance[] = CURATED_TOKENS.map((token) => {
        const result = data.balances?.find(
          (b: any) => b.symbol === token.symbol
        );
        const balance = result?.balance || '0';
        return {
          ...token,
          balance,
          formattedBalance: formatBalance(balance, token.decimals),
        };
      });

      setTokenBalances(balances);
    } catch (err) {
      console.error('Failed to fetch balances:', err);
      setError('Unable to load balances. Please try again.');
      // Set zero balances on error
      setTokenBalances(
        CURATED_TOKENS.map((token) => ({
          ...token,
          balance: '0',
          formattedBalance: '0',
        }))
      );
    }
  }, [walletAddress]);

  useEffect(() => {
    if (walletAddress) {
      setIsLoading(true);
      fetchBalances().finally(() => setIsLoading(false));
    }
  }, [walletAddress, fetchBalances]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBalances();
    setIsRefreshing(false);
  };

  // Get ETH balance for the main display
  const ethBalance =
    tokenBalances.find((t) => t.symbol === 'ETH')?.formattedBalance || '0';

  return (
    <div className="min-h-screen bg-surface">
      <Header
        walletAddress={walletAddress}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Error banner */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/15 flex items-center gap-3 animate-fade-in">
            <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-300">{error}</p>
            <button
              onClick={handleRefresh}
              className="ml-auto text-xs text-red-400 hover:text-red-300 font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Top section: Balance + Notes */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-5">
            <BalanceCard totalEthBalance={ethBalance} isLoading={isLoading} />
            <ActionButtons
              onBuy={() => setShowBuy(true)}
              onSell={() => setShowSell(true)}
              onSend={() => setShowSend(true)}
              onReceive={() => setShowReceive(true)}
            />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <NotesPanel referenceCode={referenceCode} />
            <ContactPanel />
          </div>
        </div>

        {/* Token List */}
        <TokenList tokens={tokenBalances} isLoading={isLoading} />

        {/* Support Tickets */}
        <SupportTickets />
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-6 mt-4">
        <div className="border-t border-surface-800/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-surface-600">
            &copy; {new Date().getFullYear()} CNH Financial. All rights reserved.
          </p>
          <p className="text-xs text-surface-600">
            Ethereum Mainnet &middot; Powered by Privy
          </p>
        </div>
      </footer>

      {/* Modals */}
      <ReceiveModal
        isOpen={showReceive}
        onClose={() => setShowReceive(false)}
        walletAddress={walletAddress}
      />
      <SendModal isOpen={showSend} onClose={() => setShowSend(false)} />
      <TradeModal
        isOpen={showBuy}
        onClose={() => setShowBuy(false)}
        type="buy"
      />
      <TradeModal
        isOpen={showSell}
        onClose={() => setShowSell(false)}
        type="sell"
      />
    </div>
  );
}
