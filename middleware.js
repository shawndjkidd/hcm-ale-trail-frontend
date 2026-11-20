// Vercel Routing Middleware: gives each event's own link (/event/<name>-<id>) a proper
// link preview. Facebook, Zalo, WhatsApp and iMessage don't run the app, so the event's
// poster, name, date and place are written into the page here before it is sent.
// People get the same page and the app opens on that event. Unknown events fall through
// to the normal app.

export const config = { matcher: ['/event/:path*', '/admin', '/admin/:path*'] };

const BACKEND = 'https://hcm-ale-trail-backend-flm8.vercel.app';
const TZ = 'Asia/Ho_Chi_Minh';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pick = (v) => (v && typeof v === 'object' ? (v.en || v.vn || '') : String(v || ''));

export default async function middleware(request) {
  const url = new URL(request.url);
  if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) return adminPage(url);
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

// The dashboard (/admin) gets its own home-screen settings in the page itself. Phones read these
// when the page loads, before the app's code runs, so "Add to Home Screen" opens the dashboard
// (named Trail Admin) instead of the guest app.
async function adminPage(url) {
  try {
    const pageRes = await fetch(new URL('/index.html', url));
    if (!pageRes.ok) return undefined;
    const html = (await pageRes.text())
      .replace(/<title>[\s\S]*?<\/title>/i, '<title>Trail Admin · HCM Ale Trail</title>')
      .replace(/(<link id="app-manifest" rel="manifest" href=")[^"]*(")/, '$1/manifest-admin.webmanifest$2')
      .replace(/(<link id="app-touch-icon" rel="apple-touch-icon" href=")[^"]*(")/, '$1/icons/hcm-180.png$2')
      .replace(/(<meta name="apple-mobile-web-app-title" content=")[^"]*(")/, '$1Trail Admin$2')
      .replace(/(<meta name="theme-color" content=")[^"]*(")/, '$1#0E0F11$2')
      // A solid status bar: the dashboard starts below the clock instead of underneath it.
      .replace(/(<meta name="apple-mobile-web-app-status-bar-style" content=")[^"]*(")/, '$1black$2')
      // No pinch or tap zoom on the dashboard: a zoomed page slides around on a phone.
      .replace(/(<meta name="viewport" content=")[^"]*(")/, '$1width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover$2');
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate' } });
  } catch {
    return undefined;
  }
}
