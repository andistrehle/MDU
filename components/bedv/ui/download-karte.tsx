'use client';

// ============================================================
// Download-Karte
// ============================================================
//
// Hinter den Einträgen liegen KEINE Dateien — es ist eine Demo. Ein Verweis
// ins Leere (404 oder „Coming Soon") wäre in einer Vorführung aber genau der
// Moment, in dem das Gespräch kippt.
//
// Deshalb klappt der Knopf eine Erläuterung auf: was an dieser Stelle in der
// echten Plattform läge. Der Knopf tut also etwas, sagt die Wahrheit, und
// die Vorführung läuft weiter.
// ============================================================

import { useState } from 'react';
import { FileText, ChevronDown } from 'lucide-react';
import type { Download } from '@/data/bedv/typen';
import { datum } from '@/lib/bedv/format';
import { Badge } from './bausteine';

export function DownloadKarte({ eintrag }: { eintrag: Download }) {
  const [offen, setOffen] = useState(false);

  return (
    <div className="bedv-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 13, padding: '15px 16px', alignItems: 'flex-start' }}>
        <span
          aria-hidden="true"
          style={{
            width: 42, height: 42, flex: 'none', borderRadius: 10, display: 'grid', placeItems: 'center',
            background: 'var(--bedv-blue-mist)', color: 'var(--bedv-blue-deep)',
          }}
        >
          <FileText size={19} />
        </span>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '1.02rem' }}>{eintrag.titel}</h3>
            <Badge ton="leise">{eintrag.dateityp}</Badge>
          </div>
          <p style={{ color: 'var(--bedv-ink-dim)', fontSize: '0.87rem', marginTop: 6, lineHeight: 1.55 }}>
            {eintrag.beschreibung}
          </p>
          <div style={{ fontSize: '0.75rem', color: 'var(--bedv-ink-faint)', marginTop: 7 }}>
            {eintrag.groesseKb} KB · Stand {datum(eintrag.stand)}
          </div>

          <button
            className="bedv-btn bedv-btn--ghost bedv-btn--sm"
            style={{ marginTop: 12 }}
            aria-expanded={offen}
            onClick={() => setOffen(o => !o)}
          >
            {offen ? 'Hinweis schließen' : 'Öffnen'}
            <ChevronDown size={14} aria-hidden="true" style={{ transform: offen ? 'rotate(180deg)' : undefined, transition: 'transform 0.15s ease' }} />
          </button>
        </div>
      </div>

      {offen && (
        <div
          className="bedv-fade-up"
          style={{
            padding: '12px 16px', background: 'var(--bedv-accent-soft)',
            borderTop: '1px solid #F2DCAE', color: 'var(--bedv-accent-deep)',
            fontSize: '0.85rem', lineHeight: 1.55,
          }}
        >
          <strong>Demo-Ablage.</strong> In der Live-Plattform lädt dieser Knopf die Datei
          ({`„${eintrag.titel}“`}, {eintrag.dateityp}, {eintrag.groesseKb} KB). Für die Demo
          wurde bewusst keine erfundene Verbandsunterlage erzeugt — ein Dokument mit
          BeDV-Briefkopf, das der Verband nie beschlossen hat, hätte hier nichts verloren.
        </div>
      )}
    </div>
  );
}
