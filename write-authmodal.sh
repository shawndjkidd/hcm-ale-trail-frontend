#!/usr/bin/env bash
set -euo pipefail

mkdir -p src/components

cat > src/components/AuthModal.jsx <<'EOT'
import { useState } from "react";

export default function AuthModal({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e?.preventDefault?.();
    setErr("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setErr(data?.error || "Login failed");
        setBusy(false);
        return;
      }

      onSuccess?.(data);
    } catch (e) {
      setErr(e?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="welcome-modal">
        <h2 style={{ marginBottom: 8 }}>Sign in</h2>
        <p style={{ marginTop: 0, opacity: 0.9 }}>Use your email + password</p>

        <form onSubmit={submit}>
          <div style={{ display: "grid", gap: 10 }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {err ? (
              <div style={{ color: "#ff6b6b", fontSize: 14 }}>{err}</div>
            ) : null}
            <button className="btn-primary" type="submit" disabled={busy}>
              {busy ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
EOT

echo "✅ Wrote: src/components/AuthModal.jsx"
