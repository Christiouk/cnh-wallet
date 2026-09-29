'use client';
import { validTronAddress, tronExplorer } from '@/lib/tron/core';
import Modal from '../Modal';
import ReceiveAddress from '../ui/ReceiveAddress';
export default function TronReceive({
  address,
  onClose,
}: {
  address: string;
  onClose(): void;
}) {
  return (
    <Modal isOpen onClose={onClose} title="Receive · Tron">
      {validTronAddress(address) ? (
        <ReceiveAddress
          network="Tron"
          address={address}
          explorer={tronExplorer('address', address)}
        />
      ) : (
        <p>Tron wallet unavailable</p>
      )}
    </Modal>
  );
}
