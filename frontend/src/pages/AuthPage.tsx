import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../store/authStore';
import { useToast } from '../components/UI/Toast';
import { SUPPORTED_CURRENCIES } from '../utils/currency';
import { AlertCircle, ArrowRight } from 'lucide-react';

// ── Google GSI Type Declarations ──────────────────────────────────────────────
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string; error?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (notification?: (n: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean; isDismissedMoment: () => boolean; getDismissedReason: () => string }) => void) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

export default function AuthPage() {
  const { login, register, googleLogin, setSkipAuth } = useAuthStore();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    baseCurrency: 'INR'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // ── Initialize GSI when script loads ────────────────────────────────────────
  const initializeGSI = useCallback(() => {
    if (!window.google?.accounts?.id) return;
    if (!GOOGLE_CLIENT_ID) {
      setGoogleError('Google Sign-In is not configured. Add VITE_GOOGLE_CLIENT_ID to frontend/.env');
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    setGoogleReady(true);
    setGoogleError(null);
  }, []);

  useEffect(() => {
    if (window.google?.accounts?.id) {
      initializeGSI();
      return;
    }

    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(interval);
        initializeGSI();
      }
    }, 200);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!window.google?.accounts?.id) {
        setGoogleError('Google Sign-In failed to load. Check your internet connection.');
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [initializeGSI]);

  // ── Handle credential response from GSI popup ────────────────────────────────
  const handleGoogleCredentialResponse = async (response: { credential: string; error?: string }) => {
    if (!response.credential) {
      setGoogleLoading(false);
      showToast('Google sign-in was cancelled or failed.', 'error');
      return;
    }

    setGoogleLoading(true);
    try {
      await googleLogin(response.credential);
      showToast('Signed in with Google!', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('[Google Auth] Failed:', err);
      showToast(err.message || 'Google sign-in failed. Please try again.', 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── Trigger GSI popup ─────────────────────────────────────────────────────────
  const handleGoogleLogin = () => {
    if (!googleReady || !window.google?.accounts?.id) {
      showToast('Google Sign-In is not ready yet. Please wait a moment.', 'error');
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      showToast('Google Sign-In is not configured. Contact the administrator.', 'error');
      return;
    }

    setGoogleLoading(true);

    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed()) {
        setGoogleLoading(false);
        showToast('Google sign-in popup was blocked. Please allow popups for this site.', 'error');
        return;
      }

      if (notification.isSkippedMoment() || notification.isDismissedMoment()) {
        setGoogleLoading(false);
        const reason = notification.getDismissedReason?.();
        if (reason === 'credential_returned') return;
        showToast('Google sign-in was cancelled.', 'error');
      }
    });
  };

  // ── Email/Password form ───────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin) {
      if (formData.password.length < 4) {
        showToast('Password must be at least 4 characters.', 'error');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        showToast('Passwords do not match.', 'error');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        await login({ email: formData.email, password: formData.password });
        showToast('Welcome back!', 'success');
      } else {
        await register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          baseCurrency: formData.baseCurrency
        });
        showToast('Account created successfully!', 'success');
      }
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const isAnyLoading = isLoading || googleLoading;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-[#FCFCFD] text-[#131517]">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-[440px] bg-white border border-[#E5E7EB] rounded-[32px] p-8 sm:p-10 shadow-[0_4px_20px_rgb(0,0,0,0.03)]"
      >
        <div className="mb-8 flex items-center justify-between">
           <div className="w-12 h-12 rounded-full bg-[#111113] flex items-center justify-center">
            <svg className="w-4 h-4 text-white fill-current transform rotate-45" viewBox="0 0 16 16">
              <rect x="2" y="2" width="12" height="12" rx="1" />
            </svg>
          </div>
          <button
            type="button"
            onClick={async () => {
              setIsLoading(true);
              try {
                await login({ email: 'demo@example.com', password: 'password123' });
                showToast('Signed in as demo user!', 'success');
                navigate('/dashboard');
              } catch (err: any) {
                showToast(err.message || 'Demo login failed. Try regular sign-in.', 'error');
                setIsLoading(false);
              }
            }}
            disabled={isAnyLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-all duration-150 cursor-pointer text-xs font-bold uppercase tracking-wider shadow-sm active:scale-95 disabled:opacity-50"
          >
            Skip Auth <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-8">
          <h1 className="text-[28px] font-bold tracking-tight text-[#111113] mb-2 font-display">
            {isLogin ? 'Sign in to Expense Tracker' : 'Create your account'}
          </h1>
          <p className="text-sm font-normal text-gray-600">
            {isLogin ? "We'll sign you in securely to your command center." : "Get started with intelligent account tracking today."}
          </p>
        </div>

        {/* Google error alert */}
        <AnimatePresence>
          {googleError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-2 mb-6 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs font-medium text-red-700"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{googleError}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email / Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-[#18181A]">Full name</label>
                <input
                  type="text"
                  name="name"
                  className="w-full h-[50px] px-4 rounded-2xl border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/80 focus:border-transparent transition-all duration-150"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-[#18181A]">Base currency</label>
                <select
                  name="baseCurrency"
                  className="w-full h-[50px] px-4 rounded-2xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/80 focus:border-transparent transition-all duration-150 cursor-pointer"
                  value={formData.baseCurrency}
                  onChange={handleChange}
                >
                  {SUPPORTED_CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.label} ({c.code})</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-[#18181A]">Email address</label>
            <input
              type="email"
              name="email"
              className="w-full h-[50px] px-4 rounded-2xl border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/80 focus:border-transparent transition-all duration-150"
              placeholder="you@company.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-[#18181A]">Password</label>
            <input
              type="password"
              name="password"
              className="w-full h-[50px] px-4 rounded-2xl border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/80 focus:border-transparent transition-all duration-150"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {!isLogin && (
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-[#18181A]">Confirm password</label>
              <input
                type="password"
                name="confirmPassword"
                className="w-full h-[50px] px-4 rounded-2xl border border-gray-200 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/80 focus:border-transparent transition-all duration-150"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isAnyLoading}
            className="w-full h-[50px] mt-2 rounded-2xl bg-[#111113] hover:bg-[#202023] active:scale-[0.99] text-white font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer shadow-[0_2px_10px_rgb(0,0,0,0.12)]"
          >
            {isLoading ? <span>Working...</span> : <span>{isLogin ? 'Sign in' : 'Create account'}</span>}
          </button>
        </form>

        <div className="relative my-7 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200/90" /></div>
            <span className="relative px-3 bg-white text-[11px] font-bold text-gray-500 tracking-wider">OR</span>
        </div>

        <button
            id="google-signin-btn"
            onClick={handleGoogleLogin}
            disabled={isAnyLoading || !!googleError}
            className="w-full h-[50px] rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-sm flex items-center justify-center gap-3 transition-colors duration-150 active:scale-[0.99] disabled:opacity-50 cursor-pointer shadow-xs"
        >
            <span>Continue with Google</span>
        </button>
      </motion.div>
    </div>
  );
}
