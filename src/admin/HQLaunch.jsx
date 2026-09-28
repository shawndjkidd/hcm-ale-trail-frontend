import { useEffect, useState } from 'react';
import { getHqSummary, hqRemoveDemo, hqGenerateCodes, TRAIL_ID } from './adminApi';

// Launch jobs that used to need SQL pastes. Each asks you to type a word to confirm.

function Confirm({ title, body, word, danger, busy, onCancel, onConfirm }) {
  const [typed, setTyped] = useState('');
  return (
    <div className="admin-modal-overlay" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}>
      <div className="admin-modal" style={{ maxWidth: 440 }}>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <div style={{ color: 'var(--admin-text-muted)', fontSize: 14, lineHeight: 1.5 }}>{body}</div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, margin: '16px 0 6px' }}>Type <b>{word}</b> to confirm</label>
        <input className="hq-input" value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button type="button" className="hq-btn" onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="button" className={`hq-btn ${danger ? 'danger' : 'y'}`} disabled={typed.trim().toUpperCase() !== word || busy} onClick={onConfirm}>{busy ? 'Working…' : title}</button>
        </div>
      </div>
    </div>
  );
}

export default function HQLaunch() {
  const [summary, setSummary] = useState(null);
  const [open, setOpen] = useState(null); // 'demo' | 'codes'
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [codes, setCodes] = useState(null);
  const [copied, setCopied] = useState(false);

  const load = async () => { const r = await getHqSummary(TRAIL_ID); if (r?.ok) setSummary(r); };
  useEffect(() => { load(); }, []);

  const demo = summary?.demo;
  const demoTotal = demo ? Object.values(demo).reduce((a, b) => a + b, 0) : 0;
  const onDefault = summary ? summary.venues.filter((v) => v.status !== 'inactive' && v.codeIsDefault).length : 0;

  const removeDemo = async () => {
    setBusy(true);
    const r = await hqRemoveDemo(TRAIL_ID, 'REMOVE');
    setBusy(false); setOpen(null);
    if (r?.ok) {
      const n = Object.values(r.removed || {}).reduce((a, b) => a + b, 0);
      setMsg({ ok: true, text: `Demo content removed (${n} rows). Venue content was not touched.` });
    } else setMsg({ ok: false, text: `Nothing was finished: ${r?.error || 'could not remove demo content'}. Try again, or tell Claude.` });
    load();
  };

  const newCodes = async () => {
    setBusy(true);
    const r = await hqGenerateCodes(TRAIL_ID, 'NEW CODES');
    setBusy(false); setOpen(null);
    if (r?.ok) { setCodes(r.codes); setMsg({ ok: true, text: 'New codes are live now. Send each venue its code.' }); }
    else setMsg({ ok: false, text: r?.error || 'Could not set new codes' });
    load();
  };

  const copyAll = async () => {
    const text = codes.map((c) => `${c.name}: ${c.code}`).join('\n');
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };

  return (
    <>
      <div className="hq-h"><div><h2>Launch &amp; settings</h2><p>The jobs that used to need SQL pastes</p></div></div>
      {msg && <div className="hq-card" style={{ marginBottom: 14, borderColor: msg.ok ? 'var(--hq-good)' : 'var(--hq-bad)' }}><b>{msg.text}</b></div>}

      <div className="hq-g hq-g2">
        <div className="hq-card">
          <h3>Remove demo content</h3>
          {!summary && <div className="hq-empty">Checking…</div>}
          {summary && demoTotal === 0 && <div className="hq-li"><span className="hq-st ok" /><div className="t"><b>No demo content left</b></div></div>}
          {summary && demoTotal > 0 && (
            <>
              <div className="hq-li"><div className="t"><b>{demo.participants} demo people · {demo.checkins} stamps · {demo.ratings} ratings</b><small>{demo.beers} beers · {demo.events} events · {demo.sideQuests} side quests</small></div></div>
              <p className="hq-note">Removes only rows made as demo. Venues, real guests, real beers and real events stay. The current side quests are demo too, so add the real ones first if you want to keep them.</p>
              <button type="button" className="hq-btn danger" style={{ marginTop: 12 }} onClick={() => setOpen('demo')}>Remove demo content</button>
            </>
          )}
        </div>

        <div className="hq-card">
          <h3>Give every venue its own code</h3>
          <div className="hq-li"><span className={`hq-st ${onDefault ? 'warn' : 'ok'}`} /><div className="t"><b>{onDefault ? `${onDefault} still on 1234` : 'Every venue has its own code'}</b><small>Venues and side quests</small></div></div>
          <p className="hq-note">Makes a random 4-digit code for every venue and side quest. It works immediately and 1234 stops working, so send each venue its new code straight away.</p>
          <button type="button" className="hq-btn y" style={{ marginTop: 12 }} onClick={() => setOpen('codes')}>Generate new codes</button>
          {codes && (
            <div style={{ marginTop: 16 }}>
              {codes.map((c) => (
                <div className="hq-li" key={c.id}><div className="t"><b>{c.name}</b><small>{c.kind === 'side_quest' ? 'Side quest' : 'Venue'}</small></div><span className="hq-codes">{c.code}</span></div>
              ))}
              <button type="button" className="hq-btn" style={{ marginTop: 10 }} onClick={copyAll}>{copied ? 'Copied' : 'Copy all codes'}</button>
            </div>
          )}
        </div>
      </div>

      {open === 'demo' && (
        <Confirm title="Remove demo content" word="REMOVE" danger busy={busy} onCancel={() => setOpen(null)} onConfirm={removeDemo}
          body={<>This deletes all demo people, stamps, ratings, beers, events and side quests for good. It can't be undone. Venue content is not touched.</>} />
      )}
      {open === 'codes' && (
        <Confirm title="Generate new codes" word="NEW CODES" busy={busy} onCancel={() => setOpen(null)} onConfirm={newCodes}
          body={<>Every venue and side quest gets a new code right now, and 1234 stops working. Staff need their new code before the next guest arrives.</>} />
      )}
    </>
  );
}
