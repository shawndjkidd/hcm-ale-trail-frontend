import { useCallback, useEffect, useState } from "react";
import SignIn from "./v2/SignIn";
import UntappdOnboarding from "./components/UntappdOnboarding";
import CardResetPrompt from "./components/CardResetPrompt";

import Home from "./v2/Home";
import Brewery from "./v2/Brewery";
import CheckInFlow from "./v2/CheckIn";
import SideQuest from "./v2/SideQuest";
import MapScreen from "./v2/MapScreen";
import MyCard from "./v2/MyCard";
import Events from "./v2/Events";
import Profile from "./v2/Profile";
import Ask from "./v2/Ask";
import Onboarding, { MicroQuestion, nextMicroQuestion } from "./v2/Onboarding";
import { Welcome, Guide } from "./v2/Welcome";
import { Celebrate, HatClaim, shareCard } from "./v2/Celebrate";
import { TabBar, MenuDrawer, Toast } from "./v2/ui";
import { useV, fmt } from "./v2/i18n";
import { openStatus, formatClose } from "./v2/util";
import "./v2/v2.css";

import { supabase } from "./lib/supabase";
import { TRAIL_ID, SHOW_UNTAPPD_INTEGRATION } from "./config";
import {
  getBreweries, getMe, getMyRatings, logout as apiLogout, postResetCard, getLeaderboard,
  storeLoginTokens, getAccessToken, setTokens, getUserMe, patchUserMe,
} from "./lib/api";

import "./styles/App.css";

const TAB_PATHS = { home: "/", map: "/map", card: "/card", ask: "/ask" };

function pathParts() {
  return (window.location.pathname || "/").split("/").filter(Boolean);
}

function normalizeBrewery(b) {
  const descObj = b?.description && typeof b.description === "object" ? b.description : null;
  return {
    ...b,
    description: typeof b?.description === "string" ? b.description : (descObj?.en || ""),
    description_i18n: descObj || null,
    logo_url: b?.logo_url || null,
  };
}

const readJSON = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; }
};

export default function App() {
  // ── Preferences ───────────────────────────────────────────────────────────
  const [nightMode, setNightMode] = useState(() => localStorage.getItem("hcm-night-mode") === "true");
  useEffect(() => {
    document.body.classList.toggle("night-mode", nightMode);
    localStorage.setItem("hcm-night-mode", String(nightMode));
  }, [nightMode]);
  const toggleNightMode = () => setNightMode((m) => !m);

  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem("hcm-language");
    if (saved) return saved;
    const nav = navigator.language || "";
    if (nav.startsWith("vi")) return "vn";
    if (nav.startsWith("ko")) return "kr";
    if (nav.startsWith("ja")) return "jp";
    return "en";
  });
  useEffect(() => {
    localStorage.setItem("hcm-language", language);
    document.documentElement.lang = { en: "en", vn: "vi", kr: "ko", jp: "ja" }[language] || "en";
  }, [language]);
  const v = useV(language);

  // ── Trail + user state ────────────────────────────────────────────────────
  const [breweries, setBreweries] = useState([]);
  const [stamps, setStamps] = useState(() => readJSON("hcm-stamps", []));
  const [stampDates, setStampDates] = useState({});
  const [beers, setBeers] = useState([]);
  const [events, setEvents] = useState([]);
  const [sideQuests, setSideQuests] = useState([]);
  const [questClaims, setQuestClaims] = useState(() => readJSON("hcm-sidequest-checkins", []));
  const [boardTop, setBoardTop] = useState([]);
  const [user, setUser] = useState(() => readJSON("hcm-user", null));
  const [userMe, setUserMe] = useState(null);
  const [timerStart, setTimerStart] = useState(null);
  const [timerEnd, setTimerEnd] = useState(null);
  const [hatClaimed, setHatClaimed] = useState(() => localStorage.getItem("hcm-hat-claimed") === "true");
  const [cardRound, setCardRound] = useState(() => parseInt(localStorage.getItem("hcm-card-round") || "1", 10));
  const [initialized, setInitialized] = useState(false);
  const [here, setHere] = useState(null);

  // ── Navigation ────────────────────────────────────────────────────────────
  const [tab, setTab] = useState("home");
  const [cardTab, setCardTab] = useState("stamps");
  const [screen, setScreen] = useState(null); // { type: 'brewery'|'quest'|'events'|'profile', ... }
  const [checkIn, setCheckIn] = useState(null); // brewery being checked in at
  const [menuOpen, setMenuOpen] = useState(false);

  // ── Overlays ──────────────────────────────────────────────────────────────
  const [ageConfirmed, setAgeConfirmed] = useState(() => !!localStorage.getItem("hcm-age-confirmed-at"));
  const [welcomeDone, setWelcomeDone] = useState(() => !!localStorage.getItem("hcm-welcome-done") || !!localStorage.getItem("hcm-user"));
  const [showGuide, setShowGuide] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [afterAuth, setAfterAuth] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [editTaste, setEditTaste] = useState(false);
  const [micro, setMicro] = useState(null);
  const [milestone, setMilestone] = useState(null);
  const [celebrate, setCelebrate] = useState(null);
  const [hatClaimOpen, setHatClaimOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [showCardResetPrompt, setShowCardResetPrompt] = useState(false);
  const [untappdOnboardingDismissed, setUntappdOnboardingDismissed] = useState(() => localStorage.getItem("hcm-untappd-onboarding-dismissed") === "true");

  const flash = useCallback((text) => { setToast(text); setTimeout(() => setToast(""), 2200); }, []);

  // ── Loaders ───────────────────────────────────────────────────────────────
  const loadBreweries = async () => {
    const r = await getBreweries(TRAIL_ID);
    if (r?.ok && Array.isArray(r.breweries)) {
      const list = r.breweries.map(normalizeBrewery);
      setBreweries(list);
      return list;
    }
    return [];
  };

  const loadMe = async () => {
    const r = await getMe(TRAIL_ID);
    if (!r?.ok) return null;
    if (Array.isArray(r.checkedInBreweryIds)) {
      setStamps(r.checkedInBreweryIds);
      localStorage.setItem("hcm-stamps", JSON.stringify(r.checkedInBreweryIds));
    }
    const dates = {};
    for (const c of r.checkins || []) if (c.brewery_id && !dates[c.brewery_id]) dates[c.brewery_id] = c.checked_in_at;
    setStampDates(dates);
    setTimerStart(r.startedAt ? new Date(r.startedAt).getTime() : null);
    setTimerEnd(r.completedAt ? new Date(r.completedAt).getTime() : null);
    setHatClaimed(!!r.hatClaimed);
    localStorage.setItem("hcm-hat-claimed", String(!!r.hatClaimed));
    if (r.hatClaimed) {
      const round = typeof r.cardRound === "number" ? r.cardRound : cardRound;
      if (!localStorage.getItem(`hcm-reset-prompt-dismissed-${TRAIL_ID}-${round}`)) setShowCardResetPrompt(true);
    }
    if (r.profile) {
      localStorage.setItem("hcm-onboarding-profile", JSON.stringify({ ...readJSON("hcm-onboarding-profile", {}), ...r.profile }));
      if (r.profile.onboarding_completed_at) localStorage.setItem("hcm-onboarding-complete", "true");
    }
    if (typeof r.cardRound === "number") {
      setCardRound(r.cardRound);
      localStorage.setItem("hcm-card-round", String(r.cardRound));
    }
    return r;
  };

  const loadMyBeers = async () => {
    const res = await getMyRatings(TRAIL_ID);
    if (res?.ok && Array.isArray(res.ratings)) {
      setBeers(res.ratings.map((r) => ({
        id: r.id, breweryId: r.brewery_id, breweryName: r.brewery_name, name: r.beer_name,
        rating: r.rating, notes: r.notes || "", createdAt: r.created_at || null,
      })));
    }
  };

  const loadUserMe = async () => {
    const res = await getUserMe();
    if (res?.ok && res.user) {
      setUserMe(res.user);
      if (localStorage.getItem("hcm-age-confirmed-at") && !res.user.legal_age_confirmed_at) patchUserMe({ legal_age_confirmed: true }).catch(() => {});
      if (res.user.legal_age_confirmed_at && !localStorage.getItem("hcm-age-confirmed-at")) {
        localStorage.setItem("hcm-age-confirmed-at", res.user.legal_age_confirmed_at);
        setAgeConfirmed(true);
      }
    }
  };

  const loadBoardTop = () => getLeaderboard().then((res) => res?.ok && setBoardTop(res.leaderboard || [])).catch(() => {});

  const requestLocation = useCallback(() => {
    if (here || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setHere({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  }, [here]);

  // ── Routing helpers ───────────────────────────────────────────────────────
  const push = (path) => { try { window.history.pushState({}, "", path); } catch {} };
  const goTab = (id) => { setScreen(null); setTab(id); push(TAB_PATHS[id] || "/"); };
  const openBrewery = (b) => { setScreen({ type: "brewery", id: b.id }); push(`/brewery/${b.id}`); };
  const openQuest = (q) => { setScreen({ type: "quest", quest: q }); push(`/side-quest/${q.id}`); };
  const closeScreen = () => { setScreen(null); push(TAB_PATHS[tab] || "/"); };

  const routeFromUrl = (list, quests) => {
    const [a, b] = pathParts();
    if ((a === "brewery" || a === "checkin") && b) {
      if (list.some((x) => x.id === b)) { setScreen({ type: "brewery", id: b }); if (a === "checkin") push(`/brewery/${b}`); }
    } else if (a === "side-quest" && b) {
      const q = quests.find((x) => x.id === b);
      if (q) setScreen({ type: "quest", quest: q });
    } else if (a === "settings" || a === "profile") {
      setScreen({ type: "profile" });
    } else if (a === "events") {
      setScreen({ type: "events" });
    } else if (a && ["map", "card", "ask"].includes(a)) {
      setScreen(null); setTab(a);
    } else {
      setScreen(null); setTab("home");
    }
  };

  // ── Boot ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;

      // Google OAuth callback
      if (urlParams.get("error")) {
        try { window.history.replaceState({}, "", window.location.pathname); } catch {}
      } else if (hash && hash.includes("access_token")) {
        try {
          const hp = new URLSearchParams(hash.substring(1));
          let accessToken = hp.get("access_token"); let refreshToken = hp.get("refresh_token"); let expiresAt = hp.get("expires_at");
          if (!accessToken) {
            const { data: { session } } = await supabase.auth.getSession();
            accessToken = session?.access_token; refreshToken = session?.refresh_token; expiresAt = session?.expires_at;
          }
          if (accessToken) {
            const res = await fetch("/api/auth/google", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken, expires_at: expiresAt }),
            });
            const data = await res.json().catch(() => null);
            if (res.ok && data?.ok) {
              storeLoginTokens(data);
              const u = data.user ? { id: data.user.id, email: data.user.email } : { id: null };
              setUser(u); localStorage.setItem("hcm-user", JSON.stringify(u));
              localStorage.setItem("hcm-welcome-done", "true"); setWelcomeDone(true);
            }
          }
        } catch (e) { console.error("OAuth callback error:", e); }
        try { window.history.replaceState({}, "", window.location.pathname); } catch {}
      }

      // Keep the hcm-* tokens and the Supabase client session in step
      if (localStorage.getItem("hcm-user")) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!getAccessToken() && session?.access_token) setTokens(session);
          else if (getAccessToken() && !session?.access_token && localStorage.getItem("hcm-refresh-token")) {
            await supabase.auth.setSession({ access_token: getAccessToken(), refresh_token: localStorage.getItem("hcm-refresh-token") });
          }
        } catch {}
      }

      const [list, quests] = await Promise.all([
        loadBreweries(),
        fetch(`/api/trails/${TRAIL_ID}/side-quests`).then((r) => r.json()).then((d) => (d?.ok ? d.sideQuests || [] : [])).catch(() => []),
      ]);
      setSideQuests(quests);
      fetch(`/api/trails/${TRAIL_ID}/events`).then((r) => r.json()).then((d) => d?.ok && setEvents(d.events || [])).catch(() => {});
      loadBoardTop();
      routeFromUrl(list, quests);
      setInitialized(true);
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Back/forward buttons
  useEffect(() => {
    const onPop = () => routeFromUrl(breweries, sideQuests);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [breweries, sideQuests]); // eslint-disable-line react-hooks/exhaustive-deps

  // Signed-in data
  useEffect(() => {
    if (!user?.id) return;
    loadUserMe();
    loadMe().then(() => {
      if (!localStorage.getItem("hcm-onboarding-complete")) setShowOnboarding(true);
    }).catch(() => {});
    loadMyBeers().catch(() => {});
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Screens open at the top
  useEffect(() => { try { window.scrollTo(0, 0); } catch {} }, [tab, screen]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const confirmAge = () => {
    localStorage.setItem("hcm-age-confirmed-at", new Date().toISOString());
    setAgeConfirmed(true);
    if (userMe) patchUserMe({ legal_age_confirmed: true }).catch(() => {});
  };

  const requireSignIn = (then, reason) => { setAfterAuth(() => then || null); setShowAuth({ mode: "signup", reason: reason || null }); };

  const onAuthSuccess = async (authRes) => {
    const u = authRes?.user ? { id: authRes.user.id, email: authRes.user.email } : { id: null };
    setUser(u);
    localStorage.setItem("hcm-user", JSON.stringify(u));
    localStorage.setItem("hcm-welcome-done", "true");
    setWelcomeDone(true);
    setShowAuth(false);
    const next = afterAuth; setAfterAuth(null);
    if (next) setTimeout(next, 50);
  };

  const handleLogout = () => {
    apiLogout();
    supabase.auth.signOut().catch(() => {});
    ["hcm-user", "hcm-stamps", "hcm-beers", "hcm-onboarding-complete", "hcm-onboarding-profile", "hcm-timer-start", "hcm-timer-end",
      "hcm-leaderboard", "hcm-sidequest-checkins", "hcm-completion-modal-shown", "hcm-untappd-onboarding-dismissed", "hcm-card-round",
      "hcm-milestone-5-seen", "hcm-milestone-7-seen", "hcm-micro-asked", "hcm-hat-claimed"].forEach((k) => localStorage.removeItem(k));
    setUser(null); setUserMe(null); setStamps([]); setStampDates({}); setBeers([]); setTimerStart(null); setTimerEnd(null);
    setHatClaimed(false); setCardRound(1); setQuestClaims([]); setMenuOpen(false); setScreen(null); setTab("home"); push("/");
  };

  const startCheckIn = (brewery) => {
    if (!user) return requireSignIn(() => setCheckIn(brewery), v.signInToCheckIn);
    setCheckIn(brewery);
  };

  const activeBreweries = breweries.filter((b) => b.status !== "inactive");
  const total = activeBreweries.length || 8;

  const onStamped = (breweryId, n) => {
    setStamps((s) => (s.includes(breweryId) ? s : [...s, breweryId]));
    setStampDates((d) => ({ ...d, [breweryId]: d[breweryId] || new Date().toISOString() }));
    if (!timerStart) setTimerStart(Date.now());
    loadMe().catch(() => {});
    loadMyBeers().catch(() => {});
    // Milestone line on Home
    const left = activeBreweries.filter((b) => b.id !== breweryId && !stamps.includes(b.id));
    const openLeft = left.find((b) => openStatus(b).open);
    if (n === 1) setMilestone({ count: n, title: v.m1, line: "" });
    else if (n === Math.ceil(total / 2)) setMilestone({ count: n, title: fmt(v.m4, { n: total - n }), line: "" });
    else if (n === total - 1) {
      setMilestone({ count: n, title: openLeft ? fmt(v.m7open, { place: openLeft.name, t: formatClose(openStatus(openLeft).closesAt, v) }) : v.m7, line: "" });
    }
    if (n >= total) {
      const place = breweries.find((b) => b.id === breweryId)?.name;
      getLeaderboard().then((res) => {
        const rows = res?.leaderboard || [];
        setBoardTop(rows);
        const mine = rows.findIndex((r) => r.userId === user?.id);
        setCelebrate({ pendingRank: mine >= 0 ? mine + 1 : null, place });
      }).catch(() => setCelebrate({ place }));
    }
  };

  const afterCheckInClosed = () => {
    setCheckIn(null);
    if (!celebrate) {
      const q = nextMicroQuestion(stamps.length);
      if (q) setTimeout(() => setMicro(q), 350);
    }
  };

  const handleCardReset = async () => {
    const res = await postResetCard();
    if (!res?.ok) throw new Error(res?.error || "Reset failed");
    const newRound = res.newCardRound || cardRound + 1;
    setCardRound(newRound); localStorage.setItem("hcm-card-round", String(newRound));
    setStamps([]); setStampDates({}); localStorage.removeItem("hcm-stamps");
    setHatClaimed(false); localStorage.removeItem("hcm-hat-claimed");
    setTimerStart(null); setTimerEnd(null);
    localStorage.removeItem("hcm-micro-asked");
    setShowCardResetPrompt(false);
    goTab("home");
  };

  const doShare = async () => {
    const ms = timerStart ? (timerEnd || Date.now()) - timerStart : null;
    const mine = boardTop.findIndex((r) => r.userId === user?.id);
    await shareCard({ language, stamps, breweries: activeBreweries, totalMs: ms, running: !timerEnd, rank: mine >= 0 ? mine + 1 : null, beersCount: beers.length });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (!initialized) {
    return (
      <div className="v2" style={{ display: "grid", placeItems: "center" }}>
        <div className="loading-spinner" aria-label={v.loading} />
      </div>
    );
  }

  const needsWelcome = !ageConfirmed || (!user && !welcomeDone);
  const profile = readJSON("hcm-onboarding-profile", {});
  const currentBrewery = screen?.type === "brewery" ? breweries.find((b) => b.id === screen.id) : null;
  const clockMs = timerStart && timerEnd ? timerEnd - timerStart : null;

  const showUntappd = SHOW_UNTAPPD_INTEGRATION && !!user && !!userMe && userMe.is_untappd_tester && !userMe.untappd?.connected
    && !showOnboarding && !untappdOnboardingDismissed;

  let content;
  if (screen?.type === "brewery" && currentBrewery) {
    content = (
      <Brewery brewery={currentBrewery} stampedAt={stamps.includes(currentBrewery.id) ? stampDates[currentBrewery.id] || new Date().toISOString() : null}
        beerCountHere={beers.filter((b) => b.breweryId === currentBrewery.id).length} events={events} language={language}
        onBack={closeScreen} onCheckIn={() => startCheckIn(currentBrewery)} />
    );
  } else if (screen?.type === "quest") {
    content = (
      <SideQuest quest={screen.quest} claimed={questClaims.includes(screen.quest.id)} language={language} user={user} onBack={closeScreen}
        onRequireSignIn={() => requireSignIn()}
        onClaimed={(id) => { const next = [...new Set([...questClaims, id])]; setQuestClaims(next); localStorage.setItem("hcm-sidequest-checkins", JSON.stringify(next)); }} />
    );
  } else if (screen?.type === "events") {
    content = <Events events={events} breweries={breweries} language={language} onBack={closeScreen} onOpenBrewery={openBrewery} />;
  } else if (screen?.type === "profile" && user) {
    content = (
      <Profile user={user} userMe={userMe} profile={profile} stampsCount={stamps.length} total={total} beersCount={beers.length} bestMs={clockMs}
        language={language} setLanguage={setLanguage} nightMode={nightMode} toggleNightMode={toggleNightMode}
        onBack={closeScreen} onEditTaste={() => setEditTaste(true)} onLogout={handleLogout}
        onDeleted={() => { handleLogout(); localStorage.removeItem("hcm-welcome-done"); setWelcomeDone(false); }} />
    );
  } else if (tab === "map") {
    content = <MapScreen breweries={breweries} sideQuests={sideQuests} stamps={stamps} language={language} here={here} requestLocation={requestLocation} onOpenBrewery={openBrewery} onOpenQuest={openQuest} />;
  } else if (tab === "card") {
    content = (
      <MyCard tab={cardTab} setTab={setCardTab} user={user} breweries={activeBreweries} stamps={stamps} stampDates={stampDates} beers={beers}
        timerStart={timerStart} timerEnd={timerEnd} hatClaimed={hatClaimed} language={language}
        onSignIn={() => requireSignIn()} onShare={doShare} onLoadBeers={loadMyBeers} />
    );
  } else if (tab === "ask") {
    content = (
      <Ask user={user} name={profile?.display_name} breweries={activeBreweries} stamps={stamps} hatClaimed={hatClaimed} language={language}
        onSignIn={() => requireSignIn()} onOpenBrewery={openBrewery} />
    );
  } else {
    content = (
      <Home breweries={breweries} stamps={stamps} stampDates={stampDates} timerStart={timerStart} timerEnd={timerEnd} events={events}
        sideQuests={sideQuests} boardTop={boardTop} user={user} hatClaimed={hatClaimed} cardRound={cardRound} language={language}
        setLanguage={setLanguage} nightMode={nightMode} toggleNightMode={toggleNightMode} onMenu={() => setMenuOpen(true)}
        onOpenBrewery={openBrewery} onOpenQuest={openQuest}
        onOpenEvents={(ev) => {
          if (ev?.breweryId && breweries.some((b) => b.id === ev.breweryId)) openBrewery({ id: ev.breweryId });
          else { setScreen({ type: "events" }); push("/events"); }
        }}
        onOpenGuide={() => setShowGuide(true)} onOpenBoard={() => { setCardTab("ranking"); goTab("card"); }}
        milestone={milestone} onDismissMilestone={() => setMilestone(null)} here={here} requestLocation={requestLocation} />
    );
  }

  const showTabs = !screen || screen.type === "events";

  return (
    <div className="v2 app" data-lang={language}>
      {content}
      {showTabs && <TabBar current={screen ? null : tab} onChange={goTab} language={language} />}

      {menuOpen && (
        <MenuDrawer language={language} setLanguage={setLanguage} nightMode={nightMode} toggleNightMode={toggleNightMode} user={user}
          onClose={() => setMenuOpen(false)}
          onProfile={() => { setMenuOpen(false); setScreen({ type: "profile" }); push("/profile"); }}
          onGuide={() => { setMenuOpen(false); setShowGuide(true); }}
          onSignIn={() => { setMenuOpen(false); setShowAuth({ mode: "login" }); }}
          onLogout={handleLogout} />
      )}

      {checkIn && (
        <CheckInFlow brewery={checkIn} isStamped={stamps.includes(checkIn.id)} stampCount={stamps.length} total={total} language={language}
          onClose={afterCheckInClosed} onStamped={onStamped} onBeerSaved={() => loadMyBeers()} onToast={flash} />
      )}

      {micro && !checkIn && <MicroQuestion question={micro} language={language} onClose={() => setMicro(null)} />}

      {celebrate && !checkIn && (
        <Celebrate language={language} totalMs={timerStart ? (timerEnd || Date.now()) - timerStart : 0} rank={celebrate.pendingRank} lastPlace={celebrate.place}
          onClaim={() => { setCelebrate(null); setHatClaimOpen(true); }} onClose={() => setCelebrate(null)} />
      )}
      {hatClaimOpen && (
        <HatClaim language={language} breweries={activeBreweries} onClose={() => setHatClaimOpen(false)}
          onClaimed={() => { setHatClaimed(true); localStorage.setItem("hcm-hat-claimed", "true"); loadMe(); }} />
      )}

      {showCardResetPrompt && !celebrate && !hatClaimOpen && (
        <CardResetPrompt language={language} setLanguage={setLanguage} cardRound={cardRound} onReset={handleCardReset}
          onDismiss={() => { localStorage.setItem(`hcm-reset-prompt-dismissed-${TRAIL_ID}-${cardRound}`, "true"); setShowCardResetPrompt(false); }} />
      )}

      {showOnboarding && user && !showAuth && (
        <Onboarding language={language} breweries={activeBreweries} stamps={stamps}
          onDone={(firstStop) => { setShowOnboarding(false); if (firstStop) openBrewery(firstStop); }} />
      )}
      {editTaste && (
        <Onboarding language={language} breweries={activeBreweries} stamps={stamps} editing onDone={() => setEditTaste(false)} />
      )}

      {showGuide && <Guide language={language} onDone={() => { setShowGuide(false); localStorage.setItem("hcm-guide-seen", "true"); }} />}

      {needsWelcome && (
        <Welcome language={language} setLanguage={setLanguage}
          onStart={() => {
            confirmAge(); localStorage.setItem("hcm-welcome-done", "true"); setWelcomeDone(true);
            if (!localStorage.getItem("hcm-guide-seen")) setShowGuide(true);
          }}
          onSignIn={() => { confirmAge(); localStorage.setItem("hcm-welcome-done", "true"); setWelcomeDone(true); setShowAuth({ mode: "login" }); }} />
      )}

      {showAuth && (
        <SignIn language={language} initialMode={showAuth.mode || "signup"} reason={showAuth.reason} onSuccess={onAuthSuccess}
          onClose={() => { setShowAuth(false); setAfterAuth(null); }} />
      )}

      {showUntappd && (
        <UntappdOnboarding language={language} onDismiss={() => { localStorage.setItem("hcm-untappd-onboarding-dismissed", "true"); setUntappdOnboardingDismissed(true); }} />
      )}

      <Toast text={toast} />
    </div>
  );
}
