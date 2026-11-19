// Ergebnis-Seiten (Tabellen, Ergebnisse, Spielplan, Liga-, Team-, Spieler- und
// Berichtsseiten) zum Neubau markieren. Neu gebaut wird erst beim nächsten
// Aufruf der jeweiligen Seite — kein Schwall an ISR-Schreibvorgängen.
import 'server-only';
import { revalidatePath } from 'next/cache';

export function ergebnisSeitenMarkieren() {
  revalidatePath('/');
  revalidatePath('/tabellen');
  revalidatePath('/ergebnisse');
  revalidatePath('/spielplan');
  revalidatePath('/ligen/[code]', 'page');
  revalidatePath('/teams/[id]', 'page');
  revalidatePath('/spieler/[playerId]', 'page');
  revalidatePath('/spielbericht/[spiel]', 'page');
}
