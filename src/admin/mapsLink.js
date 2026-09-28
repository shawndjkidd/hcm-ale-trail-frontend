// Pull coordinates out of a pasted Google Maps link when it contains them
// (…/@10.79,106.71,17z… or …?q=10.79,106.71). Short share links don't, so those need the numbers typed in.
export function coordsFromMapsLink(link) {
  const s = String(link || '');
  const m = s.match(/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/) || s.match(/[?&](?:q|query|destination)=(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/)
    || s.match(/!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/);
  return m ? { latitude: m[1], longitude: m[2] } : null;
}
