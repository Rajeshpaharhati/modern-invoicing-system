import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  RotateCcw,
  Printer,
  Trash2,
  CheckCircle,
  FileText
} from 'lucide-react';
import { invoicesAPI, clientsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';

const InvoicesListPage = () => {
  const toast = useToast();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (clientFilter) params.clientId = clientFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (searchQuery) params.search = searchQuery;

      const res = await invoicesAPI.getAll(params);
      setInvoices(res.data.data);
    } catch (err) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, clientFilter, startDate, endDate, searchQuery]);

  // Load clients for filter dropdown
  useEffect(() => {
    const loadClients = async () => {
      try {
        const res = await clientsAPI.getAll();
        setClients(res.data.data);
      } catch (err) {
        console.error('Failed to load clients list:', err);
      }
    };
    loadClients();
  }, []);

  // Fetch invoices on filter change
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleResetFilters = () => {
    setStatusFilter('');
    setClientFilter('');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  const handleMarkPaid = async (id) => {
    try {
      await invoicesAPI.updateStatus(id, 'paid');
      toast.success('Invoice marked as Paid');
      fetchInvoices();
    } catch (err) {
      toast.error('Failed to update invoice status');
    }
  };

  const handleDelete = async (id, invNumber) => {
    if (!window.confirm(`Are you sure you want to delete invoice ${invNumber}?`)) return;
    try {
      await invoicesAPI.delete(id);
      toast.success(`Invoice ${invNumber} deleted`);
      fetchInvoices();
    } catch (err) {
      toast.error('Failed to delete invoice');
    }
  };

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt || 0);
  };

  return (
    <div>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24
        }}
      >
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--slate-900)' }}>
            Invoices Directory
          </h2>
          <p style={{ fontSize: 14, color: 'var(--slate-500)' }}>
            Create, track, filter, and print invoices for your clients
          </p>
        </div>

        <Link to="/invoices/new" className="btn btn-primary">
          <Plus size={16} />
          <span>Create New Invoice</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="card" style={{ marginBottom: 24, padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Filter size={16} color="var(--slate-500)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--slate-700)' }}>
            Filter Invoices
          </span>
          {(statusFilter || clientFilter || startDate || endDate || searchQuery) && (
            <button
              onClick={handleResetFilters}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: 'var(--primary-600)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <RotateCcw size={12} />
              Reset Filters
            </button>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12
          }}
        >
          {/* Search by Invoice # */}
          <div>
            <label className="form-label" style={{ fontSize: 11 }}>Search #</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. INV-2026"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: 32 }}
              />
              <Search
                size={14}
                color="var(--slate-400)"
                style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="form-label" style={{ fontSize: 11 }}>Status</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          {/* Client Filter */}
          <div>
            <label className="form-label" style={{ fontSize: 11 }}>Client</label>
            <select
              className="form-select"
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
            >
              <option value="">All Clients</option>
              {clients.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range - Start */}
          <div>
            <label className="form-label" style={{ fontSize: 11 }}>From Date</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* Date Range - End */}
          <div>
            <label className="form-label" style={{ fontSize: 11 }}>To Date</label>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--slate-400)' }}>
            Loading invoices...
          </div>
        ) : invoices.length === 0 ? (
          <div style={{ padding: '64px 20px', textAlign: 'center' }}>
            <FileText size={48} color="var(--slate-300)" style={{ margin: '0 auto 14px' }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--slate-800)', marginBottom: 6 }}>
              No invoices found
            </h3>
            <p style={{ fontSize: 14, color: 'var(--slate-500)', marginBottom: 20 }}>
              {statusFilter || clientFilter || startDate || endDate || searchQuery
                ? 'No invoices match your selected filter criteria.'
                : 'Get started by creating your first client invoice.'}
            </p>
            <Link to="/invoices/new" className="btn btn-primary btn-sm">
              <Plus size={14} />
              <span>Create Invoice</span>
            </Link>
          </div>
        ) : (
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv._id}>
                    <td>
                      <Link
                        to={`/invoices/${inv._id}`}
                        style={{
                          fontWeight: 700,
                          color: 'var(--primary-600)',
                          textDecoration: 'none'
                        }}
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                        {inv.clientId?.name || 'Unknown Client'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--slate-400)' }}>
                        {inv.clientId?.email}
                      </div>
                    </td>
                    <td>{new Date(inv.issueDate).toLocaleDateString()}</td>
                    <td>
                      <span
                        style={{
                          color:
                            inv.status === 'overdue' || (new Date(inv.dueDate) < new Date() && inv.status !== 'paid')
                              ? 'var(--danger-text)'
                              : 'inherit',
                          fontWeight: inv.status === 'overdue' ? 600 : 'normal'
                        }}
                      >
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--slate-900)' }}>
                      {formatCurrency(inv.total)}
                    </td>
                    <td>
                      <StatusBadge status={inv.status} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <Link
                          to={`/invoices/${inv._id}`}
                          className="btn btn-secondary btn-sm"
                          title="View & Print Invoice"
                        >
                          <Printer size={13} />
                          <span>View/Print</span>
                        </Link>

                        {inv.status !== 'paid' && (
                          <button
                            onClick={() => handleMarkPaid(inv._id)}
                            className="btn btn-success btn-sm"
                            title="Mark as Paid"
                          >
                            <CheckCircle size={13} />
                            <span>Paid</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(inv._id, inv.invoiceNumber)}
                          className="btn btn-sm"
                          style={{
                            background: 'none',
                            border: '1px solid var(--slate-200)',
                            color: 'var(--slate-400)',
                            cursor: 'pointer'
                          }}
                          title="Delete Invoice"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
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

export default InvoicesListPage;
