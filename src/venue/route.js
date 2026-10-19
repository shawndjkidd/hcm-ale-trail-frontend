// /venue/<token>: a venue owner's private, read-only page. The token is a uuid; anything else
// is not a venue page (falls through to the normal app, which shows its own not-found handling).
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function venueTokenFromPath(pathname) {
  const m = /^\/venue\/([^/?#]+)\/?$/.exec(pathname || '');
  return m && UUID.test(m[1]) ? m[1].toLowerCase() : null;
}
