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
    return localStorage.getItem('admin-theme') || 'light';
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
  const isBreweryAdmin = adminUser.primaryRole === 'brewery_admin';

  return (
    <div className="admin-app">
      <header className="admin-header">
        <div className="admin-header-left">
          <span className="admin-logo">🍺 Ale Trail Admin</span>
          
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
          <span className="admin-user-role">{adminUser.primaryRole}</span>
          <button className="admin-theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button className="admin-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {isBreweryAdmin && (
        <BreweryDashboard breweryId={adminUser.breweryId} />
      )}
      
      {isHQ && currentView === 'dashboard' && (
        <HQDashboard />
      )}
      
      {isHQ && currentView === 'brewery' && (
        <BreweryDashboard isHQ={true} />
      )}
    </div>
  );
}