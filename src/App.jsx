import { useEffect, useRef, useState } from "react";
import HomePage from "./components/HomePage";
import BreweryDetail from "./components/BreweryDetail";
import SideQuestDetail from "./components/SideQuestDetail";
import FAQ from "./components/FAQ";
import MyBeers from "./components/MyBeers";
import Leaderboard from "./components/Leaderboard";
import AuthModal from "./components/AuthModal";
import AleTrailMap from "./components/AleTrailMap";
import Settings from "./components/Settings";

import translations from "./translations";
import { recordCheckin, supabase } from "./lib/supabase";
import { TRAIL_ID } from "./config";
import { getBreweries, getMe, logout as apiLogout, startNewRun, postCheckin, getLeaderboard, claimHat, storeLoginTokens } from "./lib/api";

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

function parseCheckinFromUrl() {
  try {
    const path = window.location.pathname || "/";
    const parts = path.split("/").filter(Boolean);
    if (parts.length >= 2 && parts[0] === "checkin") {
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
  const [nightMode, setNightMode] = useState(() => {
    const saved = localStorage.getItem("hcm-night-mode") === "true";
    if (saved) document.body.classList.add("night-mode");
    return saved;
  });

  useEffect(() => {
    document.body.classList.toggle("night-mode", nightMode);
    localStorage.setItem("hcm-night-mode", String(nightMode));
  }, [nightMode]);

  const toggleNightMode = () => setNightMode((m) => !m);

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
  const [showAuth, setShowAuth] = useState(false);
  const [timerStart, setTimerStart] = useState(null);
  const [timerEnd, setTimerEnd] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [activeEvents, setActiveEvents] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [autoOpenBeer, setAutoOpenBeer] = useState(false);
  const [hatClaimed, setHatClaimed] = useState(() => localStorage.getItem("hcm-hat-claimed") === "true");

  const pendingQR = useRef(null);
  const pendingSideQuestQR = useRef(null);
  const t = translations[language];

  const handleLogout = () => {
    apiLogout();
    setUser(null);
    localStorage.removeItem("hcm-user");
    setStamps([]);
    setShowAuth(true);
    goHome();
  };

  const goHome = () => {
    setSelectedBrewery(null);
    setSelectedSideQuest(null);
    setQrValidated(false);
    setSideQuestQrValidated(false);
    setAutoOpenBeer(false);
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
        // Merge server stamps with any locally-held stamps to avoid wiping
        // stamps that were saved to state/localStorage but not yet persisted to DB
        setStamps(prev => {
          const merged = [...new Set([...prev, ...r.checkedInBreweryIds])];
          localStorage.setItem("hcm-stamps", JSON.stringify(merged));
          return merged;
        });
      }
      // Sync hat claim status from server (authoritative)
      if (r.hatClaimed) {
        setHatClaimed(true);
        localStorage.setItem("hcm-hat-claimed", "true");
      }
      return r;
    }
    return null;
  };

  const handleHatClaimed = () => {
    setHatClaimed(true);
    localStorage.setItem("hcm-hat-claimed", "true");
  };

  useEffect(() => {
    const init = async () => {
      // ── Restore local state ───────────────────────────────────────────────
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

      // ── Google OAuth callback ─────────────────────────────────────────────
      // Must run before auth state decision to avoid flash of auth modal
      const urlParams = new URLSearchParams(window.location.search);
      const oauthError = urlParams.get("error");
      const oauthErrorDesc = urlParams.get("error_description");

      if (oauthError) {
        console.log("OAuth error:", oauthError, oauthErrorDesc);
        try { window.history.replaceState({}, "", window.location.pathname); } catch {}
        setShowAuth(true);
        loadBreweries().then(() => setInitialized(true));
        return;
      }

      const hash = window.location.hash;
      if (hash && hash.includes("access_token")) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          console.log("OAuth check: session =", session);
          if (session?.access_token && session.user?.app_metadata?.provider === "google") {
            const res = await fetch("/api/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                expires_at: session.expires_at,
              }),
            });
            const data = await res.json().catch(() => null);
            console.log("Google auth response:", data);
            if (res.ok && data?.ok) {
              storeLoginTokens(data);
              const u = data.user ? { id: data.user.id, email: data.user.email } : { id: null };
              setUser(u);
              localStorage.setItem("hcm-user", JSON.stringify(u));
              try { window.history.replaceState({}, "", window.location.pathname); } catch {}
              setShowAuth(false);
              loadBreweries().then(() => setInitialized(true));
              loadMe().catch(() => {});
              return;
            }
          }
        } catch (e) {
          console.log("OAuth callback error:", e);
        }
        // OAuth hash present but failed — clean URL and fall through to normal auth
        try { window.history.replaceState({}, "", window.location.pathname); } catch {}
      }

      // ── Normal auth state ─────────────────────────────────────────────────
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        setShowAuth(false);
      } else {
        setShowAuth(true);
      }

      // ── Route handling ────────────────────────────────────────────────────
      if (window.location.pathname === '/settings') {
        loadBreweries().then(() => setInitialized(true));
        setView('settings');
        return;
      }

      if (window.location.pathname === '/map') {
        loadBreweries().then(() => setInitialized(true));
        setView('map');
        return;
      }

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
              setShowAuth(false);
            } else {
              setShowAuth(true);
            }
          }
          setInitialized(true);
        });
        loadBreweries();
        return;
      }

      loadBreweries().then((list) => {
        const checkinId = parseCheckinFromUrl();
        const directBreweryId = parseBreweryFromUrl();

        if (checkinId) {
          const brewery = list.find((b) => b.id === checkinId);
          if (brewery) {
            try { window.history.replaceState({}, "", `/brewery/${checkinId}`); } catch {}
            pendingQR.current = { brewery, breweryId: checkinId, autoOpenBeer: true };
            const u = savedUser ? JSON.parse(savedUser) : null;
            if (u) {
              setSelectedBrewery(brewery);
              setQrValidated(true);
              setAutoOpenBeer(true);
              setView("brewery");
              setUser(u);
              setShowAuth(false);
            } else {
              setShowAuth(true);
            }
          }
        } else if (directBreweryId) {
          const brewery = list.find((b) => b.id === directBreweryId);
          if (brewery) {
            setSelectedBrewery(brewery);
            setView("brewery");
          }
        }
        setInitialized(true);
      });
    };

    init();

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
    fetch(`/api/trails/${TRAIL_ID}/events`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          const now = new Date();
          setActiveEvents(
            (data.events || []).filter(
              (e) => new Date(e.startsAt) <= now && (!e.endsAt || new Date(e.endsAt) >= now)
            )
          );
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem("hcm-stamps", JSON.stringify(stamps));
  }, [stamps]);

  useEffect(() => {
    localStorage.setItem("hcm-beers", JSON.stringify(beers));
  }, [beers]);

  useEffect(() => {
    localStorage.setItem("hcm-language", language);
    document.body.classList.toggle("lang-jp", language === "jp");
    document.body.classList.toggle("lang-kr", language === "kr");
  }, [language]);

  const handleUserRegistration = (userData) => {
    setUser(userData);
    localStorage.setItem("hcm-user", JSON.stringify(userData));
    setShowAuth(false);
    if (pendingQR.current) {
      setSelectedBrewery(pendingQR.current.brewery);
      setQrValidated(true);
      if (pendingQR.current.autoOpenBeer) setAutoOpenBeer(true);
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
      try {
        // Primary: call backend API (uses JWT, correct participant lookup)
        const result = await postCheckin(TRAIL_ID, breweryId, {});
        if (result?.ok) {
          console.log("Check-in saved via backend API:", breweryId);
        } else {
          console.log("Backend check-in failed:", result?.error, "— trying Supabase direct");
          // Fallback: direct Supabase insert
          if (user?.id) {
            const { error } = await recordCheckin(user.id, breweryId, "qr_scan");
            if (error) console.log("Supabase check-in error:", error);
            else console.log("Check-in saved via Supabase direct:", breweryId);
          }
        }
      } catch (err) {
        console.log("Check-in error:", err);
      }
      if (newStamps.length === 1 && !timerStart) {
        const startTime = Date.now();
        setTimerStart(startTime);
        localStorage.setItem("hcm-timer-start", startTime.toString());
      }
      const requiredCount = breweries.filter(b => b.status !== 'temporarily_closed').length || 8;
      if (newStamps.length >= requiredCount && timerStart && !timerEnd) {
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
    setAutoOpenBeer(false);
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
    if (newView === "leaderboard") {
      getLeaderboard().then((res) => {
        if (res?.leaderboard?.length) {
          setLeaderboardData(res.leaderboard);
        }
      }).catch(() => {});
    }
    if (newView !== "brewery" && newView !== "sidequest") {
      setSelectedBrewery(null);
      setSelectedSideQuest(null);
      setQrValidated(false);
      setSideQuestQrValidated(false);
      setAutoOpenBeer(false);
      try {
        if (newView === "home") window.history.pushState({}, "", "/");
        else if (newView === "map") window.history.pushState({}, "", "/map");
        else if (newView === "settings") window.history.pushState({}, "", "/settings");
      } catch {}
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
    setHatClaimed(false);
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
    await loadMe();
    if (pendingQR.current) {
      setSelectedBrewery(pendingQR.current.brewery);
      setQrValidated(true);
      if (pendingQR.current.autoOpenBeer) setAutoOpenBeer(true);
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

  if (!initialized) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="app" data-lang={language}>
      {showAuth && <AuthModal onSuccess={onAuthSuccess} language={language} setLanguage={setLanguage} />}
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
          activeEvents={activeEvents}
          nightMode={nightMode}
          toggleNightMode={toggleNightMode}
          onLogout={handleLogout}
          onSettings={() => handleNavigate("settings")}
          hatClaimed={hatClaimed}
          onHatClaimed={handleHatClaimed}
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
          autoOpenBeer={autoOpenBeer}
          onAutoOpenComplete={() => setAutoOpenBeer(false)}
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
      {view === "map" && (
        <AleTrailMap
          breweries={breweries}
          stamps={stamps}
          onBack={() => handleNavigate("home")}
          nightMode={nightMode}
          onBreweryNavigate={handleBreweryClick}
          language={language}
        />
      )}
      {view === "settings" && (
        <Settings user={user} language={language} onBack={() => handleNavigate("home")} />
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
    </div>
  );
}
