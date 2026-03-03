'use client';
import { useState, useCallback } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom } from 'viem';
import { gnosis } from 'viem/chains';

export type GnosisPayStep =
  | 'idle'
  | 'connecting'
  | 'signing'
  | 'authenticating'
  | 'checking-user'
  | 'signing-up'
  | 'accepting-terms'
  | 'kyc'
  | 'phone'
  | 'verifying-phone'
  | 'deploying-safe'
  | 'waiting-safe'
  | 'ordering-card'
  | 'success'
  | 'error';

export interface GnosisPayState {
  step: GnosisPayStep;
  jwt: string | null;
  kycUrl: string | null;
  cards: unknown[];
  error: string | null;
  userProfile: Record<string, unknown> | null;
}

const INITIAL_STATE: GnosisPayState = {
  step: 'idle',
  jwt: null,
  kycUrl: null,
  cards: [],
  error: null,
  userProfile: null,
};

export function useGnosisPay() {
  const { wallets } = useWallets();
  const [state, setState] = useState<GnosisPayState>(INITIAL_STATE);

  const setStep = (step: GnosisPayStep) => setState(s => ({ ...s, step }));
  const setError = (error: string) => setState(s => ({ ...s, step: 'error', error }));

  // Step 1: Authenticate via SIWE
  const authenticate = useCallback(async (): Promise<string | null> => {
    const wallet = wallets[0];
    if (!wallet) { setError('No wallet connected'); return null; }

    try {
      setStep('connecting');
      const address = wallet.address;

      // Get nonce
      setStep('signing');
      const nonceRes = await fetch('/api/gnosis-pay/auth?action=nonce');
      const { nonce } = await nonceRes.json();

      // Build SIWE message
      const domain = window.location.host;
      const origin = window.location.origin;
      const issuedAt = new Date().toISOString();
      const siweMessage = [
        `${domain} wants you to sign in with your Ethereum account:`,
        address,
        '',
        'Sign in to Morsands Wallet with Gnosis Pay',
        '',
        `URI: ${origin}`,
        'Version: 1',
        'Chain ID: 100',
        `Nonce: ${nonce}`,
        `Issued At: ${issuedAt}`,
      ].join('\n');

      // Sign with Privy wallet
      await wallet.switchChain(100); // Gnosis chain
      const provider = await wallet.getEthereumProvider();
      const signature = await provider.request({
        method: 'personal_sign',
        params: [siweMessage, address],
      });

      // Exchange for JWT
      setStep('authenticating');
      const authRes = await fetch('/api/gnosis-pay/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: siweMessage, signature, ttlInSeconds: 86400 }),
      });
      const authData = await authRes.json();

      if (!authData.token && !authData.jwt && !authData.accessToken) {
        setError(authData.message || authData.error || 'Authentication failed');
        return null;
      }

      const jwt = authData.token || authData.jwt || authData.accessToken;
      setState(s => ({ ...s, jwt }));
      return jwt;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      return null;
    }
  }, [wallets]);

  // Step 2: Check user profile or sign up
  const ensureUser = useCallback(async (jwt: string, email: string): Promise<boolean> => {
    try {
      setStep('checking-user');
      const profileRes = await fetch('/api/gnosis-pay/user?action=profile', {
        headers: { 'x-gp-jwt': jwt },
      });

      if (profileRes.status === 401 || profileRes.status === 404) {
        // New user — sign up
        setStep('signing-up');
        const signupRes = await fetch('/api/gnosis-pay/user?action=signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jwt, authEmail: email }),
        });
        if (!signupRes.ok) {
          const err = await signupRes.json();
          setError(err.message || 'Signup failed');
          return false;
        }
      }

      // Accept terms
      setStep('accepting-terms');
      const termsListRes = await fetch('/api/gnosis-pay/user?action=terms', {
        headers: { 'x-gp-jwt': jwt },
      });
      const termsList = await termsListRes.json();
      const terms = Array.isArray(termsList) ? termsList : termsList.terms || [];

      for (const term of terms) {
        await fetch('/api/gnosis-pay/user?action=terms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jwt, terms: term.name || term.id, version: term.version }),
        });
      }

      // Get updated profile
      const updatedProfile = await fetch('/api/gnosis-pay/user?action=profile', {
        headers: { 'x-gp-jwt': jwt },
      });
      const profile = await updatedProfile.json();
      setState(s => ({ ...s, userProfile: profile }));
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'User setup failed');
      return false;
    }
  }, []);

  // Step 3: Start KYC
  const startKyc = useCallback(async (jwt: string): Promise<string | null> => {
    try {
      setStep('kyc');
      const res = await fetch('/api/gnosis-pay/user?action=kyc', {
        headers: { 'x-gp-jwt': jwt },
      });
      const data = await res.json();
      const url = data.url || data.iframeUrl || data.kycUrl;
      if (url) {
        setState(s => ({ ...s, kycUrl: url }));
        return url;
      }
      return null;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'KYC failed');
      return null;
    }
  }, []);

  // Step 4: Deploy Safe
  const deploySafe = useCallback(async (jwt: string): Promise<boolean> => {
    try {
      setStep('deploying-safe');
      const res = await fetch('/api/gnosis-pay/user?action=deploy-safe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jwt }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.message || 'Safe deployment failed');
        return false;
      }

      // Poll for deployment completion (max 2 minutes)
      setStep('waiting-safe');
      for (let i = 0; i < 24; i++) {
        await new Promise(r => setTimeout(r, 5000));
        const statusRes = await fetch('/api/gnosis-pay/user?action=safe-status', {
          headers: { 'x-gp-jwt': jwt },
        });
        const status = await statusRes.json();
        if (status.deployed || status.status === 'deployed') return true;
      }
      setError('Safe deployment timed out — please try again');
      return false;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Safe deployment failed');
      return false;
    }
  }, []);

  // Step 5: Order card
  const orderCard = useCallback(async (
    jwt: string,
    type: 'virtual' | 'physical',
    shippingAddress?: Record<string, string>
  ): Promise<boolean> => {
    try {
      setStep('ordering-card');
      const res = await fetch(`/api/gnosis-pay/cards?type=${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jwt, shippingAddress }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Card order failed');
        return false;
      }
      setState(s => ({ ...s, step: 'success', cards: [data] }));
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Card order failed');
      return false;
    }
  }, []);

  // Full flow: authenticate → ensure user → KYC check → deploy safe → order card
  const startCardApplication = useCallback(async (
    email: string,
    cardType: 'virtual' | 'physical',
    shippingAddress?: Record<string, string>
  ) => {
    setState(INITIAL_STATE);

    const jwt = await authenticate();
    if (!jwt) return;

    const userReady = await ensureUser(jwt, email);
    if (!userReady) return;

    // Check KYC status from profile
    const profileRes = await fetch('/api/gnosis-pay/user?action=profile', {
      headers: { 'x-gp-jwt': jwt },
    });
    const profile = await profileRes.json();
    const kycStatus = profile.kycStatus || profile.kyc?.status;

    if (!kycStatus || kycStatus === 'notStarted' || kycStatus === 'documentsRequested') {
      await startKyc(jwt);
      // KYC requires user action — pause here and show KYC iframe
      return;
    }

    if (kycStatus !== 'approved') {
      setState(s => ({ ...s, step: 'kyc', kycUrl: null }));
      return;
    }

    // Check if Safe is deployed
    const safeRes = await fetch('/api/gnosis-pay/user?action=safe-status', {
      headers: { 'x-gp-jwt': jwt },
    });
    const safeData = await safeRes.json();
    const safeDeployed = safeData.deployed || safeData.status === 'deployed';

    if (!safeDeployed) {
      const deployed = await deploySafe(jwt);
      if (!deployed) return;
    }

    await orderCard(jwt, cardType, shippingAddress);
  }, [authenticate, ensureUser, startKyc, deploySafe, orderCard]);

  const reset = () => setState(INITIAL_STATE);

  return { state, startCardApplication, orderCard, reset };
}
