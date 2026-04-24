import React, { useState } from 'react';
import { Menu, LogOut, Settings } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { CurrencySelector } from '../Settings/CurrencySelector';
import './Header.css';

export const Header = ({ setMobileOpen }) => {
  const { user, logout } = useAppContext();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!user) return null;

  return (
    <header className="header glass-card">
      <div className="header-content">
        <button className="btn btn--icon btn--ghost mobile-menu-btn" onClick={(e) => { e.stopPropagation(); setMobileOpen(true); }}>
          <Menu size={24} />
        </button>
        <div className="header-right">
          <CurrencySelector />
          <div className="user-dropdown-container">
            <div className="user-profile" onClick={() => setShowDropdown(!showDropdown)}>
              <div className="avatar">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</div>
              <span className="username">{user.name}</span>
            </div>
            
            {showDropdown && (
              <div className="user-dropdown glass-card animate-scale-in" onMouseLeave={() => setShowDropdown(false)}>
                <div className="dropdown-user-info">
                  <div className="dropdown-name">{user.name}</div>
                  <div className="dropdown-email text-secondary" style={{ fontSize: '0.75rem' }}>{user.email}</div>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '8px 0' }} />
                <button className="btn btn--ghost text-danger" style={{ width: '100%', justifyContent: 'flex-start' }} onClick={logout}>
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
