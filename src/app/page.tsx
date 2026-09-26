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

  return <Dashboard />;
}
