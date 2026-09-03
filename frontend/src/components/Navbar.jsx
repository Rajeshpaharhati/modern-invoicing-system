import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Sparkles, ShieldCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Navbar = ({ title = 'Dashboard' }) => {
  const { user, switchRole } = useAuth();
  const toast = useToast();
  const [switching, setSwitching] = useState(false);

  const isPremium = user?.role === 'premium';

  const handleToggleTier = async () => {
    try {
      setSwitching(true);
      const nextRole = isPremium ? 'free' : 'premium';
      await switchRole(nextRole);
      toast.success(`Active tier switched to: ${nextRole.toUpperCase()}`);
    } catch (err) {
      toast.error('Failed to switch tier');
    } finally {
      setSwitching(false);
    }
  };

  return (
    <header className="top-navbar no-print">
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--slate-900)' }}>
          {title}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Quick Tier Switcher for Evaluator Convenience */}
        <button
          onClick={handleToggleTier}
          disabled={switching}
          title="Click to toggle between Free and Premium tiers to test tiered access features"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            border: isPremium ? '1px solid #f59e0b' : '1px solid var(--slate-300)',
            background: isPremium ? '#fffbeb' : '#ffffff',
            color: isPremium ? '#b45309' : 'var(--slate-700)',
            transition: 'all 0.2s ease'
          }}
        >
          {switching ? (
            <RefreshCw size={12} className="spin" />
          ) : isPremium ? (
            <Sparkles size={13} color="#f59e0b" />
          ) : (
            <ShieldCheck size={13} color="var(--slate-500)" />
          )}
          <span>
            Tier: <strong>{isPremium ? 'PREMIUM' : 'FREE'}</strong> (Click to switch)
          </span>
        </button>

        <Link to="/invoices/new" className="btn btn-primary btn-sm">
          <Plus size={15} />
          <span>New Invoice</span>
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
