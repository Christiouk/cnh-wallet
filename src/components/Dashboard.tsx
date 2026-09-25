'use client';

import { useState } from 'react';
import { useEmbeddedWallets } from '@/hooks/useEmbeddedWallets';
import { usePortfolioBalances } from '@/hooks/usePortfolioBalances';
import { getNetworkWalletState } from '@/lib/wallet/networks';
import { walletStateMessage } from '@/lib/wallet/selection';
import Header from './Header';
import BalanceCard from './BalanceCard';
import ActionButtons from './ActionButtons';
import TokenList from './TokenList';
import ContactPanel from './ContactPanel';
import NotesPanel from './NotesPanel';
import EarnPanel from './EarnPanel';
import SupportTickets from './SupportTickets';
import TransactionHistory from './TransactionHistory';
import BitcoinPanel from './BitcoinPanel';
import ReceiveModal from './ReceiveModal';
import SendModal from './SendModal';
import TradeModal from './TradeModal';
import SwapModal from './SwapModal';
import TransakModal from './TransakModal';
import PriceTicker from './PriceTicker';
import { formatBalance, generateReferenceCode } from '@/lib/utils';
import { usePrices } from '@/hooks/usePrices';

export default function Dashboard() {
  const { user, evm, tron } = useEmbeddedWallets();
  const [activeNetwork, setActiveNetwork] = useState('ethereum');
  const networkWallet = getNetworkWalletState(activeNetwork, evm, tron);
  const walletAddress = networkWallet.status === 'ready' ? networkWallet.address : '';
  const { state: portfolio, refresh: handleRefresh } = usePortfolioBalances(user?.id, walletAddress);
  const tokenBalances = portfolio.status === 'ready' ? portfolio.balances : [];
  const isLoading = portfolio.status === 'loading' || networkWallet.status === 'loading';
  const error = portfolio.status === 'rpc-error' ? portfolio.message
    : networkWallet.status === 'deferred' ? 'This network is not available yet.'
    : walletStateMessage(networkWallet.status);

  // Modal states
  const [showReceive, setShowReceive] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [showSell, setShowSell] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [showBuy, setShowBuy] = useState(false);

  // Live prices
  const { prices, isLoading: pricesLoading } = usePrices();

  const userEmail = user?.email?.address || '';
  const referenceCode = generateReferenceCode(walletAddress || userEmail);

  // Calculate total USD portfolio value
  const totalUsdValue = tokenBalances.reduce((sum, token) => {
    const price = prices[token.symbol]?.usd || 0;
    const balance = parseFloat(formatBalance(token.balance, token.decimals));
    return sum + balance * price;
  }, 0);

  const ethBalance = tokenBalances.find((t) => t.symbol === 'ETH')?.formattedBalance || '0';

  return (
    <div className="min-h-screen bg-surface">
      <Header
        walletAddress={walletAddress}
        onRefresh={handleRefresh}
        isRefreshing={isLoading}
        activeNetwork={activeNetwork}
        onNetworkChange={setActiveNetwork}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Error banner */}
        {error && (
          <div role="status" className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/15 flex items-center gap-3 animate-fade-in">
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
            <BalanceCard
              totalEthBalance={ethBalance}
              totalUsdValue={!pricesLoading ? totalUsdValue : undefined}
              isLoading={isLoading}
              unavailable={portfolio.status !== 'ready'}
            />
            <ActionButtons
              onBuy={() => setShowBuy(true)}
              onSell={() => setShowSell(true)}
              onSend={() => setShowSend(true)}
              onReceive={() => setShowReceive(true)}
              onSwap={() => setShowSwap(true)}
              walletAddress={walletAddress || undefined}
              disabled={!walletAddress}
            />
          </div>
          <div className="lg:col-span-2">
            <NotesPanel referenceCode={referenceCode} />
          </div>
        </div>

        {/* Live Price Ticker */}
        <PriceTicker prices={prices} loading={pricesLoading} />

        {/* Token List with live prices */}
        <TokenList tokens={tokenBalances} isLoading={isLoading} prices={prices} unavailable={portfolio.status !== 'ready'} />

        {/* Earn / Yield — Aave v3 */}
        <EarnPanel walletAddress={walletAddress || undefined} />

        {/* Transaction History */}
        {walletAddress && <TransactionHistory walletAddress={walletAddress} />}

        {/* Bitcoin Network */}
        {activeNetwork === 'bitcoin' && <BitcoinPanel btcUsdPrice={prices['BTC']?.usd || 0} />}

        {/* Support Tickets */}
        <SupportTickets />

        {/* Contact — bottom of page */}
        <ContactPanel />
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-6 mt-4">
        <div className="border-t border-surface-800/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-surface-600">
            &copy; {new Date().getFullYear()} Morsands. All rights reserved.
          </p>
          <p className="text-xs text-surface-600">
            Multi-Chain &middot; Powered by Privy
          </p>
        </div>
      </footer>

      {/* Modals */}
      <ReceiveModal
        isOpen={showReceive && Boolean(walletAddress)}
        onClose={() => setShowReceive(false)}
        walletAddress={walletAddress}
      />
      <SendModal isOpen={showSend && Boolean(walletAddress)} onClose={() => setShowSend(false)} />
      <TradeModal isOpen={showSell} onClose={() => setShowSell(false)} type="sell" prices={prices} />
      <SwapModal isOpen={showSwap && Boolean(walletAddress)} onClose={() => setShowSwap(false)} prices={prices} />
      <TransakModal
        isOpen={showBuy && Boolean(walletAddress)}
        onClose={() => setShowBuy(false)}
        walletAddress={walletAddress || undefined}
      />
    </div>
  );
}
