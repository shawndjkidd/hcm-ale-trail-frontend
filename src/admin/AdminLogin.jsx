import { useEffect, useState } from 'react';
import { adminLogin, adminForgotPassword, adminPasskeysAvailable, adminPasskeySignIn } from './adminApi';

export default function AdminLogin({ onLoginSuccess, notice = '' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'forgot'
  const [info, setInfo] = useState('');
  const [passkeys, setPasskeys] = useState(false);
  useEffect(() => { adminPasskeysAvailable().then(setPasskeys); }, []);

  const handleForgot = async (e) => {
    e.preventDefault();
    setError(''); setInfo('');
    if (!email.trim()) { setError('Type your email first'); return; }
    setLoading(true);
    const r = await adminForgotPassword(email.trim());
    setLoading(false);
    // Same message whether or not the email exists, so nobody can probe for accounts.
    if (r.ok) setInfo('If that email has a dashboard login, a reset link is on its way. Check your inbox (and spam).');
    else setError(r.error || 'Could not send the email. Please try again.');
  };

  const handlePasskey = async () => {
    setError(''); setInfo('');
    setLoading(true);
    const r = await adminPasskeySignIn(rememberMe);
    setLoading(false);
    if (r.ok) onLoginSuccess();
    else if (!/abort|cancel|not ?allowed/i.test(`${r.code || ''} ${r.error || ''}`)) setError(r.error || 'Passkey sign-in failed');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await adminLogin(email.trim(), password, rememberMe);

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
        {notice && <div role="alert" style={{ margin: '0 0 16px', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--admin-primary)', fontWeight: 600, fontSize: 14 }}>{notice}</div>}

        {mode === 'forgot' ? (
          <form onSubmit={handleForgot}>
            {error && <div className="admin-error">{error}</div>}
            {info && <div role="status" style={{ margin: '0 0 16px', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--admin-success)', fontSize: 14 }}>{info}</div>}
            <p style={{ color: 'var(--admin-text-muted)', fontSize: 14, margin: '0 0 14px' }}>Type the email you sign in with and we'll email you a link to set a new password.</p>
            <div className="admin-form-group">
              <label className="admin-form-label" htmlFor="forgot-email">Email</label>
              <input id="forgot-email" type="email" className="admin-form-input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={loading}>{loading ? 'Sending…' : 'Email me a reset link'}</button>
            <button type="button" className="admin-btn" onClick={() => { setMode('login'); setError(''); setInfo(''); }}
              style={{ marginTop: 10, background: 'transparent', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}>Back to sign in</button>
          </form>
        ) : (
        <form onSubmit={handleSubmit}>
          {error && <div className="admin-error">{error}</div>}

          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              className="admin-form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@aletrail.app"
              required
              autoComplete="username webauthn"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              className="admin-form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <label className="admin-remember-label">
            <input
              type="checkbox"
              className="admin-remember-checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span className="admin-remember-box" />
            <span>Remember me for 30 days</span>
          </label>

          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          {passkeys && (
            <button type="button" className="admin-btn" onClick={handlePasskey} disabled={loading}
              style={{ marginTop: 10, background: 'transparent', border: '1px solid var(--admin-border)', color: 'var(--admin-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="4" /><path d="M2 21c0-3.9 3.1-7 7-7 1.4 0 2.7.4 3.8 1.1" /><circle cx="18" cy="14" r="2.5" /><path d="M18 16.5V22m0-2.5h2" /></svg>
              Sign in with a passkey
            </button>
          )}
          <button type="button" onClick={() => { setMode('forgot'); setError(''); setInfo(''); }}
            style={{ marginTop: 14, background: 'none', border: 0, color: 'var(--admin-text-muted)', textDecoration: 'underline', cursor: 'pointer', fontSize: 14, width: '100%' }}>
            Forgot password?
          </button>
        </form>
        )}
      </div>
    </div>
  );
}
