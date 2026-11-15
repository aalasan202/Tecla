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
