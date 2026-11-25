/** Iconos de trazo (24×24), heredan el color del texto. */
const base = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

type P = { size?: number };

export const IconSongs = ({ size = 24 }: P) => (
  <svg {...base} width={size} height={size}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

export const IconPiano = ({ size = 24 }: P) => (
  <svg {...base} width={size} height={size}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="7" x2="7" y1="5" y2="19" />
    <line x1="12" x2="12" y1="5" y2="19" />
    <line x1="17" x2="17" y1="5" y2="19" />
  </svg>
);

export const IconProgress = ({ size = 24 }: P) => (
  <svg {...base} width={size} height={size}>
    <line x1="4" x2="4" y1="20" y2="12" />
    <line x1="10" x2="10" y1="20" y2="6" />
    <line x1="16" x2="16" y1="20" y2="10" />
    <line x1="22" x2="2" y1="20" y2="20" />
  </svg>
);

export const IconSettings = ({ size = 24 }: P) => (
  <svg {...base} width={size} height={size}>
    <line x1="4" x2="20" y1="7" y2="7" />
    <line x1="4" x2="20" y1="17" y2="17" />
    <circle cx="9" cy="7" r="2.5" fill="var(--icon-bg, var(--surface))" />
    <circle cx="15" cy="17" r="2.5" fill="var(--icon-bg, var(--surface))" />
  </svg>
);

export const IconBack = ({ size = 22 }: P) => (
  <svg {...base} width={size} height={size}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

export const IconPlay = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z" />
  </svg>
);

export const IconRotate = () => (
  <svg width="168" height="168" viewBox="0 0 168 168" aria-hidden="true">
    <rect x="60" y="22" width="48" height="88" rx="9" fill="none" stroke="#8E9BF0" strokeWidth="3" strokeDasharray="6 6" />
    <rect x="30" y="74" width="108" height="58" rx="10" fill="#FFFFFF" />
    <g fill="#3A4EDF">
      {[44, 56, 68, 80, 92, 104, 116].map((x) => (
        <rect key={x} x={x} y="96" width="8" height="26" rx="1.5" />
      ))}
    </g>
    <g fill="#151B2C">
      {[49, 61, 85, 97, 109].map((x) => (
        <rect key={x} x={x} y="96" width="6" height="15" rx="1" />
      ))}
    </g>
    <path d="M124 30 a40 40 0 0 1 22 30" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
    <path d="M139 58 l7 4 l3 -8" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ---------- Curso (010) ----------

export const IconCourse = ({ size = 24 }: P) => (
  <svg {...base} width={size} height={size}>
    <path d="M3 7l9-4 9 4-9 4-9-4z" />
    <path d="M7 9v5c0 1.5 2.2 3 5 3s5-1.5 5-3V9" />
    <line x1="21" x2="21" y1="7" y2="13" />
  </svg>
);

export const IconLock = ({ size = 18 }: P) => (
  <svg {...base} width={size} height={size}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

export const IconCheck = ({ size = 18 }: P) => (
  <svg {...base} width={size} height={size}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

export const IconTip = ({ size = 24 }: P) => (
  <svg {...base} width={size} height={size}>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" />
  </svg>
);

export const IconFlag = ({ size = 24 }: P) => (
  <svg {...base} width={size} height={size}>
    <path d="M5 21V4" />
    <path d="M5 4h11l-2 4 2 4H5" />
  </svg>
);

export const IconClock = ({ size = 24 }: P) => (
  <svg {...base} width={size} height={size}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const IconTurtle = ({ size = 24 }: P) => (
  <svg {...base} width={size} height={size}>
    <path d="M4 15c0-4 3.6-7 8-7s8 3 8 7H4z" />
    <path d="M20 13h1.5a1.5 1.5 0 0 0 0-3H20" />
    <path d="M7 15v3M17 15v3" />
    <path d="M9 8.5l1.5 3h3l1.5-3" />
  </svg>
);

export const IconVoice = ({ size = 24 }: P) => (
  <svg {...base} width={size} height={size}>
    <path d="M5 9a7 7 0 0 1 14 0c0 4-3 5-3 8a3 3 0 0 1-6 0" />
    <path d="M9 9a3 3 0 0 1 6 0" />
    <path d="M2 6c-.7 2-.7 4 0 6M22 6c.7 2 .7 4 0 6" />
  </svg>
);

export const IconArrow = ({ size = 24 }: P) => (
  <svg {...base} width={size} height={size}>
    <circle cx="6" cy="12" r="2.5" />
    <path d="M11 12h10M17 8l4 4-4 4" />
  </svg>
);

export const IconLoop = ({ size = 24 }: P) => (
  <svg {...base} width={size} height={size}>
    <path d="M17 2l3 3-3 3" />
    <path d="M4 11V9a4 4 0 0 1 4-4h12" />
    <path d="M7 22l-3-3 3-3" />
    <path d="M20 13v2a4 4 0 0 1-4 4H4" />
  </svg>
);

export const IconMetronome = ({ size = 24 }: P) => (
  <svg {...base} width={size} height={size}>
    <path d="M9 3h6l4 18H5L9 3z" />
    <path d="M12 16l5-9" />
    <line x1="7" x2="17" y1="16" y2="16" />
  </svg>
);
