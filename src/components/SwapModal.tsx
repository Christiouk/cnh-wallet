'use client';
// Morsands — Swap Modal (1inch v6 DEX Integration)
// Flow: Quote → Fee (1% on-chain) → Approve (ERC-20) → Swap (1inch router)
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSendTransaction, useWallets } from '@privy-io/react-auth';
import {
  encodeFunctionData,
  parseUnits,
  formatUnits,
  createPublicClient,
  http,
} from 'viem';
import { mainnet } from 'viem/chains';
import Modal from './Modal';
import { FEE } from '@/lib/constants';
import { CURATED_TOKENS } from '@/lib/tokens';
import { PricesMap } from '@/hooks/usePrices';

const ONEINCH_ROUTER = '0x111111125421cA6dc452d289314280a0f8842A65' as `0x${string}`;
const ONEINCH_CHAIN_ID = 1;
const NATIVE_ETH = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

const ERC20_ABI = [
  { name: 'approve', type: 'function', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable' },
  { name: 'allowance', type: 'function', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }], stateMutability: 'view' },
  { name: 'transfer', type: 'function', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }], stateMutability: 'nonpayable' },
] as const;

const SWAPPABLE = CURATED_TOKENS.filter(t =>
  ['ETH', 'WBTC', 'USDT', 'USDC', 'DAI', 'WETH'].includes(t.symbol)
);

function formatUSD(value: number): string {
  if (value >= 1000) return '$' + value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (value >= 1) return '$' + value.toFixed(2);
  return '$' + value.toFixed(6);
}

function formatAmount(value: number): string {
  if (value === 0) return '0';
  if (value < 0.000001) return value.toExponential(4);
  return value.toFixed(6);
}

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  prices?: PricesMap;
}

type SwapStep = 'idle' | 'quoting' | 'fee' | 'approve' | 'swap' | 'done' | 'error';

export default function SwapModal({ isOpen, onClose, prices = {} }: SwapModalProps) {
  const { wallets } = useWallets();
  const { sendTransaction } = useSendTransaction();
  const wallet = wallets[0];
  const walletAddress = wallet?.address as `0x${string}` | undefined;

  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [step, setStep] = useState<SwapStep>('idle');
  const [quote, setQuote] = useState<{ toAmountFormatted: number } | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const quoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fromTokenData = SWAPPABLE.find(t => t.symbol === fromToken);
  const toTokenData = SWAPPABLE.find(t => t.symbol === toToken);
  const fromPrice = prices[fromToken]?.usd || 0;
  const numFrom = parseFloat(fromAmount) || 0;
  const fromUsdValue = numFrom * fromPrice;
  const feeUsd = fromUsdValue * (FEE.percentage / 100);

  const fetchQuote = useCallback(async () => {
    if (!fromTokenData || !toTokenData || numFrom <= 0) { setQuote(null); return; }
    setQuoteError(null);
    setStep('quoting');
    try {
      const srcToken = fromTokenData.isNative ? NATIVE_ETH : fromTokenData.address!;
      const dstToken = toTokenData.isNative ? NATIVE_ETH : toTokenData.address!;
      const amountIn = parseUnits(fromAmount, fromTokenData.decimals);
      const amountAfterFee = (amountIn * BigInt(99)) / BigInt(100);
      const apiKey = process.env.NEXT_PUBLIC_ONEINCH_API_KEY || '';
      const url = `https://api.1inch.dev/swap/v6.0/${ONEINCH_CHAIN_ID}/quote?src=${srcToken}&dst=${dstToken}&amount=${amountAfterFee.toString()}`;
      const res = await fetch(url, { headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {} });
      if (!res.ok) throw new Error('Quote unavailable');
      const data = await res.json();
      setQuote({ toAmountFormatted: Number(formatUnits(BigInt((data as { dstAmount: string }).dstAmount), toTokenData.decimals)) });
      setStep('idle');
    } catch {
      setQuote(null);
      setQuoteError('Quote unavailable — check amount or try again');
      setStep('idle');
    }
  }, [fromToken, toToken, fromAmount, fromTokenData, toTokenData, numFrom]);

  useEffect(() => {
    if (quoteTimer.current) clearTimeout(quoteTimer.current);
    if (numFrom > 0) { quoteTimer.current = setTimeout(fetchQuote, 700); }
    else { setQuote(null); }
    return () => { if (quoteTimer.current) clearTimeout(quoteTimer.current); };
  }, [fromToken, toToken, fromAmount, fetchQuote]);

  const handleFlip = () => {
    const prev = fromToken;
    setFromToken(toToken);
    setToToken(prev);
    setFromAmount('');
    setQuote(null);
  };

  const handleClose = () => {
    setStep('idle'); setFromAmount(''); setFromToken('ETH'); setToToken('USDC');
    setQuote(null); setTxHash(null); setErrorMsg(null); setQuoteError(null);
    onClose();
  };

  const handleSwap = async () => {
    if (!walletAddress || !fromTokenData || !toTokenData || numFrom <= 0) return;
    setErrorMsg(null);
    try {
      const srcToken = fromTokenData.isNative ? NATIVE_ETH : fromTokenData.address!;
      const dstToken = toTokenData.isNative ? NATIVE_ETH : toTokenData.address!;
      const amountIn = parseUnits(fromAmount, fromTokenData.decimals);
      const feeAmount = (amountIn * BigInt(FEE.basisPoints)) / BigInt(10000);
      const amountAfterFee = amountIn - feeAmount;

      // Step 1: Fee
      setStep('fee');
      if (fromTokenData.isNative) {
        await sendTransaction({ to: FEE.recipientAddress as `0x${string}`, value: feeAmount });
      } else {
        await sendTransaction({
          to: fromTokenData.address as `0x${string}`,
          data: encodeFunctionData({ abi: ERC20_ABI, functionName: 'transfer', args: [FEE.recipientAddress as `0x${string}`, feeAmount] }),
        });
      }

      // Step 2: Approve (ERC-20 only)
      if (!fromTokenData.isNative) {
        setStep('approve');
        const publicClient = createPublicClient({ chain: mainnet, transport: http() });
        const allowance = await publicClient.readContract({
          address: fromTokenData.address as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [walletAddress, ONEINCH_ROUTER],
        });
        if ((allowance as bigint) < amountAfterFee) {
          await sendTransaction({
            to: fromTokenData.address as `0x${string}`,
            data: encodeFunctionData({ abi: ERC20_ABI, functionName: 'approve', args: [ONEINCH_ROUTER, amountAfterFee] }),
          });
        }
      }

      // Step 3: Swap via 1inch
      setStep('swap');
      const apiKey = process.env.NEXT_PUBLIC_ONEINCH_API_KEY || '';
      const swapUrl = `https://api.1inch.dev/swap/v6.0/${ONEINCH_CHAIN_ID}/swap?src=${srcToken}&dst=${dstToken}&amount=${amountAfterFee.toString()}&from=${walletAddress}&slippage=1&disableEstimate=false`;
      const swapRes = await fetch(swapUrl, { headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {} });
      if (!swapRes.ok) {
        const err = await swapRes.json().catch(() => ({}));
        throw new Error((err as { description?: string })?.description || 'Swap failed — try again');
      }
      const swapData = await swapRes.json();
      const tx = (swapData as { tx: { to: string; data: string } }).tx;
      const receipt = await sendTransaction({
        to: tx.to as `0x${string}`,
        data: tx.data as `0x${string}`,
        value: fromTokenData.isNative ? amountAfterFee : BigInt(0),
      });
      setTxHash((receipt as { hash?: string })?.hash || null);
      setStep('done');
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Transaction failed');
      setStep('error');
    }
  };

  const stepLabel: Record<SwapStep, string> = {
    idle: '', quoting: 'Getting best price...',
    fee: 'Step 1/3 — Sending platform fee...',
    approve: 'Step 2/3 — Approving token...',
    swap: 'Step 3/3 — Executing swap...',
    done: 'Swap complete', error: 'Transaction failed',
  };
  const isExecuting = ['fee', 'approve', 'swap'].includes(step);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Swap Tokens">
      {step === 'done' ? (
        <div className="space-y-5">
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-emerald-500/10">
              <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="text-base font-semibold text-white mb-2">Swap Executed</h4>
            <p className="text-sm text-surface-400 max-w-xs mx-auto">Your swap has been submitted on-chain. Tokens will arrive in your wallet shortly.</p>
          </div>
          {txHash && (
            <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="block text-center text-xs text-cyan-400 hover:text-cyan-300 underline">
              View on Etherscan &#8594;
            </a>
          )}
          <div className="bg-surface-800 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-surface-300"><span>Swapped</span><span className="text-white font-medium">{numFrom} {fromToken}</span></div>
            <div className="flex justify-between text-surface-300"><span>Received (est.)</span><span className="text-emerald-400 font-medium">~{quote ? formatAmount(quote.toAmountFormatted) : '---'} {toToken}</span></div>
            <div className="flex justify-between text-surface-300"><span>Platform Fee (1%)</span><span className="text-amber-400 font-medium">{formatUSD(feeUsd)}</span></div>
          </div>
          <button onClick={handleClose} className="w-full py-3 rounded-xl bg-surface-700 text-white font-semibold hover:bg-surface-600 transition-colors">Close</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-surface-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-surface-400 uppercase tracking-wider">You Pay</span>
              <select value={fromToken} onChange={e => { setFromToken(e.target.value); setFromAmount(''); setQuote(null); }}
                className="bg-surface-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg border border-surface-600 focus:outline-none focus:border-cyan-500" disabled={isExecuting}>
                {SWAPPABLE.filter(t => t.symbol !== toToken).map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
              </select>
            </div>
            <input type="number" placeholder="0.00" value={fromAmount} onChange={e => setFromAmount(e.target.value)}
              className="w-full bg-transparent text-2xl font-bold text-white placeholder-surface-500 focus:outline-none" disabled={isExecuting} />
            {fromUsdValue > 0 && <p className="text-xs text-surface-400">{formatUSD(fromUsdValue)}</p>}
          </div>

          <div className="flex justify-center">
            <button onClick={handleFlip} disabled={isExecuting}
              className="w-9 h-9 rounded-xl bg-surface-700 border border-surface-600 flex items-center justify-center hover:bg-surface-600 transition-colors disabled:opacity-40">
              <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          <div className="bg-surface-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-surface-400 uppercase tracking-wider">You Receive</span>
              <select value={toToken} onChange={e => { setToToken(e.target.value); setQuote(null); }}
                className="bg-surface-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg border border-surface-600 focus:outline-none focus:border-cyan-500" disabled={isExecuting}>
                {SWAPPABLE.filter(t => t.symbol !== fromToken).map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
              </select>
            </div>
            <div className="text-2xl font-bold text-white">
              {step === 'quoting' ? <span className="text-surface-500 animate-pulse">Quoting...</span>
                : quote ? <span className="text-emerald-400">~{formatAmount(quote.toAmountFormatted)}</span>
                : <span className="text-surface-500">---</span>}
            </div>
            {quoteError && <p className="text-xs text-red-400">{quoteError}</p>}
          </div>

          {numFrom > 0 && (
            <div className="bg-surface-800 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between text-surface-300"><span>Input value</span><span className="text-white">{formatUSD(fromUsdValue)}</span></div>
              <div className="flex justify-between text-surface-300"><span>Platform Fee (1%)</span><span className="text-amber-400">-{formatUSD(feeUsd)}</span></div>
              <div className="flex justify-between text-surface-300"><span>Net swapped</span><span className="text-white">{formatUSD(fromUsdValue - feeUsd)}</span></div>
              <div className="flex justify-between text-surface-300 pt-1 border-t border-surface-700">
                <span>Slippage tolerance</span><span className="text-cyan-400">1%</span>
              </div>
              <div className="flex justify-between text-surface-300"><span>Route</span><span className="text-cyan-400">1inch v6</span></div>
            </div>
          )}

          {isExecuting && (
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 text-cyan-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <span className="text-sm text-cyan-300 font-medium">{stepLabel[step]}</span>
              </div>
              <p className="text-xs text-surface-400 mt-1">Please confirm each transaction in your wallet</p>
            </div>
          )}

          {step === 'error' && errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
              <p className="text-sm text-red-400">{errorMsg}</p>
              <button onClick={() => { setStep('idle'); setErrorMsg(null); }} className="text-xs text-surface-400 hover:text-white mt-1 underline">Try again</button>
            </div>
          )}

          <button onClick={handleSwap}
            disabled={!walletAddress || numFrom <= 0 || isExecuting || step === 'quoting'}
            className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 disabled:opacity-40 disabled:cursor-not-allowed">
            {isExecuting ? stepLabel[step] : 'Swap Now'}
          </button>

          <p className="text-xs text-surface-500 text-center">Powered by 1inch v6 · On-chain execution · 1% platform fee applies</p>
        </div>
      )}
    </Modal>
  );
}
