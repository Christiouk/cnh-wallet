'use client';

import { usePrivy } from '@privy-io/react-auth';

export default function Page() {
  const { login, logout, authenticated, user } = usePrivy();

  return (
    <main style={{ padding: 32 }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>CNH Wallet</h1>

      {!authenticated ? (
        <button onClick={login} style={{ padding: '10px 14px' }}>
          Login
        </button>
      ) : (
        <>
          <p style={{ marginTop: 12 }}>
            Logged in as: {user?.email?.address ?? 'unknown'}
          </p>
          <button onClick={logout} style={{ padding: '10px 14px' }}>
            Logout
          </button>
        </>
      )}
    </main>
  );
}
