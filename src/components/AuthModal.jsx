import { useState } from "react";
import { storeLoginTokens } from "../lib/api";
import translations from "../translations";

export default function AuthModal({ onSuccess, language = "en" }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const t = translations[language] || translations.en;

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
        setErr(data?.error || t.loginFailed || "Login failed");
        return;
      }

      storeLoginTokens(data);
      onSuccess?.(data);
    } catch (e) {
      setErr(e?.message || t.loginFailed || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="welcome-modal">
        {/* Logo */}
        <img 
          src="/logos/HCM Logo-Ale-Trail-2023-BK.png" 
          alt="HCM Ale Trail" 
          className="welcome-logo"
        />
        
        <h2 className="welcome-title">{t.signIn || "SIGN IN"}</h2>
        <p className="welcome-subtitle">{t.signInSubtitle || "Welcome back! Enter your details."}</p>

        <form onSubmit={submit}>
          <div className="form-group">
            <label>{t.yourEmail || "Email"} *</label>
            <input
              type="email"
              className="text-input"
              placeholder="you@example.com"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>{t.password || "Password"} *</label>
            <input
              type="password"
              className="text-input"
              placeholder="••••••••"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {err && <div className="form-error">{err}</div>}

          <button 
            className="welcome-btn" 
            type="submit" 
            disabled={busy}
          >
            {busy ? (t.signingIn || "Signing in...") : (t.signIn || "SIGN IN")}
          </button>
        </form>

        <p className="welcome-disclaimer">
          🍺 {t.signInDisclaimer || "Ready to continue your ale trail adventure?"}
        </p>
      </div>
    </div>
  );
}