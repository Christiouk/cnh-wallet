'use client';
import { isAddress } from 'viem';
import Modal from './Modal';
import ReceiveAddress from './ui/ReceiveAddress';
export default function ReceiveModal({
  isOpen,
  onClose,
  walletAddress,
}: {
  isOpen: boolean;
  onClose(): void;
  walletAddress: string;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Receive">
      {isAddress(walletAddress) ? (
        <ReceiveAddress
          network="Ethereum"
          address={walletAddress}
          explorer={`https://etherscan.io/address/${walletAddress}`}
        />
      ) : (
        <p>Ethereum wallet unavailable</p>
      )}
    </Modal>
  );
}
