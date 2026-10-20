// Self-hosted Anton + Be Vietnam Pro, inlined as data URLs so image and PDF downloads
// (html-to-image) can use them: the browser can't read Google's font files cross-origin.
let fontCssPromise = null;
export function printFontCss() {
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
