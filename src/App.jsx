import { useEffect, useRef, useState } from "react";
import HomePage from "./components/HomePage";
import BreweryDetail from "./components/BreweryDetail";
import FAQ from "./components/FAQ";
import MyBeers from "./components/MyBeers";
import WelcomeModal from "./components/WelcomeModal";
import Leaderboard from "./components/Leaderboard";
import AuthModal from "./components/AuthModal";
import translations from "./translations";
import "./styles/App.css";

import { TRAIL_ID } from "./config";
import { getAccessToken, getBreweries, getMe, logout as apiLogout } from "./lib/api";

// Accepts BOTH:
// - /brewery/<uuid>
// - ?brewery=<uuid> (legacy)
function parseBreweryFromUrl() {
  try {
    const path = window.location.pathname || "/";
    const parts = path.split("/").filter(Boolean);

    if (parts.length >= 2 && parts[0] === "brewery") {
      const id = parts[1];
      if (id && id.length >= 10) return id;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get("brewery");
    if (q && q.length >= 10) return q;

    return null;
  } catch {
    return null;
  }
}

export default function App() {
  const [stamps, setStamps] = useState([]);
  const [beers, setBeers] = useState([]);
  const [selectedBrewery, setSelectedBrewery] = useState(null);
  const [view, setView] = useState("home");
  const [language, setLanguage] = useState("en");
  const [qrValidated, setQrValidated] = useState(false);
  const [user, setUser] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  // backend-driven brewery list
  const [breweries, setBreweries] = useState([]);

  // keep your existing timer/leaderboard local for now
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

  // Load local storage (UI prefs)
  useEffect(() => {
    const savedBeers = localStorage.getItem("hcm-beers");
    const savedLang = localStorage.getItem("hcm-language");
    const savedTimerStart = localStorage.getItem("hcm-timer-start");
    const savedTimerEnd = localStorage.getItem("hcm-timer-end");
    const savedLeaderboard = localStorage.getItem("hcm-leaderboard");

    if (savedBeers) setBeers(JSON.parse(savedBeers));
    if (savedLang) setLanguage(savedLang);
    if (savedTimerStart) setTimerStart(parseInt(savedTimerStart));
    if (savedTimerEnd) setTimerEnd(parseInt(savedTimerEnd));
    if (savedLeaderboard) setLeaderboardData(JSON.parse(savedLeaderboard));

    // If user has a token stored, try backend /me
    const token = getAccessToken();
    setShowAuth(!token);

    // Browser back/forward sync
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
  }, [breweries]);

  useEffect(() => localStorage.setItem("hcm-beers", JSON.stringify(beers)), [beers]);
  useEffect(() => localStorage.setItem("hcm-language", language), [language]);

  async function hydrateFromBackend() {
    // breweries list is public
    const b = await getBreweries(TRAIL_ID);
    if (b?.ok && Array.isArray(b.breweries)) {
      setBreweries(b.breweries);
    }

    // /me needs auth
    const token = getAccessToken();
    if (!token) return;

    const me = await getMe(TRAIL_ID);
    if (me?.ok) {
      setUser({ id: me.userId });
      setStamps(me.checkedInBreweryIds || []);
      setShowAuth(false);

      // if deep linked
      const breweryId = parseBreweryFromUrl();
      if (breweryId && b?.ok && Array.isArray(b.breweries)) {
        const match = b.breweries.find((x) => x.id === breweryId);
        if (match) {
          pendingQR.current = { brewery: match, breweryId };
          setSelectedBrewery(match);
          setQrValidated(true);
          setView("brewery");
        }
      }
    } else if (me?.status === 401) {
      setShowAuth(true);
    }
  }

  useEffect(() => {
    hydrateFromBackend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUserRegistration = (userData) => {
    setUser(userData);
    setShowWelcome(false);

    if (pendingQR.current) {
      setSelectedBrewery(pendingQR.current.brewery);
      setQrValidated(true);
      setView("brewery");
      pendingQR.current = null;
    }
  };

  const addBeer = (beer) => {
    setBeers((prev) => [...prev, { ...beer, id: Date.now() }]);
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
      setLeaderboardData([]);

      localStorage.removeItem("hcm-stamps");
      localStorage.removeItem("hcm-beers");
      localStorage.removeItem("hcm-hat-claimed");
      localStorage.removeItem("hcm-timer-start");
      localStorage.removeItem("hcm-timer-end");
      localStorage.removeItem("hcm-leaderboard");

      alert(t.resetSuccess);
    }
  };

  const getUserCompletionTime = () => {
    if (timerStart && timerEnd) return timerEnd - timerStart;
    return null;
  };

  if (!breweries || breweries.length === 0) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="app">
      {showAuth && (
        <AuthModal
          onSuccess={async () => {
            await hydrateFromBackend();
          }}
        />
      )}

      {showWelcome && (
        <WelcomeModal language={language} setLanguage={setLanguage} onComplete={handleUserRegistration} />
      )}

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
        <div style={{ position: "fixed", bottom: 10, right: 10, opacity: 0.6 }}>
          <button
            className="btn-secondary"
            onClick={() => {
              apiLogout();
              setUser(null);
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
