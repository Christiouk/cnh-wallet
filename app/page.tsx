'use client';

import { usePrivy } from '@privy-io/react-auth';

export default function Page() {
  const { login, logout, authenticated, user } = usePrivy();

  const email =
    user?.email?.address ||
    user?.google?.email ||
    user?.apple?.email ||
    'Not available';

  return (
    <main style={styles.page}>
      {/* Top bar */}
      <div style={styles.topbar}>
        <div>
          <div style={styles.brand}>CNH Wallet</div>
          <div style={styles.subbrand}>Institutional client portal</div>
        </div>

        <div style={styles.topbarRight}>
          {authenticated ? (
            <button onClick={logout} style={styles.btnSecondary}>
              Logout
            </button>
          ) : (
            <button onClick={login} style={styles.btnPrimary}>
              Login
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {!authenticated ? (
        <div style={styles.hero}>
          <div style={styles.heroTitle}>Welcome to CNH Wallet</div>
          <div style={styles.heroText}>
            Secure access for clients. Authenticate to view your wallet profile and dashboard.
          </div>

          <button onClick={login} style={styles.btnPrimaryLarge}>
            Login
          </button>

          <div style={styles.note}>
            Tip: enable <b>Email</b> + <b>External wallets</b> in Privy (already done on your screenshots).
          </div>
        </div>
      ) : (
        <div style={styles.grid}>
          {/* Card 1 */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>Client Identity</div>
            <div style={styles.row}>
              <div style={styles.label}>Email</div>
              <div style={styles.value}>{email}</div>
            </div>
            <div style={styles.row}>
              <div style={styles.label}>Status</div>
              <div style={styles.value}>
                <span style={styles.pillOk}>Authenticated</span>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>Wallet Profile</div>
            <div style={styles.row}>
              <div style={styles.label}>Network</div>
              <div style={styles.value}>Ethereum / Solana (as enabled in Privy)</div>
            </div>
            <div style={styles.row}>
              <div style={styles.label}>Wallet</div>
              <div style={styles.value}>Connected after user selects wallet in login</div>
            </div>
            <div style={styles.small}>
              Next step: we’ll display the real wallet address + balances.
            </div>
          </div>

          {/* Card 3 */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>Portfolio Overview</div>
            <div style={styles.kpis}>
              <div style={styles.kpiBox}>
                <div style={styles.kpiLabel}>Total Balance</div>
                <div style={styles.kpiValue}>—</div>
              </div>
              <div style={styles.kpiBox}>
                <div style={styles.kpiLabel}>24h P/L</div>
                <div style={styles.kpiValue}>—</div>
              </div>
              <div style={styles.kpiBox}>
                <div style={styles.kpiLabel}>Exposure</div>
                <div style={styles.kpiValue}>—</div>
              </div>
            </div>
            <div style={styles.small}>
              Placeholder KPIs (we’ll connect real data after wallet address is displayed).
            </div>
          </div>

          {/* Card 4 */}
          <div style={styles.card}>
            <div style={styles.cardTitle}>Actions</div>
            <div style={styles.actions}>
              <button style={styles.btnGhost} disabled>
                Deposit (coming next)
              </button>
              <button style={styles.btnGhost} disabled>
                Withdraw (coming next)
              </button>
              <button style={styles.btnGhost} disabled>
                Statements (coming next)
              </button>
            </div>
            <div style={styles.small}>
              This is the CNH “institutional dashboard shell”. We’ll activate features step-by-step.
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#0b0f17',
    color: '#e9eefc',
    padding: 24,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  },
  topbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: '16px 18px',
    marginBottom: 20,
  },
  brand: { fontSize: 18, fontWeight: 700, letterSpacing: 0.3 },
  subbrand: { fontSize: 12, opacity: 0.75, marginTop: 2 },
  topbarRight: { display: 'flex', gap: 10, alignItems: 'center' },

  hero: {
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 18,
    padding: 28,
    maxWidth: 720,
  },
  heroTitle: { fontSize: 28, fontWeight: 800, marginBottom: 10 },
  heroText: { fontSize: 14, opacity: 0.85, lineHeight: 1.5, marginBottom: 18 },
  note: { marginTop: 14, fontSize: 12, opacity: 0.7 },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 14,
  },
  card: {
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 18,
    padding: 18,
  },
  cardTitle: { fontSize: 14, fontWeight: 700, marginBottom: 12, opacity: 0.9 },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    padding: '10px 0',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  label: { fontSize: 12, opacity: 0.7 },
  value: { fontSize: 12, opacity: 0.95, textAlign: 'right' },
  small: { marginTop: 10, fontSize: 12, opacity: 0.7, lineHeight: 1.4 },

  kpis: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 },
  kpiBox: {
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 12,
    background: 'rgba(0,0,0,0.12)',
  },
  kpiLabel: { fontSize: 11, opacity: 0.7 },
  kpiValue: { fontSize: 16, fontWeight: 800, marginTop: 6 },

  actions: { display: 'flex', flexWrap: 'wrap', gap: 10 },

  pillOk: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 999,
    background: 'rgba(80, 200, 120, 0.15)',
    border: '1px solid rgba(80, 200, 120, 0.25)',
    color: '#bff5cf',
    fontSize: 12,
    fontWeight: 600,
  },

  btnPrimary: {
    background: '#ffffff',
    color: '#0b0f17',
    border: 'none',
    borderRadius: 12,
    padding: '10px 14px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  btnPrimaryLarge: {
    background: '#ffffff',
    color: '#0b0f17',
    border: 'none',
    borderRadius: 14,
    padding: '12px 16px',
    fontWeight: 900,
    cursor: 'pointer',
    width: 180,
  },
  btnSecondary: {
    background: 'transparent',
    color: '#e9eefc',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: 12,
    padding: '10px 14px',
    fontWeight: 800,
    cursor: 'pointer',
  },
  btnGhost: {
    background: 'rgba(255,255,255,0.04)',
    color: '#e9eefc',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 12,
    padding: '10px 12px',
    fontWeight: 700,
    cursor: 'not-allowed',
    opacity: 0.7,
  },
};
