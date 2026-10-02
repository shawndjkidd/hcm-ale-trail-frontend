import { Fragment, useEffect, useState } from 'react';
import { hqGetSignups, hqMarkSignup, hqDeleteTesterRatings, TRAIL_ID } from './adminApi';
import { useConfirm } from './AdminFeedback';

// HQ Sign-ups: everyone who joined, with our call on whether they're a real customer or
// a tester, and why. HQ can override the call and delete testers' beer ratings so they
// don't skew venue scores. Emails stay here: venues never see this page.

const REASON = {
  customer: 'Signed up after launch',
  marked_real: 'Marked real by HQ',
  marked_tester: 'Marked tester by HQ',
  hq_team: 'HQ team login',
  venue_staff: 'Venue staff',
  before_launch: 'Joined before the trail opened',
  test_email: 'Test-style email',
};
const when = (iso) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }); } catch { return '—'; }
};

export default function HQSignups() {
  const confirm = useConfirm();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [show, setShow] = useState('all');
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');

  const load = async () => {
    setError('');
    const r = await hqGetSignups(TRAIL_ID);
    if (r?.ok) setData(r); else setError(r?.error || 'Could not load sign-ups');
  };
  useEffect(() => { load(); }, []);

  const mark = async (p, m) => {
    setBusy(p.id); setMsg('');
    const r = await hqMarkSignup(TRAIL_ID, p.id, m);
    setBusy('');
    if (!r?.ok) { setMsg(r?.error || 'Could not save'); return; }
    load();
  };
  const removeRatings = async (p) => {
    const n = p ? p.ratings.length : data.totals.testerRatings;
    const ok = await confirm({
      title: 'Delete tester ratings?',
      message: p ? `Delete ${n} beer rating${n === 1 ? '' : 's'} by ${p.name || p.email || 'this tester'}? This can't be undone.` : `Delete all ${n} beer ratings made by testers? Customers' ratings are never touched. This can't be undone.`,
      confirmLabel: 'Delete', danger: true,
    });
    if (!ok) return;
    setBusy(p ? p.id : 'all'); setMsg('');
    const r = await hqDeleteTesterRatings(TRAIL_ID, p?.id);
    setBusy('');
    if (!r?.ok) { setMsg(r?.error || 'Could not delete'); return; }
    setMsg(`✓ Deleted ${r.deleted} rating${r.deleted === 1 ? '' : 's'}`);
    load();
  };

  if (error && !data) {
    return (
      <div className="hq-card">
        <h3>Couldn't load sign-ups</h3>
        <p className="hq-note">{error}</p>
        <button type="button" className="hq-btn y" style={{ marginTop: 12 }} onClick={load}>Try again</button>
      </div>
    );
  }
  if (!data) return <div className="admin-loading"><div className="admin-spinner" /></div>;

  const { totals, people } = data;
  const list = people.filter((p) => show === 'all' || (show === 'customers' ? p.kind === 'customer' : p.kind === 'tester'));

  return (
    <>
      <div className="hq-h">
        <h2>Sign-ups</h2>
        <div className="sp" />
        <button type="button" className="hq-btn" onClick={load}>Refresh</button>
      </div>
      <div className="hq-g hq-g4">
        <div className="hq-card hq-kpi"><div className="l">Signed up</div><div className="v">{totals.signups}</div><div className="d">everyone</div></div>
        <div className="hq-card hq-kpi"><div className="l">Real customers</div><div className="v">{totals.customers}</div><div className="d">joined after launch, not staff</div></div>
        <div className="hq-card hq-kpi"><div className="l">Testers</div><div className="v">{totals.testers}</div><div className="d">HQ, venue staff, early or test emails</div></div>
        <div className="hq-card hq-kpi"><div className="l">Tester ratings</div><div className="v">{totals.testerRatings}</div><div className="d">{totals.testerRatings ? 'counting in venue scores' : 'none left'}</div></div>
      </div>

      <div className="hq-card hq-mt">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          {[['all', `All ${totals.signups}`], ['customers', `Customers ${totals.customers}`], ['testers', `Testers ${totals.testers}`]].map(([k, label]) => (
            <button key={k} type="button" className={`hq-btn ${show === k ? 'y' : ''}`} aria-pressed={show === k} onClick={() => setShow(k)}>{label}</button>
          ))}
          <div style={{ flex: 1 }} />
          {totals.testerRatings > 0 && (
            <button type="button" className="hq-btn danger" disabled={busy === 'all'} onClick={() => removeRatings(null)}>
              {busy === 'all' ? 'Deleting…' : `Delete all ${totals.testerRatings} tester ratings`}
            </button>
          )}
        </div>
        {msg && <p className="hq-note" style={{ color: msg.startsWith('✓') ? 'var(--hq-good)' : 'var(--hq-bad)', marginBottom: 8 }}>{msg}</p>}
        <p className="hq-note" style={{ marginBottom: 10 }}>
          Our guess comes from: HQ and venue logins, joining before the trail opened (1 Oct), or an email with "test" in it. If it's wrong, use Mark real or Mark tester.
        </p>

        {list.length === 0 ? <div className="hq-empty">Nobody here yet.</div> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="hq-table">
              <thead><tr><th>Person</th><th>Joined</th><th className="num">Stamps</th><th className="num">Ratings</th><th>Type</th><th /></tr></thead>
              <tbody>
                {list.map((p) => (
                  <Fragment key={p.id}>
                    <tr>
                      <td><b>{p.name || 'No name'}</b><div className="hq-note">{p.email || 'No email'}</div></td>
                      <td>{when(p.joinedAt)}</td>
                      <td className="num">{p.stamps}{p.finished ? ' ✓' : ''}</td>
                      <td className="num">
                        {p.ratings.length > 0
                          ? <button type="button" className="hq-btn" onClick={() => setOpen(open === p.id ? null : p.id)} aria-expanded={open === p.id}>{p.ratings.length} {open === p.id ? '▴' : '▾'}</button>
                          : 0}
                      </td>
                      <td>
                        <span className={`hq-st ${p.kind === 'customer' ? 'ok' : 'warn'}`}>
                          {p.kind === 'customer' ? 'Customer' : 'Tester'}
                        </span>
                        <div className="hq-note">{REASON[p.reason] || ''}{p.venue ? ` · ${p.venue}` : ''}</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          {p.kind === 'customer'
                            ? <button type="button" className="hq-btn" disabled={busy === p.id} onClick={() => mark(p, 'tester')}>Mark tester</button>
                            : <button type="button" className="hq-btn" disabled={busy === p.id} onClick={() => mark(p, 'real')}>Mark real</button>}
                          {(p.reason === 'marked_real' || p.reason === 'marked_tester') && (
                            <button type="button" className="hq-btn" disabled={busy === p.id} onClick={() => mark(p, 'auto')}>Undo</button>
                          )}
                          {p.kind === 'tester' && p.ratings.length > 0 && (
                            <button type="button" className="hq-btn danger" disabled={busy === p.id} onClick={() => removeRatings(p)}>Delete ratings</button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {open === p.id && (
                      <tr>
                        <td colSpan={6} style={{ whiteSpace: 'normal', background: 'var(--hq-panel2)' }}>
                          {p.ratings.map((r) => (
                            <div key={r.id} className="hq-note" style={{ padding: '3px 0' }}>
                              {'★'.repeat(Number(r.rating) || 0)} {r.beer} · {r.venue} · {when(r.at)}
                            </div>
                          ))}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
