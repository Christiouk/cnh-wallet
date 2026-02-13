'use client';

import { usePrivy } from '@privy-io/react-auth';

export default function Page() {
  const { login, logout, authenticated, user } = usePrivy();

  return (
    <main style={{ padding: 24 }}>
      <h1>CNH Test</h1>

      {!authenticated ? (
        <button onClick={login}>Login</button>
      ) : (
        <>
          <p>Logged in as: {user?.email?.address ?? 'unknown'}</p>
          <button onClick={logout}>Logout</button>
        </>
      )}
    </main>
  );
}