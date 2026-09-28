// Anonymous app analytics: views and taps, batched and sent to /track.
// Never blocks the UI and never throws. Venue impressions count once per session.
import { API_BASE, TRAIL_ID } from "../config";
import { getAccessToken } from "./api";

const QUEUE = [];
const SEEN = new Set();
const FLUSH_MS = 8000;
let timer = null;

function sessionId() {
  try {
    let id = sessionStorage.getItem("hcm-track-session");
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`);
      sessionStorage.setItem("hcm-track-session", id);
    }
    return id;
  } catch {
    return `nosession-${Date.now()}`;
  }
}

const enabled = () => typeof window !== "undefined" && !import.meta.env?.DEV && !/^(localhost|127\.)/.test(location.hostname);

// Local testing: localStorage "hcm-track-debug" = "1" collects events in window.__trackLog instead of sending.
const debug = () => { try { return localStorage.getItem("hcm-track-debug") === "1"; } catch { return false; } };

export function flush() {
  if (QUEUE.length && debug()) { (window.__trackLog ||= []).push(...QUEUE.splice(0)); return; }
  if (!QUEUE.length || !enabled()) { QUEUE.length = 0; return; }
  const events = QUEUE.splice(0, 50);
  try {
    const token = getAccessToken();
    fetch(`${API_BASE}/trails/${TRAIL_ID}/track`, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ sessionId: sessionId(), events }),
    }).catch(() => {});
  } catch {}
  if (QUEUE.length) flush();
}

export function track(name, props = {}) {
  try {
    QUEUE.push({ name, props, at: new Date().toISOString() });
    if (QUEUE.length >= 40) flush();
    else if (!timer) timer = setTimeout(() => { timer = null; flush(); }, FLUSH_MS);
  } catch {}
}

/** Same as track, but only the first time per session for this key. */
export function trackOnce(key, name, props) {
  if (SEEN.has(key)) return;
  SEEN.add(key);
  track(name, props);
}

if (typeof window !== "undefined") {
  const out = () => { if (document.visibilityState === "hidden") flush(); };
  document.addEventListener("visibilitychange", out);
  window.addEventListener("pagehide", flush);
}
