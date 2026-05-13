import { useEffect } from 'react';
import translations from '../translations';

const MILESTONE_CONFIG = {
  5: {
    emoji: '🔥',
    titleKey: 'milestone5Title',
    subtitleKey: 'milestone5Subtitle',
    messageKey: 'milestone5Message',
    accentColor: '#FFD100',
    bgColor: '#E31E24',
  },
  7: {
    emoji: '🏁',
    titleKey: 'milestone7Title',
    subtitleKey: 'milestone7Subtitle',
    messageKey: 'milestone7Message',
    accentColor: '#00B050',
    bgColor: '#00B050',
  },
};

export default function MilestoneModal({ milestone, stampCount, totalBreweries, onClose, language = 'en' }) {
  const config = MILESTONE_CONFIG[milestone];
  const t = translations[language] || translations.en;

  useEffect(() => {
    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!config) return null;

  const remaining = totalBreweries - stampCount;

  return (
    <div className="milestone-overlay">
      <div className="milestone-modal">
        <div className="milestone-emoji">{config.emoji}</div>
        <h2 className="milestone-title">{t[config.titleKey]}</h2>
        <p className="milestone-subtitle">{t[config.subtitleKey]}</p>

        <div className="milestone-progress">
          <div className="milestone-progress-bar">
            <div
              className="milestone-progress-fill"
              style={{ width: `${(stampCount / totalBreweries) * 100}%`, backgroundColor: config.accentColor }}
            />
          </div>
          <span className="milestone-progress-text">{stampCount} / {totalBreweries} {t.milestoneBreweries}</span>
        </div>

        <p className="milestone-message">{t[config.messageKey]}</p>

        {remaining > 0 && (
          <p className="milestone-remaining">
            {remaining} {t.milestoneBreweries} {t.milestoneRemaining}
          </p>
        )}

        <button
          className="milestone-close-btn"
          onClick={onClose}
          style={{ backgroundColor: config.bgColor }}
        >
          {t.milestoneLetsGo}
        </button>
      </div>
    </div>
  );
}
