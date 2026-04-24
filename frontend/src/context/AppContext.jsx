import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setToken } from '../api/client';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Global App State
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCategories = useCallback(async () => {
    const data = await api.getCategories();
    setCategories(data);
    return data;
  }, []);

  const fetchExpenses = useCallback(async (params) => {
    const data = await api.getExpenses(params);
    setExpenses(data);
    return data;
  }, []);

  const fetchBudgets = useCallback(async (params) => {
    const data = await api.getBudgets(params);
    setBudgets(data);
    return data;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setCategories([]);
    setExpenses([]);
    setBudgets([]);
  }, []);

  const initializeData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchCategories(),
        fetchExpenses(),
      ]);
      const now = new Date();
      await fetchBudgets({ month: now.getMonth() + 1, year: now.getFullYear() });
    } catch (err) {
      if (err.message === 'UNAUTHORIZED') {
        logout();
      } else {
        setError(err.message || 'Failed to initialize app data');
      }
    } finally {
      setLoading(false);
    }
  }, [fetchCategories, fetchExpenses, fetchBudgets, logout]);

  const checkAuth = useCallback(async () => {
    setAuthLoading(true);
    try {
      const userData = await api.getMe();
      setUser(userData);
      initializeData();
    } catch (err) {
      if (err.message === 'UNAUTHORIZED') {
        setUser(null);
      }
    } finally {
      setAuthLoading(false);
    }
  }, [initializeData]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials) => {
    const { token, user: userData } = await api.login(credentials);
    setToken(token);
    setUser(userData);
    initializeData();
  };

  const register = async (userData) => {
    const { token, user: newUserData } = await api.register(userData);
    setToken(token);
    setUser(newUserData);
    initializeData();
  };

  const updateUserCurrency = async (currencyCode) => {
    const res = await api.updateCurrency(currencyCode);
    setUser(prev => ({ ...prev, base_currency: res.base_currency }));
  };

  const value = {
    user,
    authLoading,
    login,
    register,
    logout,
    updateUserCurrency,

    categories,
    expenses,
    budgets,
    loading,
    error,
    refreshData: initializeData,
    fetchCategories,
    fetchExpenses,
    fetchBudgets
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
