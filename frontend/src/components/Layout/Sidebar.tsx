import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Receipt, Repeat, CreditCard, CalendarClock, Users, 
  Wallet, Tags, PieChart, Settings, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/expenses', label: 'Transactions', icon: Receipt },
  { path: '/subscriptions', label: 'Subscriptions', icon: Repeat },
  { path: '/credit-cards', label: 'Credit Cards', icon: CreditCard },
  { path: '/bills', label: 'Recurring Bills', icon: CalendarClock },
  { path: '/groups', label: 'Shared Groups', icon: Users },
  { path: '/budgets', label: 'Budgets', icon: Wallet },
  { path: '/goals', label: 'Savings Goals', icon: PieChart },
  { path: '/categories', label: 'Categories', icon: Tags },
];

export function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const toggleSidebar = () => setCollapsed(!collapsed);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside 
        className={`fixed md:translate-x-0 top-0 bottom-0 left-0 z-50 bg-[#FAFAFA] dark:bg-[#0C0C0C] border-r border-black/[0.06] dark:border-white/[0.06] flex flex-col justify-between transition-all duration-300
          ${collapsed ? 'w-16' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div>
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-black/[0.04] dark:border-white/[0.04]">
            {!collapsed && (
              <span className="text-base font-bold tracking-tight text-black dark:text-white">
                Expense Tracker
              </span>
            )}
            {collapsed && (
              <span className="text-base font-bold text-emerald-500 mx-auto">
                ET
              </span>
            )}
            <button 
              onClick={toggleSidebar} 
              className="hidden md:flex p-1.5 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.04] text-gray-400 cursor-pointer"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-4 px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                               (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
                    ${isActive 
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                      : 'text-gray-500 dark:text-gray-400 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] hover:text-black dark:hover:text-white'
                    }
                    ${collapsed ? 'justify-center' : ''}
                  `}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-emerald-500' : 'text-gray-400 group-hover:text-black dark:group-hover:text-white'}`} />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="p-3 border-t border-black/[0.04] dark:border-white/[0.04]">
          {!collapsed && user && (
            <div className="px-3 py-2 mb-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.02] dark:border-white/[0.02]">
              <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{user.name}</div>
              <div className="text-[10px] text-gray-400 truncate">{user.email}</div>
            </div>
          )}

          <button
            onClick={logout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
export default Sidebar;
