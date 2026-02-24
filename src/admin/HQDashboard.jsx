import React, { useEffect, useMemo, useState } from "react";
import CreateTrailEventButton from "../components/admin/CreateTrailEventButton";

function getTrailIdFromPropsOrEnv(trailId) {
  if (trailId) return trailId;
  return (
    (typeof window !== "undefined" && window.__TRAIL_ID__) ||
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_TRAIL_ID) ||
    null
  );
}

function getTokenFromStorage() {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("admin_token") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("admin_token") ||
    sessionStorage.getItem("token") ||
    null
  );
}

export default function HQDashboard({ trailId }) {
  const resolvedTrailId = useMemo(() => getTrailIdFromPropsOrEnv(trailId), [trailId]);

  const [token, setToken] = useState(null);
  const [me, setMe] = useState(null);

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsErr, setEventsErr] = useState(null);

  useEffect(() => {
    setToken(getTokenFromStorage());
  }, []);

  async function loadMe() {
    try {
      if (!token) return;
      const res = await fetch("/api/admin/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setMe(json);
    } catch {
      setMe(null);
    }
  }

  async function loadEvents() {
    try {
      setEventsErr(null);
      setEventsLoading(true);
      if (!token) throw new Error("Missing admin token (login first).");
      if (!resolvedTrailId) throw new Error("Missing trailId for HQ dashboard.");

      const res = await fetch(`/api/admin/trails/${resolvedTrailId}/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || `Failed: ${res.status}`);
      setEvents(json.events || []);
    } catch (e) {
      setEvents([]);
      setEventsErr(e?.message || String(e));
    } finally {
      setEventsLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    loadMe();
  }, [token]);

  useEffect(() => {
    if (!token || !resolvedTrailId) return;
    loadEvents();
  }, [token, resolvedTrailId]);

  const canCreateTrailWide =
    me?.ok &&
    me?.isAdmin &&
    (me?.primaryRole === "super_admin" ||
      (Array.isArray(me?.roles) && me.roles.some((r) => r?.role === "super_admin")));

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>HQ Dashboard</h1>
          <div style={{ opacity: 0.8, marginTop: 6 }}>
            Trail: <code>{resolvedTrailId || "MISSING"}</code>
          </div>
          <div style={{ opacity: 0.8, marginTop: 6 }}>
            Admin: <code>{me?.email || "…"}</code> — <code>{me?.primaryRole || "…"}</code>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={loadEvents} disabled={!token || !resolvedTrailId || eventsLoading}>
            {eventsLoading ? "Refreshing…" : "Refresh Events"}
          </button>

          {canCreateTrailWide ? (
            <CreateTrailEventButton trailId={resolvedTrailId} onCreated={loadEvents} />
          ) : null}
        </div>
      </div>

      <hr style={{ margin: "16px 0" }} />

      <h2 style={{ marginTop: 0 }}>Events</h2>

      {!token ? (
        <div style={{ padding: 12, background: "#fff3cd", border: "1px solid #ffeeba" }}>
          Missing token. Log in to admin first (token must be saved in localStorage as <code>admin_token</code> or <code>token</code>).
        </div>
      ) : null}

      {eventsErr ? (
        <div style={{ padding: 12, background: "#f8d7da", border: "1px solid #f5c6cb" }}>
          {eventsErr}
        </div>
      ) : null}

      <div style={{ marginTop: 12 }}>
        {eventsLoading ? (
          <div>Loading…</div>
        ) : events.length === 0 ? (
          <div style={{ opacity: 0.8 }}>No events yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {events.map((e) => (
              <div key={e.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <strong>{e?.title?.en || e?.title?.vn || "Untitled Event"}</strong>
                  <span style={{ opacity: 0.75 }}>{e?.status}</span>
                </div>

                <div style={{ marginTop: 6, opacity: 0.85 }}>
                  <div>
                    Brewery:{" "}
                    <code>{e?.breweryName || (e?.breweryId ? e.breweryId : "Trail Event")}</code>
                  </div>
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
    </div>
  );
}
