'use client';

// ============================================================
// Mein Bereich — Papier-Spielbericht hochladen (Foto/PDF + OCR)
// ============================================================
//
// Begegnung wählen → Foto(s)/PDF hochladen → OCR starten → Prüfansicht.
// Sichtbar nur, wenn das Feature serverseitig verfügbar ist; die eigentliche
// Berechtigung wird in den Routen geprüft.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MemberShell, Notice, Muted, LoginLink } from '@/components/mdu/member-area';
import { useAuth } from '@/lib/auth/auth-context';
import { hasMinRole } from '@/lib/auth/roles';
import { MATCHES, getMatchesForTeam, findLeague, type GameMatch } from '@/lib/data';
import { getOcrAvailability, uploadReportFile, startOcr } from '@/lib/supabase/match-report-uploads';

function matchLabel(m: GameMatch): string {
  const day = m.matchday ? `${m.matchday}. Sptg · ` : '';
  const date = m.date ? ` · ${new Date(m.date).toLocaleDateString('de-DE')}` : '';
  return `${day}${m.homeTeamName} – ${m.awayTeamName}${date}`;
}

export default function OcrUploadPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isAdmin = hasMinRole(user, 'league_admin');
  const allowed = isAdmin || user?.role === 'team_captain';

  const [available, setAvailable] = useState<boolean | null>(null);
  const [maxMb, setMaxMb] = useState(12);
  const [matchId, setMatchId] = useState('');
  // Ansicht der Begegnungsliste (nur für Admins umschaltbar):
  //   'mine' = nur die eigene Mannschaft (Standard, wie bei Kapitänen –
  //            der wöchentliche Normalfall)
  //   'all'  = alle Begegnungen der Liga (Ligaleitung trägt für andere ein)
  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  // Filter innerhalb der „Alle Begegnungen"-Ansicht (Admin).
  const [leagueFilter, setLeagueFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page1, setPage1] = useState<File | null>(null);
  const [page2, setPage2] = useState<File | null>(null);
  const [wantPage2, setWantPage2] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'err' | 'info'; text: string } | null>(null);

  const hasOwnTeam = !!user?.teamId;
  // Admin schaut die volle Liga-Liste an? Nur dann greifen Umschalter-Filter.
  const adminAll = isAdmin && scope === 'all';

  useEffect(() => {
    if (!user) return;
    getOcrAvailability().then(a => { setAvailable(a.enabled); setMaxMb(a.maxFileMb); });
  }, [user]);

  // Admin ohne eigene Mannschaft kann nur die „Alle Begegnungen"-Ansicht nutzen.
  useEffect(() => {
    if (isAdmin && !hasOwnTeam) setScope('all');
  }, [isAdmin, hasOwnTeam]);

  const matches = useMemo(() => {
    // Kapitäne sowie Admins im „Meine Mannschaft"-Modus: nur eigene Begegnungen.
    const list = adminAll
      ? [...MATCHES]
      : (user?.teamId ? getMatchesForTeam(user.teamId) : (isAdmin ? [...MATCHES] : []));
    return [...list].sort((a, b) => (b.matchday ?? -1) - (a.matchday ?? -1) || (b.date ?? '').localeCompare(a.date ?? ''));
  }, [adminAll, isAdmin, user?.teamId]);

  // Ligen, die in der Liste tatsächlich vorkommen — für das Admin-Filter-Dropdown.
  const leagueOptions = useMemo(() => {
    if (!adminAll) return [] as { id: string; name: string }[];
    const seen = new Map<string, string>();
    for (const m of matches) {
      if (!seen.has(m.leagueId)) seen.set(m.leagueId, findLeague(m.leagueId)?.name ?? m.leagueId);
    }
    return [...seen.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'de'));
  }, [adminAll, matches]);

  // Gefilterte Liste (nur in der Admin-„Alle Begegnungen"-Ansicht wirksam).
  const visibleMatches = useMemo(() => {
    if (!adminAll) return matches;
    const q = search.trim().toLowerCase();
    return matches.filter(m =>
      (!leagueFilter || m.leagueId === leagueFilter) &&
      (!q || matchLabel(m).toLowerCase().includes(q))
    );
  }, [matches, adminAll, leagueFilter, search]);

  // Fällt die aktuell gewählte Begegnung durch einen Filter raus, Auswahl leeren.
  useEffect(() => {
    if (matchId && !visibleMatches.some(m => m.id === matchId)) setMatchId('');
  }, [visibleMatches, matchId]);

  // Datei vor dem Hochladen prüfen: HEIC (iPhone) kann OCR nicht lesen (REV-052),
  // und zu große Dateien werden serverseitig ohnehin abgelehnt (REV-053) — daher
  // sofort mit klarer Meldung abfangen, statt erst nach vergeblichem Upload.
  function pickFile(file: File | null, setFile: (f: File | null) => void) {
    if (!file) { setFile(null); return; }
    const isHeic = /heic|heif/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
    if (isHeic) {
      setMsg({ kind: 'err', text: 'HEIC-Fotos (iPhone) können nicht ausgelesen werden. Bitte als JPG aufnehmen (iPhone: Einstellungen → Kamera → Formate → „Maximale Kompatibilität") oder als PDF hochladen.' });
      return;
    }
    if (file.size > maxMb * 1024 * 1024) {
      setMsg({ kind: 'err', text: `Die Datei ist zu groß (${Math.round(file.size / 1024 / 1024)} MB). Erlaubt sind max. ${maxMb} MB.` });
      return;
    }
    setMsg(null);
    setFile(file);
  }

  async function onStart() {
    if (!page1) { setMsg({ kind: 'err', text: 'Bitte Seite 1 (Spielbericht) als Foto/PDF auswählen.' }); return; }
    setBusy(true); setMsg({ kind: 'info', text: 'Lade hoch …' });

    const r1 = await uploadReportFile(matchId, page1, 1);
    if (r1.error || !r1.uploadId) { setBusy(false); setMsg({ kind: 'err', text: r1.error ?? 'Upload fehlgeschlagen.' }); return; }

    const extraIds: string[] = [];
    if (wantPage2 && page2) {
      const r2 = await uploadReportFile(matchId, page2, 2);
      if (r2.error || !r2.uploadId) { setBusy(false); setMsg({ kind: 'err', text: r2.error ?? 'Upload von Seite 2 fehlgeschlagen.' }); return; }
      extraIds.push(r2.uploadId);
    }

    setMsg({ kind: 'info', text: 'Erkennung läuft … das kann einen Moment dauern.' });
    const ocr = await startOcr(r1.uploadId, extraIds);
    setBusy(false);
    if (ocr.error && !ocr.status) { setMsg({ kind: 'err', text: ocr.error }); return; }
    router.push(`/mein-bereich/spielberichte/ocr/${r1.uploadId}/pruefen`);
  }

  return (
    <MemberShell title="Spielbericht hochladen">
      {loading ? <Muted>Lade …</Muted>
        : !user ? <Notice title="Bitte einloggen">Nur mit Konto verfügbar.{' '}<LoginLink /></Notice>
        : !allowed ? <Notice title="Keine Berechtigung">Spielberichte hochladen dürfen Teamkapitäne und die Ligaleitung.</Notice>
        : available === false ? (
          <Notice title="Funktion noch nicht aktiv">
            Der automatische Foto-/PDF-Upload ist aktuell nicht freigeschaltet. Du kannst den Spielbericht{' '}
            <Link href="/mein-bereich/spielberichte" style={{ color: 'var(--th-accent)', fontWeight: 700, textDecoration: 'none' }}>digital erfassen</Link>{' '}
            oder die <Link href="/spielberichte/vorlage" style={{ color: 'var(--th-accent)', fontWeight: 700, textDecoration: 'none' }}>Druckvorlage</Link> nutzen.
          </Notice>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 620 }}>
            {msg && (
              <div role={msg.kind === 'err' ? 'alert' : 'status'} style={{ padding: '10px 14px', borderRadius: 8, fontFamily: 'var(--font-manrope)', fontSize: 13, background: msg.kind === 'err' ? 'rgba(212,0,0,0.10)' : 'var(--th-accent-a07)', border: `1px solid ${msg.kind === 'err' ? 'rgba(212,0,0,0.35)' : 'var(--th-accent-a25)'}`, color: msg.kind === 'err' ? '#E24B4A' : 'var(--th-text-body)' }}>{msg.text}</div>
            )}

            <Card title="1 · Begegnung (optional)">
              {isAdmin && hasOwnTeam && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setScope('mine')} style={segBtn(scope === 'mine')}>Meine Mannschaft</button>
                  <button type="button" onClick={() => setScope('all')} style={segBtn(scope === 'all')}>Alle Begegnungen</button>
                </div>
              )}
              {adminAll && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <select value={leagueFilter} onChange={e => setLeagueFilter(e.target.value)} style={{ ...input, flex: '1 1 180px', width: 'auto' }} aria-label="Nach Liga filtern">
                    <option value="">Alle Ligen</option>
                    {leagueOptions.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                  <input
                    type="search" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Team suchen …" aria-label="Begegnung nach Team suchen"
                    style={{ ...input, flex: '2 1 200px', width: 'auto' }}
                  />
                </div>
              )}
              <select value={matchId} onChange={e => setMatchId(e.target.value)} style={input}>
                <option value="">— ohne Auswahl (wird nach der Erkennung zugeordnet) —</option>
                {visibleMatches.map(m => <option key={m.id} value={m.id}>{matchLabel(m)}</option>)}
              </select>
              {adminAll && (leagueFilter || search.trim()) && (
                <Muted>{visibleMatches.length} Begegnung{visibleMatches.length === 1 ? '' : 'en'} gefiltert{visibleMatches.length === 0 ? ' – Filter anpassen.' : '.'}</Muted>
              )}
              <Muted>Du kannst die Begegnung gleich wählen (beste Erkennung) oder ohne Auswahl hochladen — das System schlägt sie danach anhand der erkannten Teams vor.</Muted>
            </Card>

            <Card title="2 · Seite 1 — Spielbericht (Pflicht)">
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <label style={btn}>
                  📷 Foto aufnehmen
                  <input type="file" accept="image/*" capture="environment" hidden onChange={e => pickFile(e.target.files?.[0] ?? null, setPage1)} />
                </label>
                <label style={btn}>
                  📄 Datei wählen
                  <input type="file" accept="image/*,application/pdf" hidden onChange={e => pickFile(e.target.files?.[0] ?? null, setPage1)} />
                </label>
              </div>
              {page1 && <FilePill file={page1} onRemove={() => setPage1(null)} />}
              <Muted>Die Vorderseite mit Aufstellung und Ergebnissen. JPG/PNG/PDF · max. {maxMb} MB · bei gutem Licht und gerade fotografieren.</Muted>
            </Card>

            <Card title="3 · Seite 2 — Highlights (optional)">
              {!wantPage2 ? (
                <>
                  <Muted>Gibt es eine zweite Seite mit Highlights (180er, 171er, High-Finishes, kürzestes Leg)? Wenn der Bogen nur eine Seite hat oder es keine Highlights gab, kannst du das überspringen.</Muted>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => setWantPage2(true)} style={btn}>+ Seite 2 hinzufügen</button>
                  </div>
                </>
              ) : (
                <>
                  <Muted>Foto/PDF der zweiten Seite. Daraus werden die Highlights ausgelesen.</Muted>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <label style={btn}>
                      📷 Foto aufnehmen
                      <input type="file" accept="image/*" capture="environment" hidden onChange={e => pickFile(e.target.files?.[0] ?? null, setPage2)} />
                    </label>
                    <label style={btn}>
                      📄 Datei wählen
                      <input type="file" accept="image/*,application/pdf" hidden onChange={e => pickFile(e.target.files?.[0] ?? null, setPage2)} />
                    </label>
                    <button type="button" onClick={() => { setWantPage2(false); setPage2(null); }} style={{ ...btn, color: 'var(--th-text-muted)', borderColor: 'var(--th-line-10)' }}>Doch keine 2. Seite</button>
                  </div>
                  {page2 && <FilePill file={page2} onRemove={() => setPage2(null)} />}
                </>
              )}
            </Card>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={onStart} disabled={busy} style={primary}>{busy ? 'Bitte warten …' : 'OCR-Erkennung starten'}</button>
              <Link href="/mein-bereich/spielberichte/uebersicht" style={{ ...btn, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>Zurück</Link>
            </div>
            <Muted>Nach der Erkennung kannst du alle Werte prüfen und korrigieren, bevor der Bericht über den normalen Weg eingereicht wird.</Muted>
          </div>
        )}
    </MemberShell>
  );
}

function FilePill({ file, onRemove }: { file: File; onRemove: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)' }}>
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✓ {file.name} ({Math.round(file.size / 1024)} KB)</span>
      <button type="button" onClick={onRemove} style={{ background: 'none', border: 'none', color: 'var(--th-loss)', cursor: 'pointer', flexShrink: 0 }}>entfernen</button>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11, letterSpacing: '0.14em', color: 'var(--th-accent)', textTransform: 'uppercase' }}>{title}</div>
      {children}
    </div>
  );
}

const input: React.CSSProperties = { width: '100%', padding: '10px 12px', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)', borderRadius: 8, color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14 };
const btn: React.CSSProperties = { padding: '10px 18px', borderRadius: 8, cursor: 'pointer', background: 'transparent', color: 'var(--th-accent)', border: '1.5px solid var(--th-accent)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13 };
const primary: React.CSSProperties = { padding: '12px 24px', borderRadius: 8, cursor: 'pointer', background: 'var(--th-accent)', color: '#fff', border: '1px solid var(--th-accent-hover)', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13 };

/** Segment-Button für den Ansicht-Umschalter (Meine Mannschaft / Alle Begegnungen). */
function segBtn(active: boolean): React.CSSProperties {
  return {
    flex: 1, padding: '9px 10px', borderRadius: 8, cursor: 'pointer',
    background: active ? 'var(--th-accent-a12)' : 'transparent',
    border: `1.5px solid ${active ? 'var(--th-accent)' : 'var(--th-line-10)'}`,
    color: active ? 'var(--th-accent)' : 'var(--th-text-muted)',
    fontFamily: 'var(--font-manrope)', fontWeight: active ? 800 : 600, fontSize: 12.5,
  };
}
