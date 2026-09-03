import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save } from 'lucide-react';
import { clientsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

const ClientModal = ({ isOpen, onClose, onClientSaved, clientToEdit = null }) => {
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (clientToEdit) {
      setFormData({
        name: clientToEdit.name || '',
        email: clientToEdit.email || '',
        phone: clientToEdit.phone || '',
        street: clientToEdit.billingAddress?.street || '',
        city: clientToEdit.billingAddress?.city || '',
        state: clientToEdit.billingAddress?.state || '',
        zip: clientToEdit.billingAddress?.zip || '',
        country: clientToEdit.billingAddress?.country || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        country: ''
      });
    }
    setErrors({});
  }, [clientToEdit, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Client name is required';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      errs.email = 'Please provide a valid email';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        billingAddress: {
          street: formData.street.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          zip: formData.zip.trim(),
          country: formData.country.trim()
        }
      };

      if (clientToEdit) {
        const res = await clientsAPI.update(clientToEdit._id, payload);
        toast.success('Client updated successfully');
        onClientSaved(res.data.data);
      } else {
        const res = await clientsAPI.create(payload);
        toast.success('Client created successfully');
        onClientSaved(res.data.data);
      }
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to save client';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--slate-100)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-50)',
                color: 'var(--primary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <UserPlus size={18} />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--slate-900)' }}>
              {clientToEdit ? 'Edit Client Details' : 'Add New Client'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--slate-400)',
              cursor: 'pointer',
              padding: 4
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div className="form-group">
            <label className="form-label">Client / Business Name *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="e.g. Acme Corporation"
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && (
              <span style={{ fontSize: 12, color: 'var(--danger-text)' }}>
                {errors.name}
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="billing@acme.com"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <span style={{ fontSize: 12, color: 'var(--danger-text)' }}>
                  {errors.email}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="phone"
                className="form-input"
                placeholder="+1 (555) 012-3456"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ marginTop: 10, marginBottom: 8, fontSize: 13, fontWeight: 700, color: 'var(--slate-700)' }}>
            Billing Address
          </div>

          <div className="form-group">
            <label className="form-label">Street Address</label>
            <input
              type="text"
              name="street"
              className="form-input"
              placeholder="123 Corporate Blvd, Suite 400"
              value={formData.street}
              onChange={handleChange}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                name="city"
                className="form-input"
                placeholder="San Francisco"
                value={formData.city}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">State</label>
              <input
                type="text"
                name="state"
                className="form-input"
                placeholder="CA"
                value={formData.state}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Zip</label>
              <input
                type="text"
                name="zip"
                className="form-input"
                placeholder="94105"
                value={formData.zip}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Country</label>
            <input
              type="text"
              name="country"
              className="form-input"
              placeholder="United States"
              value={formData.country}
              onChange={handleChange}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
              marginTop: 20,
              paddingTop: 16,
              borderTop: '1px solid var(--slate-100)'
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={16} />
              <span>{loading ? 'Saving...' : clientToEdit ? 'Save Changes' : 'Create Client'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientModal;
