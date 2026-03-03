'use client';
import { useState, useMemo } from 'react';
import Modal from './Modal';
import { CONTACT, FEE } from '@/lib/constants';
import { CURATED_TOKENS } from '@/lib/tokens';
import { PricesMap } from '@/hooks/usePrices';

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  prices?: PricesMap;
}

const SWAPPABLE = CURATED_TOKENS.filter(t =>
  ['ETH', 'WBTC', 'USDT', 'USDC', 'DAI', 'WETH'].includes(t.symbol)
);

function formatUSD(value: number): string {
  if (value >= 1000) return '$' + value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (value >= 1) return '$' + value.toFixed(2);
  return '$' + value.toFixed(6);
}

export default function SwapModal({ isOpen, onClose, prices = {} }: SwapModalProps) {
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const fromPrice = prices[fromToken]?.usd || 0;
  const toPrice = prices[toToken]?.usd || 0;
  const numFrom = parseFloat(fromAmount) || 0;

  const fromUsdValue = numFrom * fromPrice;
  const feeUsd = fromUsdValue * (FEE.percentage / 100);
  const netUsd = fromUsdValue - feeUsd;
  const toAmount = toPrice > 0 ? netUsd / toPrice : 0;

  const exchangeRate = fromPrice > 0 && toPrice > 0 ? fromPrice / toPrice : 0;

  const handleFlip = () => {
    const prev = fromToken;
    setFromToken(toToken);
    setToToken(prev);
    setFromAmount('');
  };

  const handleSubmit = () => {
    if (!fromAmount || numFrom <= 0) return;
    setSubmitted(true);
  };

  const handleClose = () => {
    setSubmitted(false);
    setFromAmount('');
    setFromToken('ETH');
    setToToken('USDC');
    onClose();
  };

  const orderSummary = `Swap ${numFrom} ${fromToken} → ~${toAmount.toFixed(6)} ${toToken}`;
  const whatsappMessage = encodeURIComponent(
    `Hello Morsands Trade Desk,\n\nI would like to place a swap order:\n\n${orderSummary}\nFrom value: $${fromUsdValue.toFixed(2)}\nFee (1%): $${feeUsd.toFixed(2)}\nNet: $${netUsd.toFixed(2)}\n\nPlease confirm availability and pricing.`
  );
  const whatsappUrl = `${CONTACT.whatsappUrl}?text=${whatsappMessage}`;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Swap Tokens">
      {submitted ? (
        <div className="space-y-5">
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-cyan-500/10">
              <svg className="w-7 h-7 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="text-base font-semibold text-white mb-2">Swap Order Ready</h4>
            <p className="text-sm text-surface-400 max-w-xs mx-auto">
              Contact our desk to confirm execution at the best available rate.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface-800/60 border border-surface-700/30 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-surface-400">You swap</span>
              <span className="text-white font-medium">{numFrom} {fromToken}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-400">You receive ~</span>
              <span className="text-cyan-300 font-medium">{toAmount.toFixed(6)} {toToken}</span>
            </div>
            {exchangeRate > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-surface-400">Rate</span>
                <span className="text-white">1 {fromToken} ≈ {exchangeRate.toFixed(6)} {toToken}</span>
              </div>
            )}
            <div className="flex justify-between text-sm border-t border-surface-700/30 pt-2 mt-1">
              <span className="text-surface-400">Service fee (1%)</span>
              <span className="text-orange-400 font-medium">-${feeUsd.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-white">Net value</span>
              <span className="text-emerald-400">${netUsd.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 text-emerald-400 font-medium text-sm transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Confirm via WhatsApp
            </a>
            <button
              onClick={() => setSubmitted(false)}
              className="w-full p-3 rounded-xl text-surface-400 hover:text-white text-sm transition-colors"
            >
              Edit Swap
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* From token */}
          <div className="p-4 rounded-xl bg-surface-800/60 border border-surface-700/30 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-surface-400">From</label>
              {fromPrice > 0 && (
                <span className="text-xs text-surface-500">{formatUSD(fromPrice)} / {fromToken}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <select
                value={fromToken}
                onChange={(e) => {
                  if (e.target.value !== toToken) setFromToken(e.target.value);
                }}
                className="bg-surface-700/60 border border-surface-600/30 rounded-lg px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:border-brand-500/50 min-w-[90px]"
              >
                {SWAPPABLE.map(t => (
                  <option key={t.symbol} value={t.symbol} disabled={t.symbol === toToken}>
                    {t.symbol}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                className="flex-1 bg-transparent text-right text-xl font-bold text-white placeholder-surface-700 focus:outline-none"
              />
            </div>
            {numFrom > 0 && fromPrice > 0 && (
              <p className="text-xs text-surface-500 text-right">≈ {formatUSD(fromUsdValue)}</p>
            )}
          </div>

          {/* Flip button */}
          <div className="flex justify-center">
            <button
              onClick={handleFlip}
              className="w-9 h-9 rounded-xl bg-surface-800/80 border border-surface-700/30 flex items-center justify-center hover:bg-surface-700/60 hover:border-surface-600/50 transition-all group"
            >
              <svg className="w-4 h-4 text-surface-400 group-hover:text-white transition-colors group-hover:rotate-180 duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
              </svg>
            </button>
          </div>

          {/* To token */}
          <div className="p-4 rounded-xl bg-surface-800/40 border border-surface-700/20 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-surface-400">To (estimated)</label>
              {toPrice > 0 && (
                <span className="text-xs text-surface-500">{formatUSD(toPrice)} / {toToken}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <select
                value={toToken}
                onChange={(e) => {
                  if (e.target.value !== fromToken) setToToken(e.target.value);
                }}
                className="bg-surface-700/60 border border-surface-600/30 rounded-lg px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:border-brand-500/50 min-w-[90px]"
              >
                {SWAPPABLE.map(t => (
                  <option key={t.symbol} value={t.symbol} disabled={t.symbol === fromToken}>
                    {t.symbol}
                  </option>
                ))}
              </select>
              <div className="flex-1 text-right">
                <p className={`text-xl font-bold ${toAmount > 0 ? 'text-cyan-300' : 'text-surface-700'}`}>
                  {toAmount > 0 ? toAmount.toFixed(6) : '0.00'}
                </p>
              </div>
            </div>
            {toAmount > 0 && toPrice > 0 && (
              <p className="text-xs text-surface-500 text-right">≈ {formatUSD(netUsd)}</p>
            )}
          </div>

          {/* Rate + fee info */}
          {numFrom > 0 && exchangeRate > 0 && (
            <div className="px-1 space-y-1.5">
              <div className="flex justify-between text-xs text-surface-500">
                <span>Exchange rate</span>
                <span>1 {fromToken} ≈ {exchangeRate.toFixed(6)} {toToken}</span>
              </div>
              <div className="flex justify-between text-xs text-surface-500">
                <span>Service fee (1%)</span>
                <span className="text-orange-400">-${feeUsd.toFixed(2)}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!fromAmount || numFrom <= 0}
            className={`w-full p-3.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
              !fromAmount || numFrom <= 0
                ? 'bg-surface-800/60 text-surface-600 cursor-not-allowed'
                : 'bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'
            }`}
          >
            Review Swap &rarr;
          </button>

          <p className="text-xs text-surface-600 text-center">
            Swaps are executed by the Morsands trade desk. Rates are indicative.
          </p>
        </div>
      )}
    </Modal>
  );
}
