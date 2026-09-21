// ============================================================
// 404 innerhalb der BeDV-Demo
// ============================================================
//
// Ohne diese Datei nähme Next die 404-Seite des Wurzelordners — die der
// MDU, mit deren Kopfzeile und deren Farben. Mitten in einer BeDV-Demo wäre
// das der denkbar schlechteste Moment für eine fremde Marke.
//
// Greift NUR bei `notFound()`-Aufrufen. Adressen, für die es gar keine
// Route gibt, fängt `app/bedv/[...unbekannt]/page.tsx` ab.
// ============================================================

import Link from 'next/link';
import { bedvPath } from '@/lib/bedv/site';
import { Dartboard } from '@/components/bedv/brand/dartboard';

export default function NichtGefunden() {
  return (
    <div
      className="bedv-shell"
      style={{
        paddingBlock: '60px 70px', textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}
    >
      <Dartboard groesse={130} variante="farbig" zahlen={false} />

      <div className="bedv-eyebrow" style={{ justifyContent: 'center', marginTop: 24 }}>Daneben</div>
      <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', marginTop: 10 }}>
        Diese Seite gibt es nicht
      </h1>
      <p style={{ color: 'var(--bedv-ink-dim)', marginTop: 12, maxWidth: '46ch', lineHeight: 1.6 }}>
        Vielleicht ein Tippfehler in der Adresse, vielleicht ein alter Verweis. Über die
        Suche findest du jede Mannschaft und jeden Spieler in zwei Sekunden.
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 22 }}>
        <Link href={bedvPath()} className="bedv-btn bedv-btn--primary">Zur Startseite</Link>
        <Link href={bedvPath('/ligen')} className="bedv-btn bedv-btn--ghost">Zu den Ligen</Link>
        <Link href={bedvPath('/teams')} className="bedv-btn bedv-btn--ghost">Mannschaften</Link>
      </div>
    </div>
  );
}
