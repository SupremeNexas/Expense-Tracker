import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../components/UI/Toast';
import { SUPPORTED_CURRENCIES } from '../utils/currency';

export const AuthPage = () => {
  const { login, register } = useAppContext();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    base_currency: 'USD'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
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
          base_currency: formData.base_currency
        });
        showToast('Account created successfully!', 'success');
      }
      navigate('/');
    } catch (err) {
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-xl)' }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: 'var(--space-2xl)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <h1 style={{ background: 'linear-gradient(135deg, var(--accent-indigo), var(--accent-emerald))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
            Fintech
          </h1>
          <p className="text-secondary">Your intelligent financial command center.</p>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off">
          {!isLogin && (
            <>
              <div className="form-group mb-4">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group mb-4">
                <label className="form-label">Base Currency</label>
                <select name="base_currency" className="form-select" value={formData.base_currency} onChange={handleChange}>
                  {SUPPORTED_CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.label} ({c.code})</option>
                  ))}
                </select>
              </div>
            </>
          )}
          
          <div className="form-group mb-4">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-input"
              autoComplete="off"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group mb-4">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="u_password_field"
              id="u_password_field"
              className="form-input"
              autoComplete="new-password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group mb-4">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                className="form-input"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div style={{ marginTop: 'var(--space-lg)' }}>
            <button
              type="submit"
              className="btn btn--primary"
              style={{ width: '100%', padding: '14px', marginBottom: 'var(--space-md)' }}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: 'var(--space-md)' }}>
          <button
            className="btn btn--ghost text-secondary"
            onClick={() => { setIsLogin(!isLogin); setFormData({ name: '', email: '', password: '', confirmPassword: '', base_currency: 'USD' }); }}
            style={{ fontSize: '0.875rem' }}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};
