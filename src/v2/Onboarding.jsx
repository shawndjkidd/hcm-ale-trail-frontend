import { useState } from 'react';
import translations from '../translations';
import { saveOnboardingProfile } from '../lib/api';
import { useV } from './i18n';
import { Sheet } from './ui';
import { personalityFor, openStatus, beerLook } from './util';

const STYLES = [
  { value: 'lager', key: 'styleLager', style: 'lager' },
  { value: 'ipa', key: 'styleIpa', style: 'ipa' },
  { value: 'stout', key: 'styleStout', style: 'stout' },
  { value: 'sour', key: 'styleSour', style: 'sour' },
  { value: 'wheat', key: 'styleWheat', style: 'wheat' },
  { value: 'surprise', key: 'styleSurprise', style: null },
];
const ERAS = [
  { value: 'rookie', key: 'eraRookie' }, { value: 'prime', key: 'eraPrime' },
  { value: 'seasoned', key: 'eraSeasoned' }, { value: 'og', key: 'eraOg' },
];

function saveProfile(patch) {
  const existing = JSON.parse(localStorage.getItem('hcm-onboarding-profile') || 'null') || {};
  const merged = { ...existing, ...patch };
  localStorage.setItem('hcm-onboarding-profile', JSON.stringify(merged));
  return saveOnboardingProfile(patch).catch(() => null);
}

export default function Onboarding({ language, breweries, stamps, onDone, editing = false }) {
  const v = useV(language);
  const existing = JSON.parse(localStorage.getItem('hcm-onboarding-profile') || 'null') || {};
  const [step, setStep] = useState(0);
  const [styles, setStyles] = useState(existing.beer_styles || []);
  const [era, setEra] = useState(existing.era || null);

  const toggle = (s) => setStyles((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  const finishQuestions = async () => {
    await saveProfile({ beer_styles: styles, era });
    localStorage.setItem('hcm-onboarding-complete', 'true');
    if (editing) onDone(null); else setStep(2);
  };

  const skip = async () => {
    if (styles.length || era) await saveProfile({ beer_styles: styles, era });
    localStorage.setItem('hcm-onboarding-complete', 'true');
    onDone(null);
  };

  const pints = (n) => (
    <div className="pints" style={{ marginTop: 0 }}>
      {[0, 1, 2].map((i) => <i key={i} className={`pint${i < n ? ' on' : ''}`} style={{ width: 20, height: 28 }} />)}
    </div>
  );

  if (step === 0) {
    return (
      <div className="v2-full v2-onb red">
        <div className="wrap">
          <div className="top">{pints(1)}<span className="spacer" /><button type="button" className="link-btn" onClick={skip}>{v.skip}</button></div>
          <h1>{v.usuallyOrder}</h1>
          <p style={{ marginTop: -6 }}>{v.pickMany}</p>
          <div className="tapwall">
            {STYLES.map((s) => {
              const look = s.style ? beerLook(s.style) : null;
              return (
                <button key={s.value} type="button" className={`tap${look ? '' : ' add'}`} aria-pressed={styles.includes(s.value)}
                  style={look ? { background: look.color, color: look.ink } : undefined} onClick={() => toggle(s.value)}>
                  <span className="n">{v[s.key]}</span>
                </button>
              );
            })}
          </div>
          <button type="button" className="btn block" style={{ marginTop: 'auto' }} disabled={!styles.length} onClick={() => setStep(1)}>{v.next}</button>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="v2-full v2-onb dark">
        <div className="wrap">
          <div className="top">{pints(2)}<span className="spacer" /><button type="button" className="link-btn" onClick={skip}>{v.skip}</button></div>
          <h1>{v.howDeep}</h1>
          <div className="v2-choice">
            {ERAS.map((e) => (
              <button key={e.value} type="button" aria-pressed={era === e.value} onClick={() => setEra(e.value)}>
                <b>{v[e.key]}</b><span>{v[`${e.key}D`]}</span>
              </button>
            ))}
          </div>
          <button type="button" className="btn block" style={{ marginTop: 'auto', borderColor: '#fff', boxShadow: '5px 5px 0 #fff' }} disabled={!era} onClick={finishQuestions}>
            {editing ? v.save : v.showPersonality}
          </button>
        </div>
      </div>
    );
  }

  const p = personalityFor({ beer_styles: styles, era }) || { key: 'pWild', color: '#E0A040', style: '' };
  const candidates = [...breweries].filter((b) => !stamps.includes(b.id)).sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99));
  const firstStop = candidates.find((b) => openStatus(b).open) || candidates[0] || null;
  const look = p.style ? beerLook(p.style) : { color: '#E0A040' };

  return (
    <div className="v2-full v2-reveal" style={{ background: look.color === '#2B160D' ? '#6B3A22' : look.color }}>
      <div className="wrap">
        {pints(3)}
        <div className="eyebrow" style={{ marginTop: 8 }}>{v.yourPersonality}</div>
        <div className="card">
          <i className="glass" style={{ background: p.color, width: 52, height: 70, boxShadow: 'inset 0 0 0 4px #111' }} />
          <div className="name">{v[p.key]}</div>
          <p>{v[`${p.key}D`]}</p>
        </div>
        {firstStop && (
          <div style={{ background: 'var(--ink)', color: '#fff', padding: '12px 14px' }}>
            <div className="eyebrow" style={{ color: 'var(--yellow)' }}>{v.firstStop}</div>
            <b>{firstStop.name}</b>
            {openStatus(firstStop).open ? ` · ${v.openNowLower}` : ''}
          </div>
        )}
        <button type="button" className="btn block" style={{ marginTop: 'auto' }} onClick={() => onDone(firstStop)}>{v.letsGo}</button>
      </div>
    </div>
  );
}

// ── One-tap questions after stamps 1–4 ──────────────────────────────────────
const MICRO_ORDER = ['location', 'lifestyle', 'avatar', 'gender'];

export function nextMicroQuestion(stampCount) {
  const profile = JSON.parse(localStorage.getItem('hcm-onboarding-profile') || 'null') || {};
  const asked = JSON.parse(localStorage.getItem('hcm-micro-asked') || '[]');
  const answered = {
    location: !!(profile.neighborhood || profile.home_country),
    lifestyle: !!profile.lifestyle,
    avatar: !!profile.avatar,
    gender: !!profile.gender,
  };
  const due = MICRO_ORDER.slice(0, Math.min(stampCount, 4));
  return due.find((q) => !answered[q] && asked.filter((x) => x === q).length < 2) || null;
}

function markAsked(q) {
  const asked = JSON.parse(localStorage.getItem('hcm-micro-asked') || '[]');
  localStorage.setItem('hcm-micro-asked', JSON.stringify([...asked, q]));
}

const LOCATIONS = [
  { value: 'd1', key: 'optD1D3' }, { value: 'd2', key: 'optD2' }, { value: 'd7', key: 'optDistrict7' },
  { value: 'binh_thanh', key: 'optBinhThanh' }, { value: 'other_hcmc', key: 'optOtherHcmc' },
];
const COUNTRIES = ['US', 'GB', 'AU', 'KR', 'JP', 'FR', 'DE', 'CA', 'NL', 'SG', 'TH', 'NZ', 'IE', 'SE', 'DK', 'IN', 'CN', 'TW', 'PH', 'MY', 'ID', 'BR', 'IT', 'ES', 'BE'];
const LIFESTYLES = ['backpacker', 'digital_nomad', 'suit', 'teacher_ngo', 'student', 'just_vibing'];
const LIFESTYLE_KEYS = { backpacker: 'optBackpacker', digital_nomad: 'optDigitalNomad', suit: 'optSuit', teacher_ngo: 'optTeacherNgo', student: 'optStudent', just_vibing: 'optJustVibing' };
const AVATARS = [{ value: 'glass', key: 'optGlass' }, { value: 'pint', key: 'optPint' }, { value: 'growler', key: 'optGrowler' }, { value: 'tower', key: 'optTower' }];

export function MicroQuestion({ question, language, onClose }) {
  const v = useV(language);
  const t = translations[language] || translations.en;
  const [mode, setMode] = useState(null);
  const regionNames = (() => { try { return new Intl.DisplayNames([language === 'vn' ? 'vi' : language === 'kr' ? 'ko' : language === 'jp' ? 'ja' : 'en'], { type: 'region' }); } catch { return null; } })();

  const answer = async (patch) => { markAsked(question); await saveProfile(patch); onClose(); };
  const later = () => { markAsked(question); onClose(); };

  const optionBtn = (label, onClick, key) => (
    <button key={key || label} type="button" className="btn plain block" style={{ fontSize: '1rem', boxShadow: 'none', justifyContent: 'flex-start', fontFamily: 'var(--body)', textTransform: 'none', fontWeight: 700 }} onClick={onClick}>{label}</button>
  );

  let title = ''; let body = null;
  if (question === 'location') {
    title = v.qFrom;
    body = !mode ? (
      <>{optionBtn(v.qFromLocal, () => setMode('local'))}{optionBtn(v.qFromVisit, () => setMode('visit'))}</>
    ) : mode === 'local' ? (
      LOCATIONS.map((l) => optionBtn(t[l.key] || l.value, () => answer({ neighborhood: l.value, home_country: 'VN' }), l.value))
    ) : (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxHeight: '45vh', overflowY: 'auto' }}>
        {COUNTRIES.map((c) => (
          <button key={c} type="button" className="sq-btn" style={{ color: 'var(--text)', borderColor: 'var(--ink)', textAlign: 'left', padding: '10px' }}
            onClick={() => answer({ home_country: c, neighborhood: 'visitor' })}>{regionNames?.of(c) || c}</button>
        ))}
      </div>
    );
  } else if (question === 'lifestyle') {
    title = v.qDo;
    body = LIFESTYLES.map((l) => optionBtn(t[LIFESTYLE_KEYS[l]] || l, () => answer({ lifestyle: l }), l));
  } else if (question === 'avatar') {
    title = v.qGlass;
    body = <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>{AVATARS.map((a) => optionBtn(t[a.key] || a.value, () => answer({ avatar: a.value }), a.value))}</div>;
  } else if (question === 'gender') {
    title = v.qGender;
    body = (
      <>
        {optionBtn(t.optMale || 'Male', () => answer({ gender: 'male' }))}
        {optionBtn(t.optFemale || 'Female', () => answer({ gender: 'female' }))}
        {optionBtn(t.optOther || 'Other', () => answer({ gender: 'other' }))}
        {optionBtn(v.preferNot, () => answer({ gender: 'skip' }))}
      </>
    );
  }

  return (
    <Sheet onClose={later} label={title}>
      <h2 className="display" style={{ fontSize: '1.7rem' }}>{title}</h2>
      {body}
      <button type="button" className="link-btn" onClick={later}>{v.notNow}</button>
    </Sheet>
  );
}
