import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import { Layout } from './components/Layout/Layout';
import { ToastProvider } from './components/UI/Toast';

import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ExpensesPage from './pages/ExpensesPage';
import CategoriesPage from './pages/CategoriesPage';
import BudgetsPage from './pages/BudgetsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import CreditCardsPage from './pages/CreditCardsPage';
import BillsPage from './pages/BillsPage';
import GroupsPage from './pages/GroupsPage';
import CopilotPage from './pages/CopilotPage';
import WorkspaceSettings from './pages/WorkspaceSettings';
import Nexova404Page from './pages/Nexova404Page';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, authLoading } = useAuthStore();
  
  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0C0C0C]">
        <div className="animate-pulse text-sm text-gray-500 font-medium">Loading Workspace...</div>
      </div>
    );
  }
  
  if (!user) return <Navigate to="/auth" />;
  
  return <Layout>{children}</Layout>;
};

function AppRoutes() {
  const { user, authLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0C0C0C]">
        <div className="animate-pulse text-sm text-gray-500 font-medium">Initializing Finance Workspace...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* SaaS Landing Page is public at root */}
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
      
      {/* Auth page */}
      <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <AuthPage />} />
      
      {/* Protected Dashboard and sub-views */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/expenses" element={<ProtectedRoute><ExpensesPage /></ProtectedRoute>} />
      <Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
      <Route path="/budgets" element={<ProtectedRoute><BudgetsPage /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      <Route path="/subscriptions" element={<ProtectedRoute><SubscriptionsPage /></ProtectedRoute>} />
      <Route path="/credit-cards" element={<ProtectedRoute><CreditCardsPage /></ProtectedRoute>} />
      <Route path="/bills" element={<ProtectedRoute><BillsPage /></ProtectedRoute>} />
      <Route path="/groups" element={<ProtectedRoute><GroupsPage /></ProtectedRoute>} />
      <Route path="/copilot" element={<ProtectedRoute><CopilotPage /></ProtectedRoute>} />
      <Route path="/workspace-settings" element={<ProtectedRoute><WorkspaceSettings /></ProtectedRoute>} />

      {/* Nexova 404 Pages */}
      <Route path="/404" element={<Nexova404Page />} />
      <Route path="*" element={<Nexova404Page />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </Router>
  );
}

export default App;
