import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser, AuthTokens } from '@grid-manager/types';

interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  setAuth: (user: AuthUser, tokens: AuthTokens) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  updateTokens: (tokens: AuthTokens) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isLoading: false,
      
      setAuth: (user, tokens) =>
        set({ user, tokens, isLoading: false }),
        
      clearAuth: () =>
        set({ user: null, tokens: null, isLoading: false }),
        
      setLoading: (isLoading) =>
        set({ isLoading }),
        
      updateTokens: (tokens) =>
        set({ tokens }),
    }),
    {
      name: 'grid-manager-auth',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
      }),
    }
  )
);