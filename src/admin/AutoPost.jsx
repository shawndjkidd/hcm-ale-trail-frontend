import { useEffect, useState } from 'react';
import { getInstagram, instagramAction, TRAIL_ID } from './adminApi';
import { nextPostAt } from './PostPack';

// HQ Home: "Automatic posting" (mockup approved 20 Nov 2026). Connect @hcm.aletrail once with an
// Instagram token and the three stories post themselves at 10:00 Saigon on Mon/Thu/Sat, tagging every
// brewery. Nothing posts until the switch is on; "Post now" sends one story straight away (a test).
const TZ = 'Asia/Ho_Chi_Minh';
const DAYS = { mon: ['Monday', 'Last week on the trail', 1], thu: ['Thursday', 'What’s on this weekend', 4], sat: ['Saturday', 'Tonight on the trail', 6] };
const when = (iso) => new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: TZ });
// The story the test button suggests: whichever day comes next.
const today = () => Object.entries(DAYS).map(([k, [, , dow]]) => [k, nextPostAt(dow)]).sort((a, b) => a[1] - b[1])[0][0];

export function AutoPostCard() {
  const [s, setS] = useState(null);
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null);
  const [confirmPost, setConfirmPost] = useState(false);
  const [kind, setKind] = useState(today());
  useEffect(() => { getInstagram(TRAIL_ID).then((r) => setS(r?.ok ? r : { ok: false, error: r?.error || 'Could not load.' })); }, []);

  const act = async (body, done) => {
    setBusy(body.action); setMsg(null);
    const r = await instagramAction(TRAIL_ID, body);
    setBusy('');
    if (r?.connected !== undefined) setS({ ...r, ok: true });
    if (r?.ok) { setMsg({ ok: true, text: done }); if (body.action === 'connect') setToken(''); }
    else setMsg({ ok: false, text: r?.error || 'Something went wrong. Please try again.' });
  };

  if (!s) return <div className="hq-card"><h3 style={{ margin: 0 }}>Automatic posting</h3><p className="hq-note">Loading…</p></div>;
  if (!s.ok && s.connected === undefined) return <div className="hq-card"><h3 style={{ margin: 0 }}>Automatic posting</h3><p className="hq-note">{s.error}</p></div>;

  return (
    <div className="hq-card ap-card" data-tour="auto-post">
      <div className="ap-head">
        <h3 style={{ margin: 0 }}>Automatic posting</h3>
        <span className={`ap-state ${s.connected ? (s.enabled ? 'on' : 'ready') : ''}`}>
          {s.connected ? `@${s.username} · ${s.enabled ? 'posting automatically' : 'switched off'}` : 'Not connected'}
        </span>
      </div>

      {!s.connected ? (
        <>
          <p className="hq-note">Connect @hcm.aletrail once and the three stories post themselves at 10 am on Monday, Thursday and Saturday, tagging every brewery.</p>
          <ol className="ap-steps">
            <li>In the Meta app, open <b>Instagram</b> › <b>API setup with Instagram login</b> and press <b>Generate token</b> next to @hcm.aletrail.</li>
            <li>Copy the token and paste it here.</li>
          </ol>
          <div className="ap-connect">
            <input type="password" autoComplete="off" spellCheck={false} placeholder="Paste the Instagram token" value={token} onChange={(e) => setToken(e.target.value)} />
            <button type="button" className="trp-dl" disabled={!token.trim() || !!busy} onClick={() => act({ action: 'connect', token }, 'Connected. Switch on automatic posting when you’re ready.')}>
              {busy === 'connect' ? 'Checking…' : 'Connect Instagram'}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="hq-note">The three stories post at 10 am Saigon time, tagging every brewery. The connection renews itself.</p>
          <div className="ap-sched">
            {Object.entries(DAYS).map(([k, [d, t]]) => <div key={k}><b>{d}</b><span>{t}</span></div>)}
          </div>
          <label className="ap-switch">
            <input type="checkbox" checked={s.enabled} disabled={!!busy} onChange={(e) => act({ action: e.target.checked ? 'enable' : 'disable' }, e.target.checked ? 'Automatic posting is on.' : 'Automatic posting is off.')} />
            <span className="ap-track" aria-hidden="true" />
            Post automatically
          </label>
          <div className="ap-btns">
            {!confirmPost ? (
              <>
                <select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Which story">
                  {Object.entries(DAYS).map(([k, [d]]) => <option key={k} value={k}>{d}’s story</option>)}
                </select>
                <button type="button" className="admin-btn" style={{ width: 'auto' }} disabled={!!busy} onClick={() => setConfirmPost(true)}>Post now</button>
                <button type="button" className="admin-btn" style={{ width: 'auto' }} disabled={!!busy} onClick={() => act({ action: 'disconnect' }, 'Disconnected. Nothing will post.')}>{busy === 'disconnect' ? 'Disconnecting…' : 'Disconnect'}</button>
              </>
            ) : (
              <div className="ap-confirm">
                <span>Post {DAYS[kind][0]}’s story to @{s.username} now? It goes live straight away.</span>
                <button type="button" className="trp-dl" disabled={!!busy} onClick={async () => { await act({ action: 'post', kind }, 'Posted. Check the story on Instagram.'); setConfirmPost(false); }}>{busy === 'post' ? 'Posting… (up to a minute)' : 'Yes, post it'}</button>
                <button type="button" className="admin-btn" style={{ width: 'auto' }} disabled={busy === 'post'} onClick={() => setConfirmPost(false)}>Cancel</button>
              </div>
            )}
          </div>
          <div className="ap-log">
            {s.enabled && s.next?.[0] && <div><b>Next:</b> {when(s.next[0].at)} · {DAYS[s.next[0].kind][1]}</div>}
            {(s.log || []).slice(0, 6).map((r) => (
              <div key={r.id} className={r.status === 'failed' ? 'bad' : ''}>
                <b>{when(r.created_at)}</b> · {DAYS[r.kind][1]}{r.manual ? ' (posted by hand)' : ''} · {r.status === 'posted' ? (r.tagged ? 'posted' : 'posted, Instagram didn’t allow the tags') : r.status === 'failed' ? `didn’t post: ${r.error || 'unknown reason'}` : 'posting…'}
              </div>
            ))}
            {!s.log?.length && <div>Nothing posted yet.</div>}
          </div>
        </>
      )}
      {msg && <p className={`trp-msg ${msg.ok ? 'ok' : 'bad'}`} role="status" style={{ marginTop: 10 }}>{msg.text}</p>}
    </div>
  );
}


