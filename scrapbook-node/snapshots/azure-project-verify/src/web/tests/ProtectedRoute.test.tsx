import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../src/components/ProtectedRoute.js';
import { AuthProvider, useAuth } from '../src/auth/AuthProvider.js';

function SignedOutWrapper({ children }: { children: React.ReactNode }) {
  // Manually sign out the auto-authenticated mock user.
  const { signOut, isAuthenticated } = useAuth();
  if (isAuthenticated) {
    queueMicrotask(signOut);
    return null;
  }
  return <>{children}</>;
}

describe('<ProtectedRoute>', () => {
  it('renders children when authenticated', () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<div>secret content</div>} />
            </Route>
            <Route path="/signin" element={<div>sign in here</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
    expect(screen.getByText('secret content')).toBeInTheDocument();
  });

  it('redirects to /signin when unauthenticated', async () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route
                path="/"
                element={
                  <SignedOutWrapper>
                    <div>secret content</div>
                  </SignedOutWrapper>
                }
              />
            </Route>
            <Route path="/signin" element={<div>sign in here</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
    expect(await screen.findByText('sign in here')).toBeInTheDocument();
  });
});
