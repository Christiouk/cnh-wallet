'use client';
import { useState } from 'react';
import { formatUnits } from 'viem';
import { useEmbeddedWallets } from '@/hooks/useEmbeddedWallets';
import { usePortfolioBalances } from '@/hooks/usePortfolioBalances';
import { walletStateMessage } from '@/lib/wallet/selection';
import { usePrices } from '@/hooks/usePrices';
import Header from './Header';
import BalanceCard from './BalanceCard';
import ActionButtons from './ActionButtons';
import TokenList from './TokenList';
import TransactionHistory from './TransactionHistory';
import ReceiveModal from './ReceiveModal';
import SendModal from './SendModal';
export default function Dashboard() {
  const { user, evm } = useEmbeddedWallets();
  const walletAddress = evm.status === 'ready' ? evm.wallet.address : '';
  const { state: portfolio, refresh } = usePortfolioBalances(
    user?.id,
    walletAddress,
  );
  const tokens = portfolio.status === 'ready' ? portfolio.balances : [];
  const loading = portfolio.status === 'loading' || evm.status === 'loading';
  const error =
    portfolio.status === 'rpc-error'
      ? portfolio.message
      : walletStateMessage(evm.status);
  const [modal, setModal] = useState<'send' | 'receive' | null>(null);
  const { prices, isLoading: pricesLoading } = usePrices();
  const total =
    portfolio.status === 'ready' &&
    !pricesLoading &&
    tokens.every((t) => prices[t.symbol])
      ? tokens.reduce(
          (sum, t) =>
            sum +
            Number(formatUnits(BigInt(t.balance), t.decimals)) *
              prices[t.symbol].usd,
          0,
        )
      : undefined;
  const close = () => setModal(null);
  return (
    <div className="min-h-screen bg-surface">
      <Header
        walletAddress={walletAddress}
        onRefresh={refresh}
        isRefreshing={loading}
      />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {error && (
          <p role="status" className="text-amber-300">
            {error}
          </p>
        )}
        <BalanceCard
          totalEthBalance={tokens[0]?.formattedBalance || '0'}
          totalUsdValue={total}
          isLoading={loading}
          unavailable={portfolio.status !== 'ready'}
        />
        <ActionButtons
          onSend={() => setModal('send')}
          onReceive={() => setModal('receive')}
          disabled={!walletAddress}
        />
        <TokenList
          tokens={tokens}
          isLoading={loading}
          prices={prices}
          unavailable={portfolio.status !== 'ready'}
        />
        {walletAddress && (
          <TransactionHistory
            key={`${user?.id}:${walletAddress}`}
            walletAddress={walletAddress}
          />
        )}
      </main>
      <footer className="max-w-6xl mx-auto p-6 text-xs text-surface-500">
        Morsands · Ethereum · Powered by Privy
      </footer>
      <ReceiveModal
        isOpen={modal === 'receive' && Boolean(walletAddress)}
        onClose={close}
        walletAddress={walletAddress}
      />
      <SendModal
        key={`${user?.id}:${walletAddress}`}
        isOpen={modal === 'send' && Boolean(walletAddress)}
        onClose={close}
      />
    </div>
  );
}
