import React, { useState, useEffect } from 'react';
import { Menu, LogOut, Sun, Moon, Bell, Search, User as UserIcon } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { CurrencySelector } from '../Settings/CurrencySelector';

interface HeaderProps {
  setMobileOpen: (open: boolean) => void;
}

export function Header({ setMobileOpen }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check initial preference
    const isDark = document.documentElement.classList.contains('dark') || 
                   localStorage.getItem('theme') === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    }
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  if (!user) return null;

  return (
    <header className="fixed top-0 right-0 left-0 md:left-auto md:w-[calc(100%-var(--sidebar-width))] h-16 z-30 bg-[#FAFAFA]/85 dark:bg-[#0C0C0C]/85 backdrop-blur-md border-b border-black/[0.06] dark:border-white/[0.06] px-6 flex items-center justify-between">
      {/* Left side mobile menu and title */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setMobileOpen(true)}
          className="md:hidden p-1.5 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.04] cursor-pointer"
        >
          <Menu className="w-5 h-5 text-gray-500" />
        </button>
        <span className="hidden md:inline text-xs font-semibold text-gray-400 font-mono">WORKSPACE / FINTECH CMD</span>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-4">
        {/* Currency selector */}
        <CurrencySelector />

        {/* Dark Mode toggle */}
        <button 
          onClick={toggleDarkMode} 
          className="p-2 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.04] text-gray-400 hover:text-black dark:hover:text-white cursor-pointer transition-colors"
          title="Toggle Dark Mode"
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications mock button */}
        <button 
          className="p-2 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.04] text-gray-400 hover:text-black dark:hover:text-white cursor-pointer transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </button>

        {/* User profile dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.04] cursor-pointer transition-colors text-left"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-semibold uppercase">
              {user.name ? user.name.charAt(0) : 'U'}
            </div>
            <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[120px]">
              {user.name}
            </span>
          </button>

          {showDropdown && (
            <div 
              onMouseLeave={() => setShowDropdown(false)}
              className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#151515] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl shadow-xl p-2 animate-scale-in"
            >
              <div className="px-3 py-2">
                <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{user.name}</div>
                <div className="text-[10px] text-gray-400 truncate mt-0.5">{user.email}</div>
              </div>
              <div className="border-t border-black/[0.04] dark:border-white/[0.04] my-1" />
              <button 
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
export default Header;
