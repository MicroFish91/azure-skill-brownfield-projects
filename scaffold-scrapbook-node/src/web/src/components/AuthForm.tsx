import { useState } from 'react';
import type { FormEvent } from 'react';

interface AuthFormProps {
  title: string;
  fields: { name: string; type: string; label: string; required?: boolean }[];
  onSubmit: (data: Record<string, string>) => Promise<void>;
  submitLabel: string;
  altLink: { text: string; href: string };
  error: string | null;
}

export function AuthForm({ title, fields, onSubmit, submitLabel, altLink, error }: AuthFormProps) {
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoading(true);
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const data = Object.fromEntries(formData) as Record<string, string>;
      await onSubmit(data);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const displayError = error || formError;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>{title}</h1>
        {displayError && <div style={styles.error}>{displayError}</div>}
        <form onSubmit={handleSubmit} style={styles.form}>
          {fields.map((field) => (
            <div key={field.name} style={styles.fieldGroup}>
              <label htmlFor={field.name} style={styles.label}>{field.label}</label>
              <input
                id={field.name}
                name={field.name}
                type={field.type}
                required={field.required !== false}
                style={styles.input}
                disabled={loading}
              />
            </div>
          ))}
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Please wait...' : submitLabel}
          </button>
        </form>
        <p style={styles.altText}>
          <a href={altLink.href} style={styles.link}>{altLink.text}</a>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#fef7f0',
    fontFamily: "'Georgia', serif",
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '40px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    width: '100%',
    maxWidth: '400px',
  },
  title: {
    textAlign: 'center' as const,
    color: '#5c3d2e',
    marginBottom: '24px',
    fontSize: '28px',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: '10px 14px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  label: {
    color: '#7c5a46',
    fontSize: '14px',
    fontWeight: '600' as const,
  },
  input: {
    padding: '10px 14px',
    border: '2px solid #e8d5c4',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    padding: '12px',
    backgroundColor: '#8b5e3c',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: '600' as const,
    marginTop: '8px',
  },
  altText: {
    textAlign: 'center' as const,
    marginTop: '16px',
    fontSize: '14px',
    color: '#7c5a46',
  },
  link: {
    color: '#8b5e3c',
    textDecoration: 'underline',
  },
};
