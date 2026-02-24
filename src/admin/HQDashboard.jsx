import React, { useEffect, useMemo, useState } from "react";

const DEFAULT_TRAIL_ID = "89e5e2d6-090b-448a-8e53-6d05b731a921";

function getToken() {
  try {
    return (
      localStorage.getItem("admin_token") ||
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

function Badge({ children }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.15)",
        background: "rgba(255,255,255,0.06)",
        fontSize: 12,
        lineHeight: "18px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function Card({ title, right, children }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.10)",
        background: "rgba(0,0,0,0.18)",
        borderRadius: 14,
        padding: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 10,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 0.2 }}>
          {title}
        </div>
        {right ? <div style={{ opacity: 0.9 }}>{right}</div> : null}
      </div>
      {children}
    </div>
  );
}

export default function HQDashboard({ trailId: trailIdProp }) {
  const trailId = trailIdProp || DEFAULT_TRAIL_ID;

  const [token, setToken] = useState("");
  const [me, setMe] = useState(null);
  const [overview, setOverview] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState({ me: false, overview: false, events: false });
  const [err, setErr] = useState("");

  const isSuperAdmin = me?.primaryRole === "super_admin";

  async function loadMe(tkn) {
    setLoading((s) => ({ ...s, me: true }));
    setErr("");
    try {
      const json = await apiFetch("/api/admin/me", { token: tkn });
      setMe(json);
      return json;
    } catch (e) {
      setMe(null);
      throw e;
    } finally {
      setLoading((s) => ({ ...s, me: false }));
    }
  }

  async function loadOverview(tkn) {
    setLoading((s) => ({ ...s, overview: true }));
    setErr("");
    try {
      const json = await apiFetch(`/api/admin/trails/${trailId}/overview`, { token: tkn });
      setOverview(json);
    } finally {
      setLoading((s) => ({ ...s, overview: false }));
    }
  }

  async function loadEvents(tkn) {
    setLoading((s) => ({ ...s, events: true }));
    setErr("");
    try {
      const json = await apiFetch(`/api/admin/trails/${trailId}/events`, { token: tkn });
      setEvents(json?.events || []);
    } finally {
      setLoading((s) => ({ ...s, events: false }));
    }
  }

  async function bootstrap() {
    const tkn = getToken();
    setToken(tkn);

    if (!tkn) {
      setErr("Missing token. Please login again (token must be saved in localStorage as admin_token or token).");
      return;
    }

    try {
      const m = await loadMe(tkn);
      if (!m?.ok || !m?.isAdmin) {
        setErr("Not an admin account.");
        return;
      }
      await Promise.all([loadOverview(tkn), loadEvents(tkn)]);
    } catch (e) {
      if (e?.status === 401) {
        setErr("401 Unauthorized. Your saved token is missing/expired. Logout and login again.");
      } else {
        setErr(e?.message || "Unknown error");
      }
    }
  }

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trailId]);

  async function createTrailEvent() {
    if (!isSuperAdmin) return;

    const titleEn = prompt("Trail-wide event title (EN):", "Trail-wide Event");
    if (!titleEn) return;
    const titleVn = prompt("Trail-wide event title (VN):", "Sự kiện toàn trail") || "";

    const startsAt = prompt("Starts at (ISO, e.g. 2026-03-03T12:00:00Z):", "");
    if (!startsAt) return;

    const endsAt = prompt("Ends at (ISO, optional):", "") || null;
    const link = prompt("Link (optional):", "") || null;
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
      alert("✅ Trail-wide event created");
    } catch (e) {
      alert(`❌ Failed: ${e?.message || "Unknown error"}`);
    }
  }

  const topBreweryCheckins = useMemo(() => {
    const rows = overview?.checkinsByBrewery || [];
    return rows.slice(0, 8);
  }, [overview]);

  return (
    <div style={{ padding: 18, maxWidth: 1100 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 32, letterSpacing: 0.3 }}>HQ Dashboard</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => bootstrap()}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <Card title="Trail" right={<Badge>{trailId}</Badge>}>
          <div style={{ opacity: 0.9, fontSize: 13 }}>
            {overview?.range?.from ? (
              <>
                Range: <code>{overview.range.from}</code> → <code>{overview.range.to}</code>
              </>
            ) : (
              <>Loading…</>
            )}
          </div>
        </Card>

        <Card title="Admin" right={me?.primaryRole ? <Badge>{me.primaryRole}</Badge> : null}>
          <div style={{ opacity: 0.9, fontSize: 13 }}>
            {me?.email ? (
              <>
                <div><strong>{me.email}</strong></div>
                <div style={{ marginTop: 4, opacity: 0.85 }}>
                  Roles: {(me.roles || []).map((r) => r.role).join(", ") || "—"}
                </div>
              </>
            ) : (
              <>Loading…</>
            )}
          </div>
        </Card>

        <Card title="Status" right={err ? <Badge>Needs Attention</Badge> : <Badge>OK</Badge>}>
          <div style={{ fontSize: 13, opacity: err ? 1 : 0.9 }}>
            {err ? err : "All endpoints reachable."}
          </div>
        </Card>
      </div>

      <div style={{ height: 14 }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Card title="Totals">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
            <div><strong>Check-ins</strong>: {overview?.totals?.checkins ?? "—"}</div>
            <div><strong>New participants</strong>: {overview?.totals?.newParticipants ?? "—"}</div>
            <div><strong>Hat claims</strong>: {overview?.totals?.hatClaims ?? "—"}</div>
            <div><strong>Ratings</strong>: {overview?.totals?.ratingsCount ?? "—"} ({overview?.totals?.ratingsAvg ?? "—"} avg)</div>
          </div>
        </Card>

        <Card title="Completion">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
            <div><strong>Completed</strong>: {overview?.completion?.completedCount ?? "—"}</div>
            <div><strong>Completion rate</strong>: {overview?.completion?.completionRatePercent ?? "—"}%</div>
            <div style={{ gridColumn: "1 / -1" }}>
              <strong>Avg time</strong>:{" "}
              {Number.isFinite(overview?.completion?.avgTimeToCompleteMs)
                ? `${Math.round(overview.completion.avgTimeToCompleteMs / 60000)} min`
                : "—"}
            </div>
          </div>
        </Card>

        <Card title="Top breweries by check-ins" right={<Badge>{(overview?.checkinsByBrewery || []).length} venues</Badge>}>
          {topBreweryCheckins.length ? (
            <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
              {topBreweryCheckins.map((b, idx) => (
                <div key={b.breweryId} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ opacity: 0.95 }}>
                    <strong>{idx + 1}.</strong> {b.breweryName}
                  </div>
                  <Badge>{b.count}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ opacity: 0.8, fontSize: 13 }}>No data yet.</div>
          )}
        </Card>

        <Card title="Journey stats">
          <div style={{ fontSize: 13, display: "grid", gap: 8 }}>
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
        </Card>
      </div>

      <div style={{ height: 16 }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>Events</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {isSuperAdmin ? (
            <button
              onClick={createTrailEvent}
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.10)",
                color: "white",
                cursor: "pointer",
                fontWeight: 700,
              }}
              title="Creates a trail-wide event (breweryId = null)"
            >
              + Create Trail Event
            </button>
          ) : null}

          <button
            onClick={() => loadEvents(token)}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
              color: "white",
              cursor: "pointer",
            }}
          >
            Refresh Events
          </button>
        </div>
      </div>

      <div style={{ height: 10 }} />

      {loading.events ? (
        <div style={{ opacity: 0.85 }}>Loading events…</div>
      ) : events.length === 0 ? (
        <div style={{ opacity: 0.85 }}>No events yet.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {events.map((e) => {
            const title = e?.title?.en || e?.title?.vn || "Untitled";
            const desc = e?.description?.en || e?.description?.vn || "";
            const breweryLabel = e?.breweryName || (e?.breweryId ? "Brewery" : "Trail Event");

            return (
              <div
                key={e.id}
                style={{
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(0,0,0,0.18)",
                  borderRadius: 14,
                  padding: 14,
                  display: "grid",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ fontSize: 16, fontWeight: 900 }}>{title}</div>
                    <Badge>{breweryLabel}</Badge>
                  </div>
                  <Badge>{e.status || "—"}</Badge>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13, opacity: 0.95 }}>
                  <div><strong>Starts</strong>: {fmtDT(e.startsAt)}</div>
                  <div><strong>Ends</strong>: {e.endsAt ? fmtDT(e.endsAt) : "—"}</div>
                </div>

                {e.link ? (
                  <div style={{ fontSize: 13 }}>
                    <strong>Link</strong>:{" "}
                    <a href={e.link} target="_blank" rel="noreferrer" style={{ color: "#7dd3fc" }}>
                      {e.link}
                    </a>
                  </div>
                ) : null}

                {desc ? <div style={{ fontSize: 13, opacity: 0.92 }}>{desc}</div> : null}

                <div style={{ fontSize: 12, opacity: 0.65 }}>
                  id: <code>{e.id}</code>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
