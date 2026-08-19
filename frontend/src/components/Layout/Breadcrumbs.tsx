import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/expenses': 'Transactions',
  '/subscriptions': 'Subscriptions',
  '/credit-cards': 'Credit Cards',
  '/bills': 'Recurring Bills',
  '/groups': 'Shared Groups',
  '/budgets': 'Budgets',
  '/categories': 'Categories',
  '/workspace-settings': 'Settings',
  '/goals': 'Savings Goals',
  '/copilot': 'AI Copilot',
  '/assistant': 'AI Assistant'
};

export function Breadcrumbs() {
  const location = useLocation();
  const path = location.pathname;

  const getBreadcrumbs = () => {
    const list = [{ label: 'Home', path: '/' }];
    if (path === '/') return list;

    const segments = path.split('/').filter(Boolean);
    let currentPath = '';

    segments.forEach((segment) => {
      currentPath += `/${segment}`;
      const matchedLabel = routeMap[currentPath];
      if (matchedLabel) {
        list.push({ label: matchedLabel, path: currentPath });
      }
    });

    return list;
  };

  const crumbs = getBreadcrumbs();

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium whitespace-nowrap" aria-label="Breadcrumb">
      {crumbs.map((crumb, idx) => {
        const isLast = idx === crumbs.length - 1;
        return (
          <React.Fragment key={crumb.path}>
            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />}
            {isLast ? (
              <span className="text-[#0b1c30] font-semibold">{crumb.label}</span>
            ) : (
              <Link to={crumb.path} className="hover:text-emerald-500 transition-colors flex items-center gap-1">
                {crumb.label === 'Home' && <Home className="w-3.5 h-3.5" />}
                {crumb.label !== 'Home' && crumb.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;
