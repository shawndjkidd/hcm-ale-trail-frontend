import { useState } from 'react';
import { storeLoginTokens } from '../lib/api';
import { supabase } from '../lib/supabase';
import { useV } from './i18n';
import { LOGO_WHITE } from './ui';
import { passkeySupported, passkeySignIn } from './passkey';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
    <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05" />
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
  </svg>
);

async function postJSON(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => null);
  return { res, data };
}

export default function SignIn({ language, initialMode = 'signup', reason, onSuccess, onClose }) {
  const v = useV(language);
  const [mode, setMode] = useState(initialMode); // 'signup' | 'login' | 'forgot'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [info, setInfo] = useState('');

  const switchTo = (m) => { setMode(m); setErr(''); setInfo(''); setConfirm(''); };

  const google = async () => {
    setBusy(true); setErr('');
    try {
      // Come back to the page the person was on (e.g. the brewery they were checking in at)
      await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + window.location.pathname } });
    } catch (e) { setErr(e?.message || 'Google sign-in failed'); setBusy(false); }
  };

  const login = async () => {
    const { res, data } = await postJSON('/api/auth/login', { email: email.trim(), password });
    if (!res.ok || !data?.ok) { setErr(res.status === 401 || res.status === 400 ? v.errLogin : data?.error || v.errLogin); return false; }
    storeLoginTokens(data);
    onSuccess?.(data);
    return true;
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setInfo('');
    if (mode === 'forgot') {
      if (!email.trim()) return setErr(v.errFill);
      setBusy(true);
      const { res, data } = await postJSON('/api/auth/forgot-password', { email: email.trim() }).catch(() => ({ res: { ok: false } }));
      setBusy(false);
      if (!res.ok || !data?.ok) return setErr(data?.error || v.errFill);
      return setInfo(v.resetSent);
    }
    if (!email.trim() || !password || (mode === 'signup' && !name.trim())) return setErr(v.errFill);
    if (mode === 'signup') {
      if (password.length < 8) return setErr(v.errPwShort);
      if (password !== confirm) return setErr(v.errMismatch);
    }
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { res, data } = await postJSON('/api/auth/register', { email: email.trim(), password, name: name.trim() });
        if (!res.ok || !data?.ok) { setErr(res.status === 409 ? v.errExists : data?.error || v.errFill); return; }
        localStorage.setItem('hcm-onboarding-profile', JSON.stringify({ display_name: name.trim() }));
        const ok = await login();
        if (!ok) { setInfo(v.accountCreated); switchTo('login'); }
      } else {
        await login();
      }
    } catch (e2) {
      setErr(e2?.message || v.errLogin);
    } finally {
      setBusy(false);
    }
  };

  const withPasskey = async () => {
    setBusy(true); setErr('');
    const res = await passkeySignIn();
    setBusy(false);
    if (res.ok) onSuccess?.({ user: res.user });
    else if (res.code !== 'ERROR_CEREMONY_ABORTED' && !/abort|cancel/i.test(res.error || '')) setErr(res.error || v.errLogin);
  };

  const title = mode === 'signup' ? v.siUp : mode === 'login' ? v.siIn : v.siForgot;

  return (
    <div className="v2-full v2-welcome" role="dialog" aria-modal="true" aria-label={title} style={{ zIndex: 110 }}>
      <form className="wrap" onSubmit={submit} noValidate>
        <div className="top">
          <img src={LOGO_WHITE} alt="Ho Chi Minh Ale Trail" style={{ height: 34 }} />
          <span className="spacer" />
          <button type="button" className="round-btn" onClick={onClose} aria-label={v.close}>✕</button>
        </div>
        <h1 className="display" style={{ fontSize: '2.6rem', color: 'var(--yellow)', textShadow: '3px 3px 0 var(--ink)' }}>{title}</h1>
        {reason && mode !== 'forgot' && <p style={{ fontWeight: 600, marginTop: -8 }}>{reason}</p>}

        {mode !== 'forgot' && (
          <>
            <button type="button" className="btn plain block" onClick={google} disabled={busy}
              style={{ fontFamily: 'var(--body)', textTransform: 'none', fontWeight: 800, fontSize: '1rem', letterSpacing: 0 }}>
              <GoogleIcon /> {v.google}
            </button>
            {mode === 'login' && passkeySupported() && (
              <button type="button" className="btn ink block" onClick={withPasskey} disabled={busy}
                style={{ fontFamily: 'var(--body)', textTransform: 'none', fontWeight: 800, fontSize: '1rem', letterSpacing: 0, boxShadow: 'none', borderColor: '#fff' }}>
                {v.passkeySignIn}
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '.8rem', fontWeight: 700, opacity: .9 }}>
              <span style={{ flex: 1, height: 2, background: 'rgba(255,255,255,.4)' }} />{v.orEmail}<span style={{ flex: 1, height: 2, background: 'rgba(255,255,255,.4)' }} />
            </div>
          </>
        )}

        {mode === 'signup' && (
          <div className="v2-field"><label htmlFor="si-name">{v.nameLabel}</label>
            <input id="si-name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></div>
        )}
        <div className="v2-field"><label htmlFor="si-email">{v.emailLabel}</label>
          <input id="si-email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        {mode !== 'forgot' && (
          <div className="v2-field"><label htmlFor="si-pw">{v.passwordLabel}</label>
            <input id="si-pw" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        )}
        {mode === 'signup' && (
          <div className="v2-field"><label htmlFor="si-pw2">{v.confirmLabel}</label>
            <input id="si-pw2" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
        )}
        {mode === 'login' && (
          <button type="button" className="link-btn" style={{ alignSelf: 'flex-end', marginTop: -6 }} onClick={() => switchTo('forgot')}>{v.forgotLink}</button>
        )}

        {err && <p role="alert" style={{ background: 'var(--ink)', color: '#FFB3BE', padding: '8px 10px', fontWeight: 700 }}>{err}</p>}
        {info && <p role="status" style={{ background: 'var(--ink)', color: 'var(--yellow)', padding: '8px 10px', fontWeight: 700 }}>{info}</p>}

        <button type="submit" className="btn block" disabled={busy} style={{ marginTop: 4 }}>
          {mode === 'signup' ? v.createAccount : mode === 'login' ? v.signInBtn : v.sendReset}
        </button>
        <button type="button" className="link-btn" style={{ alignSelf: 'center' }}
          onClick={() => switchTo(mode === 'signup' ? 'login' : mode === 'login' ? 'signup' : 'login')}>
          {mode === 'signup' ? v.toSignIn : mode === 'login' ? v.toSignUp : v.backToSignIn}
        </button>
      </form>
    </div>
  );
}
