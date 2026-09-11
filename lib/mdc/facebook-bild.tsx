// ============================================================
// MDC — Rangliste als Bild
// ============================================================
//
// Ein Facebook-Beitrag mit 32 Textzeilen ist eine Bleiwüste; dasselbe als
// Bild wird angesehen. Deshalb wird die Rangliste hier gezeichnet — als PNG,
// das sich herunterladen und an einen Beitrag hängen lässt.
//
// Gezeichnet wird mit `ImageResponse` (Satori): JSX rein, PNG raus. Das hat
// Grenzen, die man beim Ändern kennen muss:
//
//   • NUR Flexbox. Kein `grid`, kein `float`, keine Tabellen. Die beiden
//     Spalten sind deshalb zwei Flex-Spalten nebeneinander.
//   • Jedes Element mit mehr als einem Kind braucht ausdrücklich `display`.
//   • Schrift: Ohne mitgegebene Schriftdatei nimmt Satori seine eingebaute.
//     Die Hausschrift der Seite (Saira Condensed) liegt nicht als Datei im
//     Repository, sondern kommt von Google Fonts — die im Bild nachzuladen
//     hieße, bei jedem Aufruf auf einen fremden Dienst zu warten. Das Bild
//     lebt deshalb von Farbe und Aufbau, nicht von der Schrift.
//
// Die Höhe richtet sich nach der Zahl der Zeilen: Facebook zeigt hochkante
// Bilder bis 4:5 vollständig; was höher ist, wird im Verlauf beschnitten.
// Zwei Spalten halten auch 32 Plätze darunter.
// ============================================================

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import type { Division } from '@/data/types';
import type { PostDaten, PostSpieler } from './facebook-post';

const ROT = '#D61A1A';
const NAVY = '#1F3B73';
const NAVY_TIEF = '#142748';
const TINT = '#F3F7FC';
const LINIE = '#DDE5F0';
const INK = '#141A24';
const INK_DIM = '#5A6880';
const GOLD = '#B8860B';
const SILBER = '#77808F';
const BRONZE = '#A2653A';

const BREITE = 1200;
/** Höchstens so viele Zeilen je Spalte — darüber wird umgebrochen. */
const JE_SPALTE = 16;
const ZEILE = 46;
const KOPF = 150;
/** Kopfzeile der Tabellenspalten. */
const SPALTENKOPF = 34;
const FUSS = 132;

/**
 * Das Emblem als Datenstrom. Bewusst die kleine Fassung (160 px): Satori legt
 * das Bild in das Paket, und für 90 px Anzeigegröße wären 512 px Verschwendung.
 */
function emblem(): string | null {
  try {
    const datei = readFileSync(join(process.cwd(), 'public', 'mdc', 'icon-160.png'));
    return `data:image/png;base64,${datei.toString('base64')}`;
  } catch {
    // Ohne Emblem wird trotzdem gezeichnet — lieber ein Bild ohne Logo als
    // gar keins.
    return null;
  }
}

const zahl = new Intl.NumberFormat('de-DE');
const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

function datumLang(iso: string): string {
  const [j, m, t] = iso.split('-');
  return `${t}.${m}.${j}`;
}

function medaille(rank: number): string | null {
  if (rank === 1) return GOLD;
  if (rank === 2) return SILBER;
  if (rank === 3) return BRONZE;
  return null;
}

function Zeile({ spieler }: { spieler: PostSpieler }) {
  const farbe = medaille(spieler.rank);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: ZEILE,
        borderBottom: `1px solid ${LINIE}`,
        paddingLeft: 14,
        paddingRight: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          width: 52,
          fontSize: 26,
          fontWeight: 700,
          color: farbe ?? INK_DIM,
        }}
      >
        {spieler.rank}.
      </div>
      <div
        style={{
          display: 'flex',
          flex: 1,
          paddingLeft: 16,
          fontSize: 27,
          color: INK,
          fontWeight: farbe ? 700 : 400,
          overflow: 'hidden',
        }}
      >
        {spieler.name}
      </div>
      <div
        style={{
          display: 'flex', justifyContent: 'flex-end', width: 110,
          fontSize: 26, fontWeight: 700, color: NAVY,
        }}
      >
        {zahl.format(spieler.points)}
      </div>
      {/* Die Zahl der Turniere gehört dazu: Ausgeschüttet wird erst ab 15
          Teilnahmen — wer vorn steht, aber selten da war, ist noch nicht dabei. */}
      <div
        style={{
          display: 'flex', justifyContent: 'flex-end', width: 54,
          fontSize: 22, color: INK_DIM,
        }}
      >
        {spieler.tournaments}
      </div>
    </div>
  );
}

/** Schmale Kopfzeile über jeder Spalte — sonst bliebe die letzte Zahl rätselhaft. */
function SpaltenKopf() {
  const stil: React.CSSProperties = {
    display: 'flex', fontSize: 18, fontWeight: 700, color: INK_DIM,
    letterSpacing: 1.5,
  };
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', height: 34,
        paddingLeft: 14, paddingRight: 14,
        backgroundColor: TINT, borderBottom: `1px solid ${LINIE}`,
      }}
    >
      <div style={{ ...stil, width: 52 }} />
      <div style={{ ...stil, flex: 1, paddingLeft: 16 }}>SPIELER</div>
      <div style={{ ...stil, width: 110, justifyContent: 'flex-end' }}>PUNKTE</div>
      <div style={{ ...stil, width: 54, justifyContent: 'flex-end' }}>TN</div>
    </div>
  );
}

function Spalte({ spieler }: { spieler: PostSpieler[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <SpaltenKopf />
      {spieler.map(s => <Zeile key={`${s.rank}-${s.name}`} spieler={s} />)}
    </div>
  );
}

export interface BildDaten {
  division: Division;
  spieler: PostSpieler[];
  saison: string;
  stand: string;
  turniere: number;
  jackpot: number | null;
  /** Adresse ohne Schema — steht als Verweis unter dem Bild. */
  linkText: string;
}

/** Die Höhe, die dieses Bild bekommt — auch für die Vorschau nützlich. */
export function bildHoehe(anzahl: number): number {
  const spalten = anzahl > JE_SPALTE ? 2 : 1;
  const jeSpalte = Math.ceil(anzahl / spalten);
  return KOPF + SPALTENKOPF + jeSpalte * ZEILE + FUSS;
}

export function ranglisteBild(daten: BildDaten): ImageResponse {
  const spalten = daten.spieler.length > JE_SPALTE ? 2 : 1;
  const jeSpalte = Math.ceil(daten.spieler.length / spalten);
  const hoehe = bildHoehe(daten.spieler.length);
  const logo = emblem();
  const titel = daten.division === 'men' ? 'HERREN' : 'DAMEN';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: BREITE,
          height: hoehe,
          backgroundColor: '#FFFFFF',
        }}
      >
        {/* ── Kopf ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: KOPF,
            backgroundColor: NAVY_TIEF,
            paddingLeft: 34,
            paddingRight: 34,
          }}
        >
          {logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} width={92} height={92} alt="" style={{ marginRight: 24 }} />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', fontSize: 44, fontWeight: 700, color: '#FFFFFF' }}>
              MDC-Rangliste · {titel}
            </div>
            <div style={{ display: 'flex', fontSize: 26, color: '#B9C8E0', marginTop: 6 }}>
              Saison {daten.saison} · Stand {datumLang(daten.stand)} · {daten.turniere} Turniere
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              height: 54,
              paddingLeft: 18,
              paddingRight: 18,
              backgroundColor: ROT,
              borderRadius: 10,
              fontSize: 30,
              fontWeight: 700,
              color: '#FFFFFF',
            }}
          >
            TOP {daten.spieler.length}
          </div>
        </div>

        {/* ── Tabelle ── */}
        <div style={{ display: 'flex', flex: 1, backgroundColor: '#FFFFFF' }}>
          {Array.from({ length: spalten }, (_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flex: 1,
                borderLeft: i === 0 ? 'none' : `2px solid ${LINIE}`,
              }}
            >
              <Spalte spieler={daten.spieler.slice(i * jeSpalte, (i + 1) * jeSpalte)} />
            </div>
          ))}
        </div>

        {/* ── Fuß: der Verweis, um den es geht ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            height: FUSS,
            backgroundColor: TINT,
            borderTop: `3px solid ${ROT}`,
            paddingLeft: 34,
            paddingRight: 34,
          }}
        >
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, color: NAVY }}>
            Komplette Rangliste auf {daten.linkText}
          </div>
          <div style={{ display: 'flex', fontSize: 24, color: INK_DIM, marginTop: 8 }}>
            {daten.jackpot !== null
              ? `Jackpot ${euro.format(daten.jackpot)} · alle Turniere, alle Ergebnisse, jedes Profil`
              : 'Alle Turniere, alle Ergebnisse, jedes Profil'}
          </div>
        </div>
      </div>
    ),
    { width: BREITE, height: hoehe },
  );
}

/** Die Daten eines Beitrags in die Form bringen, die das Bild braucht. */
export function bildDatenAus(post: PostDaten, division: Division): BildDaten {
  return {
    division,
    spieler: division === 'men' ? post.men : post.women,
    saison: post.saison,
    stand: post.stand,
    turniere: post.turniere,
    jackpot: post.jackpot ? post.jackpot[division] : null,
    // Ohne „https://" — im Bild ist es kein Link, sondern eine Ansage.
    linkText: post.link.replace(/^https?:\/\//, ''),
  };
}
