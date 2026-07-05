import { create } from 'zustand';
import { User } from '../types';
import { api, setToken } from '../api/client';

interface AuthState {
  user: User | null;
  authLoading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  googleLogin: (payload: any) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateCurrency: (currency: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  authLoading: true,
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
  googleLogin: async (payload) => {
    const res = await api.googleLogin(payload);
    setToken(res.token);
    if (res.refreshToken) {
      localStorage.setItem('fintech_refresh_token', res.refreshToken);
    }
    set({ user: res.user });
  },
  logout: () => {
    setToken(null);
    localStorage.removeItem('fintech_refresh_token');
    set({ user: null });
  },
  checkAuth: async () => {
    set({ authLoading: true });
    try {
      const user = await api.getMe();
      set({ user, authLoading: false });
    } catch (e: any) {
      const rt = localStorage.getItem('fintech_refresh_token');
      if (rt) {
        try {
          const res = await fetch('/api/auth/refresh', {
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
  updateCurrency: async (currency) => {
    const res = await api.updateCurrency(currency);
    set((state) => ({
      user: state.user ? { ...state.user, baseCurrency: res.baseCurrency } : null
    }));
  }
}));
export default useAuthStore;
