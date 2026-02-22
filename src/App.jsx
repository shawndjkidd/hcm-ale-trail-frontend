import { useEffect, useRef, useState } from "react";
import HomePage from "./components/HomePage";
import BreweryDetail from "./components/BreweryDetail";
import FAQ from "./components/FAQ";
import MyBeers from "./components/MyBeers";
import WelcomeModal from "./components/WelcomeModal";
import Leaderboard from "./components/Leaderboard";
import AuthModal from "./components/AuthModal";

import translations from "./translations";
import { recordCheckin } from "./lib/supabase";
import { TRAIL_ID } from "./config";
import { getBreweries, getMe, logout as apiLogout } from "./lib/api";

import "./styles/App.css";

// Accepts BOTH:
// - /brewery/<uuid>
// - ?brewery=<uuid> (legacy)
function parseBreweryFromUrl() {
  try {
    const path = window.location.pathname || "/";
    const parts = path.split("/").filter(Boolean);

    // /brewery/<uuid>
    if (parts.length >= 2 && parts[0] === "brewery") {
      const id = parts[1];
      if (id && id.length >= 10) return id;
    }

    // legacy: ?brewery=<uuid>
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get("brewery");
    if (q && q.length >= 10) return q;

    return null;
  } catch {
    return null;
  }
}

// Normalizes backend brewery shape → what the old UI expects
function normalizeBrewery(b) {
  const descObj = b?.description && typeof b.description === "object" ? b.description : null;
  return {
    ...b,
    // old UI expects string here (React error #31 happens if this is an object)
    description: typeof b?.description === "string" ? b.description : (descObj?.en || ""),
    // keep original translations in case you want them later
    description_i18n: descObj || null,
    // old UI sometimes expects logo_url to exist
    logo_url: b?.logo_url ?? null,
  };
}

export default function App() {
  const [stamps, setStamps] = useState([]);
  const [beers, setBeers] = useState([]);
  const [breweries, setBreweries] = useState([]);

  const [selectedBrewery, setSelectedBrewery] = useState(null);
  const [view, setView] = useState("home");
  const [language, setLanguage] = useState("en");
  const [qrValidated, setQrValidated] = useState(false);

  const [user, setUser] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const [timerStart, setTimerStart] = useState(null);
  const [timerEnd, setTimerEnd] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);

  const pendingQR = useRef(null);
  const t = translations[language];

  // HARD "go home" (state + URL)
  const goHome = () => {
    setSelectedBrewery(null);
    setQrValidated(false);
    setView("home");

    try {
      window.history.pushState({}, "", "/");
    } catch {}
  };

  // Load breweries from backend
  const loadBreweries = async () => {
    const r = await getBreweries(TRAIL_ID);
    if (r?.ok && Array.isArray(r?.breweries)) {
      const normalized = r.breweries.map(normalizeBrewery);
      setBreweries(normalized);
      return normalized;
    }
    return [];
  };

  // If signed in, load /me and set stamps from backend progress
  const loadMe = async () => {
    const r = await getMe(TRAIL_ID);
    if (r?.ok) {
      // stamps should match backend truth
      if (Array.isArray(r.checkedInBreweryIds)) {
        setStamps(r.checkedInBreweryIds);
        localStorage.setItem("hcm-stamps", JSON.stringify(r.checkedInBreweryIds));
      }
      return r;
    }
    return null;
  };

  useEffect(() => {
    const savedStamps = localStorage.getItem("hcm-stamps");
    const savedBeers = localStorage.getItem("hcm-beers");
    const savedLang = localStorage.getItem("hcm-language");
    const savedUser = localStorage.getItem("hcm-user");
    const savedTimerStart = localStorage.getItem("hcm-timer-start");
    const savedTimerEnd = localStorage.getItem("hcm-timer-end");
    const savedLeaderboard = localStorage.getItem("hcm-leaderboard");

    if (savedStamps) setStamps(JSON.parse(savedStamps));
    if (savedBeers) setBeers(JSON.parse(savedBeers));
    if (savedLang) setLanguage(savedLang);
    if (savedTimerStart) setTimerStart(parseInt(savedTimerStart, 10));
    if (savedTimerEnd) setTimerEnd(parseInt(savedTimerEnd, 10));
    if (savedLeaderboard) setLeaderboardData(JSON.parse(savedLeaderboard));

    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setShowWelcome(false);
      setShowAuth(false);
    } else {
      // keep your existing welcome behavior
      setShowWelcome(true);
    }

    // Always load breweries (needed for deep links)
    loadBreweries().then((list) => {
      const breweryId = parseBreweryFromUrl();
      if (!breweryId) return;

      const brewery = list.find((b) => b.id === breweryId);
      if (!brewery) return;

      pendingQR.current = { brewery, breweryId };

      // If you’re already signed in, open brewery page directly
      const u = savedUser ? JSON.parse(savedUser) : null;
      if (u) {
        setSelectedBrewery(brewery);
        setQrValidated(true);
        setView("brewery");
        setUser(u);
        setShowWelcome(false);
        setShowAuth(false);
      } else {
        // not signed in → show auth modal
        setShowAuth(true);
        setShowWelcome(false);
      }
    });

    // Sync UI with browser back/forward
    const onPop = () => {
      const id = parseBreweryFromUrl();
      if (id) {
        const b = breweries.find((x) => x.id === id);
        if (b) {
          setSelectedBrewery(b);
          setView("brewery");
          return;
        }
      }
      setSelectedBrewery(null);
      setView("home");
    };

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem("hcm-stamps", JSON.stringify(stamps));
  }, [stamps]);

  useEffect(() => {
    localStorage.setItem("hcm-beers", JSON.stringify(beers));
  }, [beers]);

  useEffect(() => {
    localStorage.setItem("hcm-language", language);
  }, [language]);

  const handleUserRegistration = (userData) => {
    setUser(userData);
    localStorage.setItem("hcm-user", JSON.stringify(userData));
    setShowWelcome(false);

    if (pendingQR.current) {
      setSelectedBrewery(pendingQR.current.brewery);
      setQrValidated(true);
      setView("brewery");
      pendingQR.current = null;
    }
  };

  const addStamp = async (breweryId) => {
    if (!stamps.includes(breweryId)) {
      const newStamps = [...stamps, breweryId];
      setStamps(newStamps);

      if (user?.id) {
        try {
          const { error } = await recordCheckin(user.id, breweryId, "qr_scan");
          if (error) console.log("Error saving check-in to Supabase:", error);
        } catch (err) {
          console.log("Check-in error:", err);
        }
      }

      if (newStamps.length === 1 && !timerStart) {
        const startTime = Date.now();
        setTimerStart(startTime);
        localStorage.setItem("hcm-timer-start", startTime.toString());
      }

      if (newStamps.length === 8 && timerStart && !timerEnd) {
        const endTime = Date.now();
        setTimerEnd(endTime);
        localStorage.setItem("hcm-timer-end", endTime.toString());

        if (user) {
          const completionTime = endTime - timerStart;
          const newEntry = {
            id: Date.now(),
            name: user.name,
            time: completionTime,
            completedAt: new Date().toISOString(),
          };
          const updatedLeaderboard = [...leaderboardData, newEntry];
          setLeaderboardData(updatedLeaderboard);
          localStorage.setItem("hcm-leaderboard", JSON.stringify(updatedLeaderboard));
        }
      }
    }
  };

  const addBeer = (beer) => {
    setBeers([...beers, { ...beer, id: Date.now() }]);
  };

  const handleBreweryClick = (brewery) => {
    setSelectedBrewery(brewery);
    setQrValidated(false);
    setView("brewery");

    try {
      window.history.pushState({}, "", `/brewery/${brewery.id}`);
    } catch {}
  };

  const handleNavigate = (newView) => {
    setView(newView);
    if (newView !== "brewery") {
      setSelectedBrewery(null);
      setQrValidated(false);
      if (newView === "home") {
        try {
          window.history.pushState({}, "", "/");
        } catch {}
      }
    }
  };

  const resetCard = () => {
    if (window.confirm(t.resetConfirm)) {
      setStamps([]);
      setBeers([]);
      setTimerStart(null);
      setTimerEnd(null);
      localStorage.removeItem("hcm-stamps");
      localStorage.removeItem("hcm-beers");
      localStorage.removeItem("hcm-hat-claimed");
      localStorage.removeItem("hcm-timer-start");
      localStorage.removeItem("hcm-timer-end");
      alert(t.resetSuccess);
    }
  };

  const getUserCompletionTime = () => {
    if (timerStart && timerEnd) return timerEnd - timerStart;
    return null;
  };

  // After auth modal success: store user + load /me progress + close modal
  const onAuthSuccess = async (authRes) => {
    // authRes: { ok, access_token, refresh_token, user, ... }
    const u = authRes?.user ? { id: authRes.user.id, email: authRes.user.email } : { id: null };
    setUser(u);
    localStorage.setItem("hcm-user", JSON.stringify(u));
    setShowAuth(false);
    setShowWelcome(false);

    await loadMe();

    if (pendingQR.current) {
      setSelectedBrewery(pendingQR.current.brewery);
      setQrValidated(true);
      setView("brewery");
      pendingQR.current = null;
    }
  };

  // If signed in, keep stamps synced from backend at least once on load
  useEffect(() => {
    if (user?.id) {
      loadMe().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!breweries.length) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="app">
      {showWelcome && (
        <WelcomeModal language={language} setLanguage={setLanguage} onComplete={handleUserRegistration} />
      )}

      {showAuth && <AuthModal onSuccess={onAuthSuccess} />}

      {view === "home" && (
        <HomePage
          breweries={breweries}
          stamps={stamps}
          onBreweryClick={handleBreweryClick}
          onNavigate={handleNavigate}
          onReset={resetCard}
          language={language}
          setLanguage={setLanguage}
          user={user}
          timerStart={timerStart}
          timerEnd={timerEnd}
        />
      )}

      {view === "brewery" && selectedBrewery && (
        <BreweryDetail
          brewery={selectedBrewery}
          breweries={breweries}
          stamps={stamps}
          beers={beers}
          addStamp={addStamp}
          addBeer={addBeer}
          qrValidated={qrValidated}
          setQrValidated={setQrValidated}
          onBack={goHome}
          language={language}
          user={user}
        />
      )}

      {view === "faq" && <FAQ onBack={() => handleNavigate("home")} language={language} user={user} />}

      {view === "beers" && <MyBeers beers={beers} onBack={() => handleNavigate("home")} language={language} />}

      {view === "leaderboard" && (
        <Leaderboard
          leaderboard={leaderboardData}
          user={user}
          completionTime={getUserCompletionTime()}
          onBack={() => handleNavigate("home")}
          language={language}
        />
      )}

      {user?.id && (
        <div style={{ position: "fixed", bottom: 10, right: 10, opacity: 0.75 }}>
          <button
            className="btn-secondary"
            onClick={() => {
              apiLogout();
              setUser(null);
              localStorage.removeItem("hcm-user");
              setStamps([]);
              setShowAuth(true);
              goHome();
            }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}