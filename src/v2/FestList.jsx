import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { toPng } from 'html-to-image';
import { Sheet } from './ui';
import { artAt, beerBy, beerColour, festLive, FEST_POSTER } from './fest';
import { track } from '../lib/track';
import { printFontCss, dataUrlToBlob } from '../admin/printFonts';
import './fest.css';

// Collab Fest beer list, "tasting flight" style: tap the pints to rate a beer (rating it
// ticks it off), tap a beer for its card, taste tags and notes, and finish with a
// shareable night card. Personal, self-serve, just for fun.

const T = {
  en: {
    lockTitle: 'One day only', lockBody: 'Sat 31 Oct, 4pm to midnight at BigBamBoo. Have a look at the beers now; ticking off and rating opens on the night.', locked: 'Opens Sat 31 Oct at 4pm',
    eyebrow: 'HALLOWEEN COLLAB FEST', title: 'My tasting flight', openList: 'Open the Collab Fest beer list', tried: 'TRIED', avg: 'AVG {n} / 5', nothing: 'NOTHING YET',
    fest: 'Fest order', strong: 'Strongest', light: 'Lightest',
    hint: 'Tap the pints to rate a beer. Rating it ticks it off.', back: 'Back',
    local: 'Saved on this phone. Sign in to keep your list on your account.', signIn: 'Sign in',
    loading: 'Pouring the list…', unavailable: 'The beer list is unavailable right now. Try again in a minute.',
    beerOf: 'BEER {n} OF {t}', how: 'HOW WAS IT?', tastes: 'TASTES LIKE', optional: '(optional)',
    notYet: 'Not yet', tickIt: 'Tick it off', save: 'Save', untick: 'Untick this beer', close: 'Close',
    verdicts: ['Tap a pint', 'Not for me', 'It was OK', 'Good one', 'Really good', 'Beer of the night'],
    tags: { hoppy: 'Hoppy', juicy: 'Juicy', tropical: 'Tropical', crisp: 'Crisp', malty: 'Malty', bitter: 'Bitter', smooth: 'Smooth', sour: 'Sour' },
    nightBtn: 'My night card', nightTitle: 'Your Collab Fest card', iTried: 'I tried', collabs: 'collabs', myNight: "{name}'S NIGHT", myNightAnon: 'MY NIGHT',
    top3: 'MY TOP 3', share: 'Share', saveImg: 'Save image', making: 'Making your card…', shareFail: 'Could not make the card. Please try again.',
    rate: '{n} out of 5', rateBeer: 'Rate {name}', saveFail: 'Could not save. Check your connection and try again.',
    shareText: 'I tried {n} of {t} collab beers at Halloween Collab Fest. hcm.thealetrail.app',
  },
  vn: {
    lockTitle: 'Chỉ một ngày', lockBody: 'Thứ Bảy 31/10, 16:00 đến nửa đêm tại BigBamBoo. Xem trước các loại bia; đánh dấu và chấm điểm mở vào đêm diễn ra.', locked: 'Mở lúc 16:00 thứ Bảy 31/10',
    eyebrow: 'HALLOWEEN COLLAB FEST', title: 'Khay bia của tôi', openList: 'Mở danh sách bia Collab Fest', tried: 'ĐÃ THỬ', avg: 'TB {n} / 5', nothing: 'CHƯA CÓ',
    fest: 'Thứ tự', strong: 'Mạnh nhất', light: 'Nhẹ nhất',
    hint: 'Chạm vào ly để chấm điểm. Chấm điểm là đã thử.', back: 'Quay lại',
    local: 'Đang lưu trên điện thoại này. Đăng nhập để lưu vào tài khoản.', signIn: 'Đăng nhập',
    loading: 'Đang rót danh sách…', unavailable: 'Danh sách bia chưa tải được. Thử lại sau một phút.',
    beerOf: 'BIA {n} / {t}', how: 'BẠN THẤY THẾ NÀO?', tastes: 'VỊ', optional: '(không bắt buộc)',
    notYet: 'Chưa', tickIt: 'Đã thử', save: 'Lưu', untick: 'Bỏ đánh dấu bia này', close: 'Đóng',
    verdicts: ['Chạm vào một ly', 'Không hợp', 'Tạm được', 'Ngon', 'Rất ngon', 'Bia ngon nhất đêm nay'],
    tags: { hoppy: 'Nhiều hoa bia', juicy: 'Mọng nước', tropical: 'Nhiệt đới', crisp: 'Thanh mát', malty: 'Đậm mạch nha', bitter: 'Đắng', smooth: 'Êm', sour: 'Chua' },
    nightBtn: 'Thẻ đêm nay', nightTitle: 'Thẻ Collab Fest của bạn', iTried: 'Tôi đã thử', collabs: 'bia collab', myNight: 'ĐÊM CỦA {name}', myNightAnon: 'ĐÊM CỦA TÔI',
    top3: 'TOP 3 CỦA TÔI', share: 'Chia sẻ', saveImg: 'Lưu ảnh', making: 'Đang tạo thẻ…', shareFail: 'Chưa tạo được thẻ. Vui lòng thử lại.',
    rate: '{n} trên 5', rateBeer: 'Chấm điểm {name}', saveFail: 'Chưa lưu được. Kiểm tra kết nối rồi thử lại.',
    shareText: 'Tôi đã thử {n}/{t} bia collab tại Halloween Collab Fest. hcm.thealetrail.app',
  },
};
export const festT = (language) => T[language] || T.en;
const fill = (s, v) => String(s).replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ''));
const stars = (r) => (r ? '★'.repeat(r) + '☆'.repeat(5 - r) : '');

function Pint({ on, size = 16 }) {
  return (
    <svg width={size} height={Math.round(size * 1.375)} viewBox="0 0 16 22" aria-hidden="true">
      <path d="M2 2h12l-1.6 18H3.6z" fill={on ? 'currentColor' : 'transparent'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M2 2h12v3.5H2z" fill={on ? '#f3e7c9' : 'transparent'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function RateSheet({ beer, index, total, tasting, t, live, onClose, onSave }) {
  const [rating, setRating] = useState(tasting?.rating || 0);
  const [tags, setTags] = useState(new Set(tasting?.tags || []));
  const [busy, setBusy] = useState(false);
  const done = async (tried) => {
    setBusy(true);
    const ok = await onSave(beer.key, tried ? { tried: true, rating: rating || null, tags: [...tags] } : { tried: false });
    setBusy(false);
    if (ok) onClose();
  };
  const toggle = (k) => setTags((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  return (
    <Sheet onClose={onClose} label={beer.name}>
      <div className="fl-rate">
        <div className="fl-rate-top">
          {artAt(beer, 640)
            ? <img src={artAt(beer, 640)} alt="" className="fl-rate-art" style={{ background: `#0f1f17 url("${artAt(beer, 256)}") center/cover` }} />
            : <div className="fl-rate-art fl-noart">{beer.name}</div>}
          <div className="fl-rate-info">
            <div className="fl-eb dark">{fill(t.beerOf, { n: String(index + 1).padStart(2, '0'), t: total })}</div>
            <h2>{beer.name}</h2>
            <div className="fl-by">{beerBy(beer)}</div>
            <div className="fl-chips">
              {beer.style && <span className="c ink">{beer.style}</span>}
              {beer.abv != null && <span className="c red">{beer.abv}%</span>}
              {beer.ibu != null && <span className="c line">{beer.ibu} IBU</span>}
            </div>
          </div>
          <button type="button" className="fl-x" onClick={onClose} aria-label={t.close}>✕</button>
        </div>
        {!live && <div className="fl-locknote">{t.locked}</div>}
        {live && <>
        <div className="fl-label">{t.how}</div>
        <div className="fl-bigpints" role="group" aria-label={fill(t.rateBeer, { name: beer.name })}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" className={n <= rating ? 'on' : ''} aria-pressed={n <= rating} aria-label={fill(t.rate, { n })} onClick={() => setRating(n)}>
              <Pint on={n <= rating} size={22} />
            </button>
          ))}
        </div>
        <div className="fl-verdict">{t.verdicts[rating]}</div>
        <div className="fl-label">{t.tastes} <span>{t.optional}</span></div>
        <div className="fl-tags">
          {Object.entries(t.tags).map(([k, label]) => (
            <button key={k} type="button" className={tags.has(k) ? 'on' : ''} aria-pressed={tags.has(k)} onClick={() => toggle(k)}>{label}</button>
          ))}
        </div>
        <div className="fl-rate-actions">
          <button type="button" className="fl-btn ghost" onClick={onClose} disabled={busy}>{t.notYet}</button>
          <button type="button" className="fl-btn dark" onClick={() => done(true)} disabled={busy}>{tasting ? t.save : t.tickIt}</button>
        </div>
        {tasting && <button type="button" className="fl-untick" onClick={() => done(false)} disabled={busy}>{t.untick}</button>}
        </>}
      </div>
    </Sheet>
  );
}

// The shareable card, drawn off screen at story size and saved as an image.
function NightCardArt({ beers, tastings, t, name }) {
  const triedCount = beers.filter((b) => tastings[b.key]).length;
  const top = beers.filter((b) => tastings[b.key]?.rating).sort((a, b) => (tastings[b.key].rating - tastings[a.key].rating)
    || (Date.parse(tastings[a.key].triedAt) - Date.parse(tastings[b.key].triedAt))).slice(0, 3);
  return (
    <div className="fl-night">
      <div className="fl-night-band"><img src="/brand/logo-white.png" alt="" /><span>HALLOWEEN<br />COLLAB FEST · 31 OCT</span></div>
      <div className="fl-night-head">
        <div className="fl-eb">{name ? fill(t.myNight, { name: name.toUpperCase() }) : t.myNightAnon}</div>
        <div className="fl-night-big">{t.iTried}<b>{triedCount} / {beers.length}</b>{t.collabs}</div>
      </div>
      <div className="fl-night-grid">
        {beers.map((b) => (
          <div key={b.key} className={tastings[b.key] ? 'on' : ''}>
            {artAt(b, 256) ? <img src={artAt(b, 256)} alt="" /> : <span>{b.name}</span>}
          </div>
        ))}
      </div>
      {top.length > 0 && (
        <div className="fl-night-top">
          <div className="fl-eb muted">{t.top3}</div>
          {top.map((b, i) => <div key={b.key} className="r"><span><b>{i + 1}</b> · {b.name}</span><span className="s">{stars(tastings[b.key].rating)}</span></div>)}
        </div>
      )}
      <div className="fl-night-foot"><span>hcm.thealetrail.app</span><span>BigBamBoo × CraftCon × Brew Asia</span></div>
    </div>
  );
}

async function makeNightCard(props) {
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-2000px;top:0;width:360px;height:640px;pointer-events:none;';
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    root.render(<NightCardArt {...props} />);
    await new Promise((r) => setTimeout(r, 80));
    const node = host.firstElementChild;
    await Promise.all([...node.querySelectorAll('img')].map((im) => (im.complete && im.naturalWidth ? null : im.decode().catch(() => {}))));
    // includeQueryParams: every card is the same image route with a different ?src, so the
    // drawing tool must not treat them as one picture.
    const opts = { width: 360, height: 640, cacheBust: true, includeQueryParams: true, fontEmbedCSS: await printFontCss() };
    const safari = /^((?!chrome|chromium|crios|android|edg|fxios).)*safari/i.test(navigator.userAgent) || /iP(hone|ad|od)/.test(navigator.userAgent);
    for (let i = 0; i < (safari ? 3 : 1); i++) await toPng(node, { ...opts, pixelRatio: 0.25 });
    return await toPng(node, { ...opts, pixelRatio: 3 });
  } finally { root.unmount(); host.remove(); }
}

function NightCard({ beers, tastings, t, name, onClose }) {
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const count = beers.filter((b) => tastings[b.key]).length;
  const run = async (kind) => {
    setBusy(kind); setMsg('');
    try {
      const url = await makeNightCard({ beers, tastings, t, name });
      const file = new File([dataUrlToBlob(url)], 'collab-fest-night.png', { type: 'image/png' });
      track('fest_share', { source: 'collabfest-2026', kind });
      if (kind === 'share' && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: fill(t.shareText, { n: count, t: beers.length }) });
      } else {
        const a = document.createElement('a'); a.href = url; a.download = 'collab-fest-night.png'; a.click();
      }
    } catch (e) { if (e?.name !== 'AbortError') setMsg(t.shareFail); }
    setBusy('');
  };
  return (
    <Sheet onClose={onClose} label={t.nightTitle}>
      <div className="fl-nightsheet">
        <div className="fl-nightsheet-top"><h2>{t.nightTitle}</h2><button type="button" className="fl-x light" onClick={onClose} aria-label={t.close}>✕</button></div>
        <div className="fl-night-preview"><NightCardArt beers={beers} tastings={tastings} t={t} name={name} /></div>
        {msg && <p className="fl-msg">{msg}</p>}
        <div className="fl-rate-actions">
          <button type="button" className="fl-btn gold" onClick={() => run('share')} disabled={!!busy}>{busy === 'share' ? t.making : t.share}</button>
          <button type="button" className="fl-btn ghost light" onClick={() => run('save')} disabled={!!busy}>{busy === 'save' ? t.making : t.saveImg}</button>
        </div>
      </div>
    </Sheet>
  );
}

export default function FestList({ fest, language, user, userName, onBack, onSignIn }) {
  const t = festT(language);
  const { beers, tastings, save, error } = fest;
  const [sort, setSort] = useState('fest');
  const [open, setOpen] = useState(null); // beer key
  const [night, setNight] = useState(false);
  const [msg, setMsg] = useState('');
  const live = festLive();
  useEffect(() => { track('fest_open', { source: 'collabfest-2026' }); }, []);

  const list = useMemo(() => {
    if (!beers) return [];
    const out = beers.map((b, i) => ({ ...b, i }));
    if (sort === 'strong') out.sort((a, b) => (b.abv ?? 0) - (a.abv ?? 0));
    if (sort === 'light') out.sort((a, b) => (a.abv ?? 99) - (b.abv ?? 99));
    return out;
  }, [beers, sort]);
  const triedKeys = Object.keys(tastings).filter((k) => beers?.some((b) => b.key === k));
  const rated = triedKeys.map((k) => tastings[k].rating).filter(Boolean);
  const avg = rated.length ? (rated.reduce((a, b) => a + b, 0) / rated.length).toFixed(1) : null;

  const doSave = async (key, opts) => {
    const ok = await save(key, opts);
    if (!ok) { setMsg(t.saveFail); setTimeout(() => setMsg(''), 3000); }
    return ok;
  };
  const ratePint = (b, n) => {
    if (!live) { setMsg(t.locked); setTimeout(() => setMsg(''), 2500); return; }
    const cur = tastings[b.key];
    if (cur?.rating === n) doSave(b.key, { tried: false });
    else doSave(b.key, { tried: true, rating: n, tags: cur?.tags || [] });
  };
  const openBeer = beers?.find((b) => b.key === open);

  return (
    <div className="fl-screen">
      <div className="fl-poster"><img src={FEST_POSTER} alt="" /></div>
      {!live && (
        <div className="fl-lock" role="note">
          <b>{t.lockTitle}</b>
          <span>{t.lockBody}</span>
        </div>
      )}
      <div className="fl-head">
        <div className="fl-head-row">
          <button type="button" className="fl-back" onClick={onBack} aria-label={t.back}>‹</button>
          <div className="fl-head-title"><div className="fl-eb">{t.eyebrow}</div><h1>{t.title}</h1></div>
          <div className="fl-count"><b>{triedKeys.length}<span>/{beers?.length ?? '–'}</span></b><small>{avg ? fill(t.avg, { n: avg }) : t.nothing}</small></div>
        </div>
        {beers && (
          <div className="fl-paddle" aria-hidden="true">
            {beers.map((b) => <span key={b.key} style={{ background: tastings[b.key] ? `linear-gradient(to top, ${beerColour(b.style)} 88%, rgba(255,255,255,.08) 88%)` : undefined }} />)}
          </div>
        )}
        <div className="fl-sort" role="tablist">
          {[['fest', t.fest], ['strong', t.strong], ['light', t.light]].map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={sort === k} className={sort === k ? 'on' : ''} onClick={() => setSort(k)}>{label}</button>
          ))}
        </div>
      </div>

      {!user && beers && (
        <div className="fl-local"><span>{t.local}</span><button type="button" onClick={onSignIn}>{t.signIn}</button></div>
      )}
      {msg && <div className="fl-msg" role="alert">{msg}</div>}

      <div className="fl-list">
        {!beers && !error && <div className="fl-empty">{t.loading}</div>}
        {error && !beers && <div className="fl-empty">{t.unavailable}</div>}
        {list.map((b) => {
          const r = tastings[b.key]?.rating || 0;
          const on = !!tastings[b.key];
          return (
            <div key={b.key} className={`fl-row${on ? ' on' : ''}`}>
              <button type="button" className="fl-row-main" onClick={() => setOpen(b.key)}>
                {artAt(b, 256) ? <img src={artAt(b, 256)} alt="" loading="lazy" /> : <span className="fl-thumb-blank">{b.name.slice(0, 1)}</span>}
                <span className="fl-row-text">
                  <b>{b.name}</b>
                  <span className="by">{beerBy(b)}</span>
                  <span className="meta">{[b.style, b.abv != null ? `${b.abv}%` : null].filter(Boolean).join(' · ')}</span>
                </span>
              </button>
              <div className={`fl-pints${live ? '' : ' locked'}`} role="group" aria-label={fill(t.rateBeer, { name: b.name })}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" className={n <= r ? 'on' : ''} aria-label={fill(t.rate, { n })} aria-pressed={n <= r} onClick={() => ratePint(b, n)}>
                    <Pint on={n <= r} />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {beers && <p className="fl-hint">{live ? t.hint : t.locked}</p>}
        {triedKeys.length > 0 && (
          <div className="fl-nightbar"><button type="button" className="fl-btn gold" onClick={() => setNight(true)}>{t.nightBtn}</button></div>
        )}
      </div>

      {openBeer && (
        <RateSheet beer={openBeer} index={beers.indexOf(openBeer)} total={beers.length} tasting={tastings[openBeer.key]} t={t} live={live}
          onClose={() => setOpen(null)} onSave={doSave} />
      )}
      {night && <NightCard beers={beers} tastings={tastings} t={t} name={userName} onClose={() => setNight(false)} />}
    </div>
  );
}
