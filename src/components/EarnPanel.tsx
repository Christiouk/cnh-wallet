'use client';
// Morsands — Earn Panel (Aave v3 Multi-Network Yield)
// Supports: Ethereum Mainnet, Polygon, Base
// Revenue: 1% platform fee on every withdrawal, sent on-chain to Morsands fee wallet
import { useState, useEffect, useCallback } from 'react';
import { useSendTransaction, useWallets } from '@privy-io/react-auth';
import { encodeFunctionData, parseUnits, formatUnits, createPublicClient, http } from 'viem';
import { mainnet, polygon, base } from 'viem/chains';
import { FEE } from '@/lib/constants';

// ─── Network Config ────────────────────────────────────────────────────────────
const NETWORKS = {
  ethereum: {
    label: 'Ethereum',
    chainId: 1,
    chain: mainnet,
    rpc: 'https://eth.llamarpc.com',
    explorer: 'https://etherscan.io',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    aavePool: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2' as `0x${string}`,
    dataProvider: '0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3' as `0x${string}`,
    tokens: {
      USDC: { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as `0x${string}`, aToken: '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c' as `0x${string}`, decimals: 6 },
      USDT: { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' as `0x${string}`, aToken: '0x23878914EFE38d27C4D67Ab83ed1b93A74D4086a' as `0x${string}`, decimals: 6 },
    },
  },
  polygon: {
    label: 'Polygon',
    chainId: 137,
    chain: polygon,
    rpc: 'https://polygon.llamarpc.com',
    explorer: 'https://polygonscan.com',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    aavePool: '0x794a61358D6845594F94dc1DB02A252b5b4814aD' as `0x${string}`,
    dataProvider: '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654' as `0x${string}`,
    tokens: {
      USDC: { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' as `0x${string}`, aToken: '0x625E7708f30cA75bfd92586e17077590C60eb4cD' as `0x${string}`, decimals: 6 },
      USDT: { address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' as `0x${string}`, aToken: '0x6ab707Aca953eDAeFBc4fD23bA73294241490620' as `0x${string}`, decimals: 6 },
    },
  },
  base: {
    label: 'Base',
    chainId: 8453,
    chain: base,
    rpc: 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    aavePool: '0xA238Dd80C259a72e81d7e4664a9801593F98d1c5' as `0x${string}`,
    dataProvider: '0x2d8A3C5677189723C4cB8873CfC9C8976ddf54D3' as `0x${string}`,
    tokens: {
      USDC: { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`, aToken: '0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB' as `0x${string}`, decimals: 6 },
      USDT: { address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2' as `0x${string}`, aToken: '0x7240C27B9f3f5D4c7A2f8A1B3c2D4E5F6A7B8C9D' as `0x${string}`, decimals: 6 },
    },
  },
} as const;

type NetworkKey = keyof typeof NETWORKS;
type TokenKey = 'USDC' | 'USDT';

// ─── ABIs ──────────────────────────────────────────────────────────────────────
const ERC20_ABI = [
  { name: 'approve', type: 'function', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable' },
  { name: 'balanceOf', type: 'function', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { name: 'transfer', type: 'function', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable' },
] as const;

const AAVE_POOL_ABI = [
  { name: 'supply', type: 'function', inputs: [{ name: 'asset', type: 'address' }, { name: 'amount', type: 'uint256' }, { name: 'onBehalfOf', type: 'address' }, { name: 'referralCode', type: 'uint16' }], outputs: [], stateMutability: 'nonpayable' },
  { name: 'withdraw', type: 'function', inputs: [{ name: 'asset', type: 'address' }, { name: 'amount', type: 'uint256' }, { name: 'to', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'nonpayable' },
] as const;

const DATA_PROVIDER_ABI = [
  { name: 'getReserveData', type: 'function', inputs: [{ name: 'asset', type: 'address' }], outputs: [{ name: 'unbacked', type: 'uint256' }, { name: 'accruedToTreasuryScaled', type: 'uint256' }, { name: 'totalAToken', type: 'uint256' }, { name: 'totalStableDebt', type: 'uint256' }, { name: 'totalVariableDebt', type: 'uint256' }, { name: 'liquidityRate', type: 'uint256' }, { name: 'variableBorrowRate', type: 'uint256' }, { name: 'stableBorrowRate', type: 'uint256' }, { name: 'averageStableBorrowRate', type: 'uint256' }, { name: 'liquidityIndex', type: 'uint256' }, { name: 'variableBorrowIndex', type: 'uint256' }, { name: 'lastUpdateTimestamp', type: 'uint40' }], stateMutability: 'view' },
] as const;

const RAY = BigInt('1000000000000000000000000000');
function rayToPercent(ray: bigint): number {
  return Number((ray * BigInt(10000)) / RAY) / 100;
}

interface EarnPanelProps {
  walletAddress?: string;
}

type Step = 'idle' | 'approving' | 'depositing' | 'withdrawing' | 'success' | 'error';

interface NetworkData {
  apy: Record<TokenKey, number>;
  aTokenBalance: Record<TokenKey, string>;
  tokenBalance: Record<TokenKey, string>;
}

export default function EarnPanel({ walletAddress }: EarnPanelProps) {
  const { sendTransaction } = useSendTransaction();
  const { wallets } = useWallets();
  const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0];

  const [selectedNetwork, setSelectedNetwork] = useState<NetworkKey>('ethereum');
  const [selectedToken, setSelectedToken] = useState<TokenKey>('USDC');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [step, setStep] = useState<Step>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState('');
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [networkData, setNetworkData] = useState<Record<NetworkKey, NetworkData>>({
    ethereum: { apy: { USDC: 0, USDT: 0 }, aTokenBalance: { USDC: '0', USDT: '0' }, tokenBalance: { USDC: '0', USDT: '0' } },
    polygon:  { apy: { USDC: 0, USDT: 0 }, aTokenBalance: { USDC: '0', USDT: '0' }, tokenBalance: { USDC: '0', USDT: '0' } },
    base:     { apy: { USDC: 0, USDT: 0 }, aTokenBalance: { USDC: '0', USDT: '0' }, tokenBalance: { USDC: '0', USDT: '0' } },
  });

  const loadData = useCallback(async () => {
    if (!walletAddress) return;
    setIsLoadingData(true);
    try {
      await Promise.all(
        (Object.keys(NETWORKS) as NetworkKey[]).map(async (netKey) => {
          const net = NETWORKS[netKey];
          const publicClient = createPublicClient({ chain: net.chain, transport: http(net.rpc) });
          const tokens = net.tokens as Record<TokenKey, { address: `0x${string}`; aToken: `0x${string}`; decimals: number }>;
          const results = await Promise.all(
            (Object.keys(tokens) as TokenKey[]).map(async (sym) => {
              const token = tokens[sym];
              try {
                const [reserveData, aTokenBal, underlyingBal] = await Promise.all([
                  publicClient.readContract({ address: net.dataProvider, abi: DATA_PROVIDER_ABI, functionName: 'getReserveData', args: [token.address] }),
                  publicClient.readContract({ address: token.aToken, abi: ERC20_ABI, functionName: 'balanceOf', args: [walletAddress as `0x${string}`] }),
                  publicClient.readContract({ address: token.address, abi: ERC20_ABI, functionName: 'balanceOf', args: [walletAddress as `0x${string}`] }),
                ]);
                const liquidityRate = (reserveData as readonly bigint[])[5];
                return { sym, apy: rayToPercent(liquidityRate), aTokenBalance: formatUnits(aTokenBal as bigint, token.decimals), tokenBalance: formatUnits(underlyingBal as bigint, token.decimals) };
              } catch {
                return { sym, apy: 0, aTokenBalance: '0', tokenBalance: '0' };
              }
            })
          );
          setNetworkData(prev => ({
            ...prev,
            [netKey]: {
              apy: Object.fromEntries(results.map(r => [r.sym, r.apy])) as Record<TokenKey, number>,
              aTokenBalance: Object.fromEntries(results.map(r => [r.sym, r.aTokenBalance])) as Record<TokenKey, string>,
              tokenBalance: Object.fromEntries(results.map(r => [r.sym, r.tokenBalance])) as Record<TokenKey, string>,
            },
          }));
        })
      );
    } catch (e) {
      console.error('Failed to load Aave data:', e);
    } finally {
      setIsLoadingData(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const net = NETWORKS[selectedNetwork];
  const tokens = net.tokens as Record<TokenKey, { address: `0x${string}`; aToken: `0x${string}`; decimals: number }>;
  const currentData = networkData[selectedNetwork];
  const currentApy = currentData.apy[selectedToken] || 0;
  const currentDeposited = parseFloat(currentData.aTokenBalance[selectedToken] || '0');
  const currentWalletBalance = parseFloat(currentData.tokenBalance[selectedToken] || '0');
  const yearlyEarnings = currentDeposited * (currentApy / 100);
  const monthlyEarnings = yearlyEarnings / 12;
  const isProcessing = ['approving', 'depositing', 'withdrawing'].includes(step);

  const handleDeposit = async () => {
    if (!embeddedWallet || !walletAddress || !amount || Number(amount) <= 0) return;
    const token = tokens[selectedToken];
    const amountBig = parseUnits(amount, token.decimals);
    setStep('approving');
    setErrorMsg('');
    try {
      await sendTransaction(
        { to: token.address, data: encodeFunctionData({ abi: ERC20_ABI, functionName: 'approve', args: [net.aavePool, amountBig] }), chainId: net.chainId },
        { address: embeddedWallet.address }
      );
      setStep('depositing');
      const result = await sendTransaction(
        { to: net.aavePool, data: encodeFunctionData({ abi: AAVE_POOL_ABI, functionName: 'supply', args: [token.address, amountBig, walletAddress as `0x${string}`, 0] }), chainId: net.chainId },
        { address: embeddedWallet.address }
      );
      setTxHash(result.hash);
      setStep('success');
      setAmount('');
      setTimeout(loadData, 5000);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Transaction failed. Please try again.');
      setStep('error');
    }
  };

  const handleWithdraw = async () => {
    if (!embeddedWallet || !walletAddress || !amount || Number(amount) <= 0) return;
    const token = tokens[selectedToken];
    const withdrawAmount = Number(amount);
    const feeAmount = withdrawAmount * (FEE.percentage / 100);
    const amountBig = parseUnits(amount, token.decimals);
    setStep('withdrawing');
    setErrorMsg('');
    try {
      const result = await sendTransaction(
        { to: net.aavePool, data: encodeFunctionData({ abi: AAVE_POOL_ABI, functionName: 'withdraw', args: [token.address, amountBig, walletAddress as `0x${string}`] }), chainId: net.chainId },
        { address: embeddedWallet.address }
      );
      setTxHash(result.hash);
      // Send 1% platform fee to Morsands fee wallet
      const feeAmountBig = parseUnits(feeAmount.toFixed(token.decimals), token.decimals);
      await sendTransaction(
        { to: token.address, data: encodeFunctionData({ abi: ERC20_ABI, functionName: 'transfer', args: [FEE.recipientAddress as `0x${string}`, feeAmountBig] }), chainId: net.chainId },
        { address: embeddedWallet.address }
      );
      setStep('success');
      setAmount('');
      setTimeout(loadData, 5000);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Transaction failed. Please try again.');
      setStep('error');
    }
  };

  return (
    <div className="rounded-2xl bg-surface-800/40 border border-surface-700/30 overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-surface-700/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Earn Yield</h3>
              <p className="text-xs text-surface-500">Powered by Aave v3</p>
            </div>
          </div>
          <button onClick={loadData} className="text-xs text-surface-500 hover:text-white transition-colors">
            {isLoadingData ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Network selector */}
        <div className="flex gap-2 mt-4">
          {(Object.keys(NETWORKS) as NetworkKey[]).map((netKey) => {
            const n = NETWORKS[netKey];
            const isActive = selectedNetwork === netKey;
            // Total deposited across both tokens on this network
            const totalDeposited = parseFloat(networkData[netKey].aTokenBalance.USDC || '0') + parseFloat(networkData[netKey].aTokenBalance.USDT || '0');
            return (
              <button
                key={netKey}
                onClick={() => { setSelectedNetwork(netKey); setAmount(''); setStep('idle'); }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  isActive ? `${n.bgColor} ${n.borderColor} ${n.color}` : 'bg-surface-900/60 border-surface-700/20 text-surface-500 hover:text-white hover:border-surface-600/40'
                }`}
              >
                <div>{n.label}</div>
                {totalDeposited > 0 && (
                  <div className="text-[10px] opacity-70 mt-0.5">${totalDeposited.toFixed(2)} deposited</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* APY Cards */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {(['USDC', 'USDT'] as TokenKey[]).map((sym) => {
          const tokenApy = currentData.apy[sym] || 0;
          const deposited = parseFloat(currentData.aTokenBalance[sym] || '0');
          const isSelected = selectedToken === sym;
          return (
            <button
              key={sym}
              onClick={() => setSelectedToken(sym)}
              className={`p-3.5 rounded-xl border transition-all duration-200 text-left ${
                isSelected ? `${net.bgColor} ${net.borderColor}` : 'bg-surface-900/60 border-surface-700/20 hover:border-surface-600/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-bold ${sym === 'USDC' ? 'text-blue-400' : 'text-emerald-400'}`}>{sym}</span>
                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </div>
              <p className="text-xl font-bold text-white">
                {isLoadingData ? <span className="text-surface-600 text-sm">...</span> : `${tokenApy.toFixed(2)}%`}
              </p>
              <p className="text-xs text-surface-500 mt-0.5">APY</p>
              {deposited > 0 && (
                <p className={`text-xs mt-1.5 font-medium ${sym === 'USDC' ? 'text-blue-400' : 'text-emerald-400'}`}>
                  {deposited.toFixed(2)} deposited
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Earnings summary */}
      {currentDeposited > 0 && (
        <div className="mx-4 mb-4 p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
          <p className="text-xs text-surface-400 mb-2 font-medium">Your {selectedToken} earnings on {net.label}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-surface-500">Monthly</p>
              <p className="text-sm font-bold text-emerald-400">+{monthlyEarnings.toFixed(4)} {selectedToken}</p>
            </div>
            <div>
              <p className="text-xs text-surface-500">Yearly</p>
              <p className="text-sm font-bold text-emerald-400">+{yearlyEarnings.toFixed(4)} {selectedToken}</p>
            </div>
          </div>
        </div>
      )}

      {/* Gas fee notice for non-Ethereum */}
      {selectedNetwork !== 'ethereum' && (
        <div className={`mx-4 mb-3 p-2.5 rounded-xl ${net.bgColor} border ${net.borderColor}`}>
          <p className={`text-xs ${net.color}`}>
            {selectedNetwork === 'polygon' ? 'Low gas fees on Polygon — transactions cost fractions of a cent.' : 'Low gas fees on Base — ideal for smaller deposits.'}
          </p>
        </div>
      )}

      {/* Deposit / Withdraw Form */}
      <div className="px-4 pb-5 space-y-3">
        <div className="flex rounded-xl bg-surface-900/60 border border-surface-700/20 p-1">
          <button onClick={() => setMode('deposit')} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${mode === 'deposit' ? 'bg-emerald-500/20 text-emerald-400' : 'text-surface-500 hover:text-white'}`}>
            Deposit
          </button>
          <button onClick={() => setMode('withdraw')} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${mode === 'withdraw' ? 'bg-amber-500/20 text-amber-400' : 'text-surface-500 hover:text-white'}`}>
            Withdraw
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-surface-500 font-medium">Amount ({selectedToken})</label>
            <button
              onClick={() => setAmount(mode === 'deposit' ? currentWalletBalance.toFixed(6) : currentDeposited.toFixed(6))}
              className="text-xs text-brand-400 hover:text-brand-300"
            >
              Max: {mode === 'deposit' ? currentWalletBalance.toFixed(2) : currentDeposited.toFixed(2)}
            </button>
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min="0"
            className="w-full bg-surface-900/80 border border-surface-700/50 rounded-xl px-4 py-3 text-white text-lg font-semibold placeholder-surface-700 focus:outline-none focus:border-brand-500/50 transition-colors"
          />
        </div>

        {amount && Number(amount) > 0 && mode === 'withdraw' && (
          <p className="text-xs text-surface-500">
            1% platform fee ({(Number(amount) * 0.01).toFixed(4)} {selectedToken}) applies on withdrawal.
          </p>
        )}

        {step === 'idle' || step === 'error' ? (
          <button
            onClick={mode === 'deposit' ? handleDeposit : handleWithdraw}
            disabled={!amount || Number(amount) <= 0 || !walletAddress}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
              mode === 'deposit'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
            }`}
          >
            {mode === 'deposit' ? `Deposit ${selectedToken} on ${net.label}` : `Withdraw ${selectedToken}`}
          </button>
        ) : isProcessing ? (
          <div className="flex items-center justify-center gap-3 py-3.5">
            <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-emerald-400 font-medium">
              {step === 'approving' ? 'Approving token...' : step === 'depositing' ? 'Depositing to Aave...' : 'Withdrawing...'}
            </span>
          </div>
        ) : step === 'success' ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-emerald-300">
                {mode === 'deposit' ? 'Successfully deposited to Aave!' : 'Successfully withdrawn!'}
              </p>
            </div>
            {txHash && (
              <a href={`${net.explorer}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                className="block text-center text-xs text-brand-400 hover:text-brand-300 font-mono">
                View on {selectedNetwork === 'ethereum' ? 'Etherscan' : selectedNetwork === 'polygon' ? 'Polygonscan' : 'Basescan'} &#8599;
              </a>
            )}
            <button onClick={() => setStep('idle')} className="w-full py-3 rounded-xl bg-surface-800/60 border border-surface-700/30 text-surface-300 text-sm font-medium hover:text-white transition-colors">
              Done
            </button>
          </div>
        ) : null}

        {step === 'error' && (
          <p className="text-xs text-red-400 text-center">{errorMsg}</p>
        )}

        <p className="text-xs text-surface-600 text-center">
          Deposits earn live yield via Aave v3 on {net.label}. Withdraw anytime. 1% fee on withdrawal.
        </p>
      </div>
    </div>
  );
}
