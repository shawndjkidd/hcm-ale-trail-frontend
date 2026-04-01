import { useState, useEffect } from "react";

const VIBE_OPTIONS = [
  { id: "chill", label: "Chill Vibes", icon: "😎" },
  { id: "explorer", label: "Bar Hopper", icon: "🗺" },
  { id: "social", label: "Here for the Party", icon: "🤝" },
  { id: "craftnerd", label: "Beer Snob", icon: "🍺" },
];

const BEER_OPTIONS = [
  { id: "lager", label: "Lager / Pilsner", icon: "🍺" },
  { id: "wheat", label: "Wheat / Wit", icon: "🌾" },
  { id: "ipa", label: "IPA / Pale Ale", icon: "🍊" },
  { id: "stout", label: "Stout / Porter", icon: "🥃" },
  { id: "sour", label: "Sour / Wild", icon: "🍒" },
  { id: "cider", label: "Cider / Other", icon: "🍎" },
];

const GROUP_OPTIONS = [
  { id: "solo", label: "Solo Wolf", icon: "🐺" },
  { id: "duo", label: "Dynamic Duo", icon: "👯" },
  { id: "squad", label: "The Squad", icon: "🍻" },
  { id: "party", label: "Party Bus", icon: "🎉" },
];

const ERA_OPTIONS = [
  { id: "fresh", label: "Just Landed", icon: "🛬" },
  { id: "settling", label: "Getting Around", icon: "🏍" },
  { id: "local", label: "Local-ish", icon: "🏠" },
  { id: "og", label: "OG", icon: "🐉" },
];

const AVATAR_OPTIONS = [
  { id: "dude", label: "The Dude", icon: "🍻" },
  { id: "lady", label: "The Lady", icon: "💃" },
  { id: "mystery", label: "The Mystery", icon: "🎭" },
];

const NEIGHBORHOODS = [
  { id: "d1", label: "District 1", icon: "🏙" },
  { id: "d2", label: "District 2 / Thu Duc", icon: "🌿" },
  { id: "d3", label: "District 3", icon: "🏛" },
  { id: "d7", label: "District 7", icon: "🌇" },
  { id: "binhtan", label: "Binh Thanh", icon: "🌊" },
  { id: "other", label: "Other / Visitor", icon: "✈" },
];

export default function ProfileModal({ user, onClose }) {
  const [profile, setProfile] = useState({
    vibe: "",
    beerStyles: [],
    groupSize: "",
    era: "",
    avatar: "",
    displayName: "",
    neighborhood: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("hcm-user-profile");
      if (stored) {
        const parsed = JSON.parse(stored);
        setProfile((prev) => ({ ...prev, ...parsed }));
      }
    } catch {}
  }, []);

  const updateField = (key, value) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const toggleBeerStyle = (id) => {
    setProfile((prev) => {
      const styles = prev.beerStyles || [];
      const next = styles.includes(id)
        ? styles.filter((s) => s !== id)
        : [...styles, id];
      return { ...prev, beerStyles: next };
    });
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem("hcm-user-profile", JSON.stringify(profile));
    try {
      const token = localStorage.getItem("hcm-token");
      if (token) {
        fetch("/api/user/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(profile),
        }).catch(() => {});
      }
    } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const avatarIcon = AVATAR_OPTIONS.find((a) => a.id === profile.avatar)?.icon || "👤";

  return (
    <div className="profile-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="profile-modal">
        <button className="profile-close" onClick={onClose}>✕</button>

        <div className="profile-header">
          <div className="profile-avatar-large">{avatarIcon}</div>
          <div className="profile-name">{profile.displayName || user?.email?.split("@")[0] || "Trail Walker"}</div>
          <div className="profile-email">{user?.email || ""}</div>
        </div>

        {/* Vibe */}
        <div className="profile-section">
          <h3 className="profile-section-title">YOUR VIBE</h3>
          <div className="profile-chips">
            {VIBE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                className={`profile-chip ${profile.vibe === opt.id ? "selected" : ""}`}
                onClick={() => updateField("vibe", opt.id)}
              >
                <span>{opt.icon}</span> {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Beer Styles */}
        <div className="profile-section">
          <h3 className="profile-section-title">BEER STYLES</h3>
          <div className="profile-chips">
            {BEER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                className={`profile-chip ${(profile.beerStyles || []).includes(opt.id) ? "selected" : ""}`}
                onClick={() => toggleBeerStyle(opt.id)}
              >
                <span>{opt.icon}</span> {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Group Size */}
        <div className="profile-section">
          <h3 className="profile-section-title">CREW SIZE</h3>
          <div className="profile-chips">
            {GROUP_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                className={`profile-chip ${profile.groupSize === opt.id ? "selected" : ""}`}
                onClick={() => updateField("groupSize", opt.id)}
              >
                <span>{opt.icon}</span> {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Era */}
        <div className="profile-section">
          <h3 className="profile-section-title">YOUR ERA</h3>
          <div className="profile-chips">
            {ERA_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                className={`profile-chip ${profile.era === opt.id ? "selected" : ""}`}
                onClick={() => updateField("era", opt.id)}
              >
                <span>{opt.icon}</span> {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Avatar */}
        <div className="profile-section">
          <h3 className="profile-section-title">AVATAR</h3>
          <div className="profile-chips">
            {AVATAR_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                className={`profile-chip ${profile.avatar === opt.id ? "selected" : ""}`}
                onClick={() => updateField("avatar", opt.id)}
              >
                <span>{opt.icon}</span> {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Display Name */}
        <div className="profile-section">
          <h3 className="profile-section-title">DISPLAY NAME</h3>
          <input
            type="text"
            className="profile-input"
            value={profile.displayName || ""}
            onChange={(e) => updateField("displayName", e.target.value)}
            placeholder="Trail name..."
            maxLength={20}
          />
        </div>

        {/* Neighborhood */}
        <div className="profile-section">
          <h3 className="profile-section-title">NEIGHBORHOOD</h3>
          <div className="profile-chips">
            {NEIGHBORHOODS.map((opt) => (
              <button
                key={opt.id}
                className={`profile-chip ${profile.neighborhood === opt.id ? "selected" : ""}`}
                onClick={() => updateField("neighborhood", opt.id)}
              >
                <span>{opt.icon}</span> {opt.label}
              </button>
            ))}
          </div>
        </div>

        <button className="profile-save-btn" onClick={handleSave}>
          {saved ? "✓ SAVED!" : "SAVE PROFILE"}
        </button>
      </div>
    </div>
  );
}

