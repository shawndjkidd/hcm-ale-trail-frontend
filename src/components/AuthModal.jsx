import { useState } from "react";
import { storeLoginTokens } from "../lib/api";
import translations from "../translations";

export default function AuthModal({ onSuccess, language = "en", setLanguage }) {
  const [mode, setMode] = useState("login"); // "login" | "register" | "forgot"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");

  const t = translations[language] || translations.en;

  const resetMessages = () => {
    setErr("");
    setInfo("");
  };

  const switchMode = (newMode) => {
    resetMessages();
    setConfirmPassword("");
    setMode(newMode);
  };

  // ── Login ────────────────────────────────────────────────────────────────
  const submitLogin = async (e) => {
    e?.preventDefault?.();
    resetMessages();
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

  // ── Register ─────────────────────────────────────────────────────────────
  const submitRegister = async (e) => {
    e?.preventDefault?.();
    resetMessages();

    if (!name.trim() || !email.trim() || !password) {
      setErr("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErr(t.passwordMismatch || "Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, name: name.trim() }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        const msg = data?.error || "Registration failed.";
        setErr(res.status === 409 ? "An account with that email already exists." : msg);
        return;
      }

      // Auto sign in with the same credentials
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const loginData = await loginRes.json().catch(() => null);

      if (!loginRes.ok || !loginData?.ok) {
        // Account created but login failed — switch to login mode
        setInfo("Account created! Please sign in.");
        switchMode("login");
        return;
      }

      storeLoginTokens(loginData);
      onSuccess?.(loginData);
    } catch (e) {
      setErr(e?.message || "Registration failed.");
    } finally {
      setBusy(false);
    }
  };

  // ── Forgot password ───────────────────────────────────────────────────────
  const submitForgot = async (e) => {
    e?.preventDefault?.();
    resetMessages();
    setBusy(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        setErr(data?.error || "Failed to send reset email. Please try again.");
        return;
      }

      setInfo(t.checkEmailForReset || "Check your email for a password reset link.");
    } catch (e) {
      setErr(e?.message || "Failed to send reset email. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="modal-overlay">
      <div className="welcome-modal">
        {setLanguage && (
          <div className="language-toggle">
            <button className={`flag-btn ${language === 'en' ? 'active' : ''}`} onClick={() => setLanguage('en')}>
              <img src="https://flagcdn.com/w80/us.png" alt="EN" className="flag-img-sm" />
            </button>
            <button className={`flag-btn ${language === 'vn' ? 'active' : ''}`} onClick={() => setLanguage('vn')}>
              <img src="https://flagcdn.com/w80/vn.png" alt="VN" className="flag-img-sm" />
            </button>
            <button className={`flag-btn ${language === 'kr' ? 'active' : ''}`} onClick={() => setLanguage('kr')}>
              <img src="https://flagcdn.com/w80/kr.png" alt="KR" className="flag-img-sm" />
            </button>
            <button className={`flag-btn ${language === 'jp' ? 'active' : ''}`} onClick={() => setLanguage('jp')}>
              <img src="https://flagcdn.com/w80/jp.png" alt="JP" className="flag-img-sm" />
            </button>
          </div>
        )}
        <img
          src="/logos/HCM Logo-Ale-Trail-2023-BK.png"
          alt="HCM Ale Trail"
          className="welcome-logo"
        />

        {/* ── Login mode ── */}
        {mode === "login" && (
          <>
            <h2 className="welcome-title">{t.signIn || "SIGN IN"}</h2>
            <p className="welcome-subtitle">
              {t.signInSubtitle || "Welcome back! Enter your details."}
            </p>

            <form onSubmit={submitLogin}>
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

              <button className="welcome-btn" type="submit" disabled={busy}>
                {busy ? (t.signingIn || "Signing in...") : (t.signIn || "SIGN IN")}
              </button>
            </form>

            <p style={{ textAlign: "center", marginTop: "0.75rem" }}>
              <button
                className="auth-link-btn"
                type="button"
                onClick={() => switchMode("forgot")}
              >
                {t.forgotPassword || "Forgot password?"}
              </button>
            </p>

            <p style={{ textAlign: "center", marginTop: "0.5rem" }}>
              <span style={{ opacity: 0.7, fontSize: "0.875rem" }}>{t.noAccount || "No account?"} </span>
              <button
                className="auth-link-btn"
                type="button"
                onClick={() => switchMode("register")}
              >
                {t.createOne || "Create one"}
              </button>
            </p>
          </>
        )}

        {/* ── Register mode ── */}
        {mode === "register" && (
          <>
            <h2 className="welcome-title">{t.createAccount || "CREATE ACCOUNT"}</h2>
            <p className="welcome-subtitle">{t.joinAleTrail || "Join the HCM Ale Trail!"}</p>

            <form onSubmit={submitRegister}>
              <div className="form-group">
                <label>{t.nameLabel || "Name"} *</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder={t.namePlaceholder || "Your name"}
                  value={name}
                  autoComplete="name"
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
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
                  autoComplete="new-password"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>{t.confirmPassword || "Confirm Password"} *</label>
                <input
                  type="password"
                  className="text-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  autoComplete="new-password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {err && <div className="form-error">{err}</div>}
              {info && <div className="form-info">{info}</div>}

              <button className="welcome-btn" type="submit" disabled={busy}>
                {busy ? "..." : (t.createAccount || "CREATE ACCOUNT")}
              </button>
            </form>

            <p style={{ textAlign: "center", marginTop: "0.75rem" }}>
              <span style={{ opacity: 0.7, fontSize: "0.875rem" }}>{t.alreadyHaveAccount || "Already have an account?"} </span>
              <button
                className="auth-link-btn"
                type="button"
                onClick={() => switchMode("login")}
              >
                {t.signIn || "Sign in"}
              </button>
            </p>
          </>
        )}

        {/* ── Forgot password mode ── */}
        {mode === "forgot" && (
          <>
            <h2 className="welcome-title">{t.resetPassword || "RESET PASSWORD"}</h2>
            <p className="welcome-subtitle">
              {t.resetPasswordSubtitle || "Enter your email and we'll send you a reset link."}
            </p>

            <form onSubmit={submitForgot}>
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

              {err && <div className="form-error">{err}</div>}
              {info && <div className="form-info">{info}</div>}

              <button className="welcome-btn" type="submit" disabled={busy || !!info}>
                {busy ? "..." : (t.sendResetLink || "SEND RESET LINK")}
              </button>
            </form>

            <p style={{ textAlign: "center", marginTop: "0.75rem" }}>
              <button
                className="auth-link-btn"
                type="button"
                onClick={() => switchMode("login")}
              >
                {t.backToSignIn || "← Back to sign in"}
              </button>
            </p>
          </>
        )}

        <p className="welcome-disclaimer">
          🍺 {t.signInDisclaimer || "Ready to continue your ale trail adventure?"}
        </p>
      </div>
    </div>
  );
}
