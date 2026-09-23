import { useEffect, useRef, useState } from 'react';
import { getMyMerchandise, claimMerchandise } from '../lib/api';
import { useV, fmt } from './i18n';
import { Sheet } from './ui';
import { StaffPin, Slam } from './CheckIn';
import { formatClock, haptic, prefersReducedMotion, stampLabel } from './util';

// ── Restrained confetti: one burst of flat paper pieces in the app colours ──
function useConfetti(canvasRef, fire) {
  useEffect(() => {
    if (!fire || prefersReducedMotion()) return undefined;
    const canvas = canvasRef.current; if (!canvas) return undefined;
    const r = canvas.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1;
    canvas.width = r.width * dpr; canvas.height = r.height * dpr;
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = r.width, H = r.height, colors = ['#C8102E', '#FFD100', '#007A37', '#FFFFFF'];
    const parts = Array.from({ length: 90 }, (_, i) => ({
      x: W * (0.1 + Math.random() * 0.8), y: -10 - Math.random() * H * 0.35,
      vx: (Math.random() - 0.5) * 1.8, vy: 1.8 + Math.random() * 2.4,
      w: 5 + Math.random() * 5, h: 9 + Math.random() * 7, a: Math.random() * 6.28, va: (Math.random() - 0.5) * 0.25, c: colors[i % 4],
    }));
    let raf; let t0;
    const frame = (t) => {
      if (!t0) t0 = t; const el = t - t0; ctx.clearRect(0, 0, W, H);
      const fade = el > 1300 ? Math.max(0, 1 - (el - 1300) / 400) : 1;
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.035; p.a += p.va;
        ctx.save(); ctx.globalAlpha = fade; ctx.translate(p.x, p.y); ctx.rotate(p.a);
        ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.strokeStyle = '#111'; ctx.lineWidth = 0.8; ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      }
      if (el < 1700) raf = requestAnimationFrame(frame); else ctx.clearRect(0, 0, W, H);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [fire, canvasRef]);
}

export function Celebrate({ language, totalMs, rank, lastPlace, onClaim, onClose }) {
  const v = useV(language);
  const canvasRef = useRef(null);
  const [fire, setFire] = useState(false);
  useEffect(() => { haptic([40, 60, 40]); const t = setTimeout(() => setFire(true), 250); return () => clearTimeout(t); }, []);
  useConfetti(canvasRef, fire);
  const time = formatClock(totalMs, false);
  return (
    <div className="v2-celebrate" role="dialog" aria-modal="true" aria-label={v.youDidIt}>
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className="wrap">
        <div className="eyebrow" style={{ color: 'var(--yellow)' }}>{v.trailClock}</div>
        <div className="clock" style={{ color: 'var(--yellow)' }}>{formatClock(totalMs)}</div>
        {lastPlace && <p style={{ fontSize: '.9rem' }}>{fmt(v.stampOf, { place: lastPlace })}</p>}
        <div className="card">
          <div className="display" style={{ fontSize: '2.6rem' }}>{v.youDidIt}</div>
          <p>{fmt(v.finishBody, { time })}{rank ? ` ${fmt(v.rankLine, { n: rank })}` : ''}</p>
          <button type="button" className="btn ink block" style={{ boxShadow: 'none' }} onClick={onClaim}>{v.claimHat}</button>
          <button type="button" className="link-btn" onClick={onClose}>{v.close}</button>
        </div>
      </div>
    </div>
  );
}

// ── Claim the hat at a brewery (staff PIN) ──────────────────────────────────
export function HatClaim({ language, breweries, onClose, onClaimed }) {
  const v = useV(language);
  const [items, setItems] = useState(null);
  const [brewery, setBrewery] = useState(null);
  const [done, setDone] = useState(null);

  useEffect(() => {
    getMyMerchandise().then((res) => setItems(res?.ok ? res.merchandise || [] : [])).catch(() => setItems([]));
  }, []);

  const item = items?.find((x) => !x.pickedUp) || null;

  if (done) {
    return <Slam language={language} label={stampLabel(done.brewery)} sub={v.freeHat} headline={v.claimedQuest} line={done.item} onDone={() => { onClaimed?.(); onClose(); }} />;
  }
  if (brewery && item) {
    return (
      <StaffPin language={language} title={v.freeHat} lines={[item.name || v.freeHat, brewery.name]} onBack={() => setBrewery(null)}
        onSubmit={async (pin) => {
          const res = await claimMerchandise(item.id, brewery.id, pin);
          if (res?.ok) { setDone({ brewery: res.breweryName || brewery.name, item: res.itemName || item.name }); return { ok: true }; }
          return res;
        }} />
    );
  }
  return (
    <Sheet onClose={onClose} label={v.claimHat}>
      <h2 className="display" style={{ fontSize: '1.7rem' }}>{v.claimHat}</h2>
      {items === null && <p>{v.loading}</p>}
      {items && !item && <p>{items.length ? '✓' : v.hatNoStock}</p>}
      {item && (
        <>
          <p>{v.hatReady}</p>
          <div style={{ display: 'grid', gap: 8 }}>
            {[...breweries].sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99)).map((b) => (
              <button key={b.id} type="button" className="btn plain block" style={{ justifyContent: 'flex-start', fontSize: '1rem', boxShadow: 'none', fontFamily: 'var(--body)', textTransform: 'none', fontWeight: 700 }}
                onClick={() => setBrewery(b)}>{b.name}</button>
            ))}
          </div>
        </>
      )}
    </Sheet>
  );
}

// ── Shareable card image (Instagram Story size) ─────────────────────────────
export async function shareCard({ language, stamps, breweries, totalMs, running, rank, beersCount }) {
  const v = useV(language);
  const W = 1080, H = 1920;
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  try { await document.fonts.load('120px Anton'); await document.fonts.load('700 40px "Be Vietnam Pro"'); } catch {}
  const display = (size) => `${size}px Anton, Impact, sans-serif`;
  const body = (size, w = 700) => `${w} ${size}px "Be Vietnam Pro", system-ui, sans-serif`;

  ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#C8102E'; ctx.fillRect(60, 60, W - 120, H - 120);
  ctx.strokeStyle = '#FFD100'; ctx.lineWidth = 16; ctx.strokeRect(68, 68, W - 136, H - 136);

  try {
    const logo = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = '/brand/logo-white.png'; });
    const lw = 620; ctx.drawImage(logo, 130, 150, lw, lw * (logo.height / logo.width));
  } catch {}

  const count = stamps.length; const total = breweries.length || 8;
  ctx.fillStyle = '#111'; ctx.fillRect(130, 360, 420, 70);
  ctx.fillStyle = '#FFD100'; ctx.font = body(40, 800); ctx.fillText(count >= total ? v.completed : `${count}/${total} ${v.stamps.toUpperCase()}`, 150, 410);

  if (totalMs != null) {
    ctx.fillStyle = '#fff'; ctx.font = body(44, 600); ctx.fillText(v.trailTime, 130, 560);
    ctx.font = display(210); ctx.fillStyle = '#111'; ctx.fillText(formatClock(totalMs, false), 140, 790);
    ctx.fillStyle = '#FFD100'; ctx.fillText(formatClock(totalMs, false), 130, 780);
  }
  ctx.fillStyle = '#fff'; ctx.font = body(44, 700);
  const stats = [rank ? fmt(v.fastestN, { n: rank }) : null, `${beersCount} ${v.beers.toLowerCase()}`].filter(Boolean).join('   ·   ');
  ctx.fillText(stats, 130, 880);

  const ordered = [...breweries].sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99));
  const size = 190, gap = 30, x0 = 130, y0 = 960;
  ordered.forEach((b, i) => {
    const cx = x0 + (i % 4) * (size + gap) + size / 2; const cy = y0 + Math.floor(i / 4) * (size + gap) + size / 2;
    const got = stamps.includes(b.id);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(got ? (i % 2 ? 0.1 : -0.13) : 0);
    ctx.beginPath(); ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    if (got) {
      ctx.fillStyle = ['#C8102E', '#111', '#007A37'][i % 3]; ctx.fill();
      ctx.lineWidth = 12; ctx.strokeStyle = i % 3 === 2 ? '#fff' : '#FFD100'; ctx.stroke();
      ctx.fillStyle = i % 3 === 2 ? '#fff' : '#FFD100';
    } else {
      ctx.setLineDash([14, 12]); ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,.85)';
    }
    ctx.font = body(26, 800); ctx.textAlign = 'center';
    const words = stampLabel(b.name).split(' ');
    words.slice(0, 2).forEach((w, k) => ctx.fillText(w, 0, (k - (Math.min(words.length, 2) - 1) / 2) * 30 + 9));
    ctx.restore();
  });

  ctx.fillStyle = '#fff'; ctx.font = body(38, 600); ctx.textAlign = 'left';
  ctx.fillText('hcm.thealetrail.app', 130, H - 150);

  const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
  const file = new File([blob], 'ale-trail-card.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'HCM Ale Trail' }); return 'shared'; } catch { return 'cancelled'; }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'ale-trail-card.png'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'downloaded';
}
