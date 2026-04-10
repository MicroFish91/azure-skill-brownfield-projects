import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api, type Invite } from '../api/client';

export default function InvitePage() {
  const { user } = useAuth();
  const [toEmail, setToEmail] = useState('');
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    api.listInvites()
      .then((res) => setInvites(res.invites))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSendInvite = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const res = await api.createInvite(toEmail);
      setInvites((prev) => [res.invite, ...prev]);
      setSuccess(`Invite sent to ${toEmail}!`);
      setToEmail('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await api.acceptInvite(id);
      setInvites((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'accepted' as const } : i)));
      setSuccess('You are now paired! 💕 Go to your scrapbook.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to accept invite');
    }
  };

  if (!user) return null;

  const sentInvites = invites.filter((i) => i.fromUserId === user.id);
  const receivedInvites = invites.filter((i) => i.toEmail === user.email);

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 24, fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>💌 Invites</h1>
        <a href="/" style={{ color: '#4f46e5', textDecoration: 'none' }}>← Back to Scrapbook</a>
      </div>

      {/* Send Invite Form */}
      <div style={{ background: 'white', padding: 20, borderRadius: 8, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ margin: '0 0 12px 0' }}>Send an Invite</h3>
        <form onSubmit={handleSendInvite} style={{ display: 'flex', gap: 8 }}>
          <input
            type="email"
            value={toEmail}
            onChange={(e) => setToEmail(e.target.value)}
            placeholder="Partner's email address"
            required
            style={{ flex: 1, padding: 8, fontSize: 14, border: '1px solid #ddd', borderRadius: 4 }}
          />
          <button
            type="submit"
            style={{ padding: '8px 16px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >
            Send
          </button>
        </form>
      </div>

      {error && <div style={{ color: 'red', padding: 12, background: '#fff0f0', borderRadius: 4, marginBottom: 16 }}>{error}</div>}
      {success && <div style={{ color: 'green', padding: 12, background: '#f0fff0', borderRadius: 4, marginBottom: 16 }}>{success}</div>}

      {loading ? (
        <p style={{ color: '#888' }}>Loading invites...</p>
      ) : (
        <>
          {/* Received Invites */}
          {receivedInvites.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3>Received</h3>
              {receivedInvites.map((invite) => (
                <div
                  key={invite.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 12,
                    background: 'white',
                    borderRadius: 6,
                    marginBottom: 8,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  <span>From someone · {invite.status}</span>
                  {invite.status === 'pending' && (
                    <button
                      onClick={() => handleAccept(invite.id)}
                      style={{ padding: '6px 14px', background: '#10b981', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    >
                      Accept 💕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Sent Invites */}
          {sentInvites.length > 0 && (
            <div>
              <h3>Sent</h3>
              {sentInvites.map((invite) => (
                <div
                  key={invite.id}
                  style={{
                    padding: 12,
                    background: 'white',
                    borderRadius: 6,
                    marginBottom: 8,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                >
                  To {invite.toEmail} · {invite.status}
                </div>
              ))}
            </div>
          )}

          {invites.length === 0 && (
            <p style={{ color: '#888', textAlign: 'center' }}>No invites yet. Send one to your partner!</p>
          )}
        </>
      )}
    </div>
  );
}
