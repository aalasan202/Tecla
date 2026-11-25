import type { ReactNode } from "react";
import type { IllustrationId } from "../../course/types";

/**
 * Ilustraciones de los consejos del Curso (010, FR-026/FR-027): SVG propios en línea que solo
 * usan variables de color del tema, así que cambian con el tema claro/oscuro y van sin conexión.
 */

const INK = "var(--ink)";
const MUTED = "var(--muted)";
const LINE = "var(--line)";
const ACCENT = "var(--accent)";
const GOOD = "var(--good)";
const BAD = "var(--bad)";
const KEY = "var(--key)";
const EDGE = "var(--key-edge)";
const BLACK = "var(--black)";

const Frame = ({ label, children }: { label: string; children: ReactNode }) => (
  <svg className="illus" viewBox="0 0 320 200" role="img" aria-label={label}>
    {children}
  </svg>
);

/** Teclado: `whites` teclas blancas desde x, con las negras en su sitio; `hi` resalta blancas por índice. */
function Keys({ x, y, whites, w = 22, h = 56, hi = [], first = 0 }: { x: number; y: number; whites: number; w?: number; h?: number; hi?: number[]; first?: number }) {
  const blackAfter = [true, true, false, true, true, true, false]; // Do Re Mi Fa Sol La Si
  return (
    <g>
      {Array.from({ length: whites }, (_, i) => (
        <rect key={i} x={x + i * w} y={y} width={w} height={h} rx="2" fill={hi.includes(i) ? ACCENT : KEY} stroke={EDGE} strokeWidth="1.2" />
      ))}
      {Array.from({ length: whites - 1 }, (_, i) =>
        blackAfter[(i + first) % 7] ? <rect key={`b${i}`} x={x + (i + 1) * w - w * 0.3} y={y} width={w * 0.6} height={h * 0.6} rx="1.5" fill={BLACK} /> : null,
      )}
    </g>
  );
}

const Posture = () => (
  <Frame label="Persona sentada de perfil al piano, con los antebrazos paralelos al suelo y los pies apoyados">
    <line x1="10" x2="310" y1="186" y2="186" stroke={LINE} strokeWidth="2" />
    {/* piano */}
    <rect x="214" y="88" width="96" height="14" rx="2" fill={KEY} stroke={EDGE} strokeWidth="1.5" />
    <rect x="236" y="102" width="12" height="84" fill={MUTED} opacity="0.5" />
    {/* banqueta */}
    <rect x="70" y="128" width="80" height="10" rx="3" fill={MUTED} />
    <line x1="78" x2="78" y1="138" y2="186" stroke={MUTED} strokeWidth="5" />
    <line x1="142" x2="142" y1="138" y2="186" stroke={MUTED} strokeWidth="5" />
    {/* cuerpo */}
    <circle cx="112" cy="40" r="16" fill="none" stroke={INK} strokeWidth="4" />
    <path d="M112 56 L116 124" stroke={INK} strokeWidth="6" strokeLinecap="round" />
    <path d="M116 124 L176 128 L178 184 L196 184" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    {/* brazo: hombro → codo → mano sobre las teclas */}
    <path d="M114 66 L132 98 L214 92" fill="none" stroke={ACCENT} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    {/* guía horizontal del antebrazo */}
    <line x1="126" x2="232" y1="96" y2="96" stroke={GOOD} strokeWidth="2" strokeDasharray="5 5" />
    <text x="150" y="86" fontSize="12" fill={GOOD} fontWeight="700">90°</text>
    {/* pies apoyados */}
    <path d="M186 184 h14" stroke={GOOD} strokeWidth="4" strokeLinecap="round" />
  </Frame>
);

const HandShape = () => (
  <Frame label="Mano arqueada sobre las teclas, correcta, junto a una mano plana con la muñeca hundida, incorrecta">
    {/* correcta */}
    <rect x="20" y="150" width="130" height="16" rx="2" fill={KEY} stroke={EDGE} strokeWidth="1.5" />
    <path d="M24 112 C48 104 70 80 96 84 C118 88 124 120 128 150" fill="none" stroke={GOOD} strokeWidth="7" strokeLinecap="round" />
    <circle cx="128" cy="150" r="5" fill={GOOD} />
    <circle cx="80" cy="120" r="20" fill="none" stroke={GOOD} strokeWidth="2" strokeDasharray="4 4" />
    <path d="M60 184 l10 8 l16 -18" fill="none" stroke={GOOD} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    {/* incorrecta */}
    <rect x="170" y="150" width="130" height="16" rx="2" fill={KEY} stroke={EDGE} strokeWidth="1.5" />
    <path d="M174 132 C200 156 230 150 262 146 L290 146" fill="none" stroke={BAD} strokeWidth="7" strokeLinecap="round" />
    <path d="M222 178 l16 16 M238 178 l-16 16" stroke={BAD} strokeWidth="4" strokeLinecap="round" />
  </Frame>
);

function Hand({ cx, flip }: { cx: number; flip: boolean }) {
  // dedos del pulgar (1) al meñique (5); en la mano izquierda, al revés
  const fingers = [
    { dx: -44, top: 112, len: 34 },
    { dx: -20, top: 58, len: 60 },
    { dx: 2, top: 48, len: 70 },
    { dx: 24, top: 56, len: 62 },
    { dx: 44, top: 76, len: 44 },
  ];
  return (
    <g>
      <rect x={cx - 34} y="118" width="68" height="64" rx="22" fill="var(--accent-soft)" stroke={ACCENT} strokeWidth="2.5" />
      {fingers.map((f, i) => {
        const x = cx + (flip ? -f.dx : f.dx);
        return (
          <g key={i}>
            <rect x={x - 9} y={f.top} width="18" height={f.len + 14} rx="9" fill="var(--accent-soft)" stroke={ACCENT} strokeWidth="2.5" />
            <circle cx={x} cy={f.top + 12} r="10" fill={ACCENT} />
            <text x={x} y={f.top + 16.5} fontSize="13" fontWeight="700" textAnchor="middle" fill="var(--on-accent)">
              {i + 1}
            </text>
          </g>
        );
      })}
    </g>
  );
}

const FingerNumbers = () => (
  <Frame label="Las dos manos con los dedos numerados del 1, el pulgar, al 5, el meñique">
    <Hand cx={92} flip />
    <Hand cx={228} flip={false} />
  </Frame>
);

const FindC = () => (
  <Frame label="Teclado con los Do resaltados, justo a la izquierda de cada grupo de dos teclas negras">
    <Keys x={6} y={60} whites={14} w={22} h={110} hi={[0, 7]} />
    {/* llaves sobre los grupos de dos negras */}
    {[0, 7].map((i) => {
      const x = 6 + i * 22 + 22 - 6.6;
      return <path key={i} d={`M${x} 52 v-8 h${22 + 13.2} v8`} fill="none" stroke={ACCENT} strokeWidth="2.5" />;
    })}
    {[0, 7].map((i) => (
      <path key={`a${i}`} d={`M${6 + i * 22 + 11} 186 v-12 m-5 5 l5 -5 l5 5`} fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" />
    ))}
  </Frame>
);

const ArmWeight = () => (
  <Frame label="Brazo y mano relajados sobre el teclado, con una flecha que indica el peso del brazo hacia abajo">
    <Keys x={150} y={140} whites={7} w={22} h={46} />
    <path d="M30 40 C70 60 110 90 150 112 C170 122 196 124 214 140" fill="none" stroke={ACCENT} strokeWidth="9" strokeLinecap="round" />
    <circle cx="30" cy="40" r="12" fill={ACCENT} opacity="0.35" />
    <path d="M110 20 v62 m-12 -12 l12 12 l12 -12" fill="none" stroke={GOOD} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M24 70 q10 -8 20 0 q10 8 20 0" fill="none" stroke={MUTED} strokeWidth="2.5" strokeLinecap="round" />
  </Frame>
);

const ArmJump = () => (
  <Frame label="Teclado con un arco que muestra cómo el brazo lleva la mano de una posición a otra">
    <Keys x={6} y={120} whites={14} w={22} h={66} />
    <rect x={8} y={110} width={106} height={6} rx="3" fill={ACCENT} opacity="0.5" />
    <rect x={162} y={110} width={106} height={6} rx="3" fill={GOOD} />
    <path d="M60 100 C90 30 190 30 214 100" fill="none" stroke={ACCENT} strokeWidth="4" strokeDasharray="8 6" strokeLinecap="round" />
    <path d="M204 92 l10 10 l4 -14" fill="none" stroke={ACCENT} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </Frame>
);

const EyesOnScore = () => (
  <Frame label="La mirada va a la partitura y no a las manos">
    {/* partitura */}
    <g>
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1="170" x2="310" y1={28 + i * 9} y2={28 + i * 9} stroke={MUTED} strokeWidth="1.5" />
      ))}
      {[190, 220, 250, 280].map((x, i) => (
        <ellipse key={x} cx={x} cy={64 - i * 9} rx="6" ry="4.5" fill={INK} transform={`rotate(-20 ${x} ${64 - i * 9})`} />
      ))}
    </g>
    {/* ojo */}
    <path d="M30 100 q30 -28 60 0 q-30 28 -60 0z" fill="none" stroke={INK} strokeWidth="3" />
    <circle cx="60" cy="100" r="9" fill={ACCENT} />
    {/* sí: a la partitura */}
    <path d="M96 92 L164 54" stroke={GOOD} strokeWidth="3" strokeDasharray="6 5" strokeLinecap="round" />
    {/* no: a las manos */}
    <Keys x={150} y={150} whites={7} w={22} h={40} />
    <path d="M96 110 L148 150" stroke={BAD} strokeWidth="3" strokeDasharray="6 5" strokeLinecap="round" opacity="0.7" />
    <path d="M112 118 l14 14 M126 118 l-14 14" stroke={BAD} strokeWidth="3.5" strokeLinecap="round" />
  </Frame>
);

const ART: Record<IllustrationId, () => JSX.Element> = {
  posture: Posture,
  "hand-shape": HandShape,
  "finger-numbers": FingerNumbers,
  "find-c": FindC,
  "arm-weight": ArmWeight,
  "arm-jump": ArmJump,
  "eyes-on-score": EyesOnScore,
};

export function Illustration({ id }: { id: IllustrationId }) {
  const Art = ART[id];
  return <Art />;
}
