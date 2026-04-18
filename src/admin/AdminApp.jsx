import { useState, useEffect, useRef } from 'react';
import { getAdminMe, adminLogout, changeAdminPassword } from './adminApi';
import AdminLogin from './AdminLogin';
import HQDashboard from './HQDashboard';
import BreweryDashboard from './BreweryDashboard';
import './admin.css';

export default function AdminApp() {
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState(null);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('admin-theme') || 'dark';
  });
  const [currentView, setCurrentView] = useState('dashboard');

  // Profile dropdown
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  // Change password modal
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('admin-theme', theme);
  }, [theme]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showProfileMenu) return;
    function handleClick(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showProfileMenu]);

  const checkAuth = async () => {
    setLoading(true);
    const result = await getAdminMe();
    if (result.ok && result.isAdmin) {
      setAdminUser(result);
    } else {
      setAdminUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = () => {
    adminLogout();
    setAdminUser(null);
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const openChangePwd = () => {
    setShowProfileMenu(false);
    setPwdCurrent('');
    setPwdNew('');
    setPwdConfirm('');
    setPwdError('');
    setPwdSuccess(false);
    setShowChangePwd(true);
  };

  const handleChangePwd = async () => {
    setPwdError('');
    if (!pwdCurrent) { setPwdError('Current password is required'); return; }
    if (!pwdNew) { setPwdError('New password is required'); return; }
    if (pwdNew.length < 8) { setPwdError('New password must be at least 8 characters'); return; }
    if (pwdNew !== pwdConfirm) { setPwdError('Passwords do not match'); return; }
    setPwdSaving(true);
    const result = await changeAdminPassword(pwdCurrent, pwdNew);
    if (result.ok) {
      setPwdSuccess(true);
      setTimeout(() => setShowChangePwd(false), 1800);
    } else {
      setPwdError(result.error || 'Failed to update password');
    }
    setPwdSaving(false);
  };

  if (loading) {
    return (
      <div className="admin-app">
        <div className="admin-loading">
          <div className="admin-spinner" />
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return (
      <div className="admin-app">
        <AdminLogin onLoginSuccess={checkAuth} />
      </div>
    );
  }

  const isHQ = adminUser.primaryRole === 'super_admin' || adminUser.primaryRole === 'management';
  const isBreweryUser = adminUser.primaryRole === 'brewery_admin';
  const staffRole = adminUser.staffRole ?? null;

  const roleLabel =
    adminUser.primaryRole === 'super_admin' ? 'Super Admin' :
    adminUser.primaryRole === 'management'  ? 'Management' :
    staffRole ? staffRole.charAt(0).toUpperCase() + staffRole.slice(1) :
    (adminUser.primaryRole || '').replace(/_/g, ' ');

  return (
    <div className="admin-app">
      <header className="admin-header">
        <div className="admin-header-left">
          <span className="admin-logo">Ho Chi Minh Ale Trail Admin</span>

          {isHQ && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className={`admin-quick-filter ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentView('dashboard')}
              >
                HQ Overview
              </button>
              <button
                className={`admin-quick-filter ${currentView === 'brewery' ? 'active' : ''}`}
                onClick={() => setCurrentView('brewery')}
              >
                Brewery View
              </button>
            </div>
          )}
        </div>

        <div className="admin-header-right">
          <button className="admin-theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {/* Profile dropdown */}
          <div className="admin-profile-wrap" ref={profileMenuRef}>
            <button
              className="admin-profile-btn"
              onClick={() => setShowProfileMenu(v => !v)}
            >
              <span className="admin-user-info">{adminUser.email}</span>
              <span className="admin-user-role">{roleLabel}</span>
              <span className="admin-profile-caret">{showProfileMenu ? '▲' : '▼'}</span>
            </button>

            {showProfileMenu && (
              <div className="admin-profile-menu">
                <button
                  className="admin-profile-menu-item"
                  onClick={openChangePwd}
                >
                  Change Password
                </button>
                <div className="admin-profile-menu-divider" />
                <button
                  className="admin-profile-menu-item admin-profile-menu-item--danger"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {isBreweryUser && (
        <BreweryDashboard
          breweryId={adminUser.breweryId}
          adminEmail={adminUser.email}
          staffRole={staffRole}
        />
      )}

      {isHQ && currentView === 'dashboard' && (
        <HQDashboard adminEmail={adminUser.email} />
      )}

      {isHQ && currentView === 'brewery' && (
        <BreweryDashboard isHQ={true} staffRole="owner" />
      )}

      {/* Change Password Modal */}
      {showChangePwd && (
        <div className="admin-modal-backdrop" onMouseDown={() => !pwdSaving && setShowChangePwd(false)}>
          <div className="admin-modal" onMouseDown={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-modal-title">Change Password</div>
              <button className="admin-btn-ghost" onClick={() => !pwdSaving && setShowChangePwd(false)}>✕</button>
            </div>
            <div className="admin-modal-body">
              {pwdSuccess ? (
                <div style={{
                  textAlign: 'center',
                  padding: '20px 0',
                  color: 'var(--admin-success-light)',
                  fontWeight: 700,
                  fontSize: 16,
                }}>
                  ✓ Password updated successfully
                </div>
              ) : (
                <div className="admin-form">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Current Password</label>
                    <input
                      className="admin-form-input"
                      type="password"
                      value={pwdCurrent}
                      onChange={e => setPwdCurrent(e.target.value)}
                      autoFocus
                      disabled={pwdSaving}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">New Password</label>
                    <input
                      className="admin-form-input"
                      type="password"
                      value={pwdNew}
                      onChange={e => setPwdNew(e.target.value)}
                      disabled={pwdSaving}
                      onKeyDown={e => e.key === 'Enter' && handleChangePwd()}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Confirm New Password</label>
                    <input
                      className="admin-form-input"
                      type="password"
                      value={pwdConfirm}
                      onChange={e => setPwdConfirm(e.target.value)}
                      disabled={pwdSaving}
                      onKeyDown={e => e.key === 'Enter' && handleChangePwd()}
                    />
                  </div>
                  {pwdError && <div className="admin-error">{pwdError}</div>}
                  <div className="admin-form-actions">
                    <button className="admin-btn" onClick={() => setShowChangePwd(false)} disabled={pwdSaving}>
                      Cancel
                    </button>
                    <button className="admin-btn admin-btn-primary settings-btn" onClick={handleChangePwd} disabled={pwdSaving}>
                      {pwdSaving ? 'Updating…' : 'Update Password'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
