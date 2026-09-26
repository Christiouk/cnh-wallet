'use client';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { validTronAddress } from '@/lib/tron/core';
import Modal from '../Modal';
export default function TronReceive({
  address,
  onClose,
}: {
  address: string;
  onClose(): void;
}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);
  return (
    <Modal isOpen onClose={onClose} title="Receive · Tron">
      {!validTronAddress(address) ? (
        <p>Tron wallet unavailable</p>
      ) : (
        <div className="space-y-5">
          <p>USDT TRC-20 · Your Tron address</p>
          <div className="bg-white rounded-xl p-4 w-fit mx-auto">
            <QRCodeSVG
              value={address}
              size={192}
              title="Tron receiving address"
            />
          </div>
          <p className="font-mono text-sm break-all">{address}</p>
          <button
            className="btn-primary w-full"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(address);
                setCopied(true);
                setError(false);
              } catch {
                setError(true);
              }
            }}
          >
            {copied ? 'Address copied' : 'Copy Address'}
          </button>
          {error && (
            <p role="alert">
              Copy unavailable. Select and copy the address above.
            </p>
          )}
          <p className="text-sm text-amber-300">
            Send only assets supported on the Tron network to this address. For
            USDT, select TRON / TRC-20 at the sending exchange or wallet. Do not
            send USDT ERC-20 to this address.
          </p>
        </div>
      )}
    </Modal>
  );
}
