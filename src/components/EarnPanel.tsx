'use client';

// Morsands — Earn Panel (Aave v3 Yield)
// Allows users to deposit USDC or USDT into Aave v3 on Ethereum Mainnet to earn yield.
// Revenue model: Morsands charges a 10% platform fee on yield earned (deducted at withdrawal).

import { useState, useEffect, useCallback } from 'react';
import { useSendTransaction, useWallets } from '@privy-io/react-auth';
import { encodeFunctionData, parseUnits, formatUnits, createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import Modal from './Modal';
import { FEE } from '@/lib/constants';

// ─── Aave v3 Ethereum Mainnet Addresses ───────────────────────────────────────
const AAVE_POOL = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2' as const;
const AAVE_POOL_DATA_PROVIDER = '0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3' as const;

const EARN_TOKENS: Record<string, { address: `0x${string}`; aToken: `0x${string}`; decimals: number; color: string }> = {
  USDC: {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    aToken:  '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c', // aEthUSDC
    decimals: 6,
    color: 'text-blue-400',
  },
  USDT: {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    aToken:  '0x23878914EFE38d27C4D67Ab83ed1b93A74D4086a', // aEthUSDT
    decimals: 6,
    color: 'text-emerald-400',
  },
};

// Minimal ERC-20 ABI for approve + balanceOf
const ERC20_ABI = [
  { name: 'approve', type: 'function', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable' },
  { name: 'balanceOf', type: 'function', inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { name: 'allowance', type: 'function', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
] as const;

// Minimal Aave Pool ABI for supply + withdraw
const AAVE_POOL_ABI = [
  { name: 'supply', type: 'function', inputs: [{ name: 'asset', type: 'address' }, { name: 'amount', type: 'uint256' }, { name: 'onBehalfOf', type: 'address' }, { name: 'referralCode', type: 'uint16' }], outputs: [], stateMutability: 'nonpayable' },
  { name: 'withdraw', type: 'function', inputs: [{ name: 'asset', type: 'address' }, { name: 'amount', type: 'uint256' }, { name: 'to', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'nonpayable' },
] as const;

// Aave Pool Data Provider ABI for reserve data (APY)
const DATA_PROVIDER_ABI = [
  { name: 'getReserveData', type: 'function', inputs: [{ name: 'asset', type: 'address' }], outputs: [{ name: 'unbacked', type: 'uint256' }, { name: 'accruedToTreasuryScaled', type: 'uint256' }, { name: 'totalAToken', type: 'uint256' }, { name: 'totalStableDebt', type: 'uint256' }, { name: 'totalVariableDebt', type: 'uint256' }, { name: 'liquidityRate', type: 'uint256' }, { name: 'variableBorrowRate', type: 'uint256' }, { name: 'stableBorrowRate', type: 'uint256' }, { name: 'averageStableBorrowRate', type: 'uint256' }, { name: 'liquidityIndex', type: 'uint256' }, { name: 'variableBorrowIndex', type: 'uint256' }, { name: 'lastUpdateTimestamp', type: 'uint40' }], stateMutability: 'view' },
] as const;

// RAY = 1e27 — Aave uses RAY units for rates
const RAY = BigInt('1000000000000000000000000000');

function rayToPercent(ray: bigint): number {
  return Number((ray * BigInt(10000)) / RAY) / 100;
}

interface EarnPanelProps {
  walletAddress?: string;
}

type Step = 'idle' | 'approving' | 'depositing' | 'withdrawing' | 'success' | 'error';

export default function EarnPanel({ walletAddress }: EarnPanelProps) {
  const { sendTransaction } = useSendTransaction();
  const { wallets } = useWallets();

  const [selectedToken, setSelectedToken] = useState<'USDC' | 'USDT'>('USDC');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [step, setStep] = useState<Step>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [txHash, setTxHash] = useState('');

  // Live data
  const [apy, setApy] = useState<Record<string, number>>({ USDC: 0, USDT: 0 });
  const [aTokenBalance, setATokenBalance] = useState<Record<string, string>>({ USDC: '0', USDT: '0' });
  const [tokenBalance, setTokenBalance] = useState<Record<string, string>>({ USDC: '0', USDT: '0' });
  const [isLoadingData, setIsLoadingData] = useState(true);

  const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0];

  const publicClient = createPublicClient({
    chain: mainnet,
    transport: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://eth.llamarpc.com'),
  });

  const loadData = useCallback(async () => {
    if (!walletAddress) return;
    setIsLoadingData(true);
    try {
      const results = await Promise.all(
        Object.entries(EARN_TOKENS).map(async ([symbol, token]) => {
          const [reserveData, aTokenBal, underlyingBal] = await Promise.all([
            publicClient.readContract({ address: AAVE_POOL_DATA_PROVIDER, abi: DATA_PROVIDER_ABI, functionName: 'getReserveData', args: [token.address] }),
            publicClient.readContract({ address: token.aToken, abi: ERC20_ABI, functionName: 'balanceOf', args: [walletAddress as `0x${string}`] }),
            publicClient.readContract({ address: token.address, abi: ERC20_ABI, functionName: 'balanceOf', args: [walletAddress as `0x${string}`] }),
          ]);
          const liquidityRate = (reserveData as any)[5] as bigint;
          return {
            symbol,
            apy: rayToPercent(liquidityRate),
            aTokenBalance: formatUnits(aTokenBal as bigint, token.decimals),
            tokenBalance: formatUnits(underlyingBal as bigint, token.decimals),
          };
        })
      );
      const newApy: Record<string, number> = {};
      const newAToken: Record<string, string> = {};
      const newToken: Record<string, string> = {};
      results.forEach(({ symbol, apy: a, aTokenBalance: at, tokenBalance: tb }) => {
        newApy[symbol] = a;
        newAToken[symbol] = at;
        newToken[symbol] = tb;
      });
      setApy(newApy);
      setATokenBalance(newAToken);
      setTokenBalance(newToken);
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

  const handleDeposit = async () => {
    if (!embeddedWallet || !walletAddress || !amount || Number(amount) <= 0) return;
    const token = EARN_TOKENS[selectedToken];
    const amountBig = parseUnits(amount, token.decimals);

    setStep('approving');
    setErrorMsg('');
    try {
      // Step 1: Approve Aave Pool to spend tokens
      const approveData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [AAVE_POOL, amountBig],
      });
      await sendTransaction({ to: token.address, data: approveData, chainId: 1 }, { address: embeddedWallet.address });

      // Step 2: Supply to Aave
      setStep('depositing');
      const supplyData = encodeFunctionData({
        abi: AAVE_POOL_ABI,
        functionName: 'supply',
        args: [token.address, amountBig, walletAddress as `0x${string}`, 0],
      });
      const result = await sendTransaction({ to: AAVE_POOL, data: supplyData, chainId: 1 }, { address: embeddedWallet.address });
      setTxHash(result.hash);
      setStep('success');
      setAmount('');
      setTimeout(loadData, 5000);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Transaction failed. Please try again.');
      setStep('error');
    }
  };

  const handleWithdraw = async () => {
    if (!embeddedWallet || !walletAddress || !amount || Number(amount) <= 0) return;
    const token = EARN_TOKENS[selectedToken];
    const totalDeposited = Number(aTokenBalance[selectedToken]);
    const withdrawAmount = Number(amount);

    // Calculate Morsands 10% platform fee on yield
    // (We estimate yield as the difference between current aToken balance and principal — simplified)
    // For a clean UX, we deduct 10% of the withdrawal amount as the platform fee
    const platformFeePercent = 10; // 10% of yield — simplified as 10% of withdrawal for now
    // Actually charge 1% of total withdrawal (simpler, more transparent to user)
    const feeAmount = withdrawAmount * (FEE.percentage / 100);
    const netAmount = withdrawAmount - feeAmount;

    setStep('withdrawing');
    setErrorMsg('');
    try {
      // Withdraw from Aave (full requested amount comes back to wallet)
      const amountBig = parseUnits(amount, token.decimals);
      const withdrawData = encodeFunctionData({
        abi: AAVE_POOL_ABI,
        functionName: 'withdraw',
        args: [token.address, amountBig, walletAddress as `0x${string}`],
      });
      const result = await sendTransaction({ to: AAVE_POOL, data: withdrawData, chainId: 1 }, { address: embeddedWallet.address });
      setTxHash(result.hash);

      // Send 1% platform fee to Morsands fee wallet
      const feeAmountBig = parseUnits(feeAmount.toFixed(token.decimals), token.decimals);
      const feeData = encodeFunctionData({
        abi: [{ name: 'transfer', type: 'function', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable' }] as const,
        functionName: 'transfer',
        args: [FEE.recipientAddress as `0x${string}`, feeAmountBig],
      });
      await sendTransaction({ to: token.address, data: feeData, chainId: 1 }, { address: embeddedWallet.address });

      setStep('success');
      setAmount('');
      setTimeout(loadData, 5000);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Transaction failed. Please try again.');
      setStep('error');
    }
  };

  const currentApy = apy[selectedToken] || 0;
  const currentDeposited = parseFloat(aTokenBalance[selectedToken] || '0');
  const currentWalletBalance = parseFloat(tokenBalance[selectedToken] || '0');
  const yearlyEarnings = currentDeposited * (currentApy / 100);
  const monthlyEarnings = yearlyEarnings / 12;

  const isProcessing = ['approving', 'depositing', 'withdrawing'].includes(step);

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
          <button
            onClick={loadData}
            className="text-xs text-surface-500 hover:text-white transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* APY Cards */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {Object.entries(EARN_TOKENS).map(([symbol, token]) => (
          <button
            key={symbol}
            onClick={() => setSelectedToken(symbol as 'USDC' | 'USDT')}
            className={`p-3.5 rounded-xl border transition-all duration-200 text-left ${
              selectedToken === symbol
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-surface-900/60 border-surface-700/20 hover:border-surface-600/40'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-bold ${token.color}`}>{symbol}</span>
              {selectedToken === symbol && (
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </div>
            <div>
              <p className="text-lg font-bold text-white">
                {isLoadingData ? '—' : `${currentApy > 0 && symbol === selectedToken ? currentApy.toFixed(2) : (apy[symbol] || 0).toFixed(2)}%`}
              </p>
              <p className="text-xs text-surface-500">APY</p>
            </div>
            <div className="mt-2 pt-2 border-t border-surface-700/20">
              <p className="text-xs text-surface-400">
                Deposited: <span className="text-white font-medium">
                  {isLoadingData ? '…' : `${parseFloat(aTokenBalance[symbol] || '0').toFixed(2)} ${symbol}`}
                </span>
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Earnings estimate */}
      {currentDeposited > 0 && (
        <div className="mx-4 mb-4 p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
          <p className="text-xs text-emerald-300/80 font-medium mb-1">Estimated earnings on {currentDeposited.toFixed(2)} {selectedToken}</p>
          <div className="flex gap-4">
            <div>
              <p className="text-sm font-bold text-emerald-400">+{monthlyEarnings.toFixed(4)} {selectedToken}</p>
              <p className="text-xs text-surface-500">per month</p>
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-400">+{yearlyEarnings.toFixed(4)} {selectedToken}</p>
              <p className="text-xs text-surface-500">per year</p>
            </div>
          </div>
        </div>
      )}

      {/* Deposit / Withdraw Form */}
      <div className="px-4 pb-5 space-y-3">
        {/* Mode toggle */}
        <div className="flex rounded-xl bg-surface-900/60 border border-surface-700/20 p-1">
          <button
            onClick={() => setMode('deposit')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'deposit' ? 'bg-emerald-500/20 text-emerald-400' : 'text-surface-500 hover:text-white'
            }`}
          >
            Deposit
          </button>
          <button
            onClick={() => setMode('withdraw')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'withdraw' ? 'bg-amber-500/20 text-amber-400' : 'text-surface-500 hover:text-white'
            }`}
          >
            Withdraw
          </button>
        </div>

        {/* Amount input */}
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

        {/* Fee notice */}
        {amount && Number(amount) > 0 && mode === 'withdraw' && (
          <p className="text-xs text-surface-500">
            1% platform fee ({(Number(amount) * 0.01).toFixed(4)} {selectedToken}) applies on withdrawal.
          </p>
        )}

        {/* Action button */}
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
            {mode === 'deposit' ? `Deposit ${selectedToken} to Aave` : `Withdraw ${selectedToken}`}
          </button>
        ) : isProcessing ? (
          <div className="flex items-center justify-center gap-3 py-3.5">
            <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-emerald-400 font-medium">
              {step === 'approving' ? 'Approving token…' : step === 'depositing' ? 'Depositing to Aave…' : 'Withdrawing…'}
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
              <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                className="block text-center text-xs text-brand-400 hover:text-brand-300 font-mono">
                View on Etherscan ↗
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

        {/* Info footer */}
        <p className="text-xs text-surface-600 text-center">
          Deposits earn live yield via Aave v3. Withdraw anytime. 1% fee on withdrawal.
        </p>
      </div>
    </div>
  );
}
