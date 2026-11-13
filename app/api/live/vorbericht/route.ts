// ============================================================
// Route Handler: Vorbericht fürs WhatsApp-Live — NUR für den Bazis-Live-Bot
// ============================================================
// Betreiber, 13.11.2026: zwischen Startnachricht und erstem Spiel ein kurzer,
// witziger Vorbericht aus echten Zahlen (Tabelle, Form, Top-Spieler, letztes
// Duell). Fakten rechnet lib/vorbericht.ts, Claude formuliert NUR daraus;
// ohne Claude die Vorlage. Zugang wie /api/live/aufgebot (GitHub-OIDC).
// ============================================================

import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { alleBegegnungen27, team27, venue27 } from '@/lib/data/saison-2027';
import { ladeErgebnisse27, ladeEinzel27, tabelle27 } from '@/lib/server/ergebnisse-2027';
import { pruefeWorkflowToken } from '@/lib/server/github-oidc';
import { letztesDuell, teamFakten, vorlageText, type VorberichtFakten } from '@/lib/vorbericht';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BOT_TEAMS = ['freibad-bazis'];
const MODELL = process.env.SPIELTAG_MODEL || 'claude-opus-5-5';

const SYSTEM = `Du schreibst für die WhatsApp-Gruppe eines Darts-Teams der Münchner Dart Union (E-Dart-Liga) einen kurzen, witzigen Vorbericht zum Spiel heute Abend — wie ein augenzwinkernder Stadionsprecher.

Regeln:
- Nur Fakten aus dem JSON verwenden. Keine erfundenen Zahlen, Zitate, Verletzungen, Gerüchte oder Vorgeschichten. Namen exakt wie angegeben.
- Witz entsteht aus den echten Zahlen (Tabellenplatz, Form S/U/N, Top-Spieler, Highlights, letztes Duell) — freundlich, nie herablassend gegenüber dem Gegner.
- Ein Ergebnis „12:6“ ist nach Spielen (18 Spiele je Begegnung). platz null = noch kein Spiel. form: neueste zuerst.
- 4–6 kurze Sätze, Deutsch, Du/Ihr-Ton, 3–5 passende Emojis, kein Markdown, keine Hashtags, kein Link.
- Erste Zeile genau: 📋 Vorbericht
- Danach eine Leerzeile, dann der Text (gern 2 kurze Absätze).`;

async function mitClaude(f: VorberichtFakten): Promise<string | null> {
  const key = (process.env.OCR_API_KEY || process.env.ANTHROPIC_API_KEY || '').trim();
  if (!key) return null;
  try {
    const client = new Anthropic({ apiKey: key });
    const r = await client.messages.create({
      model: MODELL,
      max_tokens: 1500,
      system: SYSTEM,
      messages: [{ role: 'user', content: JSON.stringify(f) }],
    });
    if (r.stop_reason === 'refusal' || r.stop_reason === 'max_tokens') return null;
    const text = r.content.map(b => (b.type === 'text' ? b.text : '')).join('').trim();
    return text.startsWith('📋') ? text : text ? `📋 Vorbericht\n\n${text}` : null;
  } catch (e) {
    console.error('Vorbericht: Claude fehlgeschlagen', e instanceof Anthropic.APIError ? `${e.status} ${e.message}` : e);
    return null;
  }
}

export async function GET(req: Request) {
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token || !(await pruefeWorkflowToken(token, 'bazis-live.yml'))) {
    return NextResponse.json({ error: 'nicht erlaubt' }, { status: 401 });
  }
  const url = new URL(req.url);
  const team = url.searchParams.get('team') ?? '';
  const alle = alleBegegnungen27();
  const b = alle.find(x => x.key === (url.searchParams.get('spiel') ?? ''));
  if (!BOT_TEAMS.includes(team) || !b || (b.home !== team && b.away !== team)) {
    return NextResponse.json({ error: 'unbekanntes Spiel' }, { status: 404 });
  }
  const name = (id: string) => team27(id)?.name ?? id;
  const [{ byKey }, einzel, tabH, tabG] = await Promise.all([
    ladeErgebnisse27(), ladeEinzel27(), tabelle27(team27(b.home)!.league), tabelle27(team27(b.away)!.league),
  ]);
  const ergebnisse = Object.values(byKey).filter(e => !e.wertung);
  const plan = alle.map(x => ({ key: x.key, home: x.home, away: x.away, datum: x.termin?.datum ?? null }));
  const zeilen = Object.values(einzel.jeLiga).flat();
  const f: VorberichtFakten = {
    heim: teamFakten(b.home, name, tabH, ergebnisse, plan, zeilen, b.key),
    gast: teamFakten(b.away, name, tabG, ergebnisse, plan, zeilen, b.key),
    lokal: venue27(team27(b.home)?.venueId)?.name ?? null,
    anwurf: b.termin?.uhrzeit ?? null,
    letztesDuell: letztesDuell(b.home, b.away, b.key, ergebnisse, name),
  };
  const claude = await mitClaude(f);
  return NextResponse.json({ text: claude ?? vorlageText(f), quelle: claude ? 'claude' : 'vorlage' }, { headers: { 'Cache-Control': 'no-store' } });
}
