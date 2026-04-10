import { useAuth } from '../hooks/useAuth';
import { useCouple } from '../hooks/useCouple';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { couple, loading } = useCouple();

  if (!user) return null;

  return (
    <div style={{ maxWidth: 500, margin: '40px auto', padding: 24, fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>👤 Profile</h1>
        <a href="/" style={{ color: '#4f46e5', textDecoration: 'none' }}>← Back to Scrapbook</a>
      </div>

      <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: '#888', textTransform: 'uppercase' }}>Display Name</label>
          <p style={{ margin: '4px 0', fontSize: 18, fontWeight: 600 }}>{user.displayName}</p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: '#888', textTransform: 'uppercase' }}>Email</label>
          <p style={{ margin: '4px 0', fontSize: 16 }}>{user.email}</p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: '#888', textTransform: 'uppercase' }}>Couple Status</label>
          {loading ? (
            <p style={{ margin: '4px 0', color: '#888' }}>Loading...</p>
          ) : couple ? (
            <p style={{ margin: '4px 0', fontSize: 16 }}>
              💕 Paired with <strong>{couple.partner.displayName}</strong>
            </p>
          ) : (
            <p style={{ margin: '4px 0', fontSize: 16, color: '#888' }}>
              Not paired yet · <a href="/invite" style={{ color: '#4f46e5' }}>Send an invite</a>
            </p>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: '#888', textTransform: 'uppercase' }}>Member Since</label>
          <p style={{ margin: '4px 0', fontSize: 16 }}>
            {new Date(user.createdAt).toLocaleDateString()}
          </p>
        </div>

        <button
          onClick={logout}
          style={{
            width: '100%',
            padding: 12,
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
            marginTop: 8,
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
