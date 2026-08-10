// ============================================================
// Tennis Kail — gezeichnete Ersatzbilder
// ============================================================
//
// Wenn kein Originalfoto vorliegt (siehe data/tk/images.ts), zeichnet die
// Anwendung selbst. Bewusst KEINE Stockfotos: Ein fremder Platz mit fremden
// Menschen wäre eine Behauptung über eine Anlage, die so nicht stimmt. Eine
// klare, reduzierte Grafik ist ehrlicher — und sie lädt in wenigen Kilobyte.
//
// Alle Motive sind aus denselben Bauteilen gesetzt: Sandfläche, Linien,
// Netz, Waldkante, Ball. Dadurch wirken sie wie eine Serie und nicht wie
// zusammengesuchte Illustrationen.
// ============================================================

import type { ArtVariant, ImageSlot } from '@/data/tk/images';

type Tone = ImageSlot['tone'];

interface Palette {
  sky: string;
  skyLow: string;
  ground: string;
  groundDeep: string;
  line: string;
  ink: string;
  accent: string;
}

const PALETTES: Record<Tone, Palette> = {
  clay: { sky: '#F4E2D6', skyLow: '#E8C7B4', ground: '#B4573C', groundDeep: '#8A3E29', line: '#F8F3EA', ink: '#4A2318', accent: '#D9E04F' },
  forest: { sky: '#DCE5DA', skyLow: '#B9CBBB', ground: '#223B2C', groundDeep: '#16261D', line: '#EDE7DB', ink: '#0E1A13', accent: '#A8503A' },
  night: { sky: '#25352C', skyLow: '#16261D', ground: '#2F4A3A', groundDeep: '#1B3025', line: '#D9E04F', ink: '#0B1410', accent: '#D9E04F' },
  sun: { sky: '#FBEFC9', skyLow: '#F4DC9B', ground: '#C4664B', groundDeep: '#A8503A', line: '#FFFDF9', ink: '#4A3418', accent: '#2E7D4F' },
  chalk: { sky: '#F6F2EA', skyLow: '#E2DACB', ground: '#CFC4AF', groundDeep: '#A89A80', line: '#FFFDF9', ink: '#3A3529', accent: '#A8503A' },
};

/** Sandfläche mit Rauschen — Grundlage fast aller Motive. */
function ClayGround({ p, id }: { p: Palette; id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.sky} />
          <stop offset="100%" stopColor={p.skyLow} />
        </linearGradient>
        <linearGradient id={`${id}-ground`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor={p.ground} />
          <stop offset="100%" stopColor={p.groundDeep} />
        </linearGradient>
        <pattern id={`${id}-grain`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(24)">
          <rect width="6" height="6" fill="none" />
          <circle cx="1" cy="1" r="0.5" fill="#fff" opacity="0.16" />
          <circle cx="4" cy="3.5" r="0.4" fill="#000" opacity="0.1" />
        </pattern>
      </defs>
    </>
  );
}

/** Waldkante als Silhouette — der Perlacher Forst ist Teil der Identität. */
function TreeLine({ y, color, opacity = 1 }: { y: number; color: string; opacity?: number }) {
  const tops = [14, 22, 10, 28, 18, 24, 12, 30, 16, 20, 26, 13, 21, 17];
  const w = 400 / tops.length;
  return (
    <g opacity={opacity}>
      {tops.map((h, i) => (
        <path
          key={i}
          d={`M${i * w} ${y} L${i * w + w / 2} ${y - h} L${i * w + w} ${y} Z`}
          fill={color}
        />
      ))}
      <rect x="0" y={y - 1} width="400" height="6" fill={color} />
    </g>
  );
}

function SandCourt({ p, id }: { p: Palette; id: string }) {
  return (
    <>
      <rect width="400" height="260" fill={`url(#${id}-sky)`} />
      <TreeLine y={96} color={p.groundDeep} opacity={0.3} />
      <rect y="96" width="400" height="164" fill={`url(#${id}-ground)`} />
      <rect y="96" width="400" height="164" fill={`url(#${id}-grain)`} />
      {/* Spielfeld in Fluchtperspektive */}
      <path d="M96 116 L304 116 L392 252 L8 252 Z" fill="none" stroke={p.line} strokeWidth="2.5" opacity="0.9" />
      <path d="M118 148 L282 148 L322 200 L78 200 Z" fill="none" stroke={p.line} strokeWidth="1.6" opacity="0.75" />
      <line x1="200" y1="116" x2="200" y2="148" stroke={p.line} strokeWidth="1.4" opacity="0.6" />
      <line x1="200" y1="200" x2="200" y2="252" stroke={p.line} strokeWidth="1.4" opacity="0.6" />
      {/* Netz */}
      <g>
        <line x1="72" y1="174" x2="328" y2="174" stroke={p.line} strokeWidth="2.6" />
        <rect x="72" y="174" width="256" height="20" fill={p.ink} opacity="0.22" />
        <line x1="72" y1="160" x2="72" y2="196" stroke={p.line} strokeWidth="3" />
        <line x1="328" y1="160" x2="328" y2="196" stroke={p.line} strokeWidth="3" />
      </g>
      <circle cx="330" cy="70" r="18" fill={p.accent} opacity="0.85" />
    </>
  );
}

function IndoorCourt({ p, id }: { p: Palette; id: string }) {
  return (
    <>
      <rect width="400" height="260" fill={`url(#${id}-sky)`} />
      {/* Hallendach als Bogenbinder */}
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d={`M${-40 + i * 110} 0 Q200 ${34 + i * 6} ${440 - i * 110} 0`}
          fill="none"
          stroke={p.line}
          strokeWidth="1.2"
          opacity={0.22}
        />
      ))}
      <rect y="104" width="400" height="156" fill={`url(#${id}-ground)`} />
      <path d="M104 122 L296 122 L388 252 L12 252 Z" fill="none" stroke={p.line} strokeWidth="2.4" opacity="0.85" />
      <path d="M126 152 L274 152 L312 202 L88 202 Z" fill="none" stroke={p.line} strokeWidth="1.5" opacity="0.7" />
      <line x1="80" y1="178" x2="320" y2="178" stroke={p.line} strokeWidth="2.4" />
      <rect x="80" y="178" width="240" height="18" fill={p.ink} opacity="0.25" />
      {/* Hallenlicht */}
      {[90, 200, 310].map((x) => (
        <g key={x}>
          <rect x={x - 22} y="26" width="44" height="7" rx="3" fill={p.accent} opacity="0.9" />
          <path d={`M${x - 40} 33 L${x + 40} 33 L${x + 90} 104 L${x - 90} 104 Z`} fill={p.accent} opacity="0.07" />
        </g>
      ))}
    </>
  );
}

function Aerial({ p, id }: { p: Palette; id: string }) {
  const courts = [
    { x: 24, y: 40 }, { x: 148, y: 40 }, { x: 272, y: 40 },
    { x: 24, y: 152 }, { x: 148, y: 152 }, { x: 272, y: 152 },
  ];
  return (
    <>
      <rect width="400" height="260" fill={p.groundDeep} />
      <rect width="400" height="260" fill={`url(#${id}-grain)`} opacity="0.5" />
      {courts.map((c, i) => (
        <g key={i} transform={`translate(${c.x} ${c.y})`}>
          <rect width="104" height="92" rx="3" fill={`url(#${id}-ground)`} />
          <rect x="8" y="7" width="88" height="78" fill="none" stroke={p.line} strokeWidth="1.4" opacity="0.9" />
          <rect x="20" y="20" width="64" height="52" fill="none" stroke={p.line} strokeWidth="0.9" opacity="0.65" />
          <line x1="8" y1="46" x2="96" y2="46" stroke={p.line} strokeWidth="1.6" opacity="0.95" />
          <line x1="52" y1="20" x2="52" y2="72" stroke={p.line} strokeWidth="0.9" opacity="0.55" />
        </g>
      ))}
      {/* Waldkante am oberen Rand */}
      <g opacity="0.9">
        <rect width="400" height="26" fill={p.groundDeep} />
        <TreeLine y={26} color="#16261D" opacity={0.85} />
      </g>
      <circle cx="368" cy="238" r="12" fill={p.accent} />
    </>
  );
}

function Net({ p, id }: { p: Palette; id: string }) {
  return (
    <>
      <rect width="400" height="260" fill={`url(#${id}-sky)`} />
      <rect y="150" width="400" height="110" fill={`url(#${id}-ground)`} />
      <rect y="150" width="400" height="110" fill={`url(#${id}-grain)`} />
      <defs>
        <pattern id={`${id}-mesh`} width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M0 0 L12 12 M12 0 L0 12" stroke={p.line} strokeWidth="0.9" opacity="0.55" />
        </pattern>
      </defs>
      <rect x="16" y="74" width="368" height="80" fill={`url(#${id}-mesh)`} />
      <rect x="16" y="66" width="368" height="10" fill={p.line} />
      <rect x="16" y="150" width="368" height="4" fill={p.line} opacity="0.8" />
      <rect x="192" y="66" width="16" height="88" fill={p.line} opacity="0.9" />
      <rect x="8" y="60" width="12" height="100" rx="4" fill={p.ink} opacity="0.55" />
      <rect x="380" y="60" width="12" height="100" rx="4" fill={p.ink} opacity="0.55" />
    </>
  );
}

function Ball({ p, id }: { p: Palette; id: string }) {
  return (
    <>
      <rect width="400" height="260" fill={`url(#${id}-ground)`} />
      <rect width="400" height="260" fill={`url(#${id}-grain)`} />
      <circle cx="200" cy="130" r="74" fill={p.accent} />
      <path d="M126 130 Q200 84 274 130" fill="none" stroke={p.line} strokeWidth="3.4" opacity="0.95" />
      <path d="M126 130 Q200 176 274 130" fill="none" stroke={p.line} strokeWidth="3.4" opacity="0.95" />
      <ellipse cx="200" cy="220" rx="70" ry="10" fill={p.ink} opacity="0.18" />
    </>
  );
}

function Portrait({ p, id }: { p: Palette; id: string }) {
  return (
    <>
      <rect width="400" height="260" fill={`url(#${id}-sky)`} />
      <circle cx="200" cy="112" r="120" fill={`url(#${id}-ground)`} opacity="0.22" />
      {/* Abstrakte Figur mit Schläger — kein erfundenes Gesicht. */}
      <circle cx="196" cy="98" r="34" fill={p.ground} />
      <path d="M132 260 Q136 172 196 168 Q256 172 260 260 Z" fill={p.ground} />
      <g stroke={p.line} strokeWidth="5" fill="none" strokeLinecap="round">
        <path d="M254 186 L296 148" />
      </g>
      <ellipse cx="306" cy="132" rx="24" ry="30" fill="none" stroke={p.line} strokeWidth="5" transform="rotate(-38 306 132)" />
      <circle cx="112" cy="72" r="14" fill={p.accent} />
    </>
  );
}

function Kids({ p, id }: { p: Palette; id: string }) {
  return (
    <>
      <rect width="400" height="260" fill={`url(#${id}-sky)`} />
      <rect y="164" width="400" height="96" fill={`url(#${id}-ground)`} />
      <rect y="164" width="400" height="96" fill={`url(#${id}-grain)`} />
      {/* Kleinfeld, quer gestellt */}
      <rect x="44" y="184" width="312" height="56" rx="2" fill="none" stroke={p.line} strokeWidth="2" />
      <line x1="200" y1="184" x2="200" y2="240" stroke={p.line} strokeWidth="2" />
      {[92, 200, 308].map((x, i) => (
        <g key={x} transform={`translate(${x} ${138 - i * 6})`}>
          <circle cy="-30" r="15" fill={p.ground} />
          <path d="M-16 26 Q-13 -12 0 -14 Q13 -12 16 26 Z" fill={p.ground} />
          <circle cx="26" cy="-4" r="9" fill={p.accent} />
        </g>
      ))}
      <circle cx="352" cy="56" r="20" fill={p.accent} opacity="0.9" />
    </>
  );
}

function Camp({ p, id }: { p: Palette; id: string }) {
  return (
    <>
      <rect width="400" height="260" fill={`url(#${id}-sky)`} />
      <TreeLine y={150} color={p.groundDeep} opacity={0.85} />
      <rect y="150" width="400" height="110" fill={`url(#${id}-ground)`} />
      <rect y="150" width="400" height="110" fill={`url(#${id}-grain)`} />
      {/* Reihe Schläger im Sand — das Bild eines Camps */}
      {[70, 130, 190, 250, 310].map((x, i) => (
        <g key={x} transform={`translate(${x} ${196}) rotate(${-14 + i * 7})`}>
          <rect x="-3" y="0" width="6" height="54" rx="3" fill={p.ink} opacity="0.65" />
          <ellipse cx="0" cy="-18" rx="17" ry="22" fill="none" stroke={p.line} strokeWidth="4" />
        </g>
      ))}
      <circle cx="60" cy="56" r="22" fill={p.accent} opacity="0.9" />
    </>
  );
}

function EventArt({ p, id }: { p: Palette; id: string }) {
  return (
    <>
      <rect width="400" height="260" fill={`url(#${id}-sky)`} />
      <rect y="140" width="400" height="120" fill={`url(#${id}-ground)`} />
      <rect y="140" width="400" height="120" fill={`url(#${id}-grain)`} />
      {/* Wimpelkette */}
      <path d="M0 44 Q200 96 400 44" fill="none" stroke={p.line} strokeWidth="2" opacity="0.8" />
      {Array.from({ length: 11 }, (_, i) => {
        const t = i / 10;
        const x = t * 400;
        const y = 44 + Math.sin(Math.PI * t) * 52;
        return (
          <path
            key={i}
            d={`M${x - 10} ${y} L${x + 10} ${y} L${x} ${y + 22} Z`}
            fill={i % 2 === 0 ? p.accent : p.line}
            opacity="0.92"
          />
        );
      })}
      {/* Flutlichtmasten */}
      {[54, 346].map((x) => (
        <g key={x}>
          <rect x={x - 3} y="120" width="6" height="110" fill={p.ink} opacity="0.5" />
          <rect x={x - 24} y="106" width="48" height="16" rx="4" fill={p.line} opacity="0.9" />
        </g>
      ))}
      <line x1="40" y1="196" x2="360" y2="196" stroke={p.line} strokeWidth="2" opacity="0.7" />
    </>
  );
}

function ShopArt({ p, id }: { p: Palette; id: string }) {
  return (
    <>
      <rect width="400" height="260" fill={`url(#${id}-sky)`} />
      <rect x="0" y="180" width="400" height="80" fill={`url(#${id}-ground)`} />
      {/* Regalbrett mit Schlägern und Dosen */}
      <rect x="30" y="176" width="340" height="7" rx="3" fill={p.ink} opacity="0.45" />
      {[70, 118].map((x, i) => (
        <g key={x} transform={`translate(${x} 60) rotate(${i ? 8 : -6} 0 100)`}>
          <ellipse cx="0" cy="40" rx="26" ry="34" fill="none" stroke={p.groundDeep} strokeWidth="6" />
          <ellipse cx="0" cy="40" rx="20" ry="28" fill="none" stroke={p.line} strokeWidth="1" opacity="0.5" />
          <rect x="-4" y="74" width="8" height="102" rx="4" fill={p.groundDeep} />
        </g>
      ))}
      {[196, 244, 292].map((x, i) => (
        <g key={x}>
          <rect x={x} y={100 + i * 6} width="40" height="76" rx="7" fill={p.line} opacity="0.95" />
          <rect x={x} y={118 + i * 6} width="40" height="26" fill={p.accent} opacity="0.9" />
          <circle cx={x + 20} cy={100 + i * 6} r="20" fill={p.line} opacity="0.6" />
        </g>
      ))}
    </>
  );
}

const RENDERERS: Record<ArtVariant, (a: { p: Palette; id: string }) => React.ReactElement> = {
  'sand-court': SandCourt,
  'indoor-court': IndoorCourt,
  aerial: Aerial,
  net: Net,
  ball: Ball,
  portrait: Portrait,
  kids: Kids,
  camp: Camp,
  event: EventArt,
  shop: ShopArt,
};

/**
 * Gezeichnetes Ersatzbild für einen Bildplatz.
 * `aria-hidden`, weil der beschreibende Text immer daneben steht — eine
 * Grafik, die nur eine Fläche füllt, gehört nicht in den Screenreader.
 */
export function FacilityArt({
  variant,
  tone,
  className,
}: {
  variant: ArtVariant;
  tone: Tone;
  className?: string;
}) {
  const p = PALETTES[tone];
  const id = `tk-${variant}-${tone}`;
  const Render = RENDERERS[variant];
  return (
    <svg
      viewBox="0 0 400 260"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <ClayGround p={p} id={id} />
      <Render p={p} id={id} />
    </svg>
  );
}
