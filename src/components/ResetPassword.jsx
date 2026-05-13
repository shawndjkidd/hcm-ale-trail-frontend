import { useEffect, useState } from "react";
import { resetPassword } from "../lib/supabase";

export default function ResetPassword() {
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const at = params.get("access_token");
    const rt = params.get("refresh_token");
    setAccessToken(at);
    setRefreshToken(rt);
  }, []);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => {
      window.location.replace("/");
    }, 3000);
    return () => clearTimeout(timer);
  }, [success]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");

    if (!password) {
      setErr("Please enter a new password.");
      return;
    }
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }

    setBusy(true);
    const result = await resetPassword(accessToken, refreshToken, password);
    setBusy(false);

    if (!result.ok) {
      setErr(result.error || "Failed to update password. Please try again.");
      return;
    }

    setSuccess(true);
  };

  const invalidLink = !accessToken || !refreshToken;

  return (
    <div className="fullscreen-takeover-white">
      <div className="welcome-modal">
        <h2 className="welcome-title">RESET PASSWORD</h2>

        {invalidLink ? (
          <>
            <p className="welcome-subtitle">
              This reset link is invalid or has expired.
            </p>
            <p style={{ textAlign: "center", marginTop: "1rem" }}>
              <a href="/" style={{ fontWeight: "bold", color: "var(--red-primary)" }}>
                ← Back to home
              </a>
            </p>
          </>
        ) : success ? (
          <>
            <p className="welcome-subtitle" style={{ color: "var(--green-primary)", fontWeight: "bold" }}>
              Password updated! You can now sign in.
            </p>
            <p style={{ textAlign: "center", fontSize: "0.875rem", opacity: 0.7 }}>
              Redirecting you home in 3 seconds…
            </p>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>New Password *</label>
              <input
                type="password"
                className="text-input"
                placeholder="••••••••"
                value={password}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm Password *</label>
              <input
                type="password"
                className="text-input"
                placeholder="••••••••"
                value={confirm}
                autoComplete="new-password"
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            {err && <div className="form-error">{err}</div>}

            <button className="welcome-btn" type="submit" disabled={busy}>
              {busy ? "Updating…" : "SET NEW PASSWORD"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
