import { useState, type FormEvent } from 'react';

interface AuthFormProps {
  title: string;
  submitLabel: string;
  onSubmit: (data: { email: string; password: string; displayName?: string }) => Promise<void>;
  showDisplayName?: boolean;
  altText: string;
  altLink: string;
  altHref: string;
}

export default function AuthForm({
  title,
  submitLabel,
  onSubmit,
  showDisplayName = false,
  altText,
  altLink,
  altHref,
}: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit({ email, password, ...(showDisplayName ? { displayName } : {}) });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24, fontFamily: 'system-ui' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 24 }}>{title}</h1>
      <form onSubmit={handleSubmit}>
        {showDisplayName && (
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="displayName" style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              style={{ width: '100%', padding: 8, fontSize: 16, boxSizing: 'border-box' }}
            />
          </div>
        )}
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: 8, fontSize: 16, boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={{ width: '100%', padding: 8, fontSize: 16, boxSizing: 'border-box' }}
          />
        </div>
        {error && (
          <div style={{ color: 'red', marginBottom: 12, padding: 8, background: '#fff0f0', borderRadius: 4 }}>
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: 12,
            fontSize: 16,
            background: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Please wait...' : submitLabel}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 16 }}>
        {altText}{' '}
        <a href={altHref} style={{ color: '#4f46e5' }}>
          {altLink}
        </a>
      </p>
    </div>
  );
}
