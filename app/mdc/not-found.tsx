// ============================================================
// MDC — Seite nicht gefunden
// ============================================================
//
// Eigene 404-Seite im MDC-Bereich: Sie liegt innerhalb von `app/mdc` und
// bekommt damit automatisch Kopf- und Fußzeile der MDC. Ohne sie fiele ein
// Tippfehler in der Adresse auf die 404-Seite der MDU zurück — mit deren
// Navigation, die auf der eigenen Domain gar nicht hingehört.
// ============================================================

import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';
import { PageHero } from '@/components/mdc/ui';
import { mdcPath } from '@/lib/mdc/site';

export default function MdcNotFound() {
  return (
    <>
      <PageHero
        kicker="404"
        title="Seite nicht gefunden"
        description="Die aufgerufene Adresse gibt es nicht (mehr). Vielleicht hat sich ein Tippfehler eingeschlichen, oder der Verweis ist veraltet."
      />

      <section className="mdc-section">
        <div className="mdc-shell" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href={mdcPath()} className="mdc-btn mdc-btn-primary">
            Zur Startseite
            <ArrowRight size={16} />
          </Link>
          <Link href={mdcPath('/rangliste')} className="mdc-btn mdc-btn-ghost">
            Zur Rangliste
          </Link>
          <Link href={mdcPath('/spieler')} className="mdc-btn mdc-btn-ghost">
            <Search size={16} />
            Spieler suchen
          </Link>
        </div>
      </section>
    </>
  );
}
