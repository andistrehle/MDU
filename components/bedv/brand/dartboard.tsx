// ============================================================
// Dartscheibe — gezeichnet, nicht fotografiert
// ============================================================
//
// Das Motiv der Startseite. Bewusst als SVG und nicht als Bilddatei:
//
//   • Es ist scharf auf jedem Bildschirm und in jeder Größe.
//   • Es wiegt ein paar Kilobyte statt ein paar hundert.
//   • Vor allem: Es ist unser eigenes. Ein Stockfoto oder gar ein Bild von
//     der bestehenden BeDV-Seite hätte in einer unverbindlichen Demo nichts
//     verloren.
//
// Die Sektorenfolge ist die echte einer Dartscheibe (20 oben, dann im
// Uhrzeigersinn). Wer sie ändert, fällt bei jedem Dartspieler im Raum
// innerhalb einer Sekunde auf — und genau solche Leute sitzen beim
// Vorführen gegenüber.
// ============================================================

/** Reihenfolge der Felder im Uhrzeigersinn, beginnend oben bei der 20. */
const SEKTOREN = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

/** Radien im Koordinatensystem der Scheibe (Mittelpunkt 100/100). */
const R = {
  zahlen: 95,
  doppelAussen: 84,
  doppelInnen: 77,
  tripleAussen: 53,
  tripleInnen: 46,
  bullAussen: 10,
  bullInnen: 4.5,
};

function punkt(winkelGrad: number, radius: number): [number, number] {
  const rad = (winkelGrad * Math.PI) / 180;
  return [100 + Math.cos(rad) * radius, 100 + Math.sin(rad) * radius];
}

/** Ringausschnitt („Kuchenstück mit Loch") als Pfad. */
function ringSektor(von: number, bis: number, rInnen: number, rAussen: number): string {
  const [ax, ay] = punkt(von, rAussen);
  const [bx, by] = punkt(bis, rAussen);
  const [cx, cy] = punkt(bis, rInnen);
  const [dx, dy] = punkt(von, rInnen);
  return [
    `M ${ax.toFixed(2)} ${ay.toFixed(2)}`,
    `A ${rAussen} ${rAussen} 0 0 1 ${bx.toFixed(2)} ${by.toFixed(2)}`,
    `L ${cx.toFixed(2)} ${cy.toFixed(2)}`,
    `A ${rInnen} ${rInnen} 0 0 0 ${dx.toFixed(2)} ${dy.toFixed(2)}`,
    'Z',
  ].join(' ');
}

export interface DartboardProps {
  /** Kantenlänge in Pixeln. */
  groesse?: number;
  /**
   * `farbig` = die vertrauten Scheibenfarben (Rot/Grün/Schwarz/Creme).
   * `gedaempft` = blau-goldene Fassung für den dunklen Kopfbereich; dort
   * würde eine Originalscheibe wie ein hineinkopiertes Foto wirken.
   */
  variante?: 'farbig' | 'gedaempft';
  /** Zahlenkranz zeigen? Auf kleinen Größen wird er unleserlich. */
  zahlen?: boolean;
  className?: string;
  /** Rein dekorativ — Bildschirmleser sollen das Motiv überspringen. */
  titel?: string;
}

export function Dartboard({
  groesse = 320,
  variante = 'farbig',
  zahlen = true,
  className,
  titel,
}: DartboardProps) {
  const farben = variante === 'farbig'
    ? {
        rand: '#101722', hellFeld: '#EFE3CB', dunkelFeld: '#14181F',
        rot: '#C7251B', gruen: '#0E7A4A', draht: 'rgba(255,255,255,0.22)',
        zahl: '#F3F6FA', bullAussen: '#0E7A4A', bullInnen: '#C7251B',
      }
    : {
        rand: '#0A1B35', hellFeld: '#1B3A66', dunkelFeld: '#0D2244',
        rot: '#F0A81C', gruen: '#3B82F6', draht: 'rgba(255,255,255,0.14)',
        zahl: '#A9BCDA', bullAussen: '#3B82F6', bullInnen: '#F0A81C',
      };

  const halb = 9; // halbe Sektorbreite in Grad

  return (
    <svg
      viewBox="0 0 200 200"
      width={groesse}
      height={groesse}
      className={className}
      role={titel ? 'img' : 'presentation'}
      aria-label={titel}
      aria-hidden={titel ? undefined : true}
    >
      {/* Außenring der Scheibe */}
      <circle cx="100" cy="100" r="99" fill={farben.rand} />
      <circle cx="100" cy="100" r={R.doppelAussen + 0.5} fill={farben.rand} />

      {SEKTOREN.map((zahl, i) => {
        // Die 20 sitzt oben; im SVG zeigt 0° nach rechts, deshalb −90°.
        const mitte = -90 + i * 18;
        const von = mitte - halb;
        const bis = mitte + halb;
        const gerade = i % 2 === 0;
        const einzel = gerade ? farben.dunkelFeld : farben.hellFeld;
        const ring = gerade ? farben.rot : farben.gruen;

        return (
          <g key={zahl}>
            {/* Doppel (außen) */}
            <path d={ringSektor(von, bis, R.doppelInnen, R.doppelAussen)} fill={ring} />
            {/* großes Einzelfeld */}
            <path d={ringSektor(von, bis, R.tripleAussen, R.doppelInnen)} fill={einzel} />
            {/* Triple */}
            <path d={ringSektor(von, bis, R.tripleInnen, R.tripleAussen)} fill={ring} />
            {/* kleines Einzelfeld */}
            <path d={ringSektor(von, bis, R.bullAussen, R.tripleInnen)} fill={einzel} />
          </g>
        );
      })}

      {/* Drahtspinne — feine Linien auf den Sektorgrenzen. */}
      <g stroke={farben.draht} strokeWidth="0.55" fill="none">
        {SEKTOREN.map((_, i) => {
          const grenze = -90 + i * 18 - halb;
          const [x1, y1] = punkt(grenze, R.bullAussen);
          const [x2, y2] = punkt(grenze, R.doppelAussen);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
        <circle cx="100" cy="100" r={R.doppelInnen} />
        <circle cx="100" cy="100" r={R.tripleAussen} />
        <circle cx="100" cy="100" r={R.tripleInnen} />
        <circle cx="100" cy="100" r={R.doppelAussen} />
      </g>

      {/* Bull */}
      <circle cx="100" cy="100" r={R.bullAussen} fill={farben.bullAussen} stroke={farben.draht} strokeWidth="0.55" />
      <circle cx="100" cy="100" r={R.bullInnen} fill={farben.bullInnen} />

      {/* Zahlenkranz */}
      {zahlen && SEKTOREN.map((zahl, i) => {
        const [x, y] = punkt(-90 + i * 18, R.zahlen);
        return (
          <text
            key={zahl}
            x={x} y={y}
            fill={farben.zahl}
            fontSize="9"
            fontWeight="700"
            fontFamily="var(--bedv-font-display)"
            textAnchor="middle"
            dominantBaseline="central"
          >
            {zahl}
          </text>
        );
      })}
    </svg>
  );
}

/**
 * Ein Pfeil, der in der Scheibe steckt — für den Kopfbereich. Getrennt vom
 * Board, damit er sich nicht mitdreht: Eine mitdrehende Scheibe ist ein
 * ruhiges Detail, ein mitkreisender Pfeil wäre Kirmes.
 */
export function Dart({ groesse = 120, className }: { groesse?: number; className?: string }) {
  return (
    <svg viewBox="0 0 120 40" width={groesse} height={groesse / 3} className={className} aria-hidden="true">
      {/* Flight */}
      <path d="M118 20 L100 6 L96 20 L100 34 Z" fill="#F0A81C" />
      <path d="M100 6 L96 20 L100 34 Z" fill="#D9940C" />
      {/* Schaft */}
      <rect x="62" y="17.5" width="38" height="5" rx="2.5" fill="#0D2244" />
      {/* Barrel */}
      <rect x="30" y="15" width="34" height="10" rx="5" fill="#C9D5E7" />
      <rect x="36" y="15" width="2" height="10" fill="#8FA6C4" />
      <rect x="44" y="15" width="2" height="10" fill="#8FA6C4" />
      <rect x="52" y="15" width="2" height="10" fill="#8FA6C4" />
      {/* Spitze */}
      <path d="M30 16.5 L6 20 L30 23.5 Z" fill="#F2F6FC" />
    </svg>
  );
}
