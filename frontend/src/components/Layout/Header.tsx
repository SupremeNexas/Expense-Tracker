import React, { useState } from 'react';
import { Menu, LogOut, Bell, Search } from 'lucide-react';
import useAuthStore from '../../store/authStore';

interface HeaderProps {
  setMobileOpen: (open: boolean) => void;
  collapsed: boolean;
}

export function Header({ setMobileOpen, collapsed }: HeaderProps) {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <header className={`fixed top-0 right-0 left-0 md:left-auto h-16 z-30 bg-white/90 backdrop-blur-md border-b border-[#e5eeff] px-6 flex items-center justify-between transition-all duration-200
      ${collapsed ? 'md:w-[calc(100%-5rem)]' : 'md:w-[calc(100%-16rem)]'}
    `}>
      <div className="flex items-center gap-3">
        <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded-lg hover:bg-[#eff4ff]">
          <Menu className="w-5 h-5 text-[#45464d]" />
        </button>
        <span className="text-lg font-bold text-[#0b1c30]">Dashboard</span>
      </div>

      <div className="flex items-center gap-4">
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#eff4ff] text-[#45464d]">
          <Search className="w-5 h-5" />
        </button>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#eff4ff] text-[#45464d] relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>
      </div>
    </header>
  );
}
export default Header;
