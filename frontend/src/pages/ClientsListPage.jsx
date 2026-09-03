import React, { useState, useEffect, useCallback } from 'react';
import {
  UserPlus,
  Search,
  Mail,
  Phone,
  MapPin,
  Edit2,
  Trash2,
  Users,
  FileText
} from 'lucide-react';
import { clientsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import ClientModal from '../components/ClientModal';

const ClientsListPage = () => {
  const toast = useToast();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const res = await clientsAPI.getAll(searchQuery);
      setClients(res.data.data);
    } catch (err) {
      toast.error('Failed to load clients list');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchClients]);

  const handleOpenCreate = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete client "${name}"?`)) return;

    try {
      await clientsAPI.delete(id);
      toast.success(`Client "${name}" deleted`);
      fetchClients();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to delete client';
      toast.error(msg);
    }
  };

  const handleClientSaved = () => {
    fetchClients();
  };

  return (
    <div>
      {/* Header */}
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
            Client Management
          </h2>
          <p style={{ fontSize: 14, color: 'var(--slate-500)' }}>
            Manage client directory, contact details, and billing addresses
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn btn-primary">
          <UserPlus size={16} />
          <span>Add New Client</span>
        </button>
      </div>

      {/* Search & Statistics Bar */}
      <div className="card" style={{ marginBottom: 24, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search clients by name, email, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: 34 }}
            />
            <Search
              size={15}
              color="var(--slate-400)"
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>

          <div style={{ fontSize: 13, color: 'var(--slate-500)' }}>
            Showing <strong>{clients.length}</strong> client{clients.length === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {/* Clients Grid */}
      {loading ? (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--slate-400)' }}>
          Loading clients directory...
        </div>
      ) : clients.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Users size={48} color="var(--slate-300)" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--slate-800)', marginBottom: 6 }}>
            No clients found
          </h3>
          <p style={{ fontSize: 14, color: 'var(--slate-500)', marginBottom: 20 }}>
            {searchQuery
              ? `No clients matched your search query "${searchQuery}".`
              : 'Add your first client to start generating invoices.'}
          </p>
          <button onClick={handleOpenCreate} className="btn btn-primary btn-sm">
            <UserPlus size={14} />
            <span>Add Client</span>
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 20
          }}
        >
          {clients.map((client) => {
            const hasAddress =
              client.billingAddress?.city ||
              client.billingAddress?.state ||
              client.billingAddress?.country;

            return (
              <div key={client._id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 'var(--radius-md)',
                        background: 'linear-gradient(135deg, var(--primary-50), var(--primary-100))',
                        color: 'var(--primary-700)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 16
                      }}
                    >
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--slate-900)' }}>
                        {client.name}
                      </h4>
                      <span style={{ fontSize: 11, color: 'var(--slate-400)' }}>
                        Added {new Date(client.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={() => handleOpenEdit(client)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 8px' }}
                      title="Edit client"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(client._id, client.name)}
                      className="btn btn-sm"
                      style={{
                        padding: '4px 8px',
                        background: 'none',
                        border: '1px solid var(--slate-200)',
                        color: 'var(--slate-400)',
                        cursor: 'pointer'
                      }}
                      title="Delete client"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: 13, color: 'var(--slate-600)', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Mail size={14} color="var(--slate-400)" />
                    <a
                      href={`mailto:${client.email}`}
                      style={{ color: 'var(--slate-700)', textDecoration: 'none' }}
                    >
                      {client.email}
                    </a>
                  </div>

                  {client.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Phone size={14} color="var(--slate-400)" />
                      <span>{client.phone}</span>
                    </div>
                  )}

                  {hasAddress && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <MapPin size={14} color="var(--slate-400)" style={{ marginTop: 2, flexShrink: 0 }} />
                      <span>
                        {[
                          client.billingAddress?.street,
                          client.billingAddress?.city,
                          client.billingAddress?.state,
                          client.billingAddress?.zip,
                          client.billingAddress?.country
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    marginTop: 16,
                    paddingTop: 12,
                    borderTop: '1px solid var(--slate-100)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontSize: 12, color: 'var(--slate-400)' }}>Client ID: {client._id.slice(-6)}</span>
                  <a
                    href={`/invoices?clientId=${client._id}`}
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--primary-600)',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <FileText size={12} />
                    <span>View Invoices</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Client Modal */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onClientSaved={handleClientSaved}
        clientToEdit={editingClient}
      />
    </div>
  );
};

export default ClientsListPage;
