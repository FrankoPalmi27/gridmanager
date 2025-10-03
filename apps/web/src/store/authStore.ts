import { create } from 'zustand';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
}

interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  tenant: TenantInfo | null;
  isLoading: boolean;
  setAuth: (user: AuthUser, tokens: AuthTokens) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  updateTokens: (tokens: AuthTokens) => void;
  setTenant: (tenant: TenantInfo | null) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  tokens: null,
  tenant: null,
  isLoading: false,

  setAuth: (user, tokens) =>
    set({ user, tokens, isLoading: false }),

  clearAuth: () =>
    set({ user: null, tokens: null, tenant: null, isLoading: false }),

  setLoading: (isLoading) =>
    set({ isLoading }),

  updateTokens: (tokens) =>
    set({ tokens }),

  setTenant: (tenant) =>
    set({ tenant }),
}));