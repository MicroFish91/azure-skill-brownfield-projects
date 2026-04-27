import { Routes, Route, Navigate } from 'react-router-dom';
import { SignInPage } from './pages/SignInPage.js';
import { ScrapbookPage } from './pages/ScrapbookPage.js';
import { PairPage } from './pages/PairPage.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';

export function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignInPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<ScrapbookPage />} />
        <Route path="/pair" element={<PairPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
