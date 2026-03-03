'use client';
import { useState } from 'react';
import Modal from './Modal';
import { CONTACT, FEE } from '@/lib/constants';
import { CURATED_TOKENS } from '@/lib/tokens';
import { PricesMap } from '@/hooks/usePrices';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'buy' | 'sell';
  prices?: PricesMap;
}

const TRADEABLE_TOKENS = CURATED_TOKENS.filter(t =>
  ['ETH', 'WBTC', 'USDT', 'USDC', 'DAI'].includes(t.symbol)
);

function formatUSD(value: number): string {
  if (value >= 1000) return '$' + value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (value >= 1) return '$' + value.toFixed(2);
  return '$' + value.toFixed(4);
}

export default function TradeModal({ isOpen, onClose, type, prices = {} }: TradeModalProps) {
  const isBuy = type === 'buy';
  const [selectedToken, setSelectedToken] = useState('ETH');
  const [amount, setAmount] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const tokenPrice = prices[selectedToken]?.usd || 0;
  const numAmount = parseFloat(amount) || 0;
  const usdValue = isBuy ? numAmount : numAmount * tokenPrice;
  const feeAmount = usdValue * (FEE.percentage / 100);
  const netAmount = usdValue - feeAmount;

  const handleSubmit = () => {
    if (!amount || numAmount <= 0) return;
    setSubmitted(true);
  };

  const handleClose = () => {
    setSubmitted(false);
    setAmount('');
    setSelectedToken('ETH');
    onClose();
  };

  const orderSummary = isBuy
    ? `Buy ${selectedToken} — Amount: $${numAmount.toFixed(2)} USD`
    : `Sell ${numAmount} ${selectedToken} — Value: $${(numAmount * tokenPrice).toFixed(2)} USD`;

  const whatsappMessage = encodeURIComponent(
    `Hello Morsands Trade Desk,\n\nI would like to place an order:\n\n${orderSummary}\nFee (1%): $${feeAmount.toFixed(2)}\nNet: $${netAmount.toFixed(2)}\n\nPlease confirm availability and pricing.`
  );
  const whatsappUrl = `${CONTACT.whatsappUrl}?text=${whatsappMessage}`;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isBuy ? 'Buy Crypto' : 'Sell Crypto'}>
      {submitted ? (
        <div className="space-y-5">
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-emerald-500/10">
              <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="text-base font-semibold text-white mb-2">Order Ready</h4>
            <p className="text-sm text-surface-400 max-w-xs mx-auto">
              Your order has been prepared. Contact our desk to confirm execution.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface-800/60 border border-surface-700/30 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-surface-400">Order</span>
              <span className="text-white font-medium">{isBuy ? 'Buy' : 'Sell'} {selectedToken}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-400">{isBuy ? 'Spend' : 'Amount'}</span>
              <span className="text-white font-medium">{isBuy ? `$${numAmount.toFixed(2)}` : `${numAmount} ${selectedToken}`}</span>
            </div>
            {tokenPrice > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-surface-400">Market Price</span>
                <span className="text-white font-medium">{formatUSD(tokenPrice)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm border-t border-surface-700/30 pt-2 mt-2">
              <span className="text-surface-400">Service Fee (1%)</span>
              <span className="text-orange-400 font-medium">-${feeAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-white">Net Value</span>
              <span className="text-emerald-400">${netAmount.toFixed(2)}</span>
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
              Edit Order
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-surface-400 mb-2">Select Asset</label>
            <div className="grid grid-cols-5 gap-2">
              {TRADEABLE_TOKENS.map(token => (
                <button
                  key={token.symbol}
                  onClick={() => setSelectedToken(token.symbol)}
                  className={`p-2 rounded-xl border text-xs font-semibold transition-all duration-150 ${
                    selectedToken === token.symbol
                      ? 'bg-brand-500/15 border-brand-500/40 text-brand-300'
                      : 'bg-surface-800/60 border-surface-700/30 text-surface-400 hover:text-white hover:border-surface-600/50'
                  }`}
                >
                  {token.symbol}
                </button>
              ))}
            </div>
            {tokenPrice > 0 && (
              <p className="text-xs text-surface-500 mt-2">
                Current price: <span className="text-surface-300 font-medium">{formatUSD(tokenPrice)}</span>
                {prices[selectedToken]?.usd_24h_change !== undefined && (
                  <span className={`ml-2 ${prices[selectedToken].usd_24h_change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {prices[selectedToken].usd_24h_change >= 0 ? '+' : ''}{prices[selectedToken].usd_24h_change.toFixed(2)}%
                  </span>
                )}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-surface-400 mb-2">
              {isBuy ? 'Amount to Spend (USD)' : `Amount to Sell (${selectedToken})`}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400 text-sm font-medium">
                {isBuy ? '$' : selectedToken.slice(0, 3)}
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={isBuy ? '100.00' : '0.05'}
                min="0"
                step={isBuy ? '10' : '0.001'}
                className="w-full pl-10 pr-4 py-3 bg-surface-800/60 border border-surface-700/30 rounded-xl text-white text-sm placeholder-surface-600 focus:outline-none focus:border-brand-500/50 focus:bg-surface-800/80 transition-all"
              />
            </div>
          </div>

          {numAmount > 0 && (
            <div className="p-4 rounded-xl bg-surface-800/40 border border-surface-700/20 space-y-2">
              <p className="text-xs font-medium text-surface-400 mb-3">Order Preview</p>
              {isBuy ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-400">You spend</span>
                    <span className="text-white">${numAmount.toFixed(2)}</span>
                  </div>
                  {tokenPrice > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-400">You receive ~</span>
                      <span className="text-white">{(netAmount / tokenPrice).toFixed(6)} {selectedToken}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-400">You sell</span>
                    <span className="text-white">{numAmount} {selectedToken}</span>
                  </div>
                  {tokenPrice > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-surface-400">Market value</span>
                      <span className="text-white">${(numAmount * tokenPrice).toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between text-sm border-t border-surface-700/30 pt-2 mt-1">
                <span className="text-surface-400">Service fee (1%)</span>
                <span className="text-orange-400">-${feeAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-white">Net value</span>
                <span className="text-emerald-400">${netAmount.toFixed(2)}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!amount || numAmount <= 0}
            className={`w-full p-3.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
              !amount || numAmount <= 0
                ? 'bg-surface-800/60 text-surface-600 cursor-not-allowed'
                : isBuy
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-orange-500/15 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20'
            }`}
          >
            {isBuy ? 'Review Buy Order' : 'Review Sell Order'} &rarr;
          </button>

          <p className="text-xs text-surface-600 text-center">
            Orders are executed by the Morsands trade desk. Prices are indicative.
          </p>
        </div>
      )}
    </Modal>
  );
}
