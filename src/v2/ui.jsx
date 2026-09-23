import { useEffect, useState } from 'react';
import { useV } from './i18n';

export const LOGO_WHITE = '/brand/logo-white.png';

const LANGS = [
  { code: 'en', label: 'EN', flag: 'us', name: 'English' },
  { code: 'vn', label: 'VI', flag: 'vn', name: 'Tiếng Việt' },
  { code: 'kr', label: 'KO', flag: 'kr', name: '한국어' },
  { code: 'jp', label: 'JA', flag: 'jp', name: '日本語' },
];

// Flag buttons for switching language (the look people liked in the original app)
export function Flags({ language, setLanguage, size = 'md' }) {
  return (
    <div className={`v2-flags ${size}`} role="group" aria-label="Language">
      {LANGS.map((l) => (
        <button key={l.code} type="button" aria-pressed={language === l.code} aria-label={l.name} title={l.name} onClick={() => setLanguage(l.code)}>
          <img src={`/flags/${l.flag}.png`} alt="" />
        </button>
      ))}
    </div>
  );
}

export const Icon = {
  trail: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...p}><path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" /></svg>),
  map: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...p}><path d="M12 21s-7-6.2-7-12a7 7 0 0114 0c0 5.8-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>),
  card: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...p}><rect x="4" y="3" width="16" height="18" rx="2" /><circle cx="12" cy="11" r="3.5" /></svg>),
  ask: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" {...p}><path d="M4 5h16v11H9l-5 4z" /></svg>),
  instagram: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true" {...p}><rect x="4" y="4" width="16" height="16" rx="5" /><circle cx="12" cy="12" r="3.6" /><circle cx="17" cy="7" r="1" fill="currentColor" /></svg>),
  facebook: (p) => (<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}><path d="M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v6h4v-6h3l.5-4h-3.5V9c0-.6.4-1 1-1z" /></svg>),
  globe: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true" {...p}><circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4c3 3 3 13 0 16M12 4c-3 3-3 13 0 16" /></svg>),
  pin: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true" {...p}><path d="M12 21s-7-6.2-7-12a7 7 0 0114 0c0 5.8-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>),
  search: (p) => (<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true" {...p}><circle cx="11" cy="11" r="6" /><path d="M16 16l4 4" /></svg>),
  cap: (p) => (<svg viewBox="0 0 24 16" width="26" height="18" aria-hidden="true" {...p}><path d="M2 12c0-6 4-10 10-10s10 4 10 10z" fill="currentColor" /><path d="M12 12h11v2H12z" fill="currentColor" /></svg>),
};

export const LOGO_BLACK = '/logos/HCM Logo-Ale-Trail-2023-BK.png';

// Sun/moon pill, as in the original app
export function NightToggle({ nightMode, toggleNightMode }) {
  return (
    <button type="button" className="v2-night" role="switch" aria-checked={nightMode} aria-label="Night mode" onClick={toggleNightMode}>
      <span className={`knob${nightMode ? ' on' : ''}`} aria-hidden="true">{nightMode ? '☾' : '☀'}</span>
      <span className="ghost sun" aria-hidden="true">☀</span>
      <span className="ghost moon" aria-hidden="true">☾</span>
    </button>
  );
}

export function TopBar({ language, setLanguage, nightMode, toggleNightMode, onMenu }) {
  return (
    <div className="v2-top2">
      <div className="row">
        <Flags language={language} setLanguage={setLanguage} />
        <NightToggle nightMode={nightMode} toggleNightMode={toggleNightMode} />
        <button type="button" className="menu-btn" onClick={onMenu} aria-label="Menu">☰</button>
      </div>
      <div className="logobox">
        <img src={LOGO_BLACK} alt="Ho Chi Minh Ale Trail" />
      </div>
    </div>
  );
}

export function TabBar({ current, onChange, language }) {
  const v = useV(language);
  const tabs = [
    { id: 'home', label: v.tabTrail, icon: Icon.trail },
    { id: 'map', label: v.tabMap, icon: Icon.map },
    { id: 'card', label: v.tabCard, icon: Icon.card },
    { id: 'ask', label: v.tabAsk, icon: Icon.ask },
  ];
  return (
    <nav className="v2-tabbar" aria-label="Main">
      <div className="inner">
        {tabs.map((tab) => {
          const I = tab.icon;
          const btn = (
            <button key={tab.id} type="button" aria-current={current === tab.id ? 'page' : undefined} onClick={() => onChange(tab.id)}>
              <I />
              {tab.label}
            </button>
          );
          if (tab.id !== 'ask') return btn;
          // Trail socials sit between My card and Ask
          return [
            <a key="ig" className="social" href="https://www.instagram.com/hcm.aletrail/" target="_blank" rel="noreferrer" ><Icon.instagram />Instagram</a>,
            <a key="fb" className="social" href="https://www.facebook.com/hcmaletrail" target="_blank" rel="noreferrer" ><Icon.facebook />Facebook</a>,
            btn,
          ];
        })}
      </div>
    </nav>
  );
}

export function Seg({ options, value, onChange, ink = false, label }) {
  return (
    <div className={`seg${ink ? ' ink' : ''}`} role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Pints({ count, total = 8, className = '' }) {
  return (
    <div className={`pints ${className}`} aria-label={`${count} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => <i key={i} className={`pint${i < count ? ' on' : ''}`} />)}
    </div>
  );
}

export function useEscape(onClose) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
}

export function Sheet({ onClose, children, label }) {
  useEscape(onClose);
  return (
    <>
      <div className="v2-scrim" onClick={onClose} />
      <div className="v2-sheet" role="dialog" aria-modal="true" aria-label={label}>
        <div className="inner">{children}</div>
      </div>
    </>
  );
}

export function MenuDrawer({ language, setLanguage, nightMode, toggleNightMode, user, onClose, onProfile, onGuide, onLogout, onSignIn, trail }) {
  const v = useV(language);
  useEscape(onClose);
  const links = [
    { label: v.menuWebsite, href: 'https://www.hochiminhaletrail.com/' },
    { label: 'Instagram', href: 'https://www.instagram.com/hcm.aletrail/' },
    { label: 'Facebook', href: 'https://www.facebook.com/hcmaletrail' },
  ];
  return (
    <>
      <div className="v2-scrim" onClick={onClose} />
      <aside className="v2-drawer" role="dialog" aria-modal="true" aria-label="Menu">
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          <img src={LOGO_WHITE} alt="" style={{ height: 30 }} />
          <span style={{ flex: 1 }} />
          <button type="button" className="round-btn" onClick={onClose} aria-label={v.close}>✕</button>
        </div>
        {user ? (
          <button type="button" className="item" onClick={onProfile}>{v.menuProfile}<span>›</span></button>
        ) : (
          <button type="button" className="item" onClick={onSignIn}>{v.menuSignIn}<span>›</span></button>
        )}
        <button type="button" className="item" onClick={onGuide}>{v.menuHowItWorks}<span>›</span></button>
        {links.map((l) => (
          <a key={l.label} className="item" href={l.href} target="_blank" rel="noreferrer">{l.label}<span>↗</span></a>
        ))}
        <div className="item" style={{ borderBottom: 0, paddingBottom: 0 }}>{v.menuLanguage}</div>
        <div style={{ padding: '10px 0' }}><Flags language={language} setLanguage={setLanguage} /></div>
        <div className="item">
          {v.menuNight}
          <button type="button" className="switch" role="switch" aria-checked={nightMode} onClick={toggleNightMode} aria-label={v.menuNight} />
        </div>
        {user && (
          <button type="button" className="item" onClick={onLogout} style={{ marginTop: 'auto' }}>{v.menuLogout}<span /></button>
        )}
      </aside>
    </>
  );
}

export function Toast({ text }) {
  if (!text) return null;
  return <div className="v2-toast" role="status">{text}</div>;
}

export function Glass({ color, size = 20, style }) {
  return <i className="glass" style={{ background: color, width: size, height: size * 1.35, ...style }} />;
}

// "Add to home screen" helper, shown once after the first stamp.
const ShareGlyph = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" /><path d="M6 11H5v10h14V11h-1" /></svg>);
const AddGlyph = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M12 8v8M8 12h8" /></svg>);
const MenuGlyph = () => (<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>);

export function InstallPrompt({ language, deferred, onClose }) {
  const v = useV(language);
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const [steps, setSteps] = useState(false);
  const canInstall = deferred && !ios;
  const icon = (document.getElementById('app-touch-icon')?.getAttribute('href')) || '/icons/pint-180.png';
  const list = ios
    ? [{ g: <ShareGlyph />, t: v.installS1, s: v.installS1b }, { g: <AddGlyph />, t: v.installS2 }, { g: <b>Add</b>, t: v.installS3 }]
    : [{ g: <MenuGlyph />, t: v.installA1 }, { g: <AddGlyph />, t: v.installA2 }, { g: <b>OK</b>, t: v.installA3 }];
  return (
    <Sheet onClose={onClose} label={v.installTitle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src={icon} alt="" style={{ width: 56, height: 56, borderRadius: 12, border: '2px solid #111' }} />
        <h2 className="display" style={{ fontSize: '1.5rem' }}>{v.installTitle}</h2>
      </div>
      {!steps ? (
        <>
          <p>{v.installWhy}</p>
          {canInstall ? (
            <button type="button" className="btn block" onClick={async () => { try { deferred.prompt(); await deferred.userChoice; } catch {} onClose(); }}>{v.installAdd}</button>
          ) : (
            <button type="button" className="btn block" onClick={() => setSteps(true)}>{v.installShow}</button>
          )}
          <button type="button" className="link-btn" onClick={onClose}>{v.installLater}</button>
        </>
      ) : (
        <>
          <ol className="v2-install-steps">
            {list.map((x, i) => (
              <li key={i}>
                <span className="n">{i + 1}</span>
                <span className="t">{x.t}{x.s && <small>{x.s}</small>}</span>
                <span className="g">{x.g}</span>
              </li>
            ))}
          </ol>
          <button type="button" className="btn block" onClick={onClose}>{v.installDone}</button>
        </>
      )}
    </Sheet>
  );
}

export const isStandalone = () =>
  (typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches) || window.navigator?.standalone === true;
