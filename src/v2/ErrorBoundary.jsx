import { Component } from 'react';
import { useV } from './i18n';

// Last line of defence: if any screen throws while drawing, show a friendly reload
// screen (in the guest's language) instead of a blank white page.
export default class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { try { console.error('App error:', error); } catch {} }
  render() {
    if (!this.state.failed) return this.props.children;
    let lang = 'en';
    try { lang = localStorage.getItem('hcm-language') || 'en'; } catch {}
    const v = useV(lang);
    return (
      <div role="alert" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#C8102E', color: '#fff', fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
        <div style={{ maxWidth: 340 }}>
          <h1 style={{ fontSize: '1.8rem', margin: '0 0 10px' }}>{v.crashTitle || 'Something went wrong'}</h1>
          <p style={{ margin: '0 0 20px', fontSize: '1.05rem' }}>{v.crashBody || 'Your stamps are safe. Reload to carry on.'}</p>
          <button type="button" onClick={() => window.location.reload()}
            style={{ background: '#FFD100', color: '#111', border: '3px solid #111', padding: '12px 28px', fontWeight: 800, fontSize: '1rem', cursor: 'pointer' }}>
            {v.reload || 'Reload'}
          </button>
        </div>
      </div>
    );
  }
}
