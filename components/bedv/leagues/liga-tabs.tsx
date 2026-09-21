'use client';

// ============================================================
// Reiter der Ligaseite
// ============================================================
//
// Übersicht · Tabelle · Spielplan · Ergebnisse · Einzelrangliste · Highlights
//
// Die Inhalte werden auf dem SERVER gerendert und als `children` in diesen
// Baustein gereicht — hier wird nur umgeschaltet. Dadurch ist jeder Reiter
// sofort da (kein Nachladen, kein Ladezustand mitten im Gespräch), und die
// Ligadaten bleiben aus dem Browser-Bündel heraus.
//
// Die Sprungmarke aus der Adresse (`#tabelle`) wird beim Öffnen gelesen:
// Die Tabellenkarten der Startseite verlinken direkt dorthin.
// ============================================================

import { useState } from 'react';
import type { ReactNode } from 'react';
import { useHash } from '@/lib/bedv/use-hash';

export interface Reiter {
  id: string;
  label: string;
  inhalt: ReactNode;
}

export function LigaTabs({ reiter }: { reiter: Reiter[] }) {
  // `null` heißt: noch nichts angeklickt — dann entscheidet die Adresse.
  // Sobald jemand einen Reiter wählt, gewinnt die Wahl; die Adresse wird
  // dabei ABSICHTLICH nicht mitgeschrieben, sonst führte „Zurück" im
  // Gespräch durch sechs Reiter statt auf die vorige Seite.
  const [gewaehltId, setGewaehltId] = useState<string | null>(null);
  const ausAdresse = useHash();

  const aktiv = gewaehltId
    ?? (reiter.some(r => r.id === ausAdresse) ? ausAdresse : reiter[0]?.id)
    ?? '';
  const gewaehlt = reiter.find(r => r.id === aktiv) ?? reiter[0];

  return (
    <>
      <div className="bedv-tabs" role="tablist" aria-label="Bereiche dieser Liga">
        {reiter.map(r => (
          <button
            key={r.id}
            role="tab"
            id={`tab-${r.id}`}
            aria-selected={r.id === gewaehlt?.id}
            aria-controls={`panel-${r.id}`}
            className="bedv-tab"
            onClick={() => setGewaehltId(r.id)}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Alle Reiter bleiben im Baum und werden nur versteckt: So bleibt die
          Scrollposition erhalten, und der Wechsel kostet keinen Aufbau. */}
      {reiter.map(r => (
        <div
          key={r.id}
          role="tabpanel"
          id={`panel-${r.id}`}
          aria-labelledby={`tab-${r.id}`}
          hidden={r.id !== gewaehlt?.id}
          style={{ paddingTop: 22 }}
        >
          {r.id === gewaehlt?.id ? <div className="bedv-fade-up">{r.inhalt}</div> : r.inhalt}
        </div>
      ))}
    </>
  );
}
