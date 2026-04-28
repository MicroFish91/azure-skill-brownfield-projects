import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCouple } from '../hooks/useCouple.js';

export function PairPage() {
  const { state, pair } = useCouple();
  const [code, setCode] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const navigate = useNavigate();

  if (state.status === 'loading') return <div className="pair-shell">Loading…</div>;

  return (
    <div className="pair-shell">
      <h2>Pair with your partner</h2>
      {state.status === 'data' && (
        <>
          <p>Share your invite code:</p>
          <div className="invite-code" data-testid="invite-code">
            {state.couple.inviteCode}
          </div>
          <p style={{ margin: '1.25rem 0 0.5rem' }}>Or enter their code:</p>
        </>
      )}
      {err && <div className="error">{err}</div>}
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Invite code"
        aria-label="Partner invite code"
      />
      <button
        onClick={async () => {
          setErr(null);
          try {
            await pair(code.trim());
            navigate('/');
          } catch (e) {
            setErr((e as Error).message);
          }
        }}
      >
        Pair
      </button>
    </div>
  );
}
