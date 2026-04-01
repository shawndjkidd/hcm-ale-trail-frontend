import { useState } from "react";

const STEPS = [
  {
    key: "vibe",
    title: "What's your vibe?",
    subtitle: "Pick the one that fits you best",
    multi: false,
    options: [
      { id: "chill", label: "Chill Vibes", icon: "ð", desc: "Low-key spots, cold beers" },
      { id: "explorer", label: "Bar Hopper", icon: "ðºï¸", desc: "Hit every spot on the map" },
      { id: "social", label: "Here for the Party", icon: "ð¥³", desc: "Where the people at?" },
      { id: "craftnerd", label: "Beer Snob", icon: "ð§", desc: "ABV, IBU, all of it" },
    ],
  },
  {
    key: "beerStyles",
    title: "What do you reach for?",
    subtitle: "Tap your favorites \u2014 go wild",
    multi: true,
    options: [
      { id: "ipa", label: "IPA", icon: "ð¥", desc: "Hops on hops" },
      { id: "lager", label: "Lager", icon: "ð", desc: "Keep it classic" },
      { id: "stout", label: "Stout", icon: "ð", desc: "Dark side energy" },
      { id: "sour", label: "Sour", icon: "ð", desc: "Pucker up" },
      { id: "wheat", label: "Wheat", icon: "âï¸", desc: "Easy breezy" },
      { id: "surprise", label: "Surprise me!", icon: "ð°", desc: "Feeling lucky" },
    ],
  },
  {
    key: "groupSize",
    title: "How do you roll?",
    subtitle: "Your usual crew",
    multi: false,
    options: [
      { id: "solo", label: "Lone Wolf", icon: "ðº", desc: "Just me & a cold one" },
      { id: "duo", label: "Dynamic Duo", icon: "ð¤", desc: "Partner in crime" },
      { id: "crew", label: "The Squad", icon: "ðª", desc: "3\u20135 deep" },
      { id: "party", label: "Full Send", icon: "ð", desc: "The more the merrier" },
    ],
  },
  {
    key: "era",
    title: "Pick your era",
    subtitle: "How long have you been at this?",
    multi: false,
    options: [
      { id: "rookie", label: "Fresh ID", icon: "ð", desc: "18\u201324 \u00B7 Just getting started" },
      { id: "prime", label: "In My Prime", icon: "â¡", desc: "25\u201334 \u00B7 Peak form" },
      { id: "seasoned", label: "Seasoned", icon: "ð¥", desc: "35\u201344 \u00B7 I know what I like" },
      { id: "og", label: "OG", icon: "ð", desc: "45+ \u00B7 Been here since day one" },
    ],
  },
  {
    key: "avatar",
    title: "Trail avatar",
    subtitle: "Pick your character",
    multi: false,
    options: [
      { id: "dude", label: "The Dude", icon: "ð»", desc: "Classic legend" },
      { id: "lady", label: "The Lady", icon: "ð", desc: "Runs this town" },
      { id: "mystery", label: "Mystery", icon: "ð¶ï¸", desc: "Wouldn't you like to know" },
    ],
  },
  {
    key: "about",
    title: "Last call!",
    subtitle: "Totally optional \u2014 skip if you want",
    multi: false,
    options: [],
    isTextStep: true,
  },
];

const NEIGHBORHOODS = [
  { id: "d1", label: "District 1", icon: "ðï¸" },
  { id: "d2", label: "D2 / Thu Duc", icon: "ð´" },
  { id: "d3", label: "District 3", icon: "ðµ" },
  { id: "d7", label: "District 7", icon: "ð" },
  { id: "other_vn", label: "Other Vietnam", icon: "ð»ð³" },
  { id: "visitor", label: "Just Visiting!", icon: "ð§³" },
];
export default function OnboardingFlow({ user, onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    vibe: null,
    beerStyles: [],
    groupSize: null,
    era: null,
    avatar: null,
    displayName: user?.name || "",
    neighborhood: "",
  });
  const [saving, setSaving] = useState(false);

  const current = STEPS[step];
  const totalSteps = STEPS.length;
  const progress = ((step + 1) / totalSteps) * 100;

  const handleSelect = (optionId) => {
    if (current.multi) {
      setAnswers((prev) => {
        const list = prev[current.key] || [];
        return {
          ...prev,
          [current.key]: list.includes(optionId)
            ? list.filter((id) => id !== optionId)
            : [...list, optionId],
        };
      });
    } else {
      setAnswers((prev) => ({
        ...prev,
        [current.key]: prev[current.key] === optionId ? null : optionId,
      }));
    }
  };

  const isSelected = (optionId) => {
    if (current.multi) {
      return (answers[current.key] || []).includes(optionId);
    }
    return answers[current.key] === optionId;
  };

  const canProceed = () => {
    if (current.isTextStep) return true;
    if (current.multi) return (answers[current.key] || []).length > 0;
    return answers[current.key] !== null;
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };
  const handleFinish = async () => {
    setSaving(true);
    try {
      const profile = {
        vibe: answers.vibe,
        beer_styles: answers.beerStyles,
        group_size: answers.groupSize,
        era: answers.era,
        avatar: answers.avatar,
        display_name: answers.displayName || user?.name || "",
        neighborhood: answers.neighborhood || "",
        completed_at: new Date().toISOString(),
      };
      localStorage.setItem("hcm-onboarding-profile", JSON.stringify(profile));
      localStorage.setItem("hcm-onboarding-complete", "true");

      if (user?.id) {
        try {
          const token = localStorage.getItem("hcm-access-token");
          await fetch("/api/user/profile", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(profile),
          });
        } catch {
          // Backend endpoint may not exist yet
        }
      }

      onComplete?.(profile);
    } catch (e) {
      console.error("Onboarding save error:", e);
      localStorage.setItem("hcm-onboarding-complete", "true");
      onComplete?.({});
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        {/* Progress bar */}
        <div className="onboarding-progress-bar">
          <div className="onboarding-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Step dots */}
        <div className="onboarding-step-dots">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`onboarding-dot ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}
            />
          ))}
        </div>

        {/* Title */}
        <h2 className="onboarding-title">{current.title}</h2>
        <p className="onboarding-subtitle">{current.subtitle}</p>

        {/* Options or text inputs */}
        {current.isTextStep ? (
          <div className="onboarding-text-fields">
            <div className="onboarding-field">
              <label className="onboarding-label">What should we call you?</label>
              <input
                type="text"
                className="onboarding-input"
                placeholder="Your trail nickname..."
                value={answers.displayName}
                onChange={(e) => setAnswers((prev) => ({ ...prev, displayName: e.target.value }))}
              />
            </div>
            <div className="onboarding-field">
              <label className="onboarding-label">Where are you based?</label>
              <div className="onboarding-tiles onboarding-tiles-3col">
                {NEIGHBORHOODS.map((opt) => (
                  <button
                    key={opt.id}
                    className={`onboarding-tile onboarding-tile-small ${answers.neighborhood === opt.id ? "selected" : ""}`}
                    onClick={() => setAnswers((prev) => ({ ...prev, neighborhood: prev.neighborhood === opt.id ? "" : opt.id }))}
                  >
                    <span className="onboarding-tile-icon">{opt.icon}</span>
                    <span className="onboarding-tile-label">{opt.label}</span>
                    {answers.neighborhood === opt.id && <span className="onboarding-tile-check">â</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className={`onboarding-tiles ${current.options.length > 4 || current.options.length === 3 ? "onboarding-tiles-3col" : ""}`}>
            {current.options.map((opt) => (
              <button
                key={opt.id}
                className={`onboarding-tile ${isSelected(opt.id) ? "selected" : ""}`}
                onClick={() => handleSelect(opt.id)}
              >
                <span className="onboarding-tile-icon">{opt.icon}</span>
                <span className="onboarding-tile-label">{opt.label}</span>
                <span className="onboarding-tile-desc">{opt.desc}</span>
                {isSelected(opt.id) && <span className="onboarding-tile-check">â</span>}
              </button>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="onboarding-nav">
          <button className="onboarding-skip" onClick={handleNext}>
            Skip
          </button>
          <button
            className="onboarding-next"
            onClick={handleNext}
            disabled={!canProceed() || saving}
          >
            {saving ? "Saving..." : step === totalSteps - 1 ? "LET'S GO! ðº" : "NEXT"}
          </button>
        </div>
      </div>
    </div>
  );
}
