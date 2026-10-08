import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { toPng } from 'html-to-image';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { getVenueQrStats } from './adminApi';
import { logoFor } from '../v2/util';
import { useT } from './i18n';
import './promote.css';

// Promote: each venue's own QR codes, printable and shareable designs in the Ale Trail
// landing-page branding, and ready-to-post ad copy. Every format has its own tracked
// link (?v=<venue ref>&s=<format>) so HQ and the venue can see which one brings guests in.

const APP_URL = 'https://hcm.thealetrail.app';
// Downloads must carry their fonts inside the image. Google's font stylesheet can't be
// read by the page, so we use our own copies and inline them once as data URLs.
let fontCssPromise = null;
function printFontCss() {
  if (!fontCssPromise) {
    fontCssPromise = (async () => {
      const css = await (await fetch('/fonts/print/print-fonts.css')).text();
      const urls = [...new Set([...css.matchAll(/url\((\/fonts\/print\/[^)]+)\)/g)].map((m) => m[1]))];
      const pairs = await Promise.all(urls.map(async (u) => {
        const blob = await (await fetch(u)).blob();
        const data = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); });
        return [u, data];
      }));
      return pairs.reduce((out, [u, data]) => out.split(u).join(data), css);
    })().catch((e) => { fontCssPromise = null; throw e; });
  }
  return fontCssPromise;
}
const LOGO_WHITE = '/brand/logo-white.png';
export const venueRef = (id) => String(id || '').replace(/-/g, '').slice(0, 8);
export const trackedLink = (id, source) => `${APP_URL}/?v=${venueRef(id)}&s=${source}`;
// "Quầy bar tầng 2" -> "quay-bar-tang-2": a venue's own name for where a code goes.
export const spotSlug = (text) => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24).replace(/-+$/g, '');
const spotLabel = (source) => source.slice(2).replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());

// The 8 trail venues' one-colour logo stencils, punched into the red as texture.
const STENCILS = ['7bridges', 'belgo', 'biacraft', 'deme', 'eastwest', 'hod', 'rooster', 'steersman'];
const TRAIL_NAMES = ['BiaCraft', 'Heart of Darkness', 'Deme', 'Steersman', 'East West', 'Rooster', '7 Bridges', 'Belgo'];

function Stencils({ w, h, size }) {
  const imgs = [];
  let i = 0, seed = 7;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (let y = -size * 0.3; y < h; y += size * 1.05) {
    for (let x = (Math.round(y / size) % 2) * size * 0.55 - size * 0.3; x < w; x += size * 1.15) {
      const rot = Math.round((rnd() - 0.5) * 50), sc = 0.75 + rnd() * 0.5;
      imgs.push(<img key={i} src={`/logos/stencil/${STENCILS[i % STENCILS.length]}.png`} alt=""
        style={{ left: x + rnd() * size * 0.2, top: y + rnd() * size * 0.2, width: size * sc, transform: `rotate(${rot}deg)` }} />);
      i++;
    }
  }
  return <div className="stencils">{imgs}</div>;
}

function Pint({ id }) {
  return (
    <svg className="pint" viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs><linearGradient id={`beer-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFD84A" /><stop offset=".55" stopColor="#F7B500" /><stop offset="1" stopColor="#E08A00" /></linearGradient></defs>
      <path d="M40 70 L260 70 L232 400 Q230 412 218 412 L82 412 Q70 412 68 400 Z" fill={`url(#beer-${id})`} stroke="#111" strokeWidth="12" strokeLinejoin="round" />
      <g fill="#FFF3B0" opacity=".85"><circle cx="110" cy="300" r="7" /><circle cx="160" cy="250" r="5" /><circle cx="130" cy="200" r="6" /><circle cx="185" cy="330" r="8" /><circle cx="150" cy="370" r="5" /><circle cx="200" cy="190" r="4" /></g>
      <path d="M72 110 L92 110 L104 380 L90 380 Z" fill="#fff" opacity=".55" />
      <path d="M28 86 C10 60 40 28 70 40 C78 10 120 4 140 24 C160 0 210 6 216 36 C246 22 282 44 270 78 C286 96 266 120 246 112 L246 132 C246 146 228 146 228 132 L228 110 L80 110 L80 148 C80 164 60 164 60 148 L60 112 C36 116 22 104 28 86 Z" fill="#fff" stroke="#111" strokeWidth="12" strokeLinejoin="round" />
      <g fill="#111" opacity=".08"><circle cx="100" cy="70" r="14" /><circle cx="180" cy="64" r="12" /></g>
    </svg>
  );
}

const Head = () => <h1 className="big">8 breweries.<br />8 stamps.<br />1 free hat.</h1>;
const Seal = () => <div className="seal"><div><b>Free<br />hat</b><small>8 stamps</small></div></div>;
const Venue = ({ logo, label, name }) => (
  <div className="venue">{logo && <img src={logo} alt="" />}<div style={{ minWidth: 0 }}><small>{label}</small><span>{name}</span></div></div>
);
// Passport-style serial from the venue id, e.g. "No. 6439".
const serialOf = (id) => `No. ${String(parseInt(venueRef(id).slice(0, 6), 16) % 10000).padStart(4, '0')}`;

function Tent({ qr, name, logo, id }) {
  return (
    <div className="pr-art pr-tent">
      <div className="rays" /><Stencils w={400} h={600} size={80} />
      <div className="top"><img src={LOGO_WHITE} alt="" /><div className="over">Saigon craft-beer passport</div></div>
      <Pint id="tent" />
      <i className="sparkle s1" /><i className="sparkle s2" />
      <Seal /><Head />
      <div className="ticket"><div className="in">
        <div className="qr"><img src={qr} alt="" /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="anton scan">Scan to<br />start</div>
          <div className="vn">Quét để bắt đầu · No download</div>
          <Venue logo={logo} label="Stamp here" name={name} />
          <span className="serial">{serialOf(id)}</span>
        </div>
      </div></div>
      <div className="grain" />
    </div>
  );
}
function Poster({ qr, name, logo, id }) {
  return (
    <div className="pr-art pr-poster">
      <div className="rays" /><Stencils w={630} h={891} size={120} />
      <div className="top"><img src={LOGO_WHITE} alt="" /><div className="over">Saigon craft-beer<br />passport · 2026</div></div>
      <Pint id="poster" />
      <i className="sparkle s1" /><i className="sparkle s2" /><i className="sparkle s3" />
      <Head />
      <p className="lede">Buy a beer at each bar, <b>get your stamp</b>, collect all eight and the hat is yours.</p>
      <Seal />
      <div className="ticket"><div className="in">
        <div className="qr"><img src={qr} alt="" /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="anton scan">Scan to<br />start</div>
          <div className="vn">Quét để bắt đầu · No download needed</div>
          <Venue logo={logo} label="Stamp 1 starts here" name={name} />
          <div className="meta"><span className="url">hcm.thealetrail.app</span><span className="serial">{serialOf(id)}</span></div>
        </div>
      </div></div>
      <div className="grain" />
    </div>
  );
}
function Story({ qr, name, logo }) {
  return (
    <div className="pr-art pr-story">
      <div className="rays" /><Stencils w={1080} h={1920} size={200} />
      <div className="top"><img src={LOGO_WHITE} alt="" /><div className="over">Saigon craft-beer passport</div></div>
      <Pint id="story" />
      <i className="sparkle s1" /><i className="sparkle s2" /><i className="sparkle s3" />
      <Seal /><Head />
      <div className="ticket"><div className="in">
        <div className="qr"><img src={qr} alt="" /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="anton scan">Scan to<br />start</div>
          <div className="vn">Quét để bắt đầu · No download</div>
          <Venue logo={logo} label="We're on the trail" name={name} />
        </div>
      </div></div>
      <div className="names">{TRAIL_NAMES.slice(0, 4).join(' · ')}<br />{TRAIL_NAMES.slice(4).join(' · ')}</div>
      <div className="grain" />
      <div className="safe t"><span>Instagram profile bar</span></div>
      <div className="safe b"><span>Instagram reply box</span></div>
    </div>
  );
}
function Sticker({ qr }) {
  return (
    <svg className="pr-sticker" viewBox="0 0 300 300" width="300" height="300" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <path id="prArcTop" d="M 50,150 A 100,100 0 0 1 250,150" />
        <path id="prArcBot" d="M 36,150 A 114,114 0 0 0 264,150" />
      </defs>
      <circle cx="150" cy="150" r="148" fill="#111" />
      <circle cx="150" cy="150" r="142" fill="#FFD100" />
      <circle cx="150" cy="150" r="133" fill="#C8102E" />
      <text fontFamily="Anton, Impact, sans-serif" fontSize="22" fill="#FFD100" letterSpacing="1.6" textAnchor="middle"><textPath href="#prArcTop" startOffset="50%">HO CHI MINH ALE TRAIL</textPath></text>
      <text fontFamily="Anton, Impact, sans-serif" fontSize="17" fill="#fff" letterSpacing="1.4" textAnchor="middle" dominantBaseline="hanging"><textPath href="#prArcBot" startOffset="50%">SCAN TO START · QUÉT ĐỂ BẮT ĐẦU</textPath></text>
      <rect x="95" y="95" width="110" height="110" fill="#fff" stroke="#111" strokeWidth="4" />
      <image href={qr} x="103" y="103" width="94" height="94" />
      <g fill="#FFD100"><circle cx="45" cy="150" r="3.5" /><circle cx="255" cy="150" r="3.5" /></g>
    </svg>
  );
}

// w x h is the design's real size in CSS px; ratio scales the PNG to 300 dpi for print.
const DESIGNS = [
  { key: 'tent', title: 'Table tent', spec: 'Tall, 10 × 15 cm per side. Print two and stand them back to back.', w: 400, h: 600, ratio: 3, preview: 0.55, C: Tent },
  { key: 'poster', title: 'Poster', spec: 'A4, scales up to A3 for print shops.', w: 630, h: 891, ratio: 4, preview: 0.4, C: Poster },
  { key: 'sticker', title: 'Sticker', spec: '80 mm round, for windows, menus and the till.', w: 300, h: 300, ratio: 3.15, preview: 0.9, C: Sticker },
  { key: 'story', title: 'Instagram / Facebook story', spec: 'Exactly 1080 × 1920 px. Dashed lines show where Instagram puts its own buttons; they are not in the download.', w: 1080, h: 1920, ratio: 1, preview: 0.18, C: Story },
];

// Ready-to-post ad copy. {name} and {link} are filled in per venue and platform.
const COPY = {
  facebook: [
    { en: "We're on the Ho Chi Minh Ale Trail! Grab a beer at {name}, get your stamp, and you're 1 of 8 closer to a free Ale Trail hat.\n\nNo app to download, just open: {link}",
      vi: '{name} đã có mặt trên Ho Chi Minh Ale Trail! Uống một ly bia tại quán, nhận con dấu, và bạn đã tiến gần hơn đến chiếc mũ Ale Trail miễn phí.\n\nKhông cần tải app, mở ngay: {link}' },
    { en: '8 breweries. 8 stamps. 1 free hat.\nStart your Ale Trail passport at {name} tonight. Buy any beer, staff stamp you in, and you’re off.\n\nStart here: {link}',
      vi: '8 nhà máy bia. 8 con dấu. 1 mũ miễn phí.\nBắt đầu hộ chiếu Ale Trail tại {name} tối nay. Mua một ly bia bất kỳ, nhân viên đóng dấu, và bắt đầu hành trình.\n\nBắt đầu tại: {link}' },
    { en: "Saigon's craft-beer passport is here, and {name} is on it. Collect all 8 stamps across the city and the hat is yours. Cheers!\n{link}",
      vi: 'Hộ chiếu bia thủ công của Sài Gòn đã có, và {name} là một điểm dừng. Sưu tầm đủ 8 con dấu khắp thành phố để nhận mũ. Dô!\n{link}' },
  ],
  instagram: [
    { en: "Stamp #1 starts here {name} is on the Ho Chi Minh Ale Trail. Buy a beer, get stamped, collect all 8 for a free hat.\n\nLink in bio: hcm.thealetrail.app\n\n#HCMAleTrail #SaigonCraftBeer #CraftBeerVietnam #Saigon",
      vi: 'Con dấu đầu tiên bắt đầu từ đây {name} có mặt trên Ho Chi Minh Ale Trail. Mua bia, nhận dấu, sưu tầm đủ 8 để nhận mũ miễn phí.\n\nLink ở bio: hcm.thealetrail.app\n\n#HCMAleTrail #BiaThuCong #SaigonCraftBeer #SaiGon' },
    { en: '8 breweries. 8 stamps. 1 free hat. Swing by {name}, grab any beer and start your Ale Trail passport. No app store needed.\n\nhcm.thealetrail.app\n\n#HCMAleTrail #SaigonNights #CraftBeer',
      vi: '8 nhà máy bia. 8 con dấu. 1 mũ miễn phí. Ghé {name}, gọi một ly bia và bắt đầu hộ chiếu Ale Trail. Không cần tải app.\n\nhcm.thealetrail.app\n\n#HCMAleTrail #BiaThuCong #SaigonNights' },
  ],
  story: [
    { en: "We're on the Ale Trail Stamp here!", vi: 'Chúng mình có mặt trên Ale Trail Nhận dấu tại đây!' },
    { en: '1 of 8 stamps {name}', vi: '1 trong 8 con dấu {name}' },
    { en: 'Free hat for 8 stamps Start tonight', vi: 'Đủ 8 dấu nhận mũ miễn phí Bắt đầu tối nay' },
  ],
};
const SOURCE_LABEL = { tent: 'Table tent', poster: 'Poster', sticker: 'Sticker', story: 'Story', facebook: 'Facebook', instagram: 'Instagram', link: 'Plain link' };

export default function PromoteTab({ brewery }) {
  const t = useT();
  const [qrs, setQrs] = useState({});
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const [pick, setPick] = useState({ facebook: 0, instagram: 0, story: 0 });
  const [stats, setStats] = useState(null);
  const [spotText, setSpotText] = useState('');
  const [spot, setSpot] = useState('');
  const refs = useRef({});
  const name = brewery?.name || 'our bar';
  const logo = logoFor(brewery);

  useEffect(() => {
    if (!brewery?.id) return;
    let live = true;
    Promise.all(DESIGNS.map(async (d) => [d.key, await QRCode.toDataURL(trackedLink(brewery.id, spot ? `c-${spot}` : d.key), { margin: 0, width: 600, errorCorrectionLevel: 'M', color: { dark: '#111111', light: '#ffffff' } })]))
      .then((pairs) => { if (live) setQrs(Object.fromEntries(pairs)); });
    return () => { live = false; };
  }, [brewery?.id, spot]);
  useEffect(() => {
    if (!brewery?.id) return;
    let live = true;
    getVenueQrStats(brewery.id).then((r) => { if (live && r?.ok) setStats(r.venues?.[0] || null); });
    return () => { live = false; };
  }, [brewery?.id]);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3500); };
  const fileName = (d) => `ale-trail-${d.key}${spot ? `-${spot}` : ''}-${venueRef(brewery.id)}.png`;

  const render = async (d) => {
    const node = refs.current[d.key];
    node.classList.add('pr-exporting');
    try {
      const fontEmbedCSS = await printFontCss();
      return await toPng(node, { width: d.w, height: d.h, pixelRatio: d.ratio, cacheBust: true, fontEmbedCSS, style: { transform: 'none' } });
    } finally { node.classList.remove('pr-exporting'); }
  };
  const download = async (d) => {
    setBusy(d.key + ':dl');
    try {
      const url = await render(d);
      const a = document.createElement('a'); a.href = url; a.download = fileName(d); a.click();
      flash('✓ ' + t('Downloaded'));
    } catch { flash(t('Could not make the image. Please try again.')); }
    setBusy('');
  };
  const share = async (d) => {
    setBusy(d.key + ':sh');
    try {
      const url = await render(d);
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], fileName(d), { type: 'image/png' });
      const text = fill(COPY.story[0].en, d.key);
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], text });
      else { const a = document.createElement('a'); a.href = url; a.download = fileName(d); a.click(); flash(t('Sharing isn’t available here, so it was downloaded instead.')); }
    } catch (e) { if (e?.name !== 'AbortError') flash(t('Could not share. Please try again.')); }
    setBusy('');
  };
  const fill = (s, source) => s.trim().replaceAll('{name}', name).replaceAll('{link}', trackedLink(brewery.id, source));
  const copyText = async (s, what) => {
    try { await navigator.clipboard.writeText(s); flash('✓ ' + t('Copied') + (what ? ` · ${what}` : '')); }
    catch { flash(t('Could not copy. Select the text and copy it yourself.')); }
  };

  const ads = useMemo(() => ({
    facebook: COPY.facebook[pick.facebook % COPY.facebook.length],
    instagram: COPY.instagram[pick.instagram % COPY.instagram.length],
    story: COPY.story[pick.story % COPY.story.length],
  }), [pick]);

  if (!brewery?.id) return null;
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div className="admin-card">
        <h3 className="admin-card-title">{t('Bring guests onto the trail')}</h3>
        <p style={{ color: 'var(--admin-text-muted)', margin: '0 0 12px' }}>
          {t('Your own QR codes open the Ale Trail app (not just your page), so new guests can sign up and start collecting stamps. Each design has its own code, so you can see which one works best.')}
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <code style={{ fontSize: 13, padding: '6px 10px', borderRadius: 8, background: 'var(--admin-bg, rgba(0,0,0,.2))' }}>{trackedLink(brewery.id, 'link')}</code>
          <button type="button" className="admin-btn" style={{ width: 'auto' }} onClick={() => copyText(trackedLink(brewery.id, 'link'), t('App link'))}>{t('Copy app link')}</button>
          {msg && <span style={{ fontSize: 13, color: msg.startsWith('✓') ? 'var(--admin-success)' : 'var(--admin-danger)' }}>{msg}</span>}
        </div>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">{t('Where will you put it?')}</h3>
        <p style={{ color: 'var(--admin-text-muted)', margin: '0 0 12px' }}>{t('Optional. Name the spot, like "front window" or "Grab ad", and every design below gets a new code just for it. Your results then show each spot separately.')}</p>
        <form style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }} onSubmit={(e) => { e.preventDefault(); const slug = spotSlug(spotText); setSpot(slug); flash(slug ? '✓ ' + t('New codes made for') + ` "${spotText.trim()}"` : t('Using the standard codes')); }}>
          <input className="admin-form-input" style={{ maxWidth: 320 }} maxLength={40} value={spotText} onChange={(e) => setSpotText(e.target.value)} placeholder={t('e.g. Front window')} aria-label={t('Where will you put it?')} />
          <button type="submit" className="admin-btn admin-btn-primary settings-btn" style={{ width: 'auto' }}>{t('Make codes')}</button>
          {spot && <button type="button" className="admin-btn" style={{ width: 'auto' }} onClick={() => { setSpot(''); setSpotText(''); }}>{t('Back to standard codes')}</button>}
        </form>
        {spot && <p style={{ fontSize: 13, margin: '10px 0 0' }}>{t('Codes below are for:')} <b>{spotLabel(`c-${spot}`)}</b></p>}
      </div>

      <div className="pr-grid">
        {DESIGNS.map((d) => {
          const C = d.C;
          const qr = qrs[d.key];
          return (
            <div key={d.key} className="pr-card">
              <h4>{t(d.title)}</h4>
              <p className="pr-spec">{t(d.spec)}</p>
              <div className="pr-preview">
                <div className="pr-frame" style={{ width: d.w * d.preview, height: d.h * d.preview }}>
                  <div className="pr-scale" style={{ transform: `scale(${d.preview})` }}>
                    <div ref={(el) => { refs.current[d.key] = el; }} style={{ width: d.w, height: d.h }}>
                      {qr ? <C qr={qr} name={name} logo={logo} id={brewery.id} /> : null}
                    </div>
                  </div>
                </div>
              </div>
              <div className="pr-actions">
                <button type="button" className="admin-btn admin-btn-primary settings-btn" style={{ width: 'auto' }} disabled={!qr || !!busy} onClick={() => download(d)}>
                  {busy === d.key + ':dl' ? t('Preparing…') : t('Download')}
                </button>
                <button type="button" className="admin-btn" style={{ width: 'auto' }} disabled={!qr || !!busy} onClick={() => share(d)}>
                  {busy === d.key + ':sh' ? t('Preparing…') : t('Share')}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">{t('Ready-to-post copy')}</h3>
        <p style={{ color: 'var(--admin-text-muted)', margin: '0 0 12px' }}>{t('Copy, paste and post with your design. Links are tracked, so you can see how many guests each post brings in. Tap New version for different wording.')}</p>
        <div className="pr-copy">
          {[['facebook', 'Facebook post'], ['instagram', 'Instagram caption'], ['story', 'Story text']].map(([k, label]) => (
            <div key={k} className="pr-copybox">
              <h5>{t(label)}</h5>
              <pre>{fill(ads[k].en, k === 'story' ? 'story' : k)}</pre>
              <pre style={{ color: 'var(--admin-text-muted)' }}>{fill(ads[k].vi, k === 'story' ? 'story' : k)}</pre>
              <div className="pr-actions">
                <button type="button" className="admin-btn admin-btn-primary settings-btn" style={{ width: 'auto' }} onClick={() => copyText(fill(ads[k].en, k), 'English')}>{t('Copy English')}</button>
                <button type="button" className="admin-btn" style={{ width: 'auto' }} onClick={() => copyText(fill(ads[k].vi, k), 'Tiếng Việt')}>{t('Copy Vietnamese')}</button>
                <button type="button" className="admin-btn" style={{ width: 'auto' }} onClick={() => setPick((p) => ({ ...p, [k]: p[k] + 1 }))}>{t('New version')}</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-card">
        <h3 className="admin-card-title">{t('How your codes are doing')}</h3>
        <p style={{ color: 'var(--admin-text-muted)', margin: '0 0 12px' }}>{t('Scans are phones that opened one of your codes or links. Sign-ups are new guests who joined after scanning. First stamps are those who then collected a stamp anywhere on the trail.')}</p>
        {stats && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 14 }}>
              {[[t('Scans'), stats.total.scans], [t('Sign-ups'), stats.total.signups], [t('First stamps'), stats.total.firstStamps],
                [t('Scan to sign-up'), stats.total.scans ? `${Math.round((stats.total.signups / stats.total.scans) * 100)}%` : '—']].map(([label, value]) => (
                <div key={label} style={{ border: '1px solid var(--admin-border)', borderRadius: 12, padding: '10px 12px' }}>
                  <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{label}</div>
                  <div style={{ fontSize: 26, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
                </div>
              ))}
            </div>
            {stats.total.scans > 0 && (
              <div style={{ height: 220, marginBottom: 12 }} aria-label={t('Sign-ups by code')}>
                <ResponsiveContainer>
                  <BarChart data={stats.sources.filter((x) => x.scans > 0).map((x) => ({ name: x.source.startsWith('c-') ? spotLabel(x.source) : t(SOURCE_LABEL[x.source] || x.source), signups: x.signups, scans: x.scans }))} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--admin-border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--admin-text-muted)' }} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--admin-text-muted)' }} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(127,127,127,.12)' }} formatter={(v, k) => [v, k === 'signups' ? t('Sign-ups') : t('Scans')]} />
                    <Bar dataKey="signups" fill="var(--hq-accent, #E09A12)" radius={[4, 4, 0, 0]} maxBarSize={44} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
        {!stats ? <p style={{ color: 'var(--admin-text-muted)' }}>{t('No scans yet.')}</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table className="pr-stats">
              <thead><tr><th>{t('Code')}</th><th className="n">{t('Scans')}</th><th className="n">{t('Sign-ups')}</th><th className="n">{t('First stamps')}</th></tr></thead>
              <tbody>
                {stats.sources.map((s) => (
                  <tr key={s.source}><td>{s.source.startsWith('c-') ? spotLabel(s.source) : t(SOURCE_LABEL[s.source] || s.source)}</td><td className="n">{s.scans}</td><td className="n">{s.signups}</td><td className="n">{s.firstStamps}</td></tr>
                ))}
                <tr><td><b>{t('Total')}</b></td><td className="n"><b>{stats.total.scans}</b></td><td className="n"><b>{stats.total.signups}</b></td><td className="n"><b>{stats.total.firstStamps}</b></td></tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
