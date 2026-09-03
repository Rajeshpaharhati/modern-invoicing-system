import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Sparkles,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const isPremium = user?.role === 'premium';

  return (
    <aside className="sidebar no-print">
      <div className="sidebar-header">
        <div className="brand-badge">N</div>
        <div>
          <div className="brand-title">the notary</div>
          <div className="brand-subtitle">Invoicing Suite</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/invoices"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <FileText size={18} />
          <span>Invoices</span>
        </NavLink>

        <NavLink
          to="/clients"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Users size={18} />
          <span>Clients</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Settings size={18} />
          <span style={{ flex: 1 }}>Branding & Settings</span>
          {isPremium ? (
            <Sparkles size={14} color="#f59e0b" />
          ) : (
            <span
              style={{
                fontSize: 10,
                color: 'var(--slate-400)',
                background: 'var(--slate-100)',
                padding: '2px 5px',
                borderRadius: 4
              }}
            >
              FREE
            </span>
          )}
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="user-snippet">
          <div className="user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-details">
            <div className="user-name">{user?.name || 'User'}</div>
            <span className={`role-pill ${user?.role || 'free'}`}>
              {user?.role === 'premium' ? '★ Premium' : 'Free Tier'}
            </span>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--slate-400)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
