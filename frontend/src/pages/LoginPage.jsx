import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Sparkles, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, demoLogin } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      let msg = err.response?.data?.error;
      if (!msg) {
        if (typeof err.response?.data === 'string' && err.response.data.includes('form')) {
          msg = 'Backend not reached: Netlify is not connected to your local backend. Run frontend locally at http://localhost:5173 or set VITE_API_URL.';
        } else if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
          msg = 'Network Error: Cannot reach backend server. Make sure your backend is running.';
        } else {
          msg = 'Invalid login credentials';
        }
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (tier) => {
    setDemoLoading(tier);
    try {
      await demoLogin(tier);
      toast.success(`Logged in as ${tier.toUpperCase()} demo user!`);
      navigate('/');
    } catch (err) {
      let msg = err.response?.data?.error;
      if (!msg) {
        if (typeof err.response?.data === 'string' && err.response.data.includes('form')) {
          msg = 'Backend not reached: Netlify is not connected to your local backend. Run frontend locally at http://localhost:5173 or set VITE_API_URL.';
        } else {
          msg = 'Demo login failed. Make sure backend is running.';
        }
      }
      toast.error(msg);
    } finally {
      setDemoLoading('');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        backgroundImage: 'radial-gradient(at 0% 0%, rgba(79, 70, 229, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(124, 58, 237, 0.15) 0px, transparent 50%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
    >
      <div style={{ maxWidth: 460, width: '100%' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--primary-600), #7c3aed)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 26,
              margin: '0 auto 14px',
              boxShadow: '0 8px 20px rgba(79, 70, 229, 0.4)'
            }}
          >
            N
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            the notary
          </h1>
          <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 4 }}>
            Modern Invoicing & Client Management System
          </p>
        </div>

        {/* 1-Click Demo Evaluation Box */}
        <div
          style={{
            backgroundColor: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 20px',
            marginBottom: 20
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#38bdf8',
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Sparkles size={13} />
            <span>Fast Evaluator Quick-Start (1-Click Login)</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              type="button"
              onClick={() => handleDemoLogin('free')}
              disabled={!!demoLoading}
              className="btn btn-sm"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#e2e8f0',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                justifyContent: 'flex-start',
                padding: '8px 12px'
              }}
            >
              <Shield size={14} color="#94a3b8" />
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>Free Tier Demo</div>
                <div style={{ fontSize: 10, color: '#94a3b8' }}>Standard Layout</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('premium')}
              disabled={!!demoLoading}
              className="btn btn-sm"
              style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.3))',
                color: '#fef3c7',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                justifyContent: 'flex-start',
                padding: '8px 12px'
              }}
            >
              <Sparkles size={14} color="#f59e0b" />
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>Premium Demo</div>
                <div style={{ fontSize: 10, color: '#fde68a' }}>Custom Branding</div>
              </div>
            </button>
          </div>
        </div>

        {/* Standard Login Card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            padding: '32px',
            boxShadow: 'var(--shadow-xl)'
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--slate-900)', marginBottom: 20 }}>
            Sign In to Account
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 8 }}
              disabled={loading}
            >
              <LogIn size={16} />
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            </button>
          </form>

          <div
            style={{
              marginTop: 24,
              paddingTop: 18,
              borderTop: '1px solid var(--slate-100)',
              textAlign: 'center',
              fontSize: 13,
              color: 'var(--slate-500)'
            }}
          >
            Don't have an account?{' '}
            <Link
              to="/register"
              style={{ color: 'var(--primary-600)', fontWeight: 600, textDecoration: 'none' }}
            >
              Create free account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
