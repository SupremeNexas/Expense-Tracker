import { create } from 'zustand';
import { User } from '../types';
import { api, setToken } from '../api/client';

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5002';

interface AuthState {
  user: User | null;
  authLoading: boolean;
  skipAuthChecked?: boolean;
  setSkipAuth?: (skip: boolean) => void;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  updateCurrency: (currency: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  authLoading: true,
  skipAuthChecked: false,

  setSkipAuth: (skip: boolean) => {
    if (skip) {
      localStorage.setItem('fintech_skip_auth', 'true');
      set({ user: { id: 'test-user', email: 'test@example.com', name: 'Demo User', baseCurrency: 'USD', onboardingComplete: true } as User });
    } else {
      localStorage.removeItem('fintech_skip_auth');
      set({ user: null });
    }
  },

  login: async (credentials) => {
    const res = await api.login(credentials);
    setToken(res.token);
    if (res.refreshToken) {
      localStorage.setItem('fintech_refresh_token', res.refreshToken);
    }
    set({ user: res.user });
  },

  register: async (data) => {
    const res = await api.register(data);
    setToken(res.token);
    if (res.refreshToken) {
      localStorage.setItem('fintech_refresh_token', res.refreshToken);
    }
    set({ user: res.user });
  },

  // Accepts the Google ID Token (credential) returned by GSI
  googleLogin: async (idToken: string) => {
    const res = await api.googleLogin(idToken);
    setToken(res.token);
    if (res.refreshToken) {
      localStorage.setItem('fintech_refresh_token', res.refreshToken);
    }
    set({ user: res.user });
  },

  logout: () => {
    setToken(null);
    localStorage.removeItem('fintech_refresh_token');
    localStorage.removeItem('fintech_skip_auth');
    // Revoke Google session so the picker appears fresh next login
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.disableAutoSelect();
    }
    set({ user: null });
  },

  checkAuth: async () => {
    set({ authLoading: true });

    if (localStorage.getItem('fintech_skip_auth') === 'true') {
      setToken(null);
      set({
        user: {
          id: 'test-user',
          email: 'test@example.com',
          name: 'Demo User',
          baseCurrency: 'USD',
          onboardingComplete: true
        } as User,
        authLoading: false
      });
      return;
    }

    try {
      const user = await api.getMe();
      set({ user, authLoading: false });
    } catch (e: any) {
      // Network error (server down) — don't wipe the user session
      if (e?.message !== 'UNAUTHORIZED' && !e?.message?.includes('401')) {
        console.warn('[Auth] Server unreachable, keeping cached session state');
        set({ authLoading: false });
        return;
      }

      // Token expired — attempt silent refresh
      const rt = localStorage.getItem('fintech_refresh_token');
      if (rt) {
        try {
          const res = await fetch(`${API_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: rt })
          });
          if (res.ok) {
            const data = await res.json();
            setToken(data.token);
            if (data.refreshToken) {
              localStorage.setItem('fintech_refresh_token', data.refreshToken);
            }
            const user = await api.getMe();
            set({ user, authLoading: false });
            return;
          }
        } catch (_) {}
      }
      setToken(null);
      set({ user: null, authLoading: false });
    }
  },

  updateProfile: async (data: any) => {
    const res = await api.updateProfile(data);
    set({ user: res.user });
  },

  updateCurrency: async (currency) => {
    const res = await api.updateCurrency(currency);
    set((state) => ({
      user: state.user ? { ...state.user, baseCurrency: res.baseCurrency } : null
    }));
  }
}));

export default useAuthStore;
