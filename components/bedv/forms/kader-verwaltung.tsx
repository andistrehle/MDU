'use client';

// ============================================================
// Kader verwalten (Demo)
// ============================================================
//
// Spieler entfernen, nachmelden, Mannschaftsführung setzen — alles im
// Browser, nichts wird gespeichert. Der Knopf „Änderungen einreichen" zeigt,
// was in der echten Plattform passieren würde: eine Nachmeldung geht an die
// Ligaleitung und ist erst nach deren Freigabe spielberechtigt.
//
// Genau dieser Punkt ist das Verkaufsargument: Heute ist eine Nachmeldung
// ein Formular per Mail und ein Anruf. Hier ist sie ein Vorgang mit Stand.
// ============================================================

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Star, Trash2, Undo2, Check, Send } from 'lucide-react';
import { bedvPath } from '@/lib/bedv/site';
import { Badge, Card, DemoHinweis, SectionHead } from '../ui/bausteine';
import { SpielerAvatar } from '../teams/team-wappen';

export interface KaderSpieler {
  id: string;
  name: string;
  initialen: string;
  passnummer: string;
  wertung: 'herren' | 'damen';
  kapitaen: boolean;
  spiele: number;
  siege: number;
  /** Erst in dieser Sitzung hinzugefügt? */
  neu?: boolean;
}

let laufendeNummer = 0;

export function KaderVerwaltung({
  ausgangslage, teamId, teamName, ligaName,
}: {
  ausgangslage: KaderSpieler[]; teamId: string; teamName: string; ligaName: string;
}) {
  const [kader, setKader] = useState<KaderSpieler[]>(ausgangslage);
  const [entfernt, setEntfernt] = useState<KaderSpieler[]>([]);
  const [neuName, setNeuName] = useState('');
  const [neuWertung, setNeuWertung] = useState<'herren' | 'damen'>('herren');
  const [eingereicht, setEingereicht] = useState(false);

  const geaendert = kader.some(s => s.neu)
    || entfernt.length > 0
    || kader.findIndex(s => s.kapitaen) !== ausgangslage.findIndex(s => s.kapitaen);

  const nachmelden = () => {
    const name = neuName.trim();
    if (name.length < 3) return;
    const teile = name.split(/\s+/);
    setKader(k => [...k, {
      id: `neu-${laufendeNummer++}`,
      name,
      initialen: ((teile[0]?.[0] ?? '') + (teile[1]?.[0] ?? teile[0]?.[1] ?? '')).toUpperCase(),
      passnummer: '— wird vergeben —',
      wertung: neuWertung,
      kapitaen: false,
      spiele: 0,
      siege: 0,
      neu: true,
    }]);
    setNeuName('');
  };

  const entfernen = (id: string) => {
    const s = kader.find(x => x.id === id);
    if (!s) return;
    setKader(k => k.filter(x => x.id !== id));
    // Nur bestehende Spieler landen im „Zurückholen"-Bereich; eine gerade
    // erst angelegte Nachmeldung ist einfach wieder weg.
    if (!s.neu) setEntfernt(e => [...e, s]);
  };

  const zurueckholen = (id: string) => {
    const s = entfernt.find(x => x.id === id);
    if (!s) return;
    setEntfernt(e => e.filter(x => x.id !== id));
    setKader(k => [...k, s]);
  };

  const kapitaenSetzen = (id: string) => {
    setKader(k => k.map(s => ({ ...s, kapitaen: s.id === id })));
  };

  if (eingereicht) {
    const neue = kader.filter(s => s.neu);
    return (
      <Card padding="28px 24px" className="bedv-pop">
        <div style={{ textAlign: 'center' }}>
          <span
            aria-hidden="true"
            style={{
              width: 56, height: 56, borderRadius: '50%', display: 'grid', placeItems: 'center',
              background: 'var(--bedv-green-soft)', color: 'var(--bedv-green)', margin: '0 auto 15px',
            }}
          >
            <Check size={28} />
          </span>
          <h2 style={{ fontSize: '1.3rem' }}>Kaderänderung eingereicht</h2>
          <p style={{ color: 'var(--bedv-ink-dim)', marginTop: 9, maxWidth: '54ch', marginInline: 'auto', lineHeight: 1.6 }}>
            {neue.length > 0
              ? `${neue.length} ${neue.length === 1 ? 'Nachmeldung liegt' : 'Nachmeldungen liegen'} bei der Ligaleitung. Spielberechtigt ${neue.length === 1 ? 'ist der Zugang' : 'sind die Zugänge'} ab der Freigabe.`
              : 'Die Änderung liegt bei der Ligaleitung zur Prüfung.'}
          </p>
          <div style={{ display: 'inline-flex', gap: 8, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Badge ton="accent">Status: wird geprüft</Badge>
            <Badge ton="leise">Vorgang {teamId.slice(0, 6).toUpperCase()}-{new Date().getFullYear()}</Badge>
          </div>
        </div>

        {neue.length > 0 && (
          <div style={{ marginTop: 20, maxWidth: 480, marginInline: 'auto' }}>
            {neue.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--bedv-line-soft)' }}>
                <SpielerAvatar initialen={s.initialen} groesse={28} />
                <span style={{ flex: 1, fontWeight: 600, fontSize: '0.9rem' }}>{s.name}</span>
                <Badge ton="leise">{s.wertung === 'damen' ? 'Damen' : 'Herren'}</Badge>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 22, maxWidth: 560, marginInline: 'auto' }}>
          <DemoHinweis>
            In dieser Demo wurde nichts gespeichert und nichts übertragen. In der echten
            Plattform läge die Nachmeldung jetzt im Bereich der Ligaleitung.
          </DemoHinweis>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 18, flexWrap: 'wrap' }}>
          <Link href={bedvPath('/ligaleitung')} className="bedv-btn bedv-btn--primary bedv-btn--sm">
            Aus Sicht der Ligaleitung ansehen
          </Link>
          <button className="bedv-btn bedv-btn--ghost bedv-btn--sm" onClick={() => setEingereicht(false)}>
            Zurück zum Kader
          </button>
        </div>
      </Card>
    );
  }

  return (
    <>
      <SectionHead
        eyebrow={ligaName}
        titel={`Kader ${teamName}`}
        text="Sechs Spieler sind die kleinste spielfähige Aufstellung — jeder bestreitet zwei Einzel und zwei Doppel."
        aktion={{ label: 'Mannschaftsseite', href: bedvPath(`/teams/${teamId}`) }}
      />

      <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)' }} className="bedv-liga-split">
        <Card padding="6px 16px 16px">
          {kader.map(s => (
            <div
              key={s.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0',
                borderBottom: '1px solid var(--bedv-line-soft)',
              }}
            >
              <SpielerAvatar initialen={s.initialen} groesse={36} akzent={s.kapitaen} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.93rem' }}>{s.name}</span>
                  {s.kapitaen && <Badge ton="accent">Mannschaftsführer</Badge>}
                  {s.neu && <Badge ton="gruen">neu</Badge>}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--bedv-ink-dim)', marginTop: 2 }}>
                  Pass {s.passnummer} · {s.wertung === 'damen' ? 'Damen' : 'Herren'}
                  {s.spiele > 0 && ` · ${s.siege}/${s.spiele} Spiele`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, flex: 'none' }}>
                {!s.kapitaen && (
                  <button
                    className="bedv-btn bedv-btn--quiet bedv-btn--sm"
                    onClick={() => kapitaenSetzen(s.id)}
                    title="Als Mannschaftsführer festlegen"
                    aria-label={`${s.name} als Mannschaftsführer festlegen`}
                  >
                    <Star size={15} aria-hidden="true" />
                  </button>
                )}
                <button
                  className="bedv-btn bedv-btn--quiet bedv-btn--sm"
                  style={{ color: 'var(--bedv-red)' }}
                  onClick={() => entfernen(s.id)}
                  title="Aus dem Kader nehmen"
                  aria-label={`${s.name} aus dem Kader nehmen`}
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}

          {kader.length < 6 && (
            <div
              style={{
                marginTop: 12, padding: '10px 13px', borderRadius: 9,
                background: 'var(--bedv-red-soft)', color: 'var(--bedv-red)', fontSize: '0.85rem',
              }}
            >
              Nur {kader.length} Spieler im Kader — für eine Begegnung über 18 Spiele werden
              sechs gebraucht.
            </div>
          )}

          {entfernt.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 13, borderTop: '1px solid var(--bedv-line)' }}>
              <div className="bedv-kicker" style={{ marginBottom: 8 }}>Aus dem Kader genommen</div>
              {entfernt.map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                  <span style={{ flex: 1, fontSize: '0.87rem', color: 'var(--bedv-ink-dim)', textDecoration: 'line-through' }}>
                    {s.name}
                  </span>
                  <button className="bedv-btn bedv-btn--quiet bedv-btn--sm" onClick={() => zurueckholen(s.id)}>
                    <Undo2 size={14} aria-hidden="true" /> Zurückholen
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <Card padding="16px 18px">
            <h3 style={{ fontSize: '1.02rem' }}>Spieler nachmelden</h3>
            <p style={{ color: 'var(--bedv-ink-dim)', fontSize: '0.85rem', marginTop: 6, lineHeight: 1.55 }}>
              Neue Spieler sind ab der Freigabe durch die Ligaleitung spielberechtigt. Die
              Passnummer vergibt der Verband.
            </p>

            <div style={{ display: 'grid', gap: 11, marginTop: 13 }}>
              <label>
                <span className="bedv-label">Name</span>
                <input
                  className="bedv-input"
                  value={neuName}
                  onChange={e => setNeuName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); nachmelden(); } }}
                  placeholder="Vor- und Nachname"
                />
              </label>
              <label>
                <span className="bedv-label">Wertungsklasse</span>
                <select className="bedv-select" value={neuWertung} onChange={e => setNeuWertung(e.target.value as 'herren' | 'damen')}>
                  <option value="herren">Herren</option>
                  <option value="damen">Damen</option>
                </select>
              </label>
              <button className="bedv-btn bedv-btn--ghost bedv-btn--block" onClick={nachmelden} disabled={neuName.trim().length < 3}>
                <Plus size={15} aria-hidden="true" /> Zum Kader hinzufügen
              </button>
            </div>
          </Card>

          <Card padding="16px 18px">
            <h3 style={{ fontSize: '1.02rem' }}>Änderungen einreichen</h3>
            <p style={{ color: 'var(--bedv-ink-dim)', fontSize: '0.85rem', marginTop: 6, lineHeight: 1.55 }}>
              {geaendert
                ? 'Die Änderungen gehen als Vorgang an die Ligaleitung und bekommen dort einen Stand.'
                : 'Noch keine Änderung. Spieler hinzufügen, entfernen oder die Mannschaftsführung ändern.'}
            </p>
            <button
              className="bedv-btn bedv-btn--primary bedv-btn--block"
              style={{ marginTop: 13 }}
              disabled={!geaendert || kader.length < 6}
              onClick={() => setEingereicht(true)}
            >
              <Send size={15} aria-hidden="true" /> Einreichen
            </button>
            {kader.length < 6 && geaendert && (
              <p style={{ fontSize: '0.78rem', color: 'var(--bedv-red)', marginTop: 8 }}>
                Erst mit sechs Spielern möglich.
              </p>
            )}
          </Card>

          <DemoHinweis>
            Oberflächen-Demo: Änderungen bleiben im Browser und verschwinden beim Neuladen.
          </DemoHinweis>
        </div>
      </div>
    </>
  );
}
