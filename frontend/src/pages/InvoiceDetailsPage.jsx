import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  CheckCircle,
  Send,
  Trash2,
  Sparkles,
  Building,
  User,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { invoicesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';

const InvoiceDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const res = await invoicesAPI.getById(id);
        setInvoice(res.data.data);
      } catch (err) {
        toast.error('Failed to load invoice details');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      setActionLoading(true);
      const res = await invoicesAPI.updateStatus(id, newStatus);
      setInvoice((prev) => ({ ...prev, status: res.data.data.status }));
      toast.success(`Invoice status updated to ${newStatus.toUpperCase()}`);
    } catch (err) {
      toast.error('Failed to update invoice status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}?`)) return;
    try {
      await invoicesAPI.delete(id);
      toast.success('Invoice deleted');
      navigate('/invoices');
    } catch (err) {
      toast.error('Failed to delete invoice');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--slate-400)' }}>
        Loading printable invoice...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px 20px' }}>
        <AlertCircle size={40} color="var(--danger-text)" style={{ margin: '0 auto 12px' }} />
        <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--slate-900)' }}>
          Invoice Not Found
        </h3>
        <p style={{ color: 'var(--slate-500)', marginBottom: 20 }}>
          The requested invoice does not exist or has been deleted.
        </p>
        <Link to="/invoices" className="btn btn-secondary btn-sm">
          Return to Invoices List
        </Link>
      </div>
    );
  }

  const issuer = invoice.userId || user;
  const isIssuerPremium = issuer?.role === 'premium';
  const customLogo = isIssuerPremium ? issuer?.branding?.logo : null;
  const logoPosition = issuer?.branding?.logoPosition || 'top-left';

  return (
    <div style={{ maxWidth: 940, margin: '0 auto' }}>
      {/* Top Action Header (Hidden in Print Mode) */}
      <div
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12
        }}
      >
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--slate-900)' }}>
                {invoice.invoiceNumber}
              </h2>
              <StatusBadge status={invoice.status} />
              {isIssuerPremium ? (
                <span className="role-pill premium" title="Branded with Premium tier logo styling">
                  ★ Premium Branding
                </span>
              ) : (
                <span className="role-pill free" title="Standard free tier invoice layout">
                  Standard Layout
                </span>
              )}
            </div>
            <p style={{ fontSize: 13, color: 'var(--slate-500)' }}>
              Created on {new Date(invoice.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {invoice.status !== 'paid' && (
            <button
              onClick={() => handleUpdateStatus('paid')}
              disabled={actionLoading}
              className="btn btn-success btn-sm"
            >
              <CheckCircle size={14} />
              <span>Mark as Paid</span>
            </button>
          )}

          {invoice.status === 'draft' && (
            <button
              onClick={() => handleUpdateStatus('sent')}
              disabled={actionLoading}
              className="btn btn-secondary btn-sm"
            >
              <Send size={14} />
              <span>Mark as Sent</span>
            </button>
          )}

          <button onClick={handlePrint} className="btn btn-primary btn-sm">
            <Printer size={14} />
            <span>Print / Save PDF</span>
          </button>

          <button
            onClick={handleDelete}
            className="btn btn-danger btn-sm"
            title="Delete invoice"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* =========================================================================
          PRINTABLE INVOICE SHEET (Formatted for both screen and @media print)
         ========================================================================= */}
      <div className="printable-invoice-page">
        {/* Header Grid: Issuer & Logo Positioning */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexDirection: logoPosition === 'top-right' ? 'row' : 'row-reverse',
            marginBottom: 36,
            paddingBottom: 24,
            borderBottom: '2px solid var(--slate-100)'
          }}
        >
          {/* Company & Issuer Details */}
          <div style={{ textAlign: logoPosition === 'top-right' ? 'left' : 'right' }}>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: 'var(--slate-900)',
                letterSpacing: '-0.02em',
                marginBottom: 4
              }}
            >
              {issuer?.branding?.companyName || issuer?.name || 'Company Name'}
            </h1>
            <div style={{ fontSize: 13, color: 'var(--slate-600)', lineHeight: 1.6 }}>
              {issuer?.branding?.companyAddress && <div>{issuer.branding.companyAddress}</div>}
              {issuer?.branding?.companyPhone && <div>Phone: {issuer.branding.companyPhone}</div>}
              <div>Email: {issuer?.email}</div>
            </div>
          </div>

          {/* Premium Logo / Standard Brand Identity */}
          <div>
            {isIssuerPremium && customLogo ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: logoPosition === 'top-right' ? 'flex-end' : 'flex-start' }}>
                <img
                  src={customLogo}
                  alt="Company Brand Logo"
                  className="brand-logo-img"
                />
                <span
                  className="role-pill premium no-print"
                  style={{ marginTop: 6, fontSize: 9 }}
                >
                  Custom Brand Logo ({logoPosition})
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, var(--primary-600), #7c3aed)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 16
                  }}
                >
                  N
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--slate-900)' }}>
                    the notary
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--slate-400)', textTransform: 'uppercase' }}>
                    Official Invoice
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Meta & Client "Billed To" Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: 32,
            marginBottom: 36
          }}
        >
          {/* Client Details */}
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--slate-400)',
                letterSpacing: '0.05em',
                marginBottom: 6
              }}
            >
              Billed To:
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--slate-900)', marginBottom: 4 }}>
              {invoice.clientId?.name || 'Valued Client'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--slate-600)', lineHeight: 1.6 }}>
              {invoice.clientId?.email && <div>{invoice.clientId.email}</div>}
              {invoice.clientId?.phone && <div>{invoice.clientId.phone}</div>}
              {invoice.clientId?.billingAddress && (
                <div>
                  {invoice.clientId.billingAddress.street && <div>{invoice.clientId.billingAddress.street}</div>}
                  {(invoice.clientId.billingAddress.city || invoice.clientId.billingAddress.state || invoice.clientId.billingAddress.zip) && (
                    <div>
                      {[
                        invoice.clientId.billingAddress.city,
                        invoice.clientId.billingAddress.state,
                        invoice.clientId.billingAddress.zip
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </div>
                  )}
                  {invoice.clientId.billingAddress.country && <div>{invoice.clientId.billingAddress.country}</div>}
                </div>
              )}
            </div>
          </div>

          {/* Invoice Specifics */}
          <div
            style={{
              backgroundColor: 'var(--slate-50)',
              padding: 20,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--slate-200)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13 }}>
              <span style={{ color: 'var(--slate-500)', fontWeight: 500 }}>Invoice Number:</span>
              <span style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{invoice.invoiceNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13 }}>
              <span style={{ color: 'var(--slate-500)', fontWeight: 500 }}>Status:</span>
              <StatusBadge status={invoice.status} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13 }}>
              <span style={{ color: 'var(--slate-500)', fontWeight: 500 }}>Issue Date:</span>
              <span style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                {new Date(invoice.issueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--slate-500)', fontWeight: 500 }}>Payment Due:</span>
              <span style={{ fontWeight: 700, color: invoice.status === 'overdue' ? 'var(--danger-text)' : 'var(--slate-900)' }}>
                {new Date(invoice.dueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Itemized Line Items Table */}
        <div style={{ marginBottom: 32 }}>
          <table className="data-table" style={{ border: '1px solid var(--slate-200)' }}>
            <thead>
              <tr>
                <th style={{ width: '50%' }}>Description</th>
                <th style={{ width: '15%', textAlign: 'center' }}>Qty</th>
                <th style={{ width: '15%', textAlign: 'right' }}>Unit Price</th>
                <th style={{ width: '20%', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 500, color: 'var(--slate-800)' }}>{item.description}</td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--slate-900)' }}>
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Notes Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 32, alignItems: 'start' }}>
          {/* Notes */}
          <div>
            {invoice.notes && (
              <div
                style={{
                  backgroundColor: 'var(--slate-50)',
                  padding: 16,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--slate-100)'
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--slate-400)', marginBottom: 4 }}>
                  Payment Notes & Instructions
                </div>
                <div style={{ fontSize: 13, color: 'var(--slate-600)', whiteSpace: 'pre-line' }}>
                  {invoice.notes}
                </div>
              </div>
            )}
          </div>

          {/* Breakdown Summary */}
          <div style={{ borderTop: '2px solid var(--slate-200)', paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
              <span style={{ color: 'var(--slate-600)' }}>Subtotal:</span>
              <span style={{ fontWeight: 600, color: 'var(--slate-800)' }}>{formatCurrency(invoice.subtotal)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
              <span style={{ color: 'var(--slate-600)' }}>Tax ({invoice.taxRate}%):</span>
              <span style={{ fontWeight: 600, color: 'var(--slate-800)' }}>{formatCurrency(invoice.taxAmount)}</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: 12,
                marginTop: 8,
                borderTop: '2px solid var(--slate-900)',
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--slate-900)'
              }}
            >
              <span>Total Due:</span>
              <span style={{ color: 'var(--primary-600)' }}>{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Invoice Footer Stamp */}
        <div
          style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: '1px solid var(--slate-100)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 11,
            color: 'var(--slate-400)'
          }}
        >
          <div>Thank you for choosing {issuer?.branding?.companyName || 'our services'}.</div>
          <div>Generated with the notary.app Invoicing Engine</div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailsPage;
