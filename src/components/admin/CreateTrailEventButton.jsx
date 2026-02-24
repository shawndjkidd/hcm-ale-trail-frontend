import React, { useEffect, useMemo, useState } from "react";

// Attempt to find a stored access token in common localStorage keys.
// If your app uses a different key, add it here.
function getAccessToken() {
  const keysToTry = [
    "access_token",
    "ACCESS_TOKEN",
    "token",
    "auth_token",
    "hcm_access_token",
    "aletrail_access_token",
    "supabase_access_token",
    "sb-access-token",
    "tokens", // sometimes tokens are stored as JSON
  ];

  for (const k of keysToTry) {
    const v = localStorage.getItem(k);
    if (!v) continue;

    // If it's JSON, try to extract access_token
    if (v.trim().startsWith("{")) {
      try {
        const obj = JSON.parse(v);
        if (obj?.access_token) return obj.access_token;
      } catch {}
    }

    // If it's raw JWT, return it
    if (v.split(".").length === 3) return v;
  }

  return null;
}

async function apiFetch(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch {}

  if (!res.ok) {
    const msg =
      json?.error ||
      json?.message ||
      `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.payload = json ?? text;
    throw err;
  }

  return json ?? {};
}

// SUPER ADMIN ONLY Create Trail Event button + modal.
// Props:
// - trailId (required)
// - onCreated(optional): callback after successful creation (e.g., refetch events)
export default function CreateTrailEventButton({ trailId, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState(null);
  const [meErr, setMeErr] = useState(null);

  const [open, setOpen] = useState(false);

  // Simple i18n JSON fields
  const [titleEn, setTitleEn] = useState("");
  const [titleVn, setTitleVn] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descVn, setDescVn] = useState("");

  const [startsAt, setStartsAt] = useState(""); // ISO or datetime-local-ish
  const [endsAt, setEndsAt] = useState("");
  const [link, setLink] = useState("");
  const [status, setStatus] = useState("active");

  const token = useMemo(() => (typeof window !== "undefined" ? getAccessToken() : null), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setMeErr(null);
        const json = await apiFetch("/api/admin/me", { token });
        if (!cancelled) setMe(json);
      } catch (e) {
        if (!cancelled) setMeErr(e?.message ?? String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const isSuperAdmin = me?.primaryRole === "super_admin";

  // If not super_admin, render nothing (or a tiny note if you prefer)
  if (!isSuperAdmin) return null;

  function normalizeDateTimeInput(v) {
    // Accept "2026-03-03T12:00" and convert to ISO Z if user didn't paste ISO.
    // If user pastes a real ISO with Z/+00:00, keep it.
    if (!v) return null;
    const trimmed = v.trim();
    if (trimmed.endsWith("Z") || trimmed.includes("+")) return trimmed;

    // Try parse as local datetime and convert to ISO string
    const d = new Date(trimmed);
    if (Number.isFinite(d.getTime())) return d.toISOString();

    return trimmed; // last resort
  }

  async function handleCreate() {
    if (!trailId) {
      alert("Missing trailId");
      return;
    }
    const starts = normalizeDateTimeInput(startsAt);
    if (!starts) {
      alert("starts_at is required");
      return;
    }

    const payload = {
      title: {
        en: titleEn || "Trail Event",
        vn: titleVn || "",
      },
      description: {
        en: descEn || "",
        vn: descVn || "",
      },
      starts_at: starts,
      ends_at: endsAt ? normalizeDateTimeInput(endsAt) : null,
      link: link || null,
      status: status || "active",
    };

    try {
      setLoading(true);
      await apiFetch(`/api/admin/trails/${trailId}/events`, {
        method: "POST",
        token,
        body: payload,
      });

      setOpen(false);

      // reset form
      setTitleEn("");
      setTitleVn("");
      setDescEn("");
      setDescVn("");
      setStartsAt("");
      setEndsAt("");
      setLink("");
      setStatus("active");

      if (typeof onCreated === "function") onCreated();
    } catch (e) {
      alert(e?.message ?? String(e));
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ margin: "12px 0" }}>
      {meErr ? (
        <div style={{ color: "crimson", marginBottom: 8 }}>
          Admin check failed: {meErr}
        </div>
      ) : null}

      <button
        onClick={() => setOpen(true)}
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid #ddd",
          background: "white",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        + Create Trail Event
      </button>

      {open ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 9999,
          }}
          onClick={() => !loading && setOpen(false)}
        >
          <div
            style={{
              width: "min(640px, 100%)",
              background: "white",
              borderRadius: 14,
              padding: 16,
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <h3 style={{ margin: 0 }}>Create Trail-wide Event</h3>
              <button
                onClick={() => !loading && setOpen(false)}
                style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 18 }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <p style={{ marginTop: 8, color: "#666" }}>
              This creates an event with <b>breweryId = null</b> (shows as <b>Trail Event</b>).
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span>Title (EN)</span>
                <input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} placeholder="e.g. Trail Launch Party" />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span>Title (VN)</span>
                <input value={titleVn} onChange={(e) => setTitleVn(e.target.value)} placeholder="e.g. Tiệc ra mắt" />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span>Starts At</span>
                <input value={startsAt} onChange={(e) => setStartsAt(e.target.value)} placeholder="2026-03-03T12:00:00Z" />
              </label>
              <label style={{ display: "grid", gap: 6 }}>
                <span>Ends At (optional)</span>
                <input value={endsAt} onChange={(e) => setEndsAt(e.target.value)} placeholder="2026-03-03T14:00:00Z" />
              </label>

              <label style={{ display: "grid", gap: 6, gridColumn: "1 / -1" }}>
                <span>Link (optional)</span>
                <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://example.com" />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span>Status</span>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="active">active</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span>Description (EN)</span>
                <textarea value={descEn} onChange={(e) => setDescEn(e.target.value)} rows={3} placeholder="Optional" />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span>Description (VN)</span>
                <textarea value={descVn} onChange={(e) => setDescVn(e.target.value)} rows={3} placeholder="Tùy chọn" />
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
              <button
                onClick={() => !loading && setOpen(false)}
                style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd", background: "white", cursor: "pointer" }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #111",
                  background: "#111",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Event"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
