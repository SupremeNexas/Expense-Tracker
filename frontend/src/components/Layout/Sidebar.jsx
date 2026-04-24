import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  Tags, 
  PieChart, 
  Wallet,
  CreditCard,
  Repeat,
  CalendarClock,
  Menu,
  X,
  Users
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/expenses', label: 'Expenses', icon: Receipt },
  { path: '/subscriptions', label: 'Subscriptions', icon: Repeat },
  { path: '/credit-cards', label: 'Credit Cards', icon: CreditCard },
  { path: '/bills', label: 'Recurring Bills', icon: CalendarClock },
  { path: '/groups', label: 'Shared Groups', icon: Users },
  { path: '/budgets', label: 'Budgets & Goals', icon: Wallet },
  { path: '/categories', label: 'Categories', icon: Tags },
  { path: '/analytics', label: 'Analytics', icon: PieChart },
];

export const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setCollapsed(!collapsed);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar glass-card ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          {!collapsed && <h2 className="brand-text">Fintech</h2>}
          {collapsed && <h2 className="brand-text-short" style={{ color: 'var(--accent-indigo)' }}>F</h2>}
          <button className="btn btn--icon btn--ghost d-none-mobile" onClick={toggleSidebar}>
            <Menu size={20} />
          </button>
          <button className="btn btn--icon btn--ghost d-none-desktop" onClick={(e) => { e.stopPropagation(); setMobileOpen(false); }}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
                             (item.path !== '/' && location.pathname.startsWith(item.path));
            
            return (
              <NavLink 
                key={item.path} 
                to={item.path} 
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
