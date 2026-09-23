import { useState } from 'react';
import { getAccessToken } from '../lib/api';
import { useV, fmt, shortDate } from './i18n';
import { Icon } from './ui';
import { StaffPin, Slam } from './CheckIn';
import { localized, placeGradient, openStatus, stampLabel } from './util';
import { statusText } from './Home';

async function claimQuest(questId, pin) {
  // Preview-only demo quests accept any 4-digit code so the flow can be seen end to end
  if (String(questId).startsWith('demo-')) return { ok: true };
  const token = getAccessToken();
  try {
    const res = await fetch('/api/side-quests/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ questId, pin }),
    });
    const data = await res.json().catch(() => ({}));
    return { ...data, status: res.status, ok: !!data.ok };
  } catch {
    return { ok: false };
  }
}

export default function SideQuest({ quest, claimed, language, user, onBack, onClaimed, onRequireSignIn }) {
  const v = useV(language);
  const [step, setStep] = useState('view');
  const title = localized(quest.title, language);
  const desc = localized(quest.description, language);
  const hero = quest.photo_url ? `url("${quest.photo_url}") center/cover` : placeGradient(`sq-${quest.id}`);
  const st = quest.operating_hours ? openStatus(quest) : null;

  if (step === 'staff') {
    return (
      <StaffPin language={language} title={v.sideQuest} lines={[title, quest.reward || '']}
        onBack={() => setStep('view')}
        onSubmit={async (pin) => {
          const res = await claimQuest(quest.id, pin);
          if (res.ok) { onClaimed?.(quest.id); setStep('done'); }
          return res;
        }} />
    );
  }
  if (step === 'done') {
    return <Slam language={language} label={stampLabel(title)} sub={v.sideQuest} headline={v.claimedQuest} line={quest.reward} onDone={onBack} />;
  }

  const links = [
    quest.instagram_url && { label: 'Instagram', href: quest.instagram_url, bg: '#E1306C', fg: '#fff', icon: Icon.instagram },
    quest.facebook_url && { label: 'Facebook', href: quest.facebook_url, bg: '#1877F2', fg: '#fff', icon: Icon.facebook },
    quest.maps_url && { label: v.directions, href: quest.maps_url, bg: '#FFD100', fg: '#111', icon: Icon.pin },
  ].filter(Boolean);

  return (
    <div className="v2-brewery" style={{ background: 'var(--ink)', color: '#fff' }}>
      <div className="hero" style={{ background: hero, height: 210 }}>
        <button type="button" className="round-btn" onClick={onBack} aria-label={v.back}>←</button>
        <span className="tag" style={{ position: 'absolute', left: 16, bottom: 14, background: 'var(--yellow)', borderColor: 'var(--yellow)', color: 'var(--ink)' }}>{v.sideQuest}</span>
      </div>
      <div className="content">
        <h1 style={{ paddingRight: 0 }}>{title}</h1>
        <p style={{ opacity: .9 }}>
          {[quest.kind, quest.district, st ? statusText(st, v, language) : null].filter(Boolean).join(' · ')}
        </p>
        {quest.reward && (
          <div style={{ background: 'var(--yellow)', color: 'var(--ink)', padding: '12px 14px' }}>
            <div className="eyebrow">{v.yourReward}</div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{quest.reward}</div>
            <div style={{ fontSize: '.82rem' }}>
              {v.staffPinNote}{quest.ends_at ? ` · ${fmt(v.until, { d: shortDate(quest.ends_at, language) })}` : ''}
            </div>
          </div>
        )}
        {desc && <p style={{ lineHeight: 1.5 }}>{desc}</p>}
        {quest.address && <p style={{ opacity: .8, fontSize: '.9rem' }}>{quest.address}</p>}
        {links.length > 0 && (
          <div className="v2-links" style={{ gridTemplateColumns: `repeat(${links.length}, minmax(0, 1fr))` }}>
            {links.map((l) => {
              const I = l.icon;
              return (
                <a key={l.label} href={l.href} target="_blank" rel="noreferrer" style={{ background: l.bg, color: l.fg, borderColor: '#fff', boxShadow: '4px 4px 0 #fff' }}>
                  <I /><span>{l.label}</span>
                </a>
              );
            })}
          </div>
        )}
      </div>
      <div className="sticky" style={{ background: 'var(--ink)', borderTopColor: 'var(--yellow)' }}>
        <div className="inner">
          {claimed ? (
            <div className="btn block" aria-disabled="true" style={{ background: 'var(--jade)', color: '#fff', borderColor: '#fff', boxShadow: 'none' }}>✓ {v.claimedQuest}</div>
          ) : (
            <button type="button" className="btn block" style={{ borderColor: '#fff', boxShadow: '5px 5px 0 #fff' }}
              onClick={() => (user ? setStep('staff') : onRequireSignIn?.())}>
              {v.claimSideQuest}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
