import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { ScrapbookPage } from './pages/ScrapbookPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#fef7f0', fontFamily: "'Georgia', serif", color: '#7c5a46' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<ScrapbookPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
