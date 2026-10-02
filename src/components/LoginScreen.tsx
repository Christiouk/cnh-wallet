'use client';

import { usePrivy, useLoginWithOAuth } from '@privy-io/react-auth';
import { LoginView } from './LoginView';
export { LoginView } from './LoginView';

export default function LoginScreen() {
  const { login } = usePrivy();
  const { initOAuth } = useLoginWithOAuth();

  // RC2 uses the modal's existing-user-only mode for every login method.
  // Never let a typo or a different OAuth identity sign up during continuity proof.
  if (process.env.NEXT_PUBLIC_A3_RC_CONTINUITY === 'true') {
    return (
      <LoginView
        onEmail={() => login({ loginMethods: ['email'], disableSignup: true })}
        onApple={() => login({ loginMethods: ['apple'], disableSignup: true })}
        onGoogle={() => login({ loginMethods: ['google'], disableSignup: true })}
      />
    );
  }

  return (
    <LoginView
      onEmail={login}
      onApple={() => initOAuth({ provider: 'apple' })}
      onGoogle={() => initOAuth({ provider: 'google' })}
    />
  );
}
