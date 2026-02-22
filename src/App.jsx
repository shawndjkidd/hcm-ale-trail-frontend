// src/App.jsx
import { useEffect, useRef, useState } from "react";

import HomePage from "./components/HomePage";
import BreweryDetail from "./components/BreweryDetail";
import FAQ from "./components/FAQ";
import MyBeers from "./components/MyBeers";
import WelcomeModal from "./components/WelcomeModal";
import Leaderboard from "./components/Leaderboard";

import translations from "./translations";
import "./styles/App.css";

import { TRAIL_ID } from "./config";
import {
  getBreweries,
  getMe,
  getBrewery,
  checkinWithManualCode,
  submitRating,
  getMyRatings,
  claimHat,
} from "./lib/api";

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

export default function App() {
  const [breweries, setBreweries] = useState([]); // backend-driven list
  const [stamps, setStamps] = useState([]); // local display list of breweryIds (optional)
  const [beers, setBeers] = useState([]); // local beer notes list (legacy UI)
  const [selectedBrewery, setSelectedBrewery] = useState(null);
  const [view, setView] = useState("home");

  const [language, setLanguage] = useState("en");
  const [qrValidated, setQrValidated] = useState(false);

  const [user, setUser] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);

  const [timerStart, setTimerStart] = useState(null);
  const [timerEnd, setTimerEnd] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);

  // NEW: backend truth for progress
  const [me, setMe] = useState(null);

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

  // Load local-only stuff + boot routing
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

    // Determine if we deep-linked to a brewery
    const breweryId = parseBreweryFromUrl();
    if (breweryId) {
      pendingQR.current = { breweryId };
    }

    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setShowWelcome(false);
    } else {
      setShowWelcome(true);
    }

    // Keep UI in sync with browser back/forward
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

  // Persist local-only
  useEffect(() => localStorage.setItem("hcm-stamps", JSON.stringify(stamps)), [stamps]);
  useEffect(() => localStorage.setItem("hcm-beers", JSON.stringify(beers)), [beers]);
  useEffect(() => localStorage.setItem("hcm-language", language), [language]);

  // Load breweries list from backend (public endpoint)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await getBreweries(TRAIL_ID);
        if (cancelled) return;

        const list = res?.breweries || [];
        setBreweries(list);

        // If we deep-linked, resolve the brewery now that list exists
        const id = pendingQR.current?.breweryId;
        if (id) {
          const b = list.find((x) => x.id === id);
          if (b) {
            setSelectedBrewery(b);
            setView("brewery");
            // If user already "registered", show brewery immediately
            // NOTE: real check-in still needs token for /me and POSTs
            setQrValidated(true);
          }
          pendingQR.current = null;
        }
      } catch (err) {
        console.log("Failed to load breweries:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load /me from backend if token exists (auth endpoint)
  async function refreshMe() {
    try {
      const res = await getMe(TRAIL_ID);
      setMe(res);

      // Keep local stamps in sync for the “completed” stamps overlay UI
      if (Array.isArray(res?.checkedInBreweryIds)) {
        setStamps(res.checkedInBreweryIds);
        localStorage.setItem("hcm-stamps", JSON.stringify(res.checkedInBreweryIds));
      }
    } catch (err) {
      // Normal if token missing/expired
      setMe(null);
    }
  }

  // Call refreshMe once after breweries load (so UI can render properly)
  useEffect(() => {
    if (!breweries.length) return;
    refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breweries.length]);

  const handleUserRegistration = (userData) => {
    setUser(userData);
    localStorage.setItem("hcm-user", JSON.stringify(userData));
    setShowWelcome(false);
  };

  const handleBreweryClick = async (brewery) => {
    setSelectedBrewery(brewery);
    setQrValidated(false);
    setView("brewery");

    try {
      window.history.pushState({}, "", `/brewery/${brewery.id}`);
    } catch {}

    // Optional: load richer detail (events + user flags) when token exists
    try {
      const detail = await getBrewery(TRAIL_ID, brewery.id);
      // BreweryDetail can optionally use these extra fields if it wants.
      // We keep selectedBrewery “shape” compatible with existing UI.
      setSelectedBrewery((prev) => ({
        ...(prev || brewery),
        _detail: detail,
      }));
    } catch (err) {
      // If unauthorized or error, ignore
    }
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

  // Legacy local beer add (UI feature)
  const addBeer = (beer) => setBeers((prev) => [...prev, { ...beer, id: Date.now() }]);

  // Check-in handler used by BreweryDetail “backup code”
  const addStamp = async (breweryId, options = {}) => {
    // Optimistic UI: show stamp immediately
    if (!stamps.includes(breweryId)) {
      const newStamps = [...stamps, breweryId];
      setStamps(newStamps);
      localStorage.setItem("hcm-stamps", JSON.stringify(newStamps));

      // Timer logic (legacy)
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

    // Backend check-in (requires valid token in localStorage)
    try {
      if (options?.method === "manual_code") {
        await checkinWithManualCode(TRAIL_ID, breweryId, options.code);
      } else {
        // default: manual_code is what UI uses right now
        if (options?.code) {
          await checkinWithManualCode(TRAIL_ID, breweryId, options.code);
        }
      }
      await refreshMe();
    } catch (err) {
      console.log("Check-in failed:", err);
      // If backend rejects, we keep optimistic UI for now (can revert later if you want strict sync)
    }
  };

  // Rating handler (if BreweryDetail calls it)
  const rateBeer = async (breweryId, payload) => {
    try {
      await submitRating(TRAIL_ID, breweryId, payload);
      await refreshMe();
      // If you want MyBeers to show backend ratings later, we can wire that up next.
    } catch (err) {
      console.log("Rating failed:", err);
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
        <WelcomeModal
          language={language}
          setLanguage={setLanguage}
          onComplete={handleUserRegistration}
        />
      )}

      {view === "home" && (
        <HomePage
          breweries={breweries}
          stamps={stamps} // used for “completed” overlays
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
          // Optional: if your component supports it later
          rateBeer={rateBeer}
          refreshMe={refreshMe}
        />
      )}

      {view === "faq" && (
        <FAQ onBack={() => handleNavigate("home")} language={language} user={user} />
      )}

      {view === "beers" && (
        <MyBeers beers={beers} onBack={() => handleNavigate("home")} language={language} />
      )}

      {view === "leaderboard" && (
        <Leaderboard
          leaderboard={leaderboardData}
          user={user}
          completionTime={getUserCompletionTime()}
          onBack={() => handleNavigate("home")}
          language={language}
        />
      )}
    </div>
  );
}