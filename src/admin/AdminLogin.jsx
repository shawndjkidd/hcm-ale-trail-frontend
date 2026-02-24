import { useState } from 'react';
import { adminLogin } from './adminApi';

export default function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await adminLogin(email.trim(), password);
    
    if (result.ok) {
      onLoginSuccess();
    } else {
      setError(result.error || 'Login failed');
    }
    
    setLoading(false);
  };

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        {/* HCM Ale Trail Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img 
            src="/logos/HCM Logo-Ale-Trail-2023-BK.png" 
            alt="HCM Ale Trail" 
            style={{ 
              maxWidth: 200, 
              height: 'auto',
              filter: 'var(--admin-logo-filter, none)'
            }}
          />
        </div>
        
        <h1 className="admin-login-title">Admin Dashboard</h1>
        <p className="admin-login-subtitle">Sign in to manage the trail</p>

        <form onSubmit={handleSubmit}>
          {error && <div className="admin-error">{error}</div>}

          <div className="admin-form-group">
            <label className="admin-form-label">Email</label>
            <input
              type="email"
              className="admin-form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@aletrail.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Password</label>
            <input
              type="password"
              className="admin-form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            className="admin-btn admin-btn-primary"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}