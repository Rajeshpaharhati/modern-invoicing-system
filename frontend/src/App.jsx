import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

import DashboardPage from './pages/DashboardPage';
import InvoicesListPage from './pages/InvoicesListPage';
import InvoiceCreatePage from './pages/InvoiceCreatePage';
import InvoiceDetailsPage from './pages/InvoiceDetailsPage';
import ClientsListPage from './pages/ClientsListPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Protected layout wrapper
const ProtectedLayout = ({ children, title }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--slate-50)',
          color: 'var(--slate-500)',
          fontSize: 14
        }}
      >
        Authenticating session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-wrapper">
        <Navbar title={title} />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
};

const App = () => {
  const { isAuthenticated, loading } = useAuth();

  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route
        path="/login"
        element={
          !loading && isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
        }
      />
      <Route
        path="/register"
        element={
          !loading && isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />
        }
      />

      {/* Protected Invoicing Application Routes */}
      <Route
        path="/"
        element={
          <ProtectedLayout title="Executive Overview">
            <DashboardPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/invoices"
        element={
          <ProtectedLayout title="Invoices">
            <InvoicesListPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/invoices/new"
        element={
          <ProtectedLayout title="New Invoice">
            <InvoiceCreatePage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/invoices/:id"
        element={
          <ProtectedLayout title="Invoice Preview & Print">
            <InvoiceDetailsPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/clients"
        element={
          <ProtectedLayout title="Clients Directory">
            <ClientsListPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedLayout title="Profile & Custom Branding">
            <SettingsPage />
          </ProtectedLayout>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
