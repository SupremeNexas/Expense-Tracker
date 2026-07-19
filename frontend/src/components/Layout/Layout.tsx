import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#FAFAFA] dark:bg-[#0C0C0C]">
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

        {/* Inner page content container */}
        <main className="flex-1 px-6 pt-20 pb-12 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
export default Layout;
