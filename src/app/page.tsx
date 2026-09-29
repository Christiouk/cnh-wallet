'use client';

import { usePrivy } from '@privy-io/react-auth';
import LoginScreen from '@/components/LoginScreen';
import Dashboard from '@/components/Dashboard';
import PrivyProviderWrapper from '@/providers/PrivyProviderWrapper';
import LoadingScreen from '@/components/LoadingScreen';

export default function Home() {
  return (
    <PrivyProviderWrapper>
      <WalletHome />
    </PrivyProviderWrapper>
  );
}
function WalletHome() {
  const { ready, authenticated } = usePrivy();

  if (!ready) {
    return <LoadingScreen />;
  }

  if (!authenticated) {
    return <LoginScreen />;
  }

  // A return hint selects a view only. Buy authorization and destinations stay server-resolved.
  const initialNetwork =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('network') === 'tron'
      ? 'tron'
      : 'ethereum';
  return <Dashboard initialNetwork={initialNetwork} />;
}
