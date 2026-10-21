// Vercel Routing Middleware: gives each event's own link (/event/<name>-<id>) a proper
// link preview. Facebook, Zalo, WhatsApp and iMessage don't run the app, so the event's
// poster, name, date and place are written into the page here before it is sent.
// People get the same page and the app opens on that event. Unknown events fall through
// to the normal app.

export const config = { matcher: ['/event/:path*'] };

const BACKEND = 'https://hcm-ale-trail-backend-flm8.vercel.app';
const TZ = 'Asia/Ho_Chi_Minh';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pick = (v) => (v && typeof v === 'object' ? (v.en || v.vn || '') : String(v || ''));

export default async function middleware(request) {
  const url = new URL(request.url);
  const ref = url.pathname.split('/')[2] || '';
  try {
    const [pageRes, eventRes] = await Promise.all([
      fetch(new URL('/index.html', url)),
      fetch(`${BACKEND}/api/events/${encodeURIComponent(ref)}`),
    ]);
    if (!pageRes.ok || !eventRes.ok) return undefined;
    const data = await eventRes.json();
    const e = data?.event;
    if (!data?.ok || !e) return undefined;

    const title = pick(e.title) || 'HCM Ale Trail event';
    const start = new Date(e.startsAt);
    const when = `${start.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ })} · ${start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ })}`;
    const place = e.venueName || e.breweryName || 'HCM Ale Trail';
    const blurb = pick(e.description).replace(/\s+/g, ' ').trim();
    const description = `${when} · ${place}${blurb ? `. ${blurb.length > 150 ? `${blurb.slice(0, 147).trim()}…` : blurb}` : ''}`;
    const rawImage = e.photoUrl || e.venuePhotoUrl || '/icons/pint-512.png';
    const image = /^https:\/\//.test(rawImage) ? rawImage : new URL(rawImage.startsWith('/') ? rawImage : '/icons/pint-512.png', url).toString();

    const tags = [
      `<title>${esc(title)} · HCM Ale Trail</title>`,
      `<meta name="description" content="${esc(description)}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:site_name" content="HCM Ale Trail" />`,
      `<meta property="og:url" content="${esc(url.toString())}" />`,
      `<meta property="og:title" content="${esc(title)}" />`,
      `<meta property="og:description" content="${esc(description)}" />`,
      `<meta property="og:image" content="${esc(image)}" />`,
      `<meta property="og:image:alt" content="${esc(title)}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${esc(title)}" />`,
      `<meta name="twitter:description" content="${esc(description)}" />`,
      `<meta name="twitter:image" content="${esc(image)}" />`,
    ].join('\n    ');

    const html = (await pageRes.text())
      .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
      .replace(/<meta\s+(?:name="description"|property="og:[^"]+"|name="twitter:[^"]+")[^>]*>\s*/gi, '')
      .replace('</head>', `    ${tags}\n  </head>`);

    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch {
    return undefined;
  }
}
