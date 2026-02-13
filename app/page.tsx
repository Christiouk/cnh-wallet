'use client';

import { usePrivy } from '@privy-io/react-auth';

export default function Page() {
  const { login, logout, authenticated, user } = usePrivy();

  const styles = {
    container: {
      padding: 40,
      fontFamily: 'system-ui, sans-serif',
      background: '#0b0f19',
      color: 'white',
      minHeight: '100vh',
    },
    card: {
      background: '#111827',
      padding: 24,
      borderRadius: 12,
      maxWidth: 520,
      marginTop: 20,
      boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
    },
    button: {
      padding: '10px 16px',
      borderRadius: 8,
      border: 'none',
      cursor: 'pointer',
      fontWeight: 600,
      background: 'white',
      color: 'black',
      marginTop: 12,
    },
    row: {
      marginTop: 12,
    },
    label: {
      fontSize: 12,
      opacity: 0.6,
    },
    value: {
      fontSize: 16,
      marginTop: 2,
      wordBreak: 'break-all' as const,
    },
  };

  return (
    <main style={styles.container}>
      <h1>CNH Wallet</h1>

      {!authenticated ? (
        <div style={styles.card}>
          <h2>Welcome to CNH Wallet</h2>
          <p>Secure access for clients. Authenticate to view your wallet profile and dashboard.</p>

          <button onClick={login} style={styles.button}>
            Login
          </button>
        </div>
      ) : (
        <div style={styles.card}>
          <h2>Client Dashboard</h2>

          <div style={styles.row}>
            <div style={styles.label}>Email</div>
            <div style={styles.value}>
              {user?.email?.address || 'No email'}
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.label}>Status</div>
            <div style={styles.value}>Authenticated</div>
          </div>

          {/* WALLET ADDRESS */}
          <div style={styles.row}>
            <div style={styles.label}>Wallet</div>
            <div style={styles.value}>
              {user?.wallet?.address || 'No wallet connected'}
            </div>
          </div>

          {/* CHAIN TYPE */}
          <div style={styles.row}>
            <div style={styles.label}>Chain</div>
            <div style={styles.value}>
              {user?.wallet?.chainType || '—'}
            </div>
          </div>

          <button onClick={logout} style={styles.button}>
            Logout
          </button>
        </div>
      )}
    </main>
  );
}
