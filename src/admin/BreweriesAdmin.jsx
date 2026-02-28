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

function safeStr(x) {
  return typeof x === "string" ? x : "";
}

function isValidPin(pin) {
  return /^\d{4}$/.test(pin);
}

function prettyJson(obj) {
  try {
    return JSON.stringify(obj ?? null, null, 2);
  } catch {
    return "";
  }
}

function parseJson(str) {
  if (!str || !str.trim()) return null;
  return JSON.parse(str);
}

function Badge({ tone = "neutral", children }) {
  const tones = {
    neutral: "admin-pill",
    success: "admin-pill admin-pill-success",
    danger: "admin-pill admin-pill-danger",
    warning: "admin-pill admin-pill-warning",
  };
  return <span className={tones[tone] || tones.neutral}>{children}</span>;
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="admin-modal-backdrop" onMouseDown={onClose}>
      <div className="admin-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="admin-modal-header">
          <div className="admin-modal-title">{title}</div>
          <button className="admin-btn admin-btn-ghost" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="admin-modal-body">{children}</div>
      </div>
    </div>
  );
}

export default function BreweriesAdmin({
  trailId: trailIdProp,
  token: tokenProp,
  onChanged,
}) {
  const trailId = trailIdProp || DEFAULT_TRAIL_ID;

  const [token, setToken] = useState(tokenProp || "");
  const [me, setMe] = useState(null);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState({ me: false, list: false, save: false });
  const [err, setErr] = useState("");

  // filters
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all|active|inactive

  // modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const isSuperAdmin = me?.primaryRole === "super_admin";

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return (rows || [])
      .filter((b) => {
        if (statusFilter !== "all" && b.status !== statusFilter) return false;
        if (!qq) return true;
        return (
          safeStr(b.name).toLowerCase().includes(qq) ||
          safeStr(b.district).toLowerCase().includes(qq) ||
          safeStr(b.address).toLowerCase().includes(qq) ||
          safeStr(b.id).toLowerCase().includes(qq)
        );
      })
      .sort((a, b) => safeStr(a.name).localeCompare(safeStr(b.name)));
  }, [rows, q, statusFilter]);

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

  async function loadBreweries(tkn) {
    setLoading((s) => ({ ...s, list: true }));
    setErr("");
    try {
      const json = await apiFetch(`/api/admin/trails/${trailId}/breweries`, {
        token: tkn,
      });
      setRows(json?.breweries || []);
      return json;
    } catch (e) {
      setRows([]);
      throw e;
    } finally {
      setLoading((s) => ({ ...s, list: false }));
    }
  }

  async function bootstrap() {
    const tkn = tokenProp || getToken();
    setToken(tkn);

    if (!tkn) {
      setErr("Missing token. Please login again (needs admin_token/token/access_token in localStorage).");
      return;
    }

    try {
      const m = await loadMe(tkn);
      if (!m?.ok || !m?.isAdmin) {
        setErr("Not an admin account.");
        return;
      }
      await loadBreweries(tkn);
    } catch (e) {
      setErr(e?.message || "Unknown error");
    }
  }

  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trailId]);

  function toneForStatus(status) {
    if (status === "active") return "success";
    if (status === "inactive") return "danger";
    return "neutral";
  }

  function openEdit(b) {
    setEditing({
      ...b,
      // editable fields
      name: b?.name ?? "",
      address: b?.address ?? "",
      district: b?.district ?? "",
      logoUrl: b?.logoUrl ?? "",
      status: b?.status ?? "active",
      pinCode: b?.pinCode ?? "",
      operatingHoursText: prettyJson(b?.operatingHours ?? null),
    });
    setEditOpen(true);
  }

  async function createBrewery(form) {
    if (!isSuperAdmin) return;

    const body = {
      name: form.name?.trim(),
      address: form.address?.trim() || null,
      district: form.district?.trim() || null,
      status: form.status || "active",
    };

    // backend expects pin_code snake if you pass it (it maps to pinCode in response)
    if (form.pinCode?.trim()) {
      if (!isValidPin(form.pinCode.trim())) {
        throw new Error("PIN must be exactly 4 digits.");
      }
      body.pin_code = form.pinCode.trim();
    }

    if (form.logoUrl?.trim()) body.logo_url = form.logoUrl.trim();

    if (form.operatingHoursText?.trim()) {
      body.operating_hours = parseJson(form.operatingHoursText);
    }

    setLoading((s) => ({ ...s, save: true }));
    try {
      await apiFetch(`/api/admin/trails/${trailId}/breweries`, {
        token,
        method: "POST",
        body,
      });
      await loadBreweries(token);
      if (typeof onChanged === "function") onChanged();
    } finally {
      setLoading((s) => ({ ...s, save: false }));
    }
  }

  async function updateBrewery(form) {
    if (!isSuperAdmin) return;

    const body = {
      name: form.name?.trim(),
      address: form.address?.trim() || null,
      district: form.district?.trim() || null,
      status: form.status || "active",
    };

    if (typeof form.logoUrl === "string") body.logo_url = form.logoUrl.trim() || null;

    // pin_code is constrained; only set if user changed it
    if (form.pinCode?.trim()) {
      if (!isValidPin(form.pinCode.trim())) {
        throw new Error("PIN must be exactly 4 digits.");
      }
      body.pin_code = form.pinCode.trim();
    } else {
      // allow clearing
      body.pin_code = null;
    }

    if (form.operatingHoursText?.trim()) {
      body.operating_hours = parseJson(form.operatingHoursText);
    } else {
      body.operating_hours = null;
    }

    setLoading((s) => ({ ...s, save: true }));
    try {
      await apiFetch(`/api/admin/breweries/${form.id}`, {
        token,
        method: "PUT",
        body,
      });
      await loadBreweries(token);
      if (typeof onChanged === "function") onChanged();
    } finally {
      setLoading((s) => ({ ...s, save: false }));
    }
  }

  async function softDelete(breweryId) {
    if (!isSuperAdmin) return;
    const ok = window.confirm("Soft delete? This sets status=inactive (you can re-activate later).");
    if (!ok) return;

    setLoading((s) => ({ ...s, save: true }));
    try {
      await apiFetch(`/api/admin/breweries/${breweryId}`, {
        token,
        method: "DELETE",
      });
      await loadBreweries(token);
      if (typeof onChanged === "function") onChanged();
    } finally {
      setLoading((s) => ({ ...s, save: false }));
    }
  }

  return (
    <div className="admin-content">
      <div className="admin-header-row">
        <div>
          <div className="admin-page-title">Breweries</div>
          <div className="admin-subtle">
            Trail: <code>{trailId}</code>
          </div>
        </div>

        <div className="admin-header-actions">
          <button className="admin-btn" onClick={() => bootstrap()} disabled={loading.list || loading.me}>
            Refresh
          </button>

          {isSuperAdmin ? (
            <button className="admin-btn admin-btn-primary" onClick={() => setCreateOpen(true)}>
              + New Brewery
            </button>
          ) : (
            <span className="admin-subtle">Super admin required to create/edit breweries.</span>
          )}
        </div>
      </div>

      {err ? <div className="admin-error">{err}</div> : null}

      <div className="admin-filters" style={{ marginTop: 10 }}>
        <input
          className="admin-input"
          placeholder="Search name / district / address / id"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="admin-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
        <div className="admin-subtle" style={{ marginLeft: "auto" }}>
          {loading.list ? "Loading…" : `${filtered.length} breweries`}
        </div>
      </div>

      <div className="admin-card" style={{ marginTop: 10 }}>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ minWidth: 220 }}>Name</th>
                <th style={{ minWidth: 170 }}>District</th>
                <th style={{ minWidth: 360 }}>Address</th>
                <th style={{ minWidth: 90 }}>PIN</th>
                <th style={{ minWidth: 110 }}>Status</th>
                <th style={{ minWidth: 260 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td>
                    <div style={{ fontWeight: 800 }}>{b.name}</div>
                    <div className="admin-subtle">
                      <code style={{ fontSize: 12 }}>{b.id}</code>
                    </div>
                  </td>
                  <td>{b.district || "—"}</td>
                  <td>{b.address || "—"}</td>
                  <td>{b.pinCode || "—"}</td>
                  <td>
                    <Badge tone={toneForStatus(b.status)}>{b.status || "—"}</Badge>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button className="admin-btn" onClick={() => openEdit(b)} disabled={!isSuperAdmin}>
                        Edit
                      </button>

                      {b.status !== "inactive" ? (
                        <button
                          className="admin-btn admin-btn-danger"
                          onClick={() => softDelete(b.id)}
                          disabled={!isSuperAdmin || loading.save}
                        >
                          Set inactive
                        </button>
                      ) : (
                        <button
                          className="admin-btn"
                          onClick={() => updateBrewery({ ...b, status: "active", pinCode: b.pinCode ?? "", operatingHoursText: prettyJson(b.operatingHours) })}
                          disabled={!isSuperAdmin || loading.save}
                          title="Re-activate"
                        >
                          Set active
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {!loading.list && filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-subtle">
                    No breweries found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE */}
      <Modal open={createOpen} title="Create Brewery" onClose={() => setCreateOpen(false)}>
        <BreweryForm
          mode="create"
          busy={loading.save}
          onCancel={() => setCreateOpen(false)}
          onSave={async (form) => {
            try {
              await createBrewery(form);
              setCreateOpen(false);
            } catch (e) {
              alert(`❌ ${e?.message || "Create failed"}`);
            }
          }}
        />
      </Modal>

      {/* EDIT */}
      <Modal open={editOpen} title="Edit Brewery" onClose={() => setEditOpen(false)}>
        <BreweryForm
          mode="edit"
          busy={loading.save}
          initial={editing}
          onCancel={() => setEditOpen(false)}
          onSave={async (form) => {
            try {
              await updateBrewery(form);
              setEditOpen(false);
            } catch (e) {
              alert(`❌ ${e?.message || "Update failed"}`);
            }
          }}
        />
      </Modal>
    </div>
  );
}

function BreweryForm({ mode, initial, busy, onCancel, onSave }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [district, setDistrict] = useState(initial?.district ?? "");
  const [logoUrl, setLogoUrl] = useState(initial?.logoUrl ?? "");
  const [status, setStatus] = useState(initial?.status ?? "active");
  const [pinCode, setPinCode] = useState(initial?.pinCode ?? "");
  const [operatingHoursText, setOperatingHoursText] = useState(initial?.operatingHoursText ?? "");

  useEffect(() => {
    setName(initial?.name ?? "");
    setAddress(initial?.address ?? "");
    setDistrict(initial?.district ?? "");
    setLogoUrl(initial?.logoUrl ?? "");
    setStatus(initial?.status ?? "active");
    setPinCode(initial?.pinCode ?? "");
    setOperatingHoursText(initial?.operatingHoursText ?? "");
  }, [initial]);

  return (
    <div className="admin-form">
      <div className="admin-form-grid">
        <label className="admin-label">
          Name *
          <input className="admin-input" value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <label className="admin-label">
          Status
          <select className="admin-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </label>

        <label className="admin-label" style={{ gridColumn: "1 / -1" }}>
          Address
          <input className="admin-input" value={address} onChange={(e) => setAddress(e.target.value)} />
        </label>

        <label className="admin-label">
          District
          <input className="admin-input" value={district} onChange={(e) => setDistrict(e.target.value)} />
        </label>

        <label className="admin-label">
          PIN (4 digits)
          <input
            className="admin-input"
            value={pinCode}
            onChange={(e) => setPinCode(e.target.value)}
            placeholder="1234"
          />
          <div className="admin-subtle" style={{ marginTop: 4 }}>
            If you set this, it must be exactly 4 digits (DB constraint).
          </div>
        </label>

        <label className="admin-label" style={{ gridColumn: "1 / -1" }}>
          Logo URL
          <input className="admin-input" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
        </label>

        <label className="admin-label" style={{ gridColumn: "1 / -1" }}>
          Operating Hours (JSON)
          <textarea
            className="admin-textarea"
            rows={10}
            value={operatingHoursText}
            onChange={(e) => setOperatingHoursText(e.target.value)}
            placeholder='{"monday":{"open":"11:00","close":"23:00","closed":false}}'
          />
          <div className="admin-subtle" style={{ marginTop: 6 }}>
            Leave empty to clear. Must be valid JSON.
          </div>
        </label>
      </div>

      <div className="admin-form-actions">
        <button className="admin-btn" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button
          className="admin-btn admin-btn-primary"
          onClick={() => {
            if (!name.trim()) {
              alert("Name is required.");
              return;
            }
            onSave({
              id: initial?.id,
              name,
              address,
              district,
              logoUrl,
              status,
              pinCode,
              operatingHoursText,
            });
          }}
          disabled={busy}
        >
          {busy ? "Saving…" : mode === "create" ? "Create" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
