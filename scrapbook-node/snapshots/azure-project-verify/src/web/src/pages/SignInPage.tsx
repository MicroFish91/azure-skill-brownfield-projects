import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.js';

export function SignInPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="signin-shell">
      <h1>Our Scrapbook</h1>
      <p>Sign in with Microsoft to start your shared scrapbook.</p>
      <button
        onClick={async () => {
          await signIn();
          navigate('/');
        }}
      >
        Sign in with Microsoft
      </button>
      <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', opacity: 0.7 }}>
        Preview mode auto-authenticates you. Real Entra ID is wired in production.
      </p>
    </div>
  );
}
