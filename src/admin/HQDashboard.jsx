import React, { useEffect, useMemo, useState } from "react";
import CreateTrailEventButton from "../components/admin/CreateTrailEventButton.jsx";

const DEFAULT_TRAIL_ID = "89e5e2d6-090b-448a-8e53-6d05b731a921";
const BUILD_TAG = "HQDashboard v2 (trailId fallback fix)";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readLS(key) {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function writeLS(key, val) {
  try {
    localStorage.setItem(key, val);
  } catch {}
}

function resolveTrailId(trailIdProp) {
  // Parent sometimes passes "MISSING" (truthy string) which breaks everything.
  // Only accept a prop if it looks like a UUID.
  if (typeof trailIdProp === "string" && UUID_RE.test(trailIdProp)) return trailIdProp;

  const fromLS = readLS("trail_id") || readLS("trailId");
  if (UUID_RE.test(fromLS)) return fromLS;

  return DEFAULT_TRAIL_ID;
}

function resolveToken() {
  return readLS("admin_token") || readLS("token") || readLS("hcm-access-token");
}

function persistToken(t) {
  writeLS("admin_token", t);
  writeLS("token", t); // keep compat
}

async function apiFetch(path, { token, method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { ok: false, error: text || "Non-JSON response" };
  }

  if (!res.ok) return { ok: false, status: res.status, ...json };
  return json;
}

export default function HQDashboard({ trailId: trailIdProp }) {
  const trailId = useMemo(() => resolveTrailId(trailIdProp), [trailIdProp]);

  const [token, setToken] = useState(() => resolveToken());
  const [tokenDraft, setTokenDraft] = useState("");
  const [admin, setAdmin] = useState(null);

  const [events, setEvents] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const isSuperAdmin = admin?.primaryRole === "super_admin";

  async function loadAdmin() {
    const t = resolveToken();
    setToken(t);
    if (!t) {
      setAdmin(null);
      return;
    }
    const me = await apiFetch("/api/admin/me", { token: t });
    if (me?.ok) setAdmin(me);
    else setAdmin(null);
  }

  async function loadEvents() {
    const t = resolveToken();
    setToken(t);

    if (!UUID_RE.test(trailId)) {
      setEvents([]);
      setErr("Invalid trailId. (Fix: set localStorage trail_id to a UUID.)");
      return;
    }
    if (!t) {
      setEvents([]);
      setErr("Missing token. Paste your admin token below.");
      return;
    }

    setLoading(true);
    setErr("");

    const res = await apiFetch(`/api/admin/trails/${trailId}/events?v=${Date.now()}`, {
      token: t,
    });

    if (res?.ok) setEvents(res.events || []);
    else {
      setEvents([]);
      setErr(res?.error || "Failed to load events.");
    }

    setLoading(false);
  }

  useEffect(() => {
    // Ensure trail_id exists in LS (helps other pages)
    writeLS("trail_id", trailId);
    loadAdmin();
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trailId]);

  function saveToken() {
    const t = tokenDraft.trim();
    if (!t) return;
    persistToken(t);
    setToken(t);
    setTokenDraft("");
    loadAdmin();
    loadEvents();
  }

  return (
    <div style={{ padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
        <h1 style={{ margin: 0 }}>HQ Dashboard</h1>
        <div style={{ fontSize: 12, opacity: 0.7 }}>{BUILD_TAG}</div>
      </div>

      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 10, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>Trail</div>
          <div style={{ fontFamily: "monospace" }}>{trailId}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>Admin</div>
          <div>{admin?.email || "—"}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, opacity: 0.75 }}>Role</div>
          <div>{admin?.primaryRole || "—"}</div>
        </div>
      </div>

      {!token ? (
        <div style={{ background: "#fff3cd", color: "#000", padding: 12, borderRadius: 8, marginBottom: 12 }}>
          <div style={{ marginBottom: 8 }}>
            Missing token. Paste your admin token (saved to localStorage as <code>admin_token</code>).
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={tokenDraft}
              onChange={(e) => setTokenDraft(e.target.value)}
              placeholder="Paste token here"
              style={{ flex: 1, padding: 10, borderRadius: 6, border: "1px solid rgba(0,0,0,0.2)" }}
            />
            <button onClick={saveToken} style={{ padding: "10px 12px", borderRadius: 6 }}>
              Save
            </button>
          </div>
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 10, alignItems: "center", margin: "14px 0" }}>
        <h2 style={{ margin: 0 }}>Events</h2>
        <button onClick={loadEvents} disabled={loading} style={{ padding: "6px 10px", borderRadius: 6 }}>
          {loading ? "Loading…" : "Refresh"}
        </button>

        {isSuperAdmin ? (
          <div style={{ marginLeft: "auto" }}>
            <CreateTrailEventButton trailId={trailId} onCreated={loadEvents} />
          </div>
        ) : null}
      </div>

      {err ? (
        <div style={{ background: "#fff3cd", color: "#000", padding: 10, borderRadius: 6, marginBottom: 10 }}>
          {err}
        </div>
      ) : null}

      {events.length === 0 ? (
        <div style={{ opacity: 0.8 }}>No events yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {events.map((e) => (
            <div key={e.id} style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: 12 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                <div style={{ fontWeight: 700 }}>{e?.title?.en || e?.title?.vn || "(untitled)"}</div>
                <div style={{ opacity: 0.75 }}>{e.breweryName || "Trail Event"}</div>
                <div style={{ marginLeft: "auto", opacity: 0.8 }}>
                  <code>{e.status}</code>
                </div>
              </div>

              <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
                <div>
                  Starts: <code>{e?.startsAt}</code>
                </div>
                {e?.endsAt ? (
                  <div>
                    Ends: <code>{e.endsAt}</code>
                  </div>
                ) : null}
                {e?.link ? (
                  <div>
                    Link:{" "}
                    <a href={e.link} target="_blank" rel="noreferrer">
                      {e.link}
                    </a>
                  </div>
                ) : null}
              </div>

              {e?.description?.en || e?.description?.vn ? (
                <div style={{ marginTop: 8, opacity: 0.9 }}>{e?.description?.en || e?.description?.vn}</div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
