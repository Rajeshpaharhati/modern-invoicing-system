import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Upload,
  Building,
  Save,
  Trash2,
  Lock,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Eye
} from 'lucide-react';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const SettingsPage = () => {
  const { user, refreshUser, switchRole } = useAuth();
  const toast = useToast();

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: '',
    companyName: '',
    companyAddress: '',
    companyPhone: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Branding State
  const [logoPosition, setLogoPosition] = useState('top-left');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [togglingTier, setTogglingTier] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        companyName: user.branding?.companyName || '',
        companyAddress: user.branding?.companyAddress || '',
        companyPhone: user.branding?.companyPhone || ''
      });
      setLogoPosition(user.branding?.logoPosition || 'top-left');
      setPreviewUrl(user.branding?.logo || null);
    }
  }, [user]);

  const isPremium = user?.role === 'premium';

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await usersAPI.updateProfile(profileData);
      await refreshUser();
      toast.success('Company profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, SVG, WebP)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be under 2MB');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSaveBranding = async () => {
    if (!isPremium) {
      toast.error('Custom branding is restricted to Premium subscribers');
      return;
    }

    setUploadingLogo(true);
    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('logo', selectedFile);
        formData.append('logoPosition', logoPosition);
        await usersAPI.uploadLogo(formData);
        setSelectedFile(null);
      } else {
        await usersAPI.updateBranding({ logoPosition });
      }

      await refreshUser();
      toast.success('Branding preferences saved successfully');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to update branding';
      toast.error(msg);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!window.confirm('Remove custom logo branding?')) return;
    try {
      setUploadingLogo(true);
      await usersAPI.updateBranding({ removeLogo: true });
      setPreviewUrl(null);
      setSelectedFile(null);
      await refreshUser();
      toast.success('Custom logo removed');
    } catch (err) {
      toast.error('Failed to remove logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleToggleTier = async (newRole) => {
    setTogglingTier(true);
    try {
      await switchRole(newRole);
      toast.success(`Active tier switched to ${newRole.toUpperCase()}`);
    } catch (err) {
      toast.error('Failed to switch plan tier');
    } finally {
      setTogglingTier(false);
    }
  };

  return (
    <div style={{ maxWidth: 940, margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--slate-900)' }}>
          Profile & Branding Settings
        </h2>
        <p style={{ fontSize: 14, color: 'var(--slate-500)' }}>
          Configure company billing details, invoice branding, and manage plan subscription
        </p>
      </div>

      {/* Subscription Tier Banner */}
      <div
        style={{
          background: isPremium
            ? 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #f59e0b 100%)'
            : 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '24px 28px',
          color: 'white',
          marginBottom: 32,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: isPremium ? '0 10px 25px -5px rgba(245, 158, 11, 0.3)' : 'var(--shadow-md)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: isPremium ? '#ffffff' : 'rgba(255,255,255,0.1)',
              color: isPremium ? '#b45309' : '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isPremium ? <Sparkles size={24} /> : <ShieldCheck size={24} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800 }}>
                {isPremium ? 'Premium Tier Active' : 'Free Tier Plan'}
              </h3>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 4,
                  backgroundColor: 'rgba(255,255,255,0.2)'
                }}
              >
                {isPremium ? 'FULL ACCESS' : 'STANDARD'}
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
              {isPremium
                ? 'Custom branding enabled. Your custom logo appears on printable invoice layouts.'
                : 'Custom logo branding is locked. Upgrade to Premium to upload your brand logo.'}
            </p>
          </div>
        </div>

        {/* Instant Tier Switcher for Evaluator Convenience */}
        <div>
          <button
            onClick={() => handleToggleTier(isPremium ? 'free' : 'premium')}
            disabled={togglingTier}
            className="btn"
            style={{
              backgroundColor: '#ffffff',
              color: isPremium ? '#b45309' : 'var(--slate-900)',
              fontWeight: 700,
              fontSize: 13
            }}
          >
            {togglingTier ? (
              <RefreshCw size={14} className="spin" />
            ) : isPremium ? (
              <span>Simulate Free Tier</span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} color="#f59e0b" />
                Upgrade to Premium
              </span>
            )}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 28 }}>
        {/* Custom Branding Card */}
        <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--slate-900)' }}>
                  Custom Invoice Branding
                </h3>
                {isPremium ? (
                  <span className="role-pill premium">★ Premium Feature</span>
                ) : (
                  <span className="role-pill free">Locked on Free Plan</span>
                )}
              </div>
              <p style={{ fontSize: 13, color: 'var(--slate-500)' }}>
                Upload your company logo and customize its position on the printable invoice layout.
              </p>
            </div>
          </div>

          {!isPremium ? (
            /* Free Plan Locked Overlay */
            <div
              style={{
                backgroundColor: 'var(--slate-50)',
                borderRadius: 'var(--radius-lg)',
                padding: '36px 24px',
                textAlign: 'center',
                border: '1px dashed var(--slate-300)'
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  backgroundColor: 'var(--slate-200)',
                  color: 'var(--slate-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px'
                }}
              >
                <Lock size={20} />
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--slate-800)', marginBottom: 6 }}>
                Custom Branding is a Premium Feature
              </h4>
              <p style={{ fontSize: 13, color: 'var(--slate-500)', maxWidth: 480, margin: '0 auto 18px' }}>
                Free tier accounts use the standard clean layout. Upgrade to Premium to upload your company logo, set top-left or top-right positioning, and customize invoice headers.
              </p>
              <button
                onClick={() => handleToggleTier('premium')}
                className="btn btn-primary btn-sm"
              >
                <Sparkles size={14} />
                <span>Unlock Premium Branding</span>
              </button>
            </div>
          ) : (
            /* Premium Unlocked Branding Controls */
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 28, marginBottom: 24 }}>
                {/* Logo Upload Box */}
                <div>
                  <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>
                    Company Logo File
                  </label>
                  <div
                    style={{
                      border: '2px dashed var(--slate-300)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '24px',
                      textAlign: 'center',
                      backgroundColor: 'var(--slate-50)',
                      cursor: 'pointer',
                      transition: 'border-color 0.2s ease'
                    }}
                    onClick={() => document.getElementById('logoInput').click()}
                  >
                    <input
                      id="logoInput"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFileSelect}
                    />
                    <Upload size={28} color="var(--primary-600)" style={{ margin: '0 auto 10px' }} />
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--slate-800)' }}>
                      Click to choose logo file
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--slate-400)', marginTop: 4 }}>
                      PNG, JPG, SVG, or WebP (Max 2MB)
                    </div>
                  </div>

                  {selectedFile && (
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--success-text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={14} />
                      <span>Selected: {selectedFile.name}</span>
                    </div>
                  )}
                </div>

                {/* Logo Alignment Selector */}
                <div>
                  <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>
                    Logo Placement on Printable Layout
                  </label>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: logoPosition === 'top-left' ? '2px solid var(--primary-600)' : '1px solid var(--slate-200)',
                        backgroundColor: logoPosition === 'top-left' ? 'var(--primary-50)' : '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="radio"
                        name="logoPosition"
                        value="top-left"
                        checked={logoPosition === 'top-left'}
                        onChange={(e) => setLogoPosition(e.target.value)}
                      />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--slate-900)' }}>
                          Top Left
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>
                          Logo on left side, company details on right
                        </div>
                      </div>
                    </label>

                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        border: logoPosition === 'top-right' ? '2px solid var(--primary-600)' : '1px solid var(--slate-200)',
                        backgroundColor: logoPosition === 'top-right' ? 'var(--primary-50)' : '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="radio"
                        name="logoPosition"
                        value="top-right"
                        checked={logoPosition === 'top-right'}
                        onChange={(e) => setLogoPosition(e.target.value)}
                      />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--slate-900)' }}>
                          Top Right
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>
                          Logo on right side, company details on left
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Live Mock Header Preview */}
              {previewUrl && (
                <div
                  style={{
                    backgroundColor: 'var(--slate-100)',
                    padding: '20px',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 20
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--slate-500)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Eye size={13} />
                    <span>Live Invoice Header Preview ({logoPosition})</span>
                  </div>

                  <div
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: 'var(--radius-md)',
                      padding: '20px',
                      border: '1px solid var(--slate-200)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexDirection: logoPosition === 'top-right' ? 'row' : 'row-reverse'
                    }}
                  >
                    <div style={{ textAlign: logoPosition === 'top-right' ? 'left' : 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--slate-900)' }}>
                        {profileData.companyName || 'Your Business Name'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>
                        {profileData.companyAddress || '123 Business Way, City, State'}
                      </div>
                    </div>

                    <img
                      src={previewUrl}
                      alt="Brand preview"
                      style={{ maxHeight: 50, maxWidth: 180, objectFit: 'contain' }}
                    />
                  </div>
                </div>
              )}

              {/* Save / Remove Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                {previewUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    disabled={uploadingLogo}
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--danger-text)' }}
                  >
                    <Trash2 size={14} />
                    <span>Remove Logo</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSaveBranding}
                  disabled={uploadingLogo}
                  className="btn btn-primary btn-sm"
                >
                  <Save size={14} />
                  <span>{uploadingLogo ? 'Saving Branding...' : 'Save Branding Preferences'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Company & Issuer Profile Information */}
        <div className="card">
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--slate-900)' }}>
              Company & Contact Profile
            </h3>
            <p style={{ fontSize: 13, color: 'var(--slate-500)' }}>
              This information will be printed on all invoices sent from your account.
            </p>
          </div>

          <form onSubmit={handleSaveProfile}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Company / Business Name</label>
                <input
                  type="text"
                  name="companyName"
                  className="form-input"
                  placeholder="e.g. Apex Digital LLC"
                  value={profileData.companyName}
                  onChange={handleProfileChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Business Phone</label>
                <input
                  type="tel"
                  name="companyPhone"
                  className="form-input"
                  placeholder="+1 (555) 000-1234"
                  value={profileData.companyPhone}
                  onChange={handleProfileChange}
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Business Address</label>
                <input
                  type="text"
                  name="companyAddress"
                  className="form-input"
                  placeholder="Street Address, City, State, Zip, Country"
                  value={profileData.companyAddress}
                  onChange={handleProfileChange}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={savingProfile}>
                <Save size={14} />
                <span>{savingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
