'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Modal from './Modal';
import { copyToClipboard } from '@/lib/utils';
import { COMPANY } from '@/lib/constants';

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string;
}

export default function ReceiveModal({ isOpen, onClose, walletAddress }: ReceiveModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(walletAddress);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Receive">
      <div className="flex flex-col items-center">
        {/* QR Code */}
        <div className="bg-white p-4 rounded-2xl mb-5 shadow-lg">
          <QRCodeSVG
            value={walletAddress || ''}
            size={180}
            level="H"
            includeMargin={false}
            bgColor="#ffffff"
            fgColor="#0f1729"
          />
        </div>

        {/* Address */}
        <div className="w-full">
          <label className="text-xs text-surface-500 font-medium mb-1.5 block">
            Your Wallet Address
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-3 bg-surface-900/80 border border-surface-700/50 rounded-xl">
              <p className="text-sm font-mono text-surface-200 break-all leading-relaxed">
                {walletAddress}
              </p>
            </div>
            <button
              onClick={handleCopy}
              className={`flex-shrink-0 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'btn-primary'
              }`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Network Warning */}
        <div className="w-full mt-4 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/15">
          <div className="flex items-start gap-2.5">
            <svg className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-xs text-amber-200/80 leading-relaxed">
              Please confirm you are sending on <strong className="text-amber-200">{COMPANY.network}</strong>. 
              Sending tokens on the wrong network may result in permanent loss of funds.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
