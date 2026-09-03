import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Users,
  Plus,
  ArrowRight,
  Sparkles,
  FileText
} from 'lucide-react';
import { invoicesAPI, clientsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

const DashboardPage = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    paidAmount: 0,
    pendingAmount: 0,
    totalCount: 0,
    paidCount: 0,
    overdueCount: 0
  });
  const [clientCount, setClientCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [invRes, clientRes] = await Promise.all([
          invoicesAPI.getAll(),
          clientsAPI.getAll()
        ]);
        setInvoices(invRes.data.data.slice(0, 5));
        if (invRes.data.summary) {
          setSummary(invRes.data.summary);
        }
        setClientCount(clientRes.data.count || 0);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const isPremium = user?.role === 'premium';

  return (
    <div>
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 32px',
          color: 'white',
          marginBottom: 32,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.3)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>
              Welcome back, {user?.name || 'Partner'}!
            </h2>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 4,
                background: isPremium ? '#f59e0b' : 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              {isPremium ? '★ Premium Plan' : 'Free Tier'}
            </span>
          </div>
          <p style={{ fontSize: 14, color: '#c7d2fe', maxWidth: 600 }}>
            {isPremium
              ? 'You have full access to custom logo branding on invoice views and printable layouts.'
              : 'You are on the Free Tier. Upgrade to Premium anytime to unlock custom logo branding and alignment.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/invoices/new" className="btn btn-primary" style={{ background: '#ffffff', color: '#4338ca' }}>
            <Plus size={16} />
            <span>Create Invoice</span>
          </Link>
          {!isPremium && (
            <Link
              to="/settings"
              className="btn"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)' }}
            >
              <Sparkles size={16} color="#fbbf24" />
              <span>Explore Premium</span>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20,
          marginBottom: 32
        }}
      >
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--primary-50)',
              color: 'var(--primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <DollarSign size={24} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
              Total Invoiced
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--slate-900)' }}>
              {formatCurrency(summary.totalRevenue)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--slate-400)' }}>
              {summary.totalCount} total invoice{summary.totalCount === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--success-bg)',
              color: 'var(--success-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CheckCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
              Collected (Paid)
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--success-text)' }}>
              {formatCurrency(summary.paidAmount)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--slate-400)' }}>
              {summary.paidCount} paid invoice{summary.paidCount === 1 ? '' : 's'}
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--warning-bg)',
              color: 'var(--warning-text)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <AlertTriangle size={24} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
              Pending / Overdue
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--slate-900)' }}>
              {formatCurrency(summary.pendingAmount)}
            </div>
            <div style={{ fontSize: 12, color: 'var(--danger-text)' }}>
              {summary.overdueCount} overdue
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#f3e8ff',
              color: '#9333ea',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
              Active Clients
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--slate-900)' }}>
              {clientCount}
            </div>
            <div style={{ fontSize: 12, color: 'var(--slate-400)' }}>
              <Link to="/clients" style={{ color: 'var(--primary-600)', textDecoration: 'none' }}>
                Manage clients &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Invoices Section */}
      <div className="card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20
          }}
        >
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--slate-900)' }}>
              Recent Invoices
            </h3>
            <p style={{ fontSize: 13, color: 'var(--slate-500)' }}>
              Latest invoices created under your account
            </p>
          </div>
          <Link to="/invoices" className="btn btn-secondary btn-sm">
            <span>View All</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--slate-400)' }}>
            Loading dashboard invoices...
          </div>
        ) : invoices.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center' }}>
            <FileText size={40} color="var(--slate-300)" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--slate-700)' }}>
              No invoices created yet
            </h4>
            <p style={{ fontSize: 13, color: 'var(--slate-400)', marginBottom: 16 }}>
              Create your first invoice to get started.
            </p>
            <Link to="/invoices/new" className="btn btn-primary btn-sm">
              <Plus size={14} />
              <span>Create Invoice</span>
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv._id}>
                    <td>
                      <Link
                        to={`/invoices/${inv._id}`}
                        style={{
                          fontWeight: 600,
                          color: 'var(--primary-600)',
                          textDecoration: 'none'
                        }}
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td>{inv.clientId?.name || 'Unnamed Client'}</td>
                    <td>{new Date(inv.issueDate).toLocaleDateString()}</td>
                    <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600, color: 'var(--slate-900)' }}>
                      {formatCurrency(inv.total)}
                    </td>
                    <td>
                      <StatusBadge status={inv.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/invoices/${inv._id}`}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 10px' }}
                      >
                        View & Print
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
