'use client';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { copyToClipboard } from '@/lib/utils';
export default function ReceiveAddress({
  address,
  network,
  explorer,
}: {
  address: string;
  network: 'Ethereum' | 'Tron';
  explorer: string;
}) {
  const [notice, setNotice] = useState('');
  return (
    <div className="receive-flow">
      <div className="network-banner">
        <span className="eyebrow">NETWORK</span>
        <strong>{network}</strong>
        <span>
          {network === 'Tron' ? 'USDT TRC-20 · TRX' : 'ETH · USDT · USDC'}
        </span>
      </div>
      <div className="qr-frame">
        <QRCodeSVG
          value={address}
          size={192}
          level="H"
          title={`${network} receiving address`}
          fgColor="#0B0D0F"
          bgColor="#ffffff"
        />
      </div>
      <p className="field-label">Your {network} Wallet Address</p>
      <p className="address-text receive-address">{address}</p>
      <button
        className="btn-primary w-full"
        onClick={async () =>
          setNotice(
            (await copyToClipboard(address))
              ? 'Address copied'
              : 'Copy unavailable. Select and copy the address above.',
          )
        }
      >
        {notice === 'Address copied' ? 'Address copied' : 'Copy Address'}
      </button>
      <p role="status" className="small muted">
        {notice}
      </p>
      <div className="network-warning">
        <strong>Check the network</strong>
        <p>
          {network === 'Tron'
            ? 'For USDT, select TRON / TRC-20 at the sending exchange or wallet. Do not send USDT ERC-20 to this address.'
            : 'Use the Ethereum network when sending supported assets to this address. Supported: ETH, USDT ERC-20 and USDC ERC-20.'}
        </p>
      </div>
      <a
        className="explorer-link"
        href={explorer}
        target="_blank"
        rel="noopener noreferrer"
      >
        View address on {network === 'Tron' ? 'Tronscan' : 'Etherscan'}{' '}
        <span aria-hidden>↗</span>
      </a>
    </div>
  );
}
