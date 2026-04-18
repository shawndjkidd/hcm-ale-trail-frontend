import { useState, useEffect } from 'react';
import { getAdminMe, adminLogout } from './adminApi';
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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('admin-theme', theme);
  }, [theme]);

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
  const staffRole = adminUser.staffRole ?? null; // 'owner' | 'manager' | 'staff' | null

  // Brewery staff users with no admin_access entry
  const isStaffOnly = isBreweryUser && !adminUser.roles?.some(r => r.role === 'super_admin' || r.role === 'management');

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
          <span className="admin-user-info">{adminUser.email}</span>
          <span className="admin-user-role">{roleLabel}</span>
          <button className="admin-theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button className="admin-logout-btn" onClick={handleLogout}>
            Logout
          </button>
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
    </div>
  );
}
