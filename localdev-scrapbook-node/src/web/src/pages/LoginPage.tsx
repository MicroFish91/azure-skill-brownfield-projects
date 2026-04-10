import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthForm from '../components/AuthForm';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (data: { email: string; password: string }) => {
    await login(data.email, data.password);
    navigate('/');
  };

  return (
    <AuthForm
      title="💕 CoupleSnap"
      submitLabel="Sign In"
      onSubmit={handleSubmit}
      altText="Don't have an account?"
      altLink="Sign up"
      altHref="/register"
    />
  );
}
