import { useAuth } from '../hooks/useAuth.tsx';
import { useCouple } from '../hooks/useCouple.ts';

export function SettingsPage() {
  const { user, logout } = useAuth();
  const { partner, loading } = useCouple(user?.coupleId ?? null);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Settings</h1>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Your Account</h2>
          <div style={styles.field}>
            <span style={styles.label}>Name</span>
            <span style={styles.value}>{user?.displayName}</span>
          </div>
          <div style={styles.field}>
            <span style={styles.label}>Email</span>
            <span style={styles.value}>{user?.email}</span>
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Couple</h2>
          {loading ? (
            <p style={styles.muted}>Loading...</p>
          ) : partner ? (
            <div style={styles.field}>
              <span style={styles.label}>Partner</span>
              <span style={styles.value}>{partner.displayName} ({partner.email})</span>
            </div>
          ) : (
            <p style={styles.muted}>You haven't paired with anyone yet.</p>
          )}
        </section>

        <div style={styles.actions}>
          <a href="/" style={styles.backLink}>Back to Scrapbook</a>
          <button onClick={logout} style={styles.logoutButton}>Sign Out</button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#fef7f0',
    fontFamily: "'Georgia', serif",
    display: 'flex',
    justifyContent: 'center',
    padding: '40px 20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    width: '100%',
    maxWidth: '500px',
    alignSelf: 'flex-start',
  },
  title: {
    color: '#5c3d2e',
    marginTop: 0,
    marginBottom: '28px',
  },
  section: {
    marginBottom: '24px',
    paddingBottom: '20px',
    borderBottom: '1px solid #e8d5c4',
  },
  sectionTitle: {
    fontSize: '18px',
    color: '#7c5a46',
    marginBottom: '12px',
  },
  field: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
  },
  label: {
    color: '#a08070',
    fontSize: '14px',
  },
  value: {
    color: '#5c3d2e',
    fontSize: '14px',
    fontWeight: '600' as const,
  },
  muted: {
    color: '#a08070',
    fontStyle: 'italic',
    fontSize: '14px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px',
  },
  backLink: {
    color: '#8b5e3c',
    fontSize: '14px',
  },
  logoutButton: {
    padding: '8px 20px',
    backgroundColor: 'transparent',
    color: '#b91c1c',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
};
