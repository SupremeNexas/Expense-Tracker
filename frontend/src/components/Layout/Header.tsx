import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell, Search } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import Breadcrumbs from './Breadcrumbs';

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
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-4">
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#eff4ff] text-[#45464d]">
          <Search className="w-5 h-5" />
        </button>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#eff4ff] text-[#45464d] relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        {/* User avatar linking to Profile */}
        <Link
          to="/profile"
          className="w-10 h-10 rounded-full border border-[#e5eeff] hover:border-slate-300 transition-colors flex items-center justify-center overflow-hidden bg-slate-50 shrink-0 cursor-pointer"
        >
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-slate-600">
              {(user.displayName || user.name || 'U').charAt(0).toUpperCase()}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
export default Header;
