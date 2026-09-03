import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  UserPlus,
  Sparkles
} from 'lucide-react';
import { invoicesAPI, clientsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import ClientModal from '../components/ClientModal';

const InvoiceCreatePage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [clients, setClients] = useState([]);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [clientId, setClientId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [status, setStatus] = useState('draft');
  const [taxRate, setTaxRate] = useState(10); // flat % field
  const [notes, setNotes] = useState('Payment is due within 30 days of invoice date. Thank you for your business!');

  // Dynamic Line Items
  const [items, setItems] = useState([
    { description: 'Web Development Consultation', quantity: 10, unitPrice: 120 }
  ]);

  // Load clients and suggest next invoice number
  useEffect(() => {
    let isMounted = true;
    const initPage = async () => {
      try {
        setLoadingClients(true);
        const [clientsRes, numRes] = await Promise.allSettled([
          clientsAPI.getAll(),
          invoicesAPI.getNextNumber()
        ]);

        if (!isMounted) return;

        if (clientsRes.status === 'fulfilled' && clientsRes.value?.data?.data) {
          const clientList = clientsRes.value.data.data;
          setClients(clientList);
          if (clientList.length > 0) {
            setClientId((prev) => prev || clientList[0]._id);
          }
        }

        if (numRes.status === 'fulfilled' && numRes.value?.data?.suggestedNumber) {
          setInvoiceNumber((prev) => prev || numRes.value.data.suggestedNumber);
        } else {
          const year = new Date().getFullYear();
          setInvoiceNumber((prev) => prev || `INV-${year}-001`);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Invoice initialization warning:', err);
      } finally {
        if (isMounted) {
          setLoadingClients(false);
        }
      }
    };

    initPage();
    return () => {
      isMounted = false;
    };
  }, []);

  // Dynamic row manipulations
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { description: '', quantity: 1, unitPrice: 0 }
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      toast.error('Invoice must contain at least one line item');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });
  };

  // Real-time auto calculations
  const subtotal = items.reduce((acc, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    return acc + Math.round(qty * price * 100) / 100;
  }, 0);

  const parsedTaxRate = Number(taxRate) || 0;
  const taxAmount = Math.round(subtotal * (parsedTaxRate / 100) * 100) / 100;
  const grandTotal = Math.round((subtotal + taxAmount) * 100) / 100;

  const handleClientSaved = (newClient) => {
    setClients((prev) => [newClient, ...prev]);
    setClientId(newClient._id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!clientId) {
      toast.error('Please select a client for this invoice');
      return;
    }

    if (!invoiceNumber.trim()) {
      toast.error('Invoice number is required');
      return;
    }

    // Validate line items
    for (let i = 0; i < items.length; i++) {
      if (!items[i].description.trim()) {
        toast.error(`Please provide a description for Item #${i + 1}`);
        return;
      }
      if (Number(items[i].quantity) <= 0) {
        toast.error(`Quantity for Item #${i + 1} must be greater than zero`);
        return;
      }
      if (Number(items[i].unitPrice) < 0) {
        toast.error(`Unit price for Item #${i + 1} cannot be negative`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        clientId,
        invoiceNumber: invoiceNumber.trim().toUpperCase(),
        issueDate,
        dueDate,
        status,
        taxRate: parsedTaxRate,
        notes: notes.trim(),
        items: items.map((it) => ({
          description: it.description.trim(),
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice)
        }))
      };

      const res = await invoicesAPI.create(payload);
      toast.success('Invoice created successfully!');
      navigate(`/invoices/${res.data.data._id}`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to create invoice';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt || 0);
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Top Breadcrumb & Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            to="/invoices"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--slate-200)',
              backgroundColor: '#ffffff',
              color: 'var(--slate-600)'
            }}
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--slate-900)' }}>
              Create New Invoice
            </h2>
            <p style={{ fontSize: 13, color: 'var(--slate-500)' }}>
              Fill in client details and line items. Real-time totals compute automatically.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Invoice Meta Card */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, color: 'var(--slate-800)' }}>
            Invoice Overview
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
            {/* Client Selector with inline Add Client modal button */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="form-label" style={{ margin: 0 }}>Client / Recipient *</label>
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(true)}
                  style={{
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
                  <UserPlus size={13} />
                  + Add New Client
                </button>
              </div>

              {loadingClients ? (
                <div style={{ fontSize: 13, color: 'var(--slate-400)' }}>Loading client directory...</div>
              ) : clients.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--danger-text)' }}>
                  No clients available. Click "+ Add New Client" above to create one.
                </div>
              ) : (
                <select
                  className="form-select"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                >
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Invoice Number */}
            <div className="form-group">
              <label className="form-label">Invoice Number *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. INV-2026-001"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                required
              />
            </div>

            {/* Issue Date */}
            <div className="form-group">
              <label className="form-label">Issue Date *</label>
              <input
                type="date"
                className="form-input"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
              />
            </div>

            {/* Due Date */}
            <div className="form-group">
              <label className="form-label">Due Date *</label>
              <input
                type="date"
                className="form-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>

            {/* Status */}
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic Line Items Card */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--slate-800)' }}>
                Line Items
              </h3>
              <p style={{ fontSize: 13, color: 'var(--slate-500)' }}>
                Add products, consulting hours, or services.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="btn btn-secondary btn-sm"
            >
              <Plus size={14} />
              <span>Add Line Item</span>
            </button>
          </div>

          <div className="table-container" style={{ marginBottom: 20 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '45%' }}>Description</th>
                  <th style={{ width: '15%' }}>Quantity</th>
                  <th style={{ width: '20%' }}>Unit Price ($)</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Total</th>
                  <th style={{ width: '5%' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => {
                  const qty = Number(item.quantity) || 0;
                  const price = Number(item.unitPrice) || 0;
                  const rowTotal = Math.round(qty * price * 100) / 100;

                  return (
                    <tr key={index}>
                      <td>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. Design Consulting or Software License"
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-input"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-input"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                          required
                        />
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--slate-800)' }}>
                        {formatCurrency(rowTotal)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--slate-400)',
                            cursor: 'pointer',
                            padding: 4
                          }}
                          title="Remove row"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Calculations Summary Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start' }}>
            {/* Notes / Terms */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Payment Terms & Notes</label>
              <textarea
                className="form-textarea"
                rows="4"
                placeholder="Bank wire instructions, ACH info, or friendly notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Subtotal, Flat Tax %, and Grand Total */}
            <div
              style={{
                backgroundColor: 'var(--slate-50)',
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--slate-200)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
                <span style={{ color: 'var(--slate-600)' }}>Subtotal:</span>
                <span style={{ fontWeight: 600, color: 'var(--slate-800)' }}>{formatCurrency(subtotal)}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--slate-600)' }}>
                  <span>Tax (flat %):</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: 110 }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    className="form-input"
                    style={{ padding: '4px 8px', fontSize: 13, textAlign: 'right' }}
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                  />
                  <span style={{ fontSize: 13, color: 'var(--slate-500)' }}>%</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: 13, color: 'var(--slate-500)' }}>
                <span>Tax Amount:</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: 14,
                  borderTop: '2px solid var(--slate-200)',
                  fontSize: 17,
                  fontWeight: 800,
                  color: 'var(--slate-900)'
                }}
              >
                <span>Total Amount:</span>
                <span style={{ color: 'var(--primary-600)' }}>{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14 }}>
          <Link to="/invoices" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            <Save size={16} />
            <span>{submitting ? 'Generating Invoice...' : 'Create Invoice'}</span>
          </button>
        </div>
      </form>

      {/* Inline Client Modal */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onClientSaved={handleClientSaved}
      />
    </div>
  );
};

export default InvoiceCreatePage;
