import { useRef, useState } from 'react';
import { useV } from './i18n';
import { LOGO_WHITE, Pints, Flags } from './ui';


export function Welcome({ language, setLanguage, onStart, onSignIn }) {
  const v = useV(language);
  return (
    <div className="v2-full v2-welcome">
      <div className="wrap">
        <div className="top" style={{ justifyContent: 'center' }}>
          <Flags language={language} setLanguage={setLanguage} size="lg" />
        </div>
        <img className="logo" src={LOGO_WHITE} alt="Ho Chi Minh Ale Trail" />
        <h1 className="headline">{v.w1}<br />{v.w2}<br />{v.w3}</h1>
        <Pints count={3} total={8} />
        <p style={{ fontSize: '1.02rem', maxWidth: '36ch' }}>{v.welcomeBody}</p>
        <div style={{ marginTop: 'auto', display: 'grid', gap: 12 }}>
          <button type="button" className="btn block" onClick={onStart}>{v.startTrail}</button>
          <button type="button" className="link-btn" style={{ color: '#fff' }} onClick={onSignIn}>{v.haveAccount}</button>
          <p className="fine">{v.ageNote}</p>
        </div>
      </div>
    </div>
  );
}

function CapArt() {
  return (
    <svg viewBox="0 0 120 80" style={{ width: '62%', maxWidth: 240 }} aria-hidden="true">
      <path d="M14 58c0-26 20-44 46-44s46 18 46 44z" fill="#C8102E" stroke="#111" strokeWidth="5" />
      <path d="M60 58h56c2 0 3 6-2 8H60z" fill="#C8102E" stroke="#111" strokeWidth="5" strokeLinejoin="round" />
      <circle cx="60" cy="14" r="5" fill="#111" />
      <text x="60" y="47" textAnchor="middle" fontFamily="Anton, Impact, sans-serif" fontSize="16" fill="#FFD100">ALE TRAIL</text>
    </svg>
  );
}

export function Guide({ language, onDone }) {
  const v = useV(language);
  const [i, setI] = useState(0);
  const start = useRef(null);
  const cards = [
    { title: v.g1Title, body: v.g1Body, bg: 'var(--red)', fg: '#fff', accent: 'var(--yellow)',
      art: <i className="glass" style={{ background: 'var(--yellow)', width: 120, height: 160, boxShadow: 'inset 0 0 0 6px #111' }} /> },
    { title: v.g2Title, body: v.g2Body, bg: 'var(--ink)', fg: '#fff', accent: 'var(--yellow)',
      art: <div className="slam-stamp" style={{ width: 170, height: 170 }}>HEART OF<br />DARKNESS<small>14·09</small></div> },
    { title: v.g3Title, body: v.g3Body, bg: 'var(--yellow)', fg: '#111', accent: 'var(--red)', art: <CapArt /> },
  ];
  const c = cards[i];
  const last = i === cards.length - 1;
  const go = (d) => setI((x) => Math.max(0, Math.min(cards.length - 1, x + d)));

  return (
    <div className="v2-full v2-guide" style={{ background: c.bg, color: c.fg }}
      onTouchStart={(e) => { start.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (start.current == null) return;
        const dx = e.changedTouches[0].clientX - start.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        start.current = null;
      }}>
      <div className="wrap">
        <div className="top"><span className="spacer" /><button type="button" className="link-btn" onClick={onDone}>{v.skip}</button></div>
        <div className="art">{c.art}</div>
        <div className="eyebrow" style={{ color: c.accent }}>{v.step.replace('{n}', i + 1)}</div>
        <h1 style={{ color: i === 1 ? 'var(--yellow)' : undefined }}>{c.title}</h1>
        <p style={{ fontSize: '1.05rem', maxWidth: '38ch' }}>{c.body}</p>
        <div className="nav">
          <div className="dots" aria-hidden="true">{cards.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</div>
          <span className="spacer" />
          {last ? (
            <button type="button" className="btn ink" style={{ boxShadow: '5px 5px 0 #111', borderColor: '#111' }} onClick={onDone}>{v.startTrail}</button>
          ) : (
            <button type="button" className="btn" style={i === 1 ? { borderColor: '#fff', boxShadow: '5px 5px 0 #fff' } : undefined} onClick={() => go(1)}>{v.next}</button>
          )}
        </div>
      </div>
    </div>
  );
}
