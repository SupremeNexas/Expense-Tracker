import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import TransactionMenu from '../Transactions/TransactionMenu';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { useToast } from '../UI/Toast';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showToast } = useToast();

  const handleMenuClick = (link: string) => {
    if (user?.isPremium) {
      navigate(link);
    } else {
      showToast('Premium feature — bypassed for demo', 'info');
      navigate(link);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8f9ff]">
      {/* Sidebar navigation */}
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* Main layout context */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300
          ${collapsed ? 'md:pl-16' : 'md:pl-64'}
        `}
      >
        {/* Top Header navbar */}
        <Header setMobileOpen={setMobileOpen} collapsed={collapsed} />

        {/* Transaction Multi-button Menu — fixed to viewport right edge */}
        <TransactionMenu />

        {/* Inner page content container */}
        <main className="flex-1 px-6 pt-20 pb-12 overflow-y-auto" data-lenis-prevent>
          {children}
        </main>
      </div>
    </div>
  );
}
export default Layout;
