import { useAuth } from '../hooks/useAuth.tsx';
import { AuthForm } from '../components/AuthForm.tsx';
import { useNavigate } from 'react-router-dom';

export function RegisterPage() {
  const { register, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (data: Record<string, string>) => {
    await register(data.email, data.password, data.displayName);
    navigate('/');
  };

  return (
    <AuthForm
      title="Create Account"
      fields={[
        { name: 'displayName', type: 'text', label: 'Display Name' },
        { name: 'email', type: 'email', label: 'Email' },
        { name: 'password', type: 'password', label: 'Password' },
      ]}
      onSubmit={handleSubmit}
      submitLabel="Sign Up"
      altLink={{ text: 'Already have an account? Sign in', href: '/login' }}
      error={error}
    />
  );
}
