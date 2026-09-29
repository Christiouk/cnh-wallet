'use client';
import { useState } from 'react';
import type { A3Network } from '@/lib/wallet/networks';
import Header from '../Header';
import Modal from '../Modal';
import { copyToClipboard } from '@/lib/utils';
export type WalletView = 'wallet' | 'activity' | 'settings';
export type AccountDetails = {
  email?: string;
  ethereum?: string;
  tron?: string;
};
export function AccountPanel({
  account,
  onLogout,
  inDialog = false,
}: {
  account: AccountDetails;
  onLogout(): void;
  inDialog?: boolean;
}) {
  const [notice, setNotice] = useState('');
  return (
    <div className="account-panel">
      <p className="eyebrow">YOUR ACCOUNT</p>
      <h2>At home in A3.</h2>
      <p className="account-identity">
        {account.email || 'Signed in to A3 Wallet'}
      </p>
      <div className="account-addresses">
        <h3 className="settings-section-heading">Wallet addresses</h3>
        {(['ethereum', 'tron'] as const).map((network) => (
          <div key={network} className="address-item">
            <div className="section-line">
              <h3>{network === 'ethereum' ? 'Ethereum' : 'Tron'}</h3>
              <span className="quiet-label">
                {account[network] ? 'Connected' : 'Not available'}
              </span>
            </div>
            {account[network] ? (
              <>
                <p className="address-text">{account[network]}</p>
                <button
                  className="btn-ghost"
                  onClick={async () =>
                    setNotice(
                      (await copyToClipboard(account[network]!))
                        ? `${network === 'ethereum' ? 'Ethereum' : 'Tron'} address copied`
                        : 'Copy unavailable. Select the address above.',
                    )
                  }
                >
                  Copy address
                </button>
              </>
            ) : (
              <p className="muted">
                {network === 'tron'
                  ? 'Choose Tron to view setup availability.'
                  : 'Your Ethereum address is unavailable.'}
              </p>
            )}
          </div>
        ))}
      </div>
      <section className="account-security">
        <h3 className="settings-section-heading">Security</h3>
        <p>
          Authentication powered by Privy. Check the recipient, network and
          amount before approving a transfer. Never share your recovery details
          or verification codes.
        </p>
      </section>
      <h3 className="settings-section-heading">Help &amp; legal</h3>
      <nav
        className="settings-links"
        aria-label={
          inDialog ? 'Account help and legal' : 'Settings help and legal'
        }
      >
        <a
          href="https://www.morsands.com/contact.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          Help & support <span aria-hidden>↗</span>
        </a>
        <a
          href="https://www.morsands.com/privacy.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          Privacy policy <span aria-hidden>↗</span>
        </a>
        <a
          href="https://www.morsands.com/delete-account.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          Account & data deletion <span aria-hidden>↗</span>
        </a>
      </nav>
      <p role="status" className="small">
        {notice}
      </p>
      <button className="btn-secondary sign-out" onClick={onLogout}>
        Sign out
      </button>
    </div>
  );
}
export default function WalletShell({
  network,
  onNetworkChange,
  account,
  onLogout,
  view,
  onViewChange,
  children,
}: {
  network: A3Network;
  onNetworkChange(network: A3Network): void;
  account: AccountDetails;
  onLogout(): void;
  view: WalletView;
  onViewChange(view: WalletView): void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="wallet-shell">
      <a className="skip-link" href="#wallet-main">
        Skip to wallet
      </a>
      <Header
        network={network}
        onNetworkChange={onNetworkChange}
        onAccount={() => setOpen(true)}
      />
      <div className="wallet-container">
        <nav className="app-navigation" aria-label="Wallet navigation">
          {(['wallet', 'activity', 'settings'] as const).map((item, index) => (
            <button
              key={item}
              aria-current={view === item ? 'page' : undefined}
              onClick={() => onViewChange(item)}
            >
              <span aria-hidden>{['◫', '↗', '○'][index]}</span>
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </nav>
        <main id="wallet-main" tabIndex={-1}>
          {view === 'settings' && (
            <section className="settings-page">
              <h1 className="sr-only">Settings</h1>
              <AccountPanel account={account} onLogout={onLogout} />
            </section>
          )}
          <div hidden={view === 'settings'}>{children}</div>
        </main>
        <footer className="app-footer">
          <span>
            A3 Wallet <span aria-hidden> / </span> Your assets. Your control.
          </span>
          <span>
            {network === 'ethereum' ? 'Ethereum' : 'Tron'} · Powered by Privy
          </span>
        </footer>
      </div>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Account">
        <AccountPanel account={account} onLogout={onLogout} inDialog />
      </Modal>
    </div>
  );
}
