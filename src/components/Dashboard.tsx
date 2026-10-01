'use client';
import { useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { formatUnits } from 'viem';
import { useEmbeddedWallets } from '@/hooks/useEmbeddedWallets';
import { usePortfolioBalances } from '@/hooks/usePortfolioBalances';
import { walletStateMessage } from '@/lib/wallet/selection';
import { usePrices, type PricesMap } from '@/hooks/usePrices';
import type { TokenBalance } from '@/lib/tokens';
import Buy from './buy/Buy';
import Swap from './swap/Swap';
import BalanceCard from './BalanceCard';
import ActionButtons from './ActionButtons';
import TokenList from './TokenList';
import TransactionHistory from './TransactionHistory';
import ReceiveModal from './ReceiveModal';
import SendModal from './SendModal';
import TronWorkspace from './tron/TronWorkspace';
import WalletShell, { type WalletView } from './ui/WalletShell';
import type { A3Network } from '@/lib/wallet/networks';
export default function Dashboard({
  initialNetwork = 'ethereum',
}: {
  initialNetwork?: A3Network;
}) {
  const [network, setNetwork] = useState<A3Network>(initialNetwork);
  const [view, setView] = useState<WalletView>('wallet');
  const { user, evm, tron } = useEmbeddedWallets();
  const { logout } = usePrivy();
  return (
    <WalletShell
      network={network}
      onNetworkChange={(n) => {
        setNetwork(n);
        setView('wallet');
      }}
      view={view}
      onViewChange={setView}
      account={{
        email: user?.email?.address,
        ethereum: evm.status === 'ready' ? evm.wallet.address : undefined,
        tron: tron?.status === 'ready' ? tron.wallet.address : undefined,
      }}
      onLogout={logout}
    >
      {network === 'ethereum' ? (
        <EthereumDashboard key={user?.id} view={view} />
      ) : (
        <TronWorkspace key={user?.id} view={view} />
      )}
    </WalletShell>
  );
}
function EthereumDashboard({ view }: { view: WalletView }) {
  const { user, evm } = useEmbeddedWallets();
  const [buyRevision, setBuyRevision] = useState(0);
  const walletAddress = evm.status === 'ready' ? evm.wallet.address : '';
  const { state: portfolio, refresh } = usePortfolioBalances(
    user?.id,
    walletAddress,
  );
  const tokens = portfolio.status === 'ready' ? portfolio.balances : [];
  const loading =
    portfolio.status === 'loading' || evm.status === 'loading';
  const error =
    portfolio.status === 'rpc-error'
      ? portfolio.message
      : walletStateMessage(evm.status);
  const { prices, isLoading: pricesLoading } = usePrices();
  return (
    <EthereumPanel
      key={`${user?.id}:${walletAddress}`}
      view={view}
      walletAddress={walletAddress}
      tokens={tokens}
      prices={pricesLoading ? {} : prices}
      loading={loading}
      unavailable={portfolio.status !== 'ready'}
      error={error || undefined}
      onRefresh={refresh}
      activity={
        walletAddress ? (
          <TransactionHistory
            key={`${user?.id}:${walletAddress}:${buyRevision}`}
            walletAddress={walletAddress}
            limit={view === 'wallet' ? 5 : undefined}
          />
        ) : (
          <p className="empty-state">
            Activity is available when your Ethereum wallet is connected.
          </p>
        )
      }
      renderSwap={(open, close) => (
        <Swap
          isOpen={open}
          balances={tokens}
          onClose={close}
          onRefresh={() => {
            refresh();
            setBuyRevision((n) => n + 1);
          }}
        />
      )}
      renderBuy={(close) => (
        <Buy
          network="ethereum"
          address={walletAddress}
          onClose={close}
          onRefresh={() => {
            refresh();
            setBuyRevision((n) => n + 1);
          }}
        />
      )}
      renderSend={(open, close) => (
        <SendModal isOpen={open} onClose={close} balances={tokens} />
      )}
    />
  );
}
export function EthereumPanel({
  view,
  walletAddress,
  tokens,
  prices,
  loading,
  unavailable,
  error,
  onRefresh,
  activity,
  renderSend,
  renderBuy,
  renderSwap,
}: {
  view: WalletView;
  walletAddress: string;
  tokens: TokenBalance[];
  prices: PricesMap;
  loading: boolean;
  unavailable: boolean;
  error?: string;
  onRefresh(): void;
  activity: React.ReactNode;
  renderSwap?(open: boolean, close: () => void): React.ReactNode;
  renderBuy?(close: () => void): React.ReactNode;
  renderSend(open: boolean, close: () => void): React.ReactNode;
}) {
  const [swapOpened, setSwapOpened] = useState(false);
  const [modal, setModal] = useState<
    'send' | 'receive' | 'buy' | 'swap' | null
  >(null);
  const total =
    !unavailable && !loading && tokens.every((t) => prices[t.symbol])
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
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">A3 WALLET / ETHEREUM</p>
          <h1>{view === 'activity' ? 'Your activity.' : 'Your wallet.'}</h1>
        </div>
        <button
          className="btn-ghost"
          onClick={onRefresh}
          disabled={loading}
        >
          Refresh <span aria-hidden>↻</span>
        </button>
      </div>
      {error && (
        <p className="notice" role="status">
          {error}
        </p>
      )}
      <div
        className={view === 'wallet' ? 'portfolio-layout' : 'activity-page'}
      >
        {view === 'wallet' && (
          <div className="portfolio-primary">
            <BalanceCard
              network="Ethereum"
              totalUsdValue={total}
              isLoading={loading}
              unavailable={unavailable}
            />
            <ActionButtons
              onSwap={
                renderSwap
                  ? () => {
                      setSwapOpened(true);
                      setModal('swap');
                    }
                  : undefined
              }
              onBuy={renderBuy ? () => setModal('buy') : undefined}
              onSend={() => setModal('send')}
              onReceive={() => setModal('receive')}
              disabled={!walletAddress}
            />
            <TokenList
              tokens={tokens}
              isLoading={loading}
              prices={prices}
              unavailable={unavailable}
            />
            <p className="portfolio-footnote">
              One network. Your assets.
              <br />
              Receive and send ETH, USDT and USDC on Ethereum.
            </p>
          </div>
        )}
        <aside className="portfolio-secondary">
          {activity}
          {view === 'wallet' && (
            <div className="network-context">
              <p className="eyebrow">YOUR NETWORK</p>
              <h3>Ethereum</h3>
              <p>
                ETH powers network transactions. Check the receiving network
                before every transfer.
              </p>
              <span>No A3 transfer fee.</span>
            </div>
          )}
        </aside>
      </div>
      <ReceiveModal
        isOpen={modal === 'receive' && Boolean(walletAddress)}
        onClose={close}
        walletAddress={walletAddress}
      />
      {swapOpened && renderSwap?.(modal === 'swap', close)}
      {modal === 'buy' && renderBuy?.(close)}
      {renderSend(modal === 'send' && Boolean(walletAddress), close)}
    </>
  );
}
