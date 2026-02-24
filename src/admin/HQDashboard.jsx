import React, { useEffect, useMemo, useState } from "react";
import CreateTrailEventButton from "../components/admin/CreateTrailEventButton.jsx";

const DEFAULT_TRAIL_ID = "89e5e2d6-090b-448a-8e53-6d05b731a921";

function getStoredTrailId() {
  try {
    return (
      localStorage.getItem("trail_id") ||
      localStorage.getItem("trailId") ||
      DEFAULT_TRAIL_ID
    );
  } catch {
    return DEFAULT_TRAIL_ID;
  }
}

function getStoredToken() {
  try {
    return (
      localStorage.getItem("admin_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("hcm-access-token") ||
      ""
    );
  } catch {
    return "";
  }
}

function setStoredToken(token) {
  try {
    localStorage.setItem("admin_token", token);
    // keep compat for other screens that read "token"
    localStorage.setItem("token", token);
  } catch {}
}

async function apiFetch(path, { token, method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let json = null;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { ok: false, error: text || "Non-JSON response" };
  }

  if (!res.ok) {
    return { ok: false, status: res.status, ...json };
  }
  return json;
}

export default function HQDashboard({ trailId: trailIdProp }) {
  const trailId = useMemo(() => trailIdProp || getStoredTrailId(), [trailIdProp]);

  const [token, setToken] = useState(() => getStoredToken());
  const [tokenDraft, setTokenDraft] = useState("");
  const [admin, setAdmin] = useState(null);

  const [events, setEvents] = useState([]);
  const [eventsErr, setEventsErr] = useState("");
  const [loadingEvents, setLoadingEvents] = useState(false);

  const isSuperAdmin = admin?.primaryRole === "super_admin";

  async function loadAdmin() {
    const t = getStoredToken();
    setToken(t);

    if (!t) {
      setAdmin(null);
      return;
    }

    const me = await apiFetch("/api/admin/me", { token: t });
    if (me?.ok) {
      setAdmin(me);
    } else {
      setAdmin(null);
    }
  }

  async function loadEvents() {
    const t = getStoredToken();
    setToken(t);

    if (!trailId) {
      setEventsErr("Missing trailId.");
      setEvents([]);
      return;
    }
    if (!t) {
      setEventsErr("Missing token. Paste your admin token below (it will be saved).");
      setEvents([]);
      return;
    }

    setLoadingEvents(true);
    setEventsErr("");

    const res = await apiFetch(`/api/admin/trails/${trailId}/events?v=${Date.now()}`, {
      token: t,
    });

    if (res?.ok) {
      setEvents(res.events || []);
    } else {
      setEvents([]);
      setEventsErr(res?.error || "Failed to load events.");
    }

    setLoadingEvents(false);
  }

  useEffect(() => {
    loadAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trailId]);

  function saveToken() {
    const t = (tokenDraft || "").trim();
    if (!t) return;
    setStoredToken(t);
    setToken(t);
    setTokenDraft("");
    loadAdmin();
    loadEvents();
  }

  return (
    <div style={{ padding: 18 }}>
      <h1 style={{ margin: "0 0 12px" }}>HQ Dashboard</h1>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Trail</div>
          <div style={{ fontFamily: "monospace" }}>{trailId || "MISSING"}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Admin</div>
          <div>{admin?.email || "—"}</div>
        </div>
        <div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Role</div>
          <div>{admin?.primaryRole || "—"}</div>
        </div>
      </div>

      {!token ? (
        <div style={{ border: "1px solid rgba(255,255,255,0.15)", padding: 12, borderRadius: 8, marginBottom: 12 }}>
          <div style={{ marginBottom: 8, opacity: 0.9 }}>
            Missing token. Paste your admin token here (saved to localStorage as <code>admin_token</code>).
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={tokenDraft}
              onChange={(e) => setTokenDraft(e.target.value)}
              placeholder="Paste Bearer token here"
              style={{ flex: 1, padding: 10, borderRadius: 6, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "inherit" }}
            />
            <button onClick={saveToken} style={{ padding: "10px 12px", borderRadius: 6 }}>
              Save
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
            Tip: if you already logged in on the user app, we also try <code>hcm-access-token</code> automatically.
          </div>
        </div>
      ) : null}

      <div style={{ display: "flex", gap: 10, alignItems: "center", margin: "14px 0" }}>
        <h2 style={{ margin: 0 }}>Events</h2>
        <button onClick={loadEvents} disabled={loadingEvents} style={{ padding: "6px 10px", borderRadius: 6 }}>
          {loadingEvents ? "Loading…" : "Refresh"}
        </button>

        {isSuperAdmin ? (
          <div style={{ marginLeft: "auto" }}>
            <CreateTrailEventButton trailId={trailId} onCreated={loadEvents} />
          </div>
        ) : null}
      </div>

      {eventsErr ? (
        <div style={{ background: "#fff3cd", color: "#000", padding: 10, borderRadius: 6, marginBottom: 10 }}>
          {eventsErr}
        </div>
      ) : null}

      {events.length === 0 ? (
        <div style={{ opacity: 0.8 }}>No events yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {events.map((e) => (
            <div
              key={e.id}
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 10,
                padding: 12,
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
                <div style={{ fontWeight: 700 }}>
                  {e?.title?.en || e?.title?.vn || "(untitled)"}
                </div>
                <div style={{ opacity: 0.75 }}>
                  {e.breweryName || "Trail Event"}
                </div>
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
                <div style={{ marginTop: 8, opacity: 0.9 }}>
                  {e?.description?.en || e?.description?.vn}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
