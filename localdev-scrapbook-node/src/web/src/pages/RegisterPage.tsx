import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthForm from '../components/AuthForm';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (data: { email: string; password: string; displayName?: string }) => {
    await register(data.email, data.password, data.displayName || data.email);
    navigate('/');
  };

  return (
    <AuthForm
      title="Join CoupleSnap 💕"
      submitLabel="Create Account"
      onSubmit={handleSubmit}
      showDisplayName
      altText="Already have an account?"
      altLink="Sign in"
      altHref="/login"
    />
  );
}
