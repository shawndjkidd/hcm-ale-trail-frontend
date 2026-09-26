import { useV } from './i18n';

// Footer credit: a pint glass with the smpl. mark on it, slowly drunk in sips,
// then poured again, with one line beside it. Tapping either opens made SMPL.
// Motion is CSS only and switches off under prefers-reduced-motion (full glass).

const HREF = 'https://www.madesmpl.com/?from=hcmc-ale-trail';

// Inside of the glass (beer is clipped to this), and the glass outline around it.
const INSIDE = 'M25 12 H75 L69.5 88 Q69 91 66 91 H34 Q31 91 30.5 88 Z';
const GLASS = 'M21 8 H79 L72.6 90 Q72 95 67 95 H33 Q28 95 27.4 90 Z';

const CSS = `
.v2-pint { display: flex; align-items: center; justify-content: center; gap: 14px; margin: 36px auto 8px; text-decoration: none; color: #fff; width: fit-content; }
.v2-pint svg { width: 64px; height: 64px; flex: none; overflow: visible; filter: drop-shadow(0 4px 6px rgba(0,0,0,.35)); }
.v2-pint .line { font-size: 13px; line-height: 1.25; color: rgba(255,255,255,.75); }
.v2-pint .line b { display: block; font-size: 15px; font-weight: 800; color: #fff; }
.v2-pint .beer { animation: v2-pint-drink 12s ease-in-out infinite; }
.v2-pint .tilt { transform-origin: 50px 95px; transform-box: view-box; animation: v2-pint-tilt 12s ease-in-out infinite; }
.v2-pint .bubble { animation: v2-pint-bubble 2.4s linear infinite; }
.v2-pint .bubble.b2 { animation-delay: .8s; }
.v2-pint .bubble.b3 { animation-delay: 1.6s; }
@keyframes v2-pint-drink {
  0%, 6%   { transform: translateY(0); }
  13%, 20% { transform: translateY(18px); }
  28%, 35% { transform: translateY(38px); }
  43%, 50% { transform: translateY(58px); }
  58%, 68% { transform: translateY(84px); }
  80%, 100% { transform: translateY(0); }
}
@keyframes v2-pint-tilt {
  0%, 6%, 13%, 20%, 28%, 35%, 43%, 50%, 58%, 100% { transform: rotate(0deg); }
  9.5%, 24%, 39%, 54% { transform: rotate(-7deg); }
}
@keyframes v2-pint-bubble {
  0% { transform: translateY(0); opacity: 0; }
  15% { opacity: .8; }
  100% { transform: translateY(-40px); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .v2-pint .beer, .v2-pint .tilt, .v2-pint .bubble { animation: none; }
}
`;

export default function SmplPint({ language }) {
  const v = useV(language);
  return (
    <a className="v2-pint" href={HREF} aria-label={`${v.experienceOn} made SMPL`}>
      <style>{CSS}</style>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <clipPath id="v2-pint-inside"><path d={INSIDE} /></clipPath>
          <linearGradient id="v2-pint-beer" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFC93C" />
            <stop offset="1" stopColor="#E08A00" />
          </linearGradient>
        </defs>
        <g className="tilt">
          {/* Glass body */}
          <path d={GLASS} fill="rgba(255,255,255,.14)" />
          {/* Beer + head, drained by moving down inside the glass */}
          <g clipPath="url(#v2-pint-inside)">
            <g className="beer">
              <rect x="0" y="22" width="100" height="80" fill="url(#v2-pint-beer)" />
              <circle className="bubble" cx="40" cy="86" r="1.3" fill="#FFF3C4" />
              <circle className="bubble b2" cx="58" cy="84" r="1.1" fill="#FFF3C4" />
              <circle className="bubble b3" cx="48" cy="88" r="1" fill="#FFF3C4" />
              <path d="M0 24 V14 Q8 10 16 13 T32 12 T48 13 T64 11 T80 13 T100 12 V24 Z" fill="#FFF6DC" />
            </g>
          </g>
          {/* Glass outline and highlight */}
          <path d={GLASS} fill="none" stroke="rgba(255,255,255,.92)" strokeWidth="3" strokeLinejoin="round" />
          <path d="M28 16 L32.5 84" stroke="rgba(255,255,255,.45)" strokeWidth="3" strokeLinecap="round" />
          {/* smpl. printed on the glass */}
          <text
            x="50" y="60" textAnchor="middle" fontSize="21" letterSpacing="-1"
            fontFamily="Nunito, 'Arial Rounded MT Bold', system-ui, sans-serif" fontWeight="900"
            fill="#1A1A1A" stroke="#FFF6DC" strokeWidth="3" paintOrder="stroke" strokeLinejoin="round"
          >smpl.</text>
        </g>
      </svg>
      <span className="line">
        {v.experienceOn}
        <b>made SMPL →</b>
      </span>
    </a>
  );
}
