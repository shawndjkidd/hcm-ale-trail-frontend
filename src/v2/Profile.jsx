import { useState } from 'react';
import translations from '../translations';
import { changePassword, changeEmail, deleteAccount } from '../lib/api';
import { useV, fmt, shortDate } from './i18n';
import { Sheet, Seg } from './ui';
import { formatClock, personalityFor } from './util';

const LANGS = [{ value: 'en', label: 'EN' }, { value: 'vn', label: 'VI' }, { value: 'kr', label: 'KO' }, { value: 'jp', label: 'JA' }];

export default function Profile({
  user, userMe, profile, stampsCount, total, beersCount, bestMs, language, setLanguage, nightMode, toggleNightMode,
  onBack, onEditTaste, onLogout, onDeleted, passkey,
}) {
  const v = useV(language);
  const t = translations[language] || translations.en;
  const [open, setOpen] = useState(null); // 'email' | 'password' | 'delete'
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState({ cur: '', next: '', confirm: '' });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const personality = personalityFor(profile);
  const name = profile?.display_name || (user?.email || '').split('@')[0] || '—';
  const since = userMe?.created_at ? shortDate(userMe.created_at, language) : null;
  const glassColor = personality?.color || '#F2C230';

  const submitEmail = async () => {
    setBusy(true); setMsg(null);
    const res = await changeEmail(email.trim());
    setBusy(false);
    setMsg(res?.ok ? { ok: true, text: v.emailChangeSent } : { ok: false, text: res?.error || t.error || 'Error' });
  };
  const submitPw = async () => {
    setMsg(null);
    if (pw.next.length < 8) return setMsg({ ok: false, text: t.passwordTooShort || 'Password must be at least 8 characters.' });
    if (pw.next !== pw.confirm) return setMsg({ ok: false, text: t.passwordMismatch || 'Passwords do not match.' });
    setBusy(true);
    const res = await changePassword(pw.cur, pw.next);
    setBusy(false);
    setMsg(res?.ok ? { ok: true, text: t.passwordUpdated || 'Password updated.' } : { ok: false, text: res?.error || 'Error' });
    if (res?.ok) setPw({ cur: '', next: '', confirm: '' });
  };
  const submitDelete = async () => {
    setBusy(true); setMsg(null);
    const res = await deleteAccount();
    setBusy(false);
    if (res?.ok) onDeleted?.();
    else setMsg({ ok: false, text: v.deleteFailed });
  };

  return (
    <div>
      <div className="v2-profile-head">
        <div className="inner">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button type="button" className="round-btn" onClick={onBack} aria-label={v.back}>←</button>
            <span style={{ flex: 1 }} />
            <span style={{ fontWeight: 700 }}>{v.profile}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="v2-avatar"><i className="glass" style={{ background: glassColor, width: 30, height: 40 }} /></div>
            <div style={{ minWidth: 0 }}>
              <div className="display" style={{ fontSize: '1.9rem' }}>{name}</div>
              <div style={{ fontSize: '.85rem' }}>
                {personality ? v[personality.key] : ''}{since ? `${personality ? ' · ' : ''}${since}` : ''}
              </div>
            </div>
          </div>
          <div className="v2-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div><b>{stampsCount}/{total}</b><span>{v.stampsLabel}</span></div>
            <div><b>{beersCount}</b><span>{v.beersLabel}</span></div>
            <div><b style={{ fontSize: bestMs ? '1.1rem' : undefined }}>{bestMs ? formatClock(bestMs, false) : '—'}</b><span>{v.bestTime}</span></div>
          </div>
        </div>
      </div>

      <div className="v2-screen no-tabs" style={{ paddingTop: 18 }}>
        <div className="eyebrow">{v.account}</div>
        <div className="v2-list">
          <button type="button" className="li" onClick={() => { setOpen('email'); setMsg(null); }}>
            <span className="k">{v.email}</span><span className="v">{userMe?.email || user?.email}</span><span>›</span>
          </button>
          <button type="button" className="li" onClick={() => { setOpen('password'); setMsg(null); }}>
            <span className="k">{v.password}</span><span>›</span>
          </button>
          {passkey?.supported && (
            <div className="li">
              <span className="k">{v.passkey}</span>
              {passkey.added ? <span className="v">{v.passkeyAdded}</span>
                : <button type="button" className="small-yellow" onClick={passkey.onAdd}>{v.addPasskey}</button>}
            </div>
          )}
        </div>

        <div className="eyebrow">{v.preferences}</div>
        <div className="v2-list">
          <div className="li" style={{ flexWrap: 'wrap' }}>
            <span className="k">{v.language}</span>
            <div style={{ width: 200 }}><Seg ink value={language} onChange={setLanguage} options={LANGS} label={v.language} /></div>
          </div>
          <div className="li">
            <span className="k">{v.menuNight}</span>
            <button type="button" className="switch" role="switch" aria-checked={nightMode} onClick={toggleNightMode} aria-label={v.menuNight} />
          </div>
          <button type="button" className="li" onClick={onEditTaste}>
            <span className="k">{v.yourTaste}</span>
            <span className="v">{(profile?.beer_styles || []).join(', ').toUpperCase() || '—'}</span><span>›</span>
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, padding: '4px 2px' }}>
          <button type="button" className="link-btn" style={{ color: '#fff' }} onClick={onLogout}>{v.logout}</button>
          <button type="button" className="link-btn" style={{ color: '#FFD100' }} onClick={() => { setOpen('delete'); setMsg(null); setConfirmText(''); }}>{v.deleteAccount}</button>
        </div>
      </div>

      {open === 'email' && (
        <Sheet onClose={() => setOpen(null)} label={v.changeEmail}>
          <h2 className="display" style={{ fontSize: '1.6rem' }}>{v.changeEmail}</h2>
          <div className="v2-field"><label htmlFor="v2-email">{v.newEmail}</label>
            <input id="v2-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          {msg && <p className={msg.ok ? 'note-ok' : 'note-err'}>{msg.text}</p>}
          <button type="button" className="btn block" disabled={busy || !email.includes('@')} onClick={submitEmail}>{v.save}</button>
        </Sheet>
      )}
      {open === 'password' && (
        <Sheet onClose={() => setOpen(null)} label={v.changePassword}>
          <h2 className="display" style={{ fontSize: '1.6rem' }}>{v.changePassword}</h2>
          <div className="v2-field"><label htmlFor="v2-pw-cur">{t.currentPassword || 'Current password'}</label>
            <input id="v2-pw-cur" type="password" autoComplete="current-password" value={pw.cur} onChange={(e) => setPw({ ...pw, cur: e.target.value })} /></div>
          <div className="v2-field"><label htmlFor="v2-pw-new">{t.newPassword || 'New password'}</label>
            <input id="v2-pw-new" type="password" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></div>
          <div className="v2-field"><label htmlFor="v2-pw-confirm">{t.confirmPassword || 'Confirm password'}</label>
            <input id="v2-pw-confirm" type="password" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></div>
          {msg && <p className={msg.ok ? 'note-ok' : 'note-err'}>{msg.text}</p>}
          <button type="button" className="btn block" disabled={busy || !pw.cur || !pw.next} onClick={submitPw}>{v.save}</button>
        </Sheet>
      )}
      {open === 'delete' && (
        <Sheet onClose={() => setOpen(null)} label={v.deleteTitle}>
          <h2 className="display" style={{ fontSize: '1.6rem', color: 'var(--red)' }}>{v.deleteTitle}</h2>
          <p>{v.deleteBody}</p>
          <div className="v2-field"><label htmlFor="v2-del">{v.typeDelete}</label>
            <input id="v2-del" value={confirmText} autoCapitalize="characters" onChange={(e) => setConfirmText(e.target.value)} /></div>
          {msg && <p className="note-err">{msg.text}</p>}
          <button type="button" className="btn block" style={{ background: 'var(--red)', color: '#fff' }}
            disabled={busy || confirmText.trim().toUpperCase() !== 'DELETE'} onClick={submitDelete}>{v.deleteConfirm}</button>
          <button type="button" className="link-btn" onClick={() => setOpen(null)}>{v.cancel}</button>
        </Sheet>
      )}
    </div>
  );
}
