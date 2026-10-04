'use client';

import { useState } from 'react';
import { usePrivy, useLoginWithOAuth, useLoginWithPasskey } from '@privy-io/react-auth';
import { useDeviceAuthentication } from '@/hooks/useDeviceAuthentication';
import { LoginView } from './LoginView';
export { LoginView } from './LoginView';

export default function LoginScreen() {
  const { login } = usePrivy();
  const [message, setMessage] = useState('');
  const supported = useDeviceAuthentication();
  const appleError = () => setMessage('Apple sign-in did not finish. Try again, or use email to access your existing account.');
  const deviceError = () => setMessage('Face ID / Touch ID sign-in did not finish. Use email, then set it up in Settings for this account.');
  const { initOAuth, state: appleState } = useLoginWithOAuth({ onError: appleError });
  const { loginWithPasskey, state: deviceState } = useLoginWithPasskey({ onError: deviceError });
  const existingOnly = process.env.NEXT_PUBLIC_A3_RC_CONTINUITY === 'true' ||
    process.env.NEXT_PUBLIC_A3_EXISTING_ACCOUNT_ONLY === 'true';
  const busy = appleState.status === 'loading' ||
    ['generating-challenge', 'awaiting-passkey', 'submitting-response'].includes(deviceState.status);

  return (
    <LoginView
      busy={busy}
      deviceSupported={supported}
      message={message}
      onEmail={() => {
        setMessage('');
        login({ loginMethods: ['email'], disableSignup: existingOnly });
      }}
      onApple={() => {
        setMessage('');
        void initOAuth({ provider: 'apple', disableSignup: existingOnly }).catch(appleError);
      }}
      onDevice={() => {
        if (!supported || busy) return;
        setMessage('');
        // Login only. Enrolment belongs to the authenticated Settings flow.
        void loginWithPasskey().catch(deviceError);
      }}
    />
  );
}
