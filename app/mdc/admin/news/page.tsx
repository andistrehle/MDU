// ============================================================
// MDC — News in der Turnierverwaltung
// ============================================================
//
// Liegt hinter derselben Passwortabfrage wie der Ergebnis-Upload
// (`proxy.ts`) und ist für Suchmaschinen gesperrt.
//
// Dynamisch, nicht vorgerechnet: Die Seite muss beim Aufruf wissen, ob die
// Zugangsdaten hinterlegt sind, und die Liste soll den Stand des laufenden
// Deployments zeigen.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHero } from '@/components/mdc/ui';
import { NewsEditor } from '@/components/mdc/news-editor';
import { NEWS } from '@/data/news';
import { todayInMunich } from '@/data/season';
import { getUploadStatus } from '@/lib/mdc/upload-config';
import { mdcPath } from '@/lib/mdc/site';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'News schreiben',
  description: 'Beiträge für die News-Seite der Munich Darts Challenge.',
};

export const dynamic = 'force-dynamic';

export default async function AdminNewsPage() {
  // Entwürfe gehören hier ausdrücklich dazu — die Verwaltung zeigt alles,
  // die Seite nur das Veröffentlichte.
  const posts = [...NEWS].sort(
    (a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id),
  );

  return (
    <>
      <PageHero
        kicker="Turnierverwaltung"
        title="News schreiben"
        description="Neuigkeiten für die Startseite und die News-Übersicht. Ein Beitrag steht ein bis zwei Minuten nach dem Anlegen online."
      />

      <section className="mdc-section">
        <div className="mdc-shell" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <NewsEditor posts={posts} heute={todayInMunich()} status={getUploadStatus()} />

          <p style={{ fontSize: '0.85rem', lineHeight: 1.7, color: 'var(--mdc-ink-dim)', maxWidth: 700 }}>
            Beiträge werden als Commit im Quellcode-Speicher abgelegt, nicht in einer Datenbank —
            genauso wie die hochgeladenen Ergebnisse. Sie sind damit versioniert und lassen sich
            zurückholen. Gelöschte Beiträge sind von der Seite verschwunden, stehen aber weiterhin
            im Verlauf des Repositories.
          </p>

          <Link href={mdcPath('/admin')} className="mdc-btn mdc-btn-ghost mdc-btn-sm" style={{ alignSelf: 'flex-start' }}>
            <ArrowLeft size={15} />
            Zur Turnierverwaltung
          </Link>
        </div>
      </section>
    </>
  );
}
