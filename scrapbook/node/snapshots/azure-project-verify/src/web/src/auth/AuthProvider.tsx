/**
 * Auth provider.
 *
 * Step 0.5 (frontend preview) ships with a MOCK auth state so the user
 * lands directly on the scrapbook view. Step 11 wires this to MSAL/Entra.
 */

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export interface AuthUser {
  id: string;
  displayName: string;
  email: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  signIn: () => Promise<void>;
  signOut: () => void;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthState | null>(null);

const MOCK_USER: AuthUser = {
  id: 'preview-user-1',
  displayName: 'Alex (preview)',
  email: 'alex@example.com'
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // Auto-authenticate in preview mode so user sees scrapbook immediately.
  const [user, setUser] = useState<AuthUser | null>(MOCK_USER);

  const value = useMemo<AuthState>(
    () => ({
      user,
      isAuthenticated: user !== null,
      signIn: async () => setUser(MOCK_USER),
      signOut: () => setUser(null),
      // In preview mode there's no real token. Returning null is fine
      // because the API client falls back to mock data when offline.
      getAccessToken: async () => 'preview-token'
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
