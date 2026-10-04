'use client';
import { useState } from 'react';
import { useLinkAccount, usePrivy } from '@privy-io/react-auth';
import { useDeviceAuthentication } from '@/hooks/useDeviceAuthentication';

// Called once in Dashboard, so link callbacks stay mounted across Settings changes.
export function useAccountSignIn() {
  const { ready, authenticated, user } = usePrivy();
  const supported = useDeviceAuthentication();
  const [message, setMessage] = useState('');
  const { linkApple, linkPasskey } = useLinkAccount({
    onSuccess: () => setMessage('Sign-in method connected. Your existing account and wallets stay with you.'),
    onError: () => setMessage('Setup did not finish. Keep using email and try again. If this method belongs to another account, contact support; accounts will not be merged.'),
  });
  const appleLinked = Boolean(user?.linkedAccounts.some(a => a.type === 'apple_oauth'));
  const deviceLinked = Boolean(user?.linkedAccounts.some(a => a.type === 'passkey'));
  const enabled = ready && authenticated && Boolean(user);
  return {
    appleLinked, deviceLinked, supported, message, enabled,
    onApple() {
      if (!enabled || appleLinked) return;
      setMessage('');
      linkApple();
    },
    onDevice() {
      if (!enabled || !supported || deviceLinked) return;
      setMessage('');
      linkPasskey({ name: 'A3 Wallet' });
    },
  };
}

export function AccountSignIn({
  appleLinked, deviceLinked, supported, message, enabled, onApple, onDevice,
}: ReturnType<typeof useAccountSignIn>) {
  return (
    <section className="account-sign-in" aria-label="Sign-in methods">
      <h3 className="settings-section-heading">Sign-in methods</h3>
      <p>Connect these while signed in to keep using this account and its existing wallets.</p>
      <button className="btn-secondary" onClick={onApple} disabled={!enabled || appleLinked}>
        {appleLinked ? 'Apple connected' : 'Connect Apple'}
      </button>
      <button className="btn-secondary" onClick={onDevice} disabled={!enabled || !supported || deviceLinked}>
        {deviceLinked ? 'Face ID / Touch ID set up' : 'Set up Face ID / Touch ID'}
      </button>
      <p className="small muted">{supported
        ? 'Your device may use its screen lock instead. Email remains available as a fallback.'
        : 'Face ID / Touch ID setup is not available in this browser. Email remains available as a fallback.'}</p>
      {message && <p className="notice" role="status">{message}</p>}
    </section>
  );
}
