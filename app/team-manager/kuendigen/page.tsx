import type { Metadata } from 'next';
import { LegalPage, LegalSection } from '@/components/mdu/legal-page';
import { KuendigungFormular } from '@/components/mdu/kuendigung-formular';
import { ANBIETER } from '@/lib/premium';

// Kündigungsbutton nach § 312k BGB: ohne Anmeldung erreichbar, im Fuß jeder Seite verlinkt.

export const metadata: Metadata = { title: 'Verträge hier kündigen', description: 'Team Manager kündigen – ohne Anmeldung.' };

export default function KuendigenPage() {
  return (
    <LegalPage title="Verträge hier kündigen" updated="November 2026" notice={null}>
      <LegalSection title="Team Manager kündigen">
        Hier kündigst du ein Monatsabo des Team Managers, auch ohne Anmeldung. Der Team Manager läuft bis zum Ende des
        bezahlten Monats weiter. Der Saisonpass endet am 31.05.2027 von selbst und muss nicht gekündigt werden.
        Du bekommst eine Eingangsbestätigung per E-Mail. Alternativ: E-Mail an {ANBIETER.email}.
      </LegalSection>
      <KuendigungFormular />
    </LegalPage>
  );
}
