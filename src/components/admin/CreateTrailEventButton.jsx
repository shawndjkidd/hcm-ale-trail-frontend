import React, { useMemo, useState } from "react";

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

/**
 * Safe version:
 * - NEVER calls /api/admin/me
 * - Only does POST /api/admin/trails/:trailId/events
 * - Super-admin gating should happen in the parent UI (HQDashboard)
 */
export default function CreateTrailEventButton({
  trailId,
  onCreated,
  label = "+ Create Trail Event",
}) {
  const [busy, setBusy] = useState(false);

  const canUse = useMemo(() => {
    return typeof trailId === "string" && trailId.length > 10;
  }, [trailId]);

  async function onClick() {
    if (!canUse) return;

    const token = getToken();
    if (!token) {
      alert("Missing token. Please logout + login again.");
      return;
    }

    const titleEn = prompt("Trail-wide event title (EN):", "Trail-wide Event");
    if (!titleEn) return;
    const titleVn = prompt("Trail-wide event title (VN):", "Sự kiện toàn trail") || "";

    const startsAt = prompt("Starts at (ISO, e.g. 2026-03-03T12:00:00Z):", "");
    if (!startsAt) return;

    const endsAt = prompt("Ends at (ISO, optional):", "") || null;
    const link = prompt("Link (optional):", "") || null;
    const descEn = prompt("Description (EN, optional):", "") || "";
    const descVn = prompt("Description (VN, optional):", "") || "";

    setBusy(true);
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

      if (typeof onCreated === "function") await onCreated();
      alert("✅ Trail-wide event created");
    } catch (e) {
      alert(`❌ Failed: ${e?.message || "Unknown error"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={!canUse || busy}
      style={{
        padding: "8px 12px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.15)",
        background: "rgba(255,255,255,0.10)",
        color: "white",
        cursor: !canUse || busy ? "not-allowed" : "pointer",
        fontWeight: 700,
        opacity: !canUse || busy ? 0.6 : 1,
      }}
      title="Creates a trail-wide event (breweryId = null)"
    >
      {busy ? "Creating..." : label}
    </button>
  );
}
