import { useEffect } from 'react';

const MILESTONE_CONFIG = {
  5: {
    emoji: '🔥',
    title: 'You\'re on fire!',
    subtitle: '5 breweries down',
    message: 'You\'ve hit the halfway mark and then some! Keep the momentum going — the finish line is closer than you think.',
    color: '#f59e0b',
  },
  7: {
    emoji: '🏁',
    title: 'Almost there!',
    subtitle: 'Just 1 more to go',
    message: 'You\'re SO close to completing the trail! One more brewery and you\'ll earn your Ale Trail hat. Let\'s finish this!',
    color: '#22c55e',
  },
};

export default function MilestoneModal({ milestone, stampCount, totalBreweries, onClose, language }) {
  const config = MILESTONE_CONFIG[milestone];

  useEffect(() => {
    // Auto-dismiss after 8 seconds
    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!config) return null;

  const remaining = totalBreweries - stampCount;

  return (
    <div className="milestone-overlay" onClick={onClose}>
      <div className="milestone-modal" onClick={e => e.stopPropagation()}>
        <div className="milestone-emoji">{config.emoji}</div>
        <h2 className="milestone-title" style={{ color: config.color }}>{config.title}</h2>
        <p className="milestone-subtitle">{config.subtitle}</p>

        <div className="milestone-progress">
          <div className="milestone-progress-bar">
            <div
              className="milestone-progress-fill"
              style={{
                width: `${(stampCount / totalBreweries) * 100}%`,
                backgroundColor: config.color
              }}
            />
          </div>
          <span className="milestone-progress-text">{stampCount} / {totalBreweries} breweries</span>
        </div>

        <p className="milestone-message">{config.message}</p>

        {remaining > 0 && (
          <p className="milestone-remaining">
            {remaining} {remaining === 1 ? 'brewery' : 'breweries'} remaining
          </p>
        )}

        <button className="milestone-close-btn" onClick={onClose} style={{ backgroundColor: config.color }}>
          Let's Go!
        </button>
      </div>
    </div>
  );
}
