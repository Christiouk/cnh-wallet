// CNH Financial — Send Modal with 0.5% Service Fee

import { useState, useCallback, useEffect } from 'react';
import { useSendTransaction, useWallets } from '@privy-io/react-auth';
import { encodeFunctionData, erc20Abi, parseUnits, isAddress, formatUnits } from 'viem';
import Modal from './Modal';
import { CURATED_TOKENS, Token } from '@/lib/tokens';
import { CONTACT } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'form' | 'confirm' | 'sending' | 'success' | 'error';

// CNH company wallet for service fees
const CNH_FEE_WALLET = '0x24B041fe121587343b4432207870E2aA5cfB5af2';
const CNH_FEE_PERCENT = 0.5; // 0.5%

export default function SendModal({ isOpen, onClose }: SendModalProps) {
  const { sendTransaction } = useSendTransaction();
  const { wallets } = useWallets();

  const [step, setStep] = useState<Step>('form');
  const [selectedToken, setSelectedToken] = useState<Token>(CURATED_TOKENS[0]);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [feeHash, setFeeHash] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showTokenPicker, setShowTokenPicker] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('form');
        setRecipient('');
        setAmount('');
        setTxHash('');
        setFeeHash('');
        setErrorMsg('');
        setShowTokenPicker(false);
      }, 300);
    }
  }, [isOpen]);

  const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0];

  const isValidForm = useCallback(() => {
    if (!recipient || !isAddress(recipient)) return false;
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return false;
    return true;
  }, [recipient, amount]);

  // Calculate fee breakdown
  const calculateFees = useCallback(() => {
    const totalAmount = Number(amount) || 0;
    const feeAmount = totalAmount * (CNH_FEE_PERCENT / 100);
    const recipientAmount = totalAmount - feeAmount;
    return { totalAmount, feeAmount, recipientAmount };
  }, [amount]);

  const handleSend = async () => {
    if (!isValidForm() || !embeddedWallet) return;
    setStep('confirm');
  };

  const handleConfirmSend = async () => {
    setStep('sending');
    setErrorMsg('');

    try {
      const { feeAmount, recipientAmount } = calculateFees();

      // Transaction 1: Send fee to CNH wallet
      let feeTxInput: any;
      if (selectedToken.isNative) {
        // Native ETH fee
        const feeInWei = parseUnits(feeAmount.toFixed(18), 18);
        feeTxInput = {
          to: CNH_FEE_WALLET as `0x${string}`,
          value: feeInWei,
          chainId: 1,
        };
      } else {
        // ERC-20 fee
        const feeTokenAmount = parseUnits(feeAmount.toFixed(selectedToken.decimals), selectedToken.decimals);
        const feeData = encodeFunctionData({
          abi: erc20Abi,
          functionName: 'transfer',
          args: [CNH_FEE_WALLET as `0x${string}`, feeTokenAmount],
        });
        feeTxInput = {
          to: selectedToken.address as `0x${string}`,
          data: feeData,
          chainId: 1,
        };
      }

      const feeResult = await sendTransaction(feeTxInput, {
        address: embeddedWallet.address,
      });
      setFeeHash(feeResult.hash);

      // Transaction 2: Send remainder to recipient
      let recipientTxInput: any;
      if (selectedToken.isNative) {
        // Native ETH transfer
        const recipientInWei = parseUnits(recipientAmount.toFixed(18), 18);
        recipientTxInput = {
          to: recipient as `0x${string}`,
          value: recipientInWei,
          chainId: 1,
        };
      } else {
        // ERC-20 transfer
        const recipientTokenAmount = parseUnits(recipientAmount.toFixed(selectedToken.decimals), selectedToken.decimals);
        const recipientData = encodeFunctionData({
          abi: erc20Abi,
          functionName: 'transfer',
          args: [recipient as `0x${string}`, recipientTokenAmount],
        });
        recipientTxInput = {
          to: selectedToken.address as `0x${string}`,
          data: recipientData,
          chainId: 1,
        };
      }

      const recipientResult = await sendTransaction(recipientTxInput, {
        address: embeddedWallet.address,
      });

      setTxHash(recipientResult.hash);
      setStep('success');
    } catch (err: any) {
      console.error('Transaction failed:', err);
      setErrorMsg(err?.message || 'Transaction failed. Please try again.');
      setStep('error');
    }
  };

  const handleClose = () => {
    onClose();
  };

  const { totalAmount, feeAmount, recipientAmount } = calculateFees();

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Send">
      {/* Step: Form */}
      {step === 'form' && (
        <div className="space-y-5">
          {/* Token Selector */}
          <div>
            <label className="text-xs text-surface-500 font-medium mb-1.5 block">Token</label>
            <button
              onClick={() => setShowTokenPicker(!showTokenPicker)}
              className="w-full flex items-center justify-between px-4 py-3 bg-surface-900/80 border border-surface-700/50 rounded-xl hover:border-brand-600/40 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold',
                  selectedToken.symbol === 'ETH' ? 'bg-gradient-to-br from-blue-500 to-blue-700' :
                  selectedToken.symbol === 'USDT' ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' :
                  selectedToken.symbol === 'USDC' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                  selectedToken.symbol === 'WBTC' ? 'bg-gradient-to-br from-orange-500 to-orange-700' :
                  'bg-gradient-to-br from-indigo-500 to-indigo-700'
                )}>
                  {selectedToken.symbol.slice(0, 3)}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">{selectedToken.name}</p>
                  <p className="text-xs text-surface-500">{selectedToken.symbol}</p>
                </div>
              </div>
              <svg className={cn('w-4 h-4 text-surface-400 transition-transform', showTokenPicker && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showTokenPicker && (
              <div className="mt-1 bg-surface-900 border border-surface-700/50 rounded-xl overflow-hidden animate-fade-in">
                {CURATED_TOKENS.map((token) => (
                  <button
                    key={token.symbol}
                    onClick={() => { setSelectedToken(token); setShowTokenPicker(false); }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left',
                      selectedToken.symbol === token.symbol && 'bg-brand-600/10'
                    )}
                  >
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold',
                      token.symbol === 'ETH' ? 'bg-gradient-to-br from-blue-500 to-blue-700' :
                      token.symbol === 'USDT' ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' :
                      token.symbol === 'USDC' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                      token.symbol === 'WBTC' ? 'bg-gradient-to-br from-orange-500 to-orange-700' :
                      'bg-gradient-to-br from-indigo-500 to-indigo-700'
                    )}>
                      {token.symbol.slice(0, 3)}
                    </div>
                    <div>
                      <p className="text-sm text-white">{token.name}</p>
                      <p className="text-xs text-surface-500">{token.symbol}</p>
                    </div>
                    {selectedToken.symbol === token.symbol && (
                      <svg className="w-4 h-4 text-brand-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Recipient Address */}
          <div>
            <label className="text-xs text-surface-500 font-medium mb-1.5 block">Recipient Address</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value.trim())}
              placeholder="0x..."
              className="input-field font-mono text-sm"
              spellCheck={false}
              autoComplete="off"
            />
            {recipient && !isAddress(recipient) && (
              <p className="text-xs text-red-400 mt-1.5">Invalid Ethereum address</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs text-surface-500 font-medium mb-1.5 block">
              Amount ({selectedToken.symbol})
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                  setAmount(val);
                }
              }}
              placeholder="0.00"
              className="input-field text-lg font-semibold"
            />
            {amount && Number(amount) > 0 && (
              <div className="mt-2 p-2.5 rounded-lg bg-surface-900/60 border border-surface-700/30 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-surface-500">CNH Fee (0.5%)</span>
                  <span className="text-amber-400 font-medium">{feeAmount.toFixed(6)} {selectedToken.symbol}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-surface-500">Recipient receives</span>
                  <span className="text-brand-400 font-semibold">{recipientAmount.toFixed(6)} {selectedToken.symbol}</span>
                </div>
              </div>
            )}
          </div>

          {/* Network Notice */}
          <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/15">
            <div className="flex items-start gap-2.5">
              <svg className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                Transfers are on <strong className="text-amber-200">Ethereum Mainnet</strong>. 
                A 0.5% service fee applies to all transfers.
              </p>
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!isValidForm()}
            className="btn-primary w-full py-3.5 text-sm font-semibold disabled:opacity-40"
          >
            Review Transfer
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-surface-800/50" />
            <span className="text-xs text-surface-600">or</span>
            <div className="flex-1 h-px bg-surface-800/50" />
          </div>

          {/* Contact CNH Desk fallback */}
          <a
            href={CONTACT.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 hover:bg-emerald-500/10 text-emerald-400 text-sm font-medium transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Contact CNH Desk for large transfers
          </a>
        </div>
      )}

      {/* Step: Confirm */}
      {step === 'confirm' && (
        <div className="space-y-5">
          <div className="text-center py-2">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/10 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-7 h-7 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h4 className="text-base font-semibold text-white mb-1">Confirm Transfer</h4>
            <p className="text-sm text-surface-400">Review the breakdown below</p>
          </div>

          <div className="bg-surface-900/80 border border-surface-700/50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-surface-500">Token</span>
              <span className="text-sm font-semibold text-white">{selectedToken.symbol}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-surface-500">Total Amount</span>
              <span className="text-sm font-semibold text-white">{totalAmount.toFixed(6)} {selectedToken.symbol}</span>
            </div>
            <div className="border-t border-surface-800/50 pt-2 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-surface-500">CNH Fee (0.5%)</span>
                <span className="text-xs font-medium text-amber-400">-{feeAmount.toFixed(6)} {selectedToken.symbol}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-surface-500">Recipient Receives</span>
                <span className="text-sm font-bold text-brand-400">{recipientAmount.toFixed(6)} {selectedToken.symbol}</span>
              </div>
            </div>
            <div className="border-t border-surface-800/50 pt-3">
              <span className="text-xs text-surface-500 block mb-1">Recipient</span>
              <span className="text-xs font-mono text-surface-200 break-all leading-relaxed">{recipient}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-surface-500">Network</span>
              <span className="text-xs text-surface-300">Ethereum Mainnet</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/15">
            <p className="text-xs text-blue-200/80 leading-relaxed">
              Two transactions will be sent: <strong className="text-blue-200">1)</strong> Service fee to CNH wallet, <strong className="text-blue-200">2)</strong> Remainder to recipient. Both must succeed.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setStep('form')}
              className="btn-secondary py-3 text-sm font-medium"
            >
              Back
            </button>
            <button
              onClick={handleConfirmSend}
              className="btn-primary py-3 text-sm font-semibold"
            >
              Confirm Send
            </button>
          </div>
        </div>
      )}

      {/* Step: Sending */}
      {step === 'sending' && (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 mx-auto mb-5 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-brand-400 border-t-transparent rounded-full animate-spin" />
          </div>
          <h4 className="text-base font-semibold text-white mb-2">Processing Transfer...</h4>
          <p className="text-sm text-surface-400 max-w-xs mx-auto">
            Sending fee and transfer. Please wait and do not close this window.
          </p>
        </div>
      )}

      {/* Step: Success */}
      {step === 'success' && (
        <div className="text-center py-6 space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-2">Transfer Complete</h4>
            <p className="text-sm text-surface-400">
              Successfully sent {recipientAmount.toFixed(6)} {selectedToken.symbol} to recipient
            </p>
            <p className="text-xs text-surface-500 mt-1">
              Fee: {feeAmount.toFixed(6)} {selectedToken.symbol}
            </p>
          </div>

          <div className="bg-surface-900/60 border border-surface-700/30 rounded-xl p-3.5 space-y-2">
            <div>
              <p className="text-xs text-surface-500 mb-1">Fee Transaction</p>
              <a
                href={`https://etherscan.io/tx/${feeHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-brand-400 hover:text-brand-300 break-all"
              >
                {feeHash}
              </a>
            </div>
            <div>
              <p className="text-xs text-surface-500 mb-1">Transfer Transaction</p>
              <a
                href={`https://etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-brand-400 hover:text-brand-300 break-all"
              >
                {txHash}
              </a>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="btn-primary w-full py-3 text-sm font-semibold"
          >
            Done
          </button>
        </div>
      )}

      {/* Step: Error */}
      {step === 'error' && (
        <div className="text-center py-6 space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-2">Transfer Failed</h4>
            <p className="text-sm text-surface-400 max-w-sm mx-auto">{errorMsg}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleClose}
              className="btn-secondary py-3 text-sm font-medium"
            >
              Close
            </button>
            <button
              onClick={() => setStep('form')}
              className="btn-primary py-3 text-sm font-semibold"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
