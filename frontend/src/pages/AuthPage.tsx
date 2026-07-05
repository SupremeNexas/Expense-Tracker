import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';
import { useToast } from '../components/UI/Toast';
import { SUPPORTED_CURRENCIES } from '../utils/currency';
import { LogIn, Sparkles, UserPlus } from 'lucide-react';

export default function AuthPage() {
  const { login, register, googleLogin } = useAuthStore();
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

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await googleLogin({
        email: formData.email || 'demo@example.com',
        name: 'Google User',
        googleId: 'google_oauth_12345'
      });
      showToast('Logged in with Google!', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err.message || 'Google Auth failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-[#FAFAFA] dark:bg-[#0C0C0C] relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-[420px] premium-card glass-effect relative border border-black/[0.06] dark:border-white/[0.06] p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-black dark:text-white">Expense Tracker</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Your intelligent financial command center.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  name="name"
                  className="input-premium"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Base Currency</label>
                <select 
                  name="baseCurrency" 
                  className="input-premium cursor-pointer"
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
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              name="email"
              className="input-premium"
              placeholder="alex@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
            <input
              type="password"
              name="password"
              className="input-premium"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {!isLogin && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                className="input-premium"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full btn-premium btn-premium-primary py-3.5 mt-6 cursor-pointer text-sm font-semibold"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 w-full border-t border-black/[0.04] dark:border-white/[0.04]" />
          <span className="relative px-3 bg-white dark:bg-[#151515] text-[10px] uppercase font-bold text-gray-400">or continue with</span>
        </div>

        {/* Google Login Mock button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full btn-premium btn-premium-secondary py-3.5 cursor-pointer text-sm font-semibold flex items-center justify-center gap-2"
          disabled={isLoading}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
          Google Workspace
        </button>

        <div className="text-center mt-6">
          <button
            className="text-xs font-semibold text-gray-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            onClick={() => {
              setIsLogin(!isLogin);
              setFormData({ name: '', email: '', password: '', confirmPassword: '', baseCurrency: 'INR' });
            }}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
