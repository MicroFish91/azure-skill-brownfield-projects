import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.js';

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  return <Outlet />;
}
