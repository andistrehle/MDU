// ============================================================
// MDC — Doppel-K.-o.-Turnierplan
// ============================================================
//
// Die Papierpläne des Betreibers (8er, 16er, 32er) in Code gegossen. Wer
// zweimal verliert, ist draußen: Der Verlierer der Gewinnerseite rutscht auf
// die Verliererseite und spielt dort weiter.
//
// WAS HIER AUS DEN PLÄNEN ÜBERNOMMEN IST — und deshalb nicht „schöner"
// gemacht werden darf:
//
//   SETZLISTE   Wer in Runde 1 gegen wen spielt, steht auf dem Zettel:
//               8er   1-8, 3-5, 4-6, 7-2
//               16er  1-15, 5-9, 3-11, 7-13, 8-14, 4-12, 6-10, 2-16
//               32er  1-31, 15-23, 5-19, 9-27, 7-17, 11-25, 3-21, 13-29,
//                     4-30, 14-22, 8-18, 12-26, 6-20, 10-28, 16-24, 2-32
//               Abgetippt vom Plan, nicht gerechnet — die Reihenfolge auf dem
//               Papier ist die, nach der im Lokal ausgerufen wird.
//
//   PLATZIERUNG Die Ergebnisliste kennt 1 bis 8 einzeln, danach Gruppen:
//               9, 9, 9, 9 · 13, 13, 13, 13 · 17 (8×) · 25 (8×). Genau so
//               wird hier vergeben.
//
// WAS NACH DEM ÜBLICHEN SCHEMA GEBAUT IST: die Verliererseite. Auf dem Papier
// stehen dafür Buchstaben (A, B, C …), die von Hand nachgezogen werden; im
// Scan sind die Linien nicht überall zu verfolgen. Gebaut ist deshalb das
// gängige Doppel-K.-o.-Schema — Verlierer der ersten Runde treffen
// aufeinander, danach kommt je Runde eine Ladung Absteiger dazu, und zwar in
// umgekehrter Reihenfolge, damit sich zwei nicht sofort wiedersehen.
//
// >>> BEVOR DAS DEN ZETTEL ERSETZT: einmal gegen den Papierplan durchspielen.
//     Weicht die Verliererseite ab, gehört SIE geändert, nicht der Zettel.
//
// Hier wird NICHTS gespeichert und nichts an die Wertung gemeldet. Der Plan
// lebt im Browser; ins System kommen die Ergebnisse weiterhin über den
// Ergebniszettel (`/admin/ergebnis`).
// ============================================================

export type Feldgroesse = 8 | 16 | 32;

/** Erste Runde, genau wie auf dem Papierplan. Zahlen sind Setzpositionen. */
export const SETZLISTE: Record<Feldgroesse, [number, number][]> = {
  8: [[1, 8], [3, 5], [4, 6], [7, 2]],
  16: [[1, 15], [5, 9], [3, 11], [7, 13], [8, 14], [4, 12], [6, 10], [2, 16]],
  32: [
    [1, 31], [15, 23], [5, 19], [9, 27], [7, 17], [11, 25], [3, 21], [13, 29],
    [4, 30], [14, 22], [8, 18], [12, 26], [6, 20], [10, 28], [16, 24], [2, 32],
  ],
};

/** Der kleinste Plan, auf dem so viele Leute Platz haben. */
export function planFuer(anzahl: number): Feldgroesse {
  if (anzahl <= 8) return 8;
  if (anzahl <= 16) return 16;
  return 32;
}

export interface Teilnehmer {
  /** Passnummer als Text, oder „gast-3" — nur zum Auseinanderhalten. */
  id: string;
  name: string;
  passNr: number | null;
}

/**
 * Woher ein Platz in einer Partie kommt. Nichts wird kopiert: Jede Partie
 * verweist auf ihre Quelle, und der Name wird bei Bedarf aufgelöst. Dadurch
 * wandert eine geänderte Entscheidung von selbst durch den ganzen Plan.
 */
export type Quelle =
  | { art: 'setzplatz'; nr: number }
  | { art: 'sieger'; partie: string }
  | { art: 'verlierer'; partie: string };

export type Seite = 'gewinner' | 'verlierer' | 'finale' | 'platz';

export interface Partie {
  id: string;
  seite: Seite;
  /** Runde innerhalb der Seite, ab 1. */
  runde: number;
  /** Überschrift für die Anzeige. */
  titel: string;
  a: Quelle;
  b: Quelle;
}

export interface Turnier {
  feld: Feldgroesse;
  teilnehmer: Teilnehmer[];
  partien: Partie[];
  /** Partie-ID → Sieger („a" oder „b"). Alles, was der Abend erzeugt. */
  ergebnisse: Record<string, 'a' | 'b'>;
}

/** Ein Platz kann leer sein (Freilos) oder noch nicht feststehen. */
export type Besetzung =
  | { art: 'spieler'; spieler: Teilnehmer }
  | { art: 'freilos' }
  | { art: 'offen' };

// ------------------------------------------------------------
// Plan bauen
// ------------------------------------------------------------

function gewinnerRunden(feld: Feldgroesse): number {
  return Math.log2(feld);
}

/**
 * Baut alle Partien eines Plans — ohne Namen, nur das Gerüst. Das Gerüst
 * hängt allein an der Feldgröße, nicht an den Teilnehmern; wer fehlt, bekommt
 * ein Freilos.
 */
export function bauePlan(feld: Feldgroesse): Partie[] {
  const partien: Partie[] = [];
  const runden = gewinnerRunden(feld);

  // ── Gewinnerseite ──
  SETZLISTE[feld].forEach(([a, b], i) => {
    partien.push({
      id: `W1-${i + 1}`,
      seite: 'gewinner',
      runde: 1,
      titel: 'Gewinnerseite · Runde 1',
      a: { art: 'setzplatz', nr: a },
      b: { art: 'setzplatz', nr: b },
    });
  });

  for (let r = 2; r <= runden; r++) {
    const anzahl = feld / 2 ** r;
    for (let i = 0; i < anzahl; i++) {
      partien.push({
        id: `W${r}-${i + 1}`,
        seite: 'gewinner',
        runde: r,
        titel: r === runden
          ? 'Gewinnerseite · Finale'
          : `Gewinnerseite · Runde ${r}`,
        a: { art: 'sieger', partie: `W${r - 1}-${2 * i + 1}` },
        b: { art: 'sieger', partie: `W${r - 1}-${2 * i + 2}` },
      });
    }
  }

  // ── Verliererseite ──
  //
  // Zwei Sorten Runden im Wechsel:
  //   ungerade  die Absteiger der Gewinnerseite kommen dazu
  //   gerade    die Überlebenden spielen unter sich weiter
  //
  // Die Absteiger werden umgedreht eingehängt (`umgekehrt`): Sonst träfe der
  // Verlierer sofort wieder auf den, der ihn gerade geschlagen hat.
  let lbPartien = feld / 4;
  let lbRunde = 1;

  // Erste Runde: die Verlierer der ersten Gewinnerrunde unter sich.
  for (let i = 0; i < lbPartien; i++) {
    partien.push({
      id: `L1-${i + 1}`,
      seite: 'verlierer',
      runde: 1,
      titel: 'Verliererseite · Runde 1',
      a: { art: 'verlierer', partie: `W1-${2 * i + 1}` },
      b: { art: 'verlierer', partie: `W1-${2 * i + 2}` },
    });
  }

  for (let wr = 2; wr <= runden; wr++) {
    // Runde mit Absteigern: so viele Partien wie Absteiger.
    lbRunde += 1;
    const absteiger = feld / 2 ** wr;
    const umgekehrt = Array.from({ length: absteiger }, (_, i) => absteiger - i);
    for (let i = 0; i < absteiger; i++) {
      partien.push({
        id: `L${lbRunde}-${i + 1}`,
        seite: 'verlierer',
        runde: lbRunde,
        titel: `Verliererseite · Runde ${lbRunde}`,
        a: { art: 'sieger', partie: `L${lbRunde - 1}-${i + 1}` },
        b: { art: 'verlierer', partie: `W${wr}-${umgekehrt[i]}` },
      });
    }
    lbPartien = absteiger;

    // Danach unter sich, solange mehr als eine Partie übrig ist.
    if (lbPartien > 1) {
      lbRunde += 1;
      const halb = lbPartien / 2;
      for (let i = 0; i < halb; i++) {
        partien.push({
          id: `L${lbRunde}-${i + 1}`,
          seite: 'verlierer',
          runde: lbRunde,
          titel: `Verliererseite · Runde ${lbRunde}`,
          a: { art: 'sieger', partie: `L${lbRunde - 1}-${2 * i + 1}` },
          b: { art: 'sieger', partie: `L${lbRunde - 1}-${2 * i + 2}` },
        });
      }
      lbPartien = halb;
    }
  }

  const lbFinale = `L${lbRunde}-1`;
  const plaetze = platzRunden(partien);

  // ── Finale ──
  // Sieger der Gewinnerseite gegen Sieger der Verliererseite. Die MDC spielt
  // EIN Finale, kein zweites bei Bedarf — so steht es auf dem Plan.
  partien.push({
    id: 'F',
    seite: 'finale',
    runde: 1,
    titel: 'Finale',
    a: { art: 'sieger', partie: `W${runden}-1` },
    b: { art: 'sieger', partie: lbFinale },
  });

  // ── Plätze 5/6 und 7/8 ──
  //
  // Stehen so auf dem Papier („SPIEL um 5 / 6", „SPIEL um 7 / 8"). Wer dort
  // antritt, ergibt sich aus der Verliererseite: In der Runde, in der zwei
  // gleichzeitig ausscheiden, steht noch nicht fest, wer von beiden Fünfter
  // ist — dafür ist das Spiel da.
  for (const [platz, runde] of Object.entries(plaetze)) {
    const partienDerRunde = partien.filter(p => p.seite === 'verlierer' && p.runde === runde);
    if (partienDerRunde.length !== 2) continue;
    partien.push({
      id: `P${platz}`,
      seite: 'platz',
      runde: 1,
      titel: `Spiel um Platz ${platz} / ${Number(platz) + 1}`,
      a: { art: 'verlierer', partie: partienDerRunde[0].id },
      b: { art: 'verlierer', partie: partienDerRunde[1].id },
    });
  }

  return partien;
}

/**
 * Welche Verliererrunde entscheidet über Platz 5 und über Platz 7?
 *
 * Von hinten gezählt: In der letzten Verliererrunde scheidet der Dritte aus,
 * in der davor der Vierte, dann zwei auf einmal (5 und 6), dann wieder zwei
 * (7 und 8). Wie viele Runden das sind, hängt an der Feldgröße — deshalb
 * gerechnet und nicht abgezählt.
 */
function platzRunden(partien: Partie[]): Record<number, number> {
  const lbRunden = [...new Set(
    partien.filter(p => p.seite === 'verlierer').map(p => p.runde),
  )].sort((a, b) => b - a);

  const treffer: Record<number, number> = {};
  let platz = 3;
  for (const runde of lbRunden) {
    const anzahl = partien.filter(p => p.seite === 'verlierer' && p.runde === runde).length;
    if (platz === 5 || platz === 7) treffer[platz] = runde;
    platz += anzahl;
  }
  return treffer;
}

export function neuesTurnier(teilnehmer: Teilnehmer[], feld?: Feldgroesse): Turnier {
  const groesse = feld ?? planFuer(teilnehmer.length);
  return {
    feld: groesse,
    teilnehmer: teilnehmer.slice(0, groesse),
    partien: bauePlan(groesse),
    ergebnisse: {},
  };
}

// ------------------------------------------------------------
// Auflösen: wer steht wo?
// ------------------------------------------------------------

export function partieVon(turnier: Turnier, id: string): Partie | undefined {
  return turnier.partien.find(p => p.id === id);
}

/**
 * Wer steht auf diesem Platz? Löst die Kette rückwärts auf, bis ein
 * Setzplatz erreicht ist.
 *
 * Ein Freilos ist ein leerer Setzplatz — beim 13er-Feld auf dem 16er-Plan
 * sind das die Positionen 14, 15, 16. Wer gegen ein Freilos spielt, ist ohne
 * Wurf weiter; das rechnet `besetzung` selbst aus, damit niemand im Lokal
 * leere Partien wegklicken muss.
 */
export function besetzung(turnier: Turnier, quelle: Quelle): Besetzung {
  if (quelle.art === 'setzplatz') {
    const spieler = turnier.teilnehmer[quelle.nr - 1];
    return spieler ? { art: 'spieler', spieler } : { art: 'freilos' };
  }

  const partie = partieVon(turnier, quelle.partie);
  if (!partie) return { art: 'offen' };

  const a = besetzung(turnier, partie.a);
  const b = besetzung(turnier, partie.b);

  // Freilos: Die Partie findet nicht statt, der andere ist weiter. Sind beide
  // Plätze leer, bleibt auch das Ergebnis leer.
  if (a.art === 'freilos' && b.art === 'freilos') return { art: 'freilos' };
  if (a.art === 'freilos') return quelle.art === 'sieger' ? b : { art: 'freilos' };
  if (b.art === 'freilos') return quelle.art === 'sieger' ? a : { art: 'freilos' };

  const sieger = turnier.ergebnisse[partie.id];
  if (!sieger) return { art: 'offen' };
  const gewinnt = sieger === 'a' ? a : b;
  const verliert = sieger === 'a' ? b : a;
  return quelle.art === 'sieger' ? gewinnt : verliert;
}

/** Beide Plätze einer Partie — für die Anzeige. */
export function besetzungen(turnier: Turnier, partie: Partie): { a: Besetzung; b: Besetzung } {
  return { a: besetzung(turnier, partie.a), b: besetzung(turnier, partie.b) };
}

/**
 * Steht die Partie zum Spielen an? Nur dann darf ein Sieger gesetzt werden —
 * und nur dann taucht sie in der Liste „jetzt dran" auf.
 */
export function spielbar(turnier: Turnier, partie: Partie): boolean {
  const { a, b } = besetzungen(turnier, partie);
  return a.art === 'spieler' && b.art === 'spieler';
}

/** Entfällt, weil auf mindestens einer Seite niemand steht (Freilos). */
export function entfaellt(turnier: Turnier, partie: Partie): boolean {
  const { a, b } = besetzungen(turnier, partie);
  return a.art === 'freilos' || b.art === 'freilos';
}

/**
 * Sieger setzen — und alles wieder aufmachen, was darauf aufbaut.
 *
 * Das Aufräumen ist der Grund, warum hier nichts kopiert wird: Wer eine
 * Entscheidung zurücknimmt, darf keine Leichen im Plan hinterlassen. Ein
 * Ergebnis, das auf einer weggefallenen Partie steht, wäre genau das.
 */
export function setzeSieger(turnier: Turnier, partieId: string, sieger: 'a' | 'b' | null): Turnier {
  const ergebnisse = { ...turnier.ergebnisse };
  if (sieger) ergebnisse[partieId] = sieger;
  else delete ergebnisse[partieId];

  const zwischen: Turnier = { ...turnier, ergebnisse };

  // Alles verwerfen, dessen Teilnehmer nicht mehr feststehen.
  let geaendert = true;
  while (geaendert) {
    geaendert = false;
    for (const partie of zwischen.partien) {
      if (!zwischen.ergebnisse[partie.id]) continue;
      if (spielbar(zwischen, partie)) continue;
      delete zwischen.ergebnisse[partie.id];
      geaendert = true;
    }
  }

  return zwischen;
}

// ------------------------------------------------------------
// Platzierungen
// ------------------------------------------------------------

/** Die Plätze der MDC-Ergebnisliste: 1–8 einzeln, danach Gruppen. */
export const PLATZ_GRUPPEN = [1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 9, 13, 13, 13, 13,
  17, 17, 17, 17, 17, 17, 17, 17, 25, 25, 25, 25, 25, 25, 25, 25];

export interface Platzierung {
  platz: number;
  spieler: Teilnehmer;
}

/**
 * Die Endliste, soweit sie feststeht.
 *
 * Gerechnet aus der Reihenfolge des Ausscheidens: Wer zuletzt verliert, steht
 * am weitesten vorn. Die Verliererseite gibt die Reihenfolge vor — dort
 * scheidet in jeder Runde eine feste Zahl von Leuten aus, und genau diese
 * Zahlen stehen als Gruppen auf der Ergebnisliste.
 *
 * Plätze 5–8 kommen aus den beiden Platzierungsspielen, falls gespielt; ohne
 * sie bleiben die vier auf ihrer Gruppe stehen, statt eine Reihenfolge zu
 * erfinden.
 */
export function platzierungen(turnier: Turnier): Platzierung[] {
  const liste: Platzierung[] = [];
  const vergeben = new Set<string>();

  const nimm = (b: Besetzung, platz: number) => {
    if (b.art !== 'spieler' || vergeben.has(b.spieler.id)) return;
    vergeben.add(b.spieler.id);
    liste.push({ platz, spieler: b.spieler });
  };

  const finale = partieVon(turnier, 'F');
  if (finale && turnier.ergebnisse[finale.id]) {
    nimm(besetzung(turnier, { art: 'sieger', partie: 'F' }), 1);
    nimm(besetzung(turnier, { art: 'verlierer', partie: 'F' }), 2);
  }

  // Verliererseite von hinten: der letzte Verlierer wurde Dritter.
  const lbRunden = turnier.partien
    .filter(p => p.seite === 'verlierer')
    .reduce((max, p) => Math.max(max, p.runde), 0);

  let platz = 3;
  for (let r = lbRunden; r >= 1; r--) {
    const partien = turnier.partien.filter(p => p.seite === 'verlierer' && p.runde === r);
    const verlierer = partien
      .map(p => besetzung(turnier, { art: 'verlierer', partie: p.id }))
      .filter(b => b.art === 'spieler');

    // Plätze 5/6 und 7/8 entscheiden die Platzierungsspiele — sonst teilen
    // sich die Betroffenen die Gruppe, und die Liste sagt das auch.
    const extra = platz === 5 || platz === 7 ? `P${platz}` : null;
    if (extra && turnier.ergebnisse[extra]) {
      nimm(besetzung(turnier, { art: 'sieger', partie: extra }), platz);
      nimm(besetzung(turnier, { art: 'verlierer', partie: extra }), platz + 1);
    } else {
      const gruppe = PLATZ_GRUPPEN[platz - 1] ?? platz;
      for (const b of verlierer) nimm(b, gruppe);
    }
    platz += partien.length;
  }

  return liste.sort((a, b) => a.platz - b.platz || a.spieler.name.localeCompare(b.spieler.name));
}

/** Wie viele Partien sind entschieden, wie viele stehen noch an? */
export function fortschritt(turnier: Turnier): { gespielt: number; offen: number } {
  let gespielt = 0;
  let offen = 0;
  for (const partie of turnier.partien) {
    if (entfaellt(turnier, partie)) continue;
    if (turnier.ergebnisse[partie.id]) gespielt += 1;
    else offen += 1;
  }
  return { gespielt, offen };
}

/** Die Partien, die jetzt gespielt werden können. */
export function jetztDran(turnier: Turnier): Partie[] {
  return turnier.partien.filter(p => spielbar(turnier, p) && !turnier.ergebnisse[p.id]);
}
