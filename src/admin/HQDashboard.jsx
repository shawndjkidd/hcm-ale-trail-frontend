import React, { useEffect, useMemo, useState } from "react";
import BreweriesAdmin from "./BreweriesAdmin";

const DEFAULT_TRAIL_ID = "89e5e2d6-090b-448a-8e53-6d05b731a921";

function getToken() {
  try {
    return (
      localStorage.getItem("hcm-admin-token") || localStorage.getItem("admin_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      ""
    );
  } catch {
    return "";
  }
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
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg =
      (json && (json.error || json.message)) ||
      `HTTP ${res.status} ${res.statusText}`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = json;
    throw err;
  }
  return json;
}

function fmtDT(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function HQDashboard({ trailId: trailIdProp }) {
  const trailId = trailIdProp || DEFAULT_TRAIL_ID;

  const [token, setToken] = useState("");
  const [me, setMe] = useState(null);
  const [overview, setOverview] = useState(null);
  const [events, setEvents] = useState([]);
  const [tab, setTab] = useState("overview"); // overview | events | breweries
  const [loading, setLoading] = useState({ me: false, overview: false, events: false });
  const [err, setErr] = useState("");

  const isSuperAdmin = me?.primaryRole === "super_admin";

  async function loadMe(tkn) {
    setLoading((s) => ({ ...s, me: true }));
    try {
      const json = await apiFetch("/api/admin/me", { token: tkn });
      setMe(json);
      return json;
    } finally {
      setLoading((s) => ({ ...s, me: false }));
    }
  }

  async function loadOverview(tkn) {
    setLoading((s) => ({ ...s, overview: true }));
    try {
      const json = await apiFetch(`/api/admin/trails/${trailId}/overview`, { token: tkn });
      setOverview(json);
      return json;
    } finally {
      setLoading((s) => ({ ...s, overview: false }));
    }
  }

  async function loadEvents(tkn) {
    setLoading((s) => ({ ...s, events: true }));
    try {
      const json = await apiFetch(`/api/admin/trails/${trailId}/events`, { token: tkn });
      setEvents(json?.events || []);
      return json;
    } finally {
      setLoading((s) => ({ ...s, events: false }));
    }
  }

  async function bootstrap() {
    const tkn = getToken();
    setToken(tkn);

    if (!tkn) {
      setErr("Missing token. Please login again (admin_token/token/access_token must be in localStorage).");
      return;
    }

    setErr("");
    try {
      const m = await loadMe(tkn);
      if (!m?.ok || !m?.isAdmin) {
        setErr("Not an admin account.");
        return;
      }

      // load these in parallel
      await Promise.all([loadOverview(tkn), loadEvents(tkn)]);
    } catch (e) {
      if (e?.status === 401) {
        setErr("401 Unauthorized. Token expired or missing. Logout + login again.");
      } else {
        setErr(e?.message || "Unknown error");
      }
    }
  }

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trailId]);

  const topBreweryCheckins = useMemo(() => {
    const rows = overview?.checkinsByBrewery || [];
    return rows.slice(0, 8);
  }, [overview]);

  async function createTrailWideEvent() {
    if (!isSuperAdmin) return;

    const titleEn = prompt("Trail-wide event title (EN):", "Trail-wide Event");
    if (!titleEn) return;
    const titleVn = prompt("Trail-wide event title (VN):", "Sự kiện toàn trail") || "";

    const startsAt = prompt("Starts at (ISO, e.g. 2026-03-03T12:00:00Z):", "");
    if (!startsAt) return;

    const endsAt = prompt("Ends at (ISO, optional):", "") || "";
    const link = prompt("Link (optional):", "") || "";
    const descEn = prompt("Description (EN, optional):", "") || "";
    const descVn = prompt("Description (VN, optional):", "") || "";

    try {
      await apiFetch(`/api/admin/trails/${trailId}/events`, {
        token,
        method: "POST",
        body: {
          title: { en: titleEn, vn: titleVn || undefined },
          description: { en: descEn || undefined, vn: descVn || undefined },
          starts_at: startsAt,
          ends_at: endsAt || undefined,
          link: link || undefined,
          status: "active",
        },
      });

      await loadEvents(token);
      setTab("events");
      alert("✅ Trail-wide event created");
    } catch (e) {
      alert(`❌ Failed: ${e?.message || "Unknown error"}`);
    }
  }

  return (
    <div className="admin-content">
      <div className="admin-header-row">
        <div>
          <div className="admin-page-title">HQ Dashboard</div>
          <div className="admin-subtle">
            Trail: <code>{trailId}</code>
          </div>
        </div>

        <div className="admin-header-actions">
          <button className="admin-btn" onClick={() => bootstrap()}>
            Refresh
          </button>
        </div>
      </div>

      {err ? <div className="admin-error">{err}</div> : null}

      <div className="admin-tabs" style={{ marginTop: 12 }}>
        <button
          className={`admin-tab ${tab === "overview" ? "active" : ""}`}
          onClick={() => setTab("overview")}
        >
          Overview
        </button>
        <button
          className={`admin-tab ${tab === "events" ? "active" : ""}`}
          onClick={() => setTab("events")}
        >
          Events
        </button>
        <button
          className={`admin-tab ${tab === "breweries" ? "active" : ""}`}
          onClick={() => setTab("breweries")}
        >
          Breweries
        </button>
      </div>

      {/* ===================== OVERVIEW TAB ===================== */}
      {tab === "overview" ? (
        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
          <div className="admin-kpi-grid">
            <div className="admin-kpi-card">
              <div className="admin-kpi-label">Check-ins</div>
              <div className="admin-kpi-value primary">{overview?.totals?.checkins ?? "—"}</div>
            </div>
            <div className="admin-kpi-card">
              <div className="admin-kpi-label">New participants</div>
              <div className="admin-kpi-value">{overview?.totals?.newParticipants ?? "—"}</div>
            </div>
            <div className="admin-kpi-card">
              <div className="admin-kpi-label">Hat claims</div>
              <div className="admin-kpi-value success">{overview?.totals?.hatClaims ?? "—"}</div>
            </div>
            <div className="admin-kpi-card">
              <div className="admin-kpi-label">Ratings</div>
              <div className="admin-kpi-value">
                {overview?.totals?.ratingsCount ?? "—"}{" "}
                <span className="admin-subtle">
                  ({overview?.totals?.ratingsAvg ?? "—"} avg)
                </span>
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <div className="admin-card-title">Completion</div>
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              <div>
                <strong>Completed:</strong> {overview?.completion?.completedCount ?? "—"}
              </div>
              <div>
                <strong>Completion rate:</strong> {overview?.completion?.completionRatePercent ?? "—"}%
              </div>
              <div>
                <strong>Avg time:</strong>{" "}
                {Number.isFinite(overview?.completion?.avgTimeToCompleteMs)
                  ? `${Math.round(overview.completion.avgTimeToCompleteMs / 60000)} min`
                  : "—"}
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <div className="admin-card-title">Top breweries by check-ins</div>
              <div className="admin-subtle">
                {(overview?.checkinsByBrewery || []).length} venues
              </div>
            </div>

            {topBreweryCheckins.length ? (
              <div style={{ display: "grid", gap: 8 }}>
                {topBreweryCheckins.map((b, idx) => (
                  <div
                    key={b.breweryId}
                    style={{ display: "flex", justifyContent: "space-between", gap: 10 }}
                  >
                    <div>
                      <strong>{idx + 1}.</strong> {b.breweryName}
                    </div>
                    <div className="admin-pill">{b.count}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-subtle">No data yet.</div>
            )}
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <div className="admin-card-title">Journey stats</div>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <div>
                <strong>Top starting breweries:</strong>{" "}
                {(overview?.journeyStats?.topStartingBreweries || [])
                  .slice(0, 3)
                  .map((x) => `${x.breweryName} (${x.count})`)
                  .join(" · ") || "—"}
              </div>
              <div>
                <strong>Top ending breweries:</strong>{" "}
                {(overview?.journeyStats?.topEndingBreweries || [])
                  .slice(0, 3)
                  .map((x) => `${x.breweryName} (${x.count})`)
                  .join(" · ") || "—"}
              </div>
              <div>
                <strong>Hat claim locations:</strong>{" "}
                {(overview?.journeyStats?.topHatClaimLocations || [])
                  .slice(0, 3)
                  .map((x) => `${x.breweryName} (${x.count})`)
                  .join(" · ") || "—"}
              </div>
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <div className="admin-card-title">Useful endpoints</div>
            </div>
            <div className="admin-subtle">
              <div>
                Admin leaderboard (emails): <code>/api/admin/trails/{trailId}/leaderboard</code>
              </div>
              <div>
                Participant export: <code>/api/admin/trails/{trailId}/participants/export?format=csv</code>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ===================== EVENTS TAB ===================== */}
      {tab === "events" ? (
        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
          <div className="admin-card">
            <div className="admin-card-header">
              <div className="admin-card-title">Events</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {isSuperAdmin ? (
                  <button className="admin-btn admin-btn-primary" onClick={createTrailWideEvent}>
                    + Create Trail Event
                  </button>
                ) : null}
                <button className="admin-btn" onClick={() => loadEvents(token)} disabled={loading.events}>
                  Refresh
                </button>
              </div>
            </div>

            {loading.events ? (
              <div className="admin-subtle">Loading events…</div>
            ) : events.length === 0 ? (
              <div className="admin-subtle">No events yet.</div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {events.map((e) => {
                  const title = e?.title?.en || e?.title?.vn || "Untitled";
                  const desc = e?.description?.en || e?.description?.vn || "";
                  const breweryLabel = e?.breweryName || (e?.breweryId ? "Brewery" : "Trail Event");

                  return (
                    <div key={e.id} className="admin-card" style={{ margin: 0 }}>
                      <div className="admin-card-header">
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                          <div className="admin-card-title">{title}</div>
                          <span className="admin-pill">{breweryLabel}</span>
                        </div>
                        <span className="admin-pill">{e.status || "—"}</span>
                      </div>

                      <div style={{ display: "grid", gap: 6 }}>
                        <div>
                          <strong>Starts:</strong> {fmtDT(e.startsAt)}
                        </div>
                        <div>
                          <strong>Ends:</strong> {e.endsAt ? fmtDT(e.endsAt) : "—"}
                        </div>
                        {e.link ? (
                          <div>
                            <strong>Link:</strong>{" "}
                            <a href={e.link} target="_blank" rel="noreferrer">
                              {e.link}
                            </a>
                          </div>
                        ) : null}
                        {desc ? <div className="admin-subtle">{desc}</div> : null}
                        <div className="admin-subtle">
                          id: <code>{e.id}</code>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* ===================== BREWERIES TAB ===================== */}
      {tab === "breweries" ? (
        <div style={{ marginTop: 12 }}>
          <BreweriesAdmin trailId={trailId} token={token} />
        </div>
      ) : null}
    </div>
  );
}
