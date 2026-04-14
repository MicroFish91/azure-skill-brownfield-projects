import { useAuth } from '../hooks/useAuth.tsx';
import { AuthForm } from '../components/AuthForm.tsx';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const { login, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (data: Record<string, string>) => {
    await login(data.email, data.password);
    navigate('/');
  };

  return (
    <AuthForm
      title="Welcome Back"
      fields={[
        { name: 'email', type: 'email', label: 'Email' },
        { name: 'password', type: 'password', label: 'Password' },
      ]}
      onSubmit={handleSubmit}
      submitLabel="Sign In"
      altLink={{ text: "Don't have an account? Sign up", href: '/register' }}
      error={error}
    />
  );
}
