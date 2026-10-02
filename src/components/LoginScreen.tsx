'use client';

import { usePrivy, useLoginWithOAuth } from '@privy-io/react-auth';
import { LoginView } from './LoginView';
export { LoginView } from './LoginView';

export default function LoginScreen() {
  const { login } = usePrivy();
  const { initOAuth } = useLoginWithOAuth();

  return (
    <LoginView
      onEmail={login}
      onApple={() => initOAuth({ provider: 'apple' })}
      onGoogle={() => initOAuth({ provider: 'google' })}
    />
  );
}
