import { useEffect, useRef, useState } from "react";
import HomePage from "./components/HomePage";
import BreweryDetail from "./components/BreweryDetail";
import SideQuestDetail from "./components/SideQuestDetail";
import FAQ from "./components/FAQ";
import MyBeers from "./components/MyBeers";
import WelcomeModal from "./components/WelcomeModal";
import Leaderboard from "./components/Leaderboard";
import AuthModal from "./components/AuthModal";

import translations from "./translations";
import { recordCheckin } from "./lib/supabase";
import { TRAIL_ID } from "./config";
import { getBreweries, getMe, logout as apiLogout, startNewRun } from "./lib/api";

import "./styles/App.css";

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

function parseSideQuestFromUrl() {
  try {
    const path = window.location.pathname || "/";
    const parts = path.split("/").filter(Boolean);
    if (parts.length >= 2 && parts[0] === "side-quest") {
      const id = parts[1];
      if (id && id.length >= 10) return id;
    }
    return null;
  } catch {
    return null;
  }
}

function normalizeBrewery(b) {
  const descObj = b?.description && typeof b.description === "object" ? b.description : null;
  return {
    ...b,
    description: typeof b?.description === "string" ? b.description : (descObj?.en || ""),
    description_i18n: descObj || null,
    logo_url: b?.logo_url ?? null,
  };
}

export default function App() {
  const [stamps, setStamps] = useState([]);
  const [beers, setBeers] = useState([]);
  const [breweries, setBreweries] = useState([]);
  const [selectedBrewery, setSelectedBrewery] = useState(null);
  const [selectedSideQuest, setSelectedSideQuest] = useState(null);
  const [sideQuestCheckins, setSideQuestCheckins] = useState([]);
  const [view, setView] = useState("home");
  const [language, setLanguage] = useState("en");
  const [qrValidated, setQrValidated] = useState(false);
  const [sideQuestQrValidated, setSideQuestQrValidated] = useState(false);
  const [user, setUser] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [timerStart, setTimerStart] = useState(null);
  const [timerEnd, setTimerEnd] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);

  const pendingQR = useRef(null);
  const pendingSideQuestQR = useRef(null);
  const t = translations[language];

  const goHome = () => {
    setSelectedBrewery(null);
    setSelectedSideQuest(null);
    setQrValidated(false);
    setSideQuestQrValidated(false);
    setView("home");
    try {
      window.history.pushState({}, "", "/");
    } catch {}
  };

  const loadBreweries = async () => {
    const r = await getBreweries(TRAIL_ID);
    if (r?.ok && Array.isArray(r?.breweries)) {
      const normalized = r.breweries.map(normalizeBrewery);
      setBreweries(normalized);
      return normalized;
    }
    return [];
  };

  const loadSideQuest = async (questId) => {
    try {
      const res = await fetch(`/api/trails/${TRAIL_ID}/side-quests/${questId}/qr`);
      const data = await res.json();
      if (data.ok && data.sideQuest) {
        return data.sideQuest;
      }
    } catch (err) {
      console.error("Failed to load side quest:", err);
    }
    return null;
  };

  const loadMe = async () => {
    const r = await getMe(TRAIL_ID);
    if (r?.ok) {
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
    const savedSideQuestCheckins = localStorage.getItem("hcm-sidequest-checkins");

    if (savedStamps) setStamps(JSON.parse(savedStamps));
    if (savedBeers) setBeers(JSON.parse(savedBeers));
    if (savedLang) setLanguage(savedLang);
    if (savedTimerStart) setTimerStart(parseInt(savedTimerStart, 10));
    if (savedTimerEnd) setTimerEnd(parseInt(savedTimerEnd, 10));
    if (savedLeaderboard) setLeaderboardData(JSON.parse(savedLeaderboard));
    if (savedSideQuestCheckins) setSideQuestCheckins(JSON.parse(savedSideQuestCheckins));

    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setShowWelcome(false);
      setShowAuth(false);
    } else {
      setShowWelcome(true);
    }

    // Check for side quest QR first
    const sideQuestId = parseSideQuestFromUrl();
    if (sideQuestId) {
      loadSideQuest(sideQuestId).then((quest) => {
        if (quest) {
          pendingSideQuestQR.current = { quest, questId: sideQuestId };
          const u = savedUser ? JSON.parse(savedUser) : null;
          if (u) {
            setSelectedSideQuest(quest);
            setSideQuestQrValidated(true);
            setView("sidequest");
            setUser(u);
            setShowWelcome(false);
            setShowAuth(false);
          } else {
            setShowAuth(true);
            setShowWelcome(false);
          }
        }
      });
      loadBreweries();
      return;
    }

    // Then check for brewery QR
    loadBreweries().then((list) => {
      const breweryId = parseBreweryFromUrl();
      if (!breweryId) return;
      const brewery = list.find((b) => b.id === breweryId);
      if (!brewery) return;
      pendingQR.current = { brewery, breweryId };
      const u = savedUser ? JSON.parse(savedUser) : null;
      if (u) {
        setSelectedBrewery(brewery);
        setQrValidated(true);
        setView("brewery");
        setUser(u);
        setShowWelcome(false);
        setShowAuth(false);
      } else {
        setShowAuth(true);
        setShowWelcome(false);
      }
    });

    const onPop = () => {
      const breweryId = parseBreweryFromUrl();
      if (breweryId) {
        const b = breweries.find((x) => x.id === breweryId);
        if (b) {
          setSelectedBrewery(b);
          setView("brewery");
          return;
        }
      }
      const questId = parseSideQuestFromUrl();
      if (questId) {
        loadSideQuest(questId).then((quest) => {
          if (quest) {
            setSelectedSideQuest(quest);
            setView("sidequest");
          }
        });
        return;
      }
      setSelectedBrewery(null);
      setSelectedSideQuest(null);
      setView("home");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
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
    if (pendingSideQuestQR.current) {
      setSelectedSideQuest(pendingSideQuestQR.current.quest);
      setSideQuestQrValidated(true);
      setView("sidequest");
      pendingSideQuestQR.current = null;
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

  const handleSideQuestClick = (quest) => {
    setSelectedSideQuest(quest);
    setSideQuestQrValidated(false);
    setView("sidequest");
  };

  const handleSideQuestComplete = (questId) => {
    if (!sideQuestCheckins.includes(questId)) {
      const updated = [...sideQuestCheckins, questId];
      setSideQuestCheckins(updated);
      localStorage.setItem("hcm-sidequest-checkins", JSON.stringify(updated));
    }
  };

  const handleNavigate = (newView) => {
    setView(newView);
    if (newView !== "brewery" && newView !== "sidequest") {
      setSelectedBrewery(null);
      setSelectedSideQuest(null);
      setQrValidated(false);
      setSideQuestQrValidated(false);
      if (newView === "home") {
        try {
          window.history.pushState({}, "", "/");
        } catch {}
      }
    }
  };

  const resetCard = async () => {
    if (!window.confirm(t.resetConfirm)) return;
    if (user?.id) {
      try {
        const result = await startNewRun();
        if (!result?.ok) {
          console.error("Failed to start new run:", result?.error);
        } else {
          await loadMe();
        }
      } catch (err) {
        console.error("Error starting new run:", err);
      }
    }
    setStamps([]);
    setBeers([]);
    setTimerStart(null);
    setTimerEnd(null);
    setSideQuestCheckins([]);
    localStorage.removeItem("hcm-stamps");
    localStorage.removeItem("hcm-beers");
    localStorage.removeItem("hcm-hat-claimed");
    localStorage.removeItem("hcm-timer-start");
    localStorage.removeItem("hcm-timer-end");
    localStorage.removeItem("hcm-completion-modal-shown");
    localStorage.removeItem("hcm-sidequest-checkins");
    alert(t.resetSuccess);
  };

  const getUserCompletionTime = () => {
    if (timerStart && timerEnd) return timerEnd - timerStart;
    return null;
  };

  const onAuthSuccess = async (authRes) => {
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
    if (pendingSideQuestQR.current) {
      setSelectedSideQuest(pendingSideQuestQR.current.quest);
      setSideQuestQrValidated(true);
      setView("sidequest");
      pendingSideQuestQR.current = null;
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadMe().catch(() => {});
    }
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
        <WelcomeModal language={language} setLanguage={setLanguage} onComplete={handleUserRegistration} onSignIn={() => setShowAuth(true)} />
      )}
      {showAuth && <AuthModal onSuccess={onAuthSuccess} language={language} />}
      {view === "home" && (
        <HomePage
          breweries={breweries}
          stamps={stamps}
          onBreweryClick={handleBreweryClick}
          onSideQuestClick={handleSideQuestClick}
          sideQuestCheckins={sideQuestCheckins}
          onNavigate={handleNavigate}
          resetCard={resetCard}
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
      {view === "sidequest" && selectedSideQuest && (
        <SideQuestDetail
          quest={selectedSideQuest}
          isCompleted={sideQuestCheckins.includes(selectedSideQuest.id)}
          onComplete={handleSideQuestComplete}
          onBack={goHome}
          language={language}
          user={user}
          qrValidated={sideQuestQrValidated}
        />
      )}
      {view === "faq" && <FAQ onBack={() => handleNavigate("home")} language={language} user={user} />}
      {view === "mybeers" && <MyBeers beers={beers} breweries={breweries} onBack={() => handleNavigate("home")} language={language} />}
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
