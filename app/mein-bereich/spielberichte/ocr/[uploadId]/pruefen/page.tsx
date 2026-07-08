'use client';
/* eslint-disable @next/next/no-img-element */

// ============================================================
// Mein Bereich — OCR-Prüfansicht
// ============================================================
//
// Zeigt das hochgeladene Original + das erkannte Ergebnis (Kopfdaten,
// Aufstellung mit Pass-Nr. + Kader-Zuordnung, 18 Ergebnisse) mit Konfidenz/
// Status (Farbe + Icon + Text) und Validierungshinweisen. Ist noch keine
// Begegnung zugeordnet, schlägt das System sie vor (aus den erkannten Teams);
// danach Übergabe an den bestehenden Editor zum Prüfen/Einreichen.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MemberShell, Notice, Muted, LoginLink } from '@/components/mdu/member-area';
import { useAuth } from '@/lib/auth/auth-context';
import {
  getUpload, getUploadPages, getOcrResult, getUploadSignedUrl, assignMatch, OCR_STATUS_LABELS,
  type MatchReportUpload, type OcrResultRow,
} from '@/lib/supabase/match-report-uploads';
import { validateExtraction, type ValidationIssue } from '@/lib/ocr/validate-match-report';
import { resolveMatchFromExtraction, matchLabel } from '@/lib/ocr/resolve-match';
import { matchPlayer, type RosterCandidate, type NameMatch } from '@/lib/ocr/match-players';
import { normalizeHighlightValue } from '@/lib/ocr/highlights';
import { MATCHES, getMatchesForTeam, getPlayersForTeamInSeason, getPlayerDisplayName, type GameMatch } from '@/lib/data';
import type { MatchReportExtraction } from '@/lib/ocr/schemas';

type Level = 'ok' | 'review' | 'missing' | 'neutral';
function levelOf(confidence: number | null | undefined, hasValue: boolean): Level {
  if (!hasValue) return 'missing';
  if (confidence == null) return 'review';
  if (confidence >= 0.9) return 'ok';
  if (confidence >= 0.7) return 'review';
  return 'missing';
}
/**
 * Kopf-Felder (Teams/Liga/Datum …) tragen im Schema keine Konfidenz. Statt
 * sie deshalb pauschal gelb „Bitte prüfen" zu färben, werden sie neutral
 * dargestellt, wenn ein Wert erkannt wurde (REV-060).
 */
function headerLevel(hasValue: boolean): Level {
  return hasValue ? 'neutral' : 'missing';
}
const LEVEL_META: Record<Level, { icon: string; text: string; color: string; bg: string }> = {
  ok:      { icon: '✓', text: 'Sicher erkannt', color: 'var(--th-win)', bg: 'rgba(34,197,94,0.10)' },
  review:  { icon: '!', text: 'Bitte prüfen', color: '#A77A00', bg: 'rgba(232,184,74,0.12)' },
  missing: { icon: '✕', text: 'Nicht erkannt', color: '#E24B4A', bg: 'rgba(212,0,0,0.10)' },
  neutral: { icon: '·', text: 'Erkannt (bitte gegen den Bogen prüfen)', color: 'var(--th-text-muted)', bg: 'var(--th-line-5)' },
};

function slotOf(pos: string | null | undefined): number {
  const m = /^[HG](\d)$/i.exec((pos ?? '').trim());
  return m ? Number(m[1]) : 99;
}

interface FieldRow { label: string; value: string | null; level: Level }
function buildRows(d: MatchReportExtraction): FieldRow[] {
  const rows: FieldRow[] = [
    { label: 'Heimmannschaft', value: d.match.homeTeam, level: headerLevel(!!d.match.homeTeam) },
    { label: 'Gastmannschaft', value: d.match.guestTeam, level: headerLevel(!!d.match.guestTeam) },
    { label: 'Liga', value: d.match.league, level: headerLevel(!!d.match.league) },
    { label: 'Spieltag', value: d.match.matchday != null ? String(d.match.matchday) : null, level: headerLevel(d.match.matchday != null) },
    { label: 'Datum', value: d.match.date, level: headerLevel(!!d.match.date) },
    { label: 'Gesamtergebnis', value: d.finalScore.home != null ? `${d.finalScore.home} : ${d.finalScore.guest}` : null, level: levelOf(d.finalScore.confidence, d.finalScore.home != null) },
  ];
  for (const g of d.games) {
    rows.push({
      label: `Spiel ${g.gameNo} (${g.type === 'double' ? 'Doppel' : 'Einzel'})`,
      value: g.legsHome != null ? `${g.legsHome} : ${g.legsGuest}` : null,
      level: levelOf(g.confidence, g.legsHome != null),
    });
  }
  return rows;
}

interface LineupRow { position: string; detected: string | null; passNo: string | null; match: NameMatch | null }
function rosterFor(teamId: string, seasonId: string): RosterCandidate[] {
  return getPlayersForTeamInSeason(teamId, seasonId).map(({ player }) => ({
    id: player.id, name: getPlayerDisplayName(player), passNo: player.licenseNumber ?? null,
  }));
}
function lineupRows(side: 'home' | 'guest', d: MatchReportExtraction, match: GameMatch | null): LineupRow[] {
  const detLine = side === 'home' ? d.homeLineup : d.guestLineup;
  const teamId = match ? (side === 'home' ? match.homeTeamId : match.awayTeamId) : null;
  const roster = teamId && match ? rosterFor(teamId, match.seasonId) : [];
  return [...detLine]
    .filter(p => p.detectedName || p.passNo)
    .sort((a, b) => slotOf(a.position) - slotOf(b.position))
    .map(p => ({
      position: p.position,
      detected: p.detectedName,
      passNo: p.passNo,
      match: roster.length ? matchPlayer({ name: p.detectedName, passNo: p.passNo }, roster) : null,
    }));
}
const HIGHLIGHT_LABEL: Record<'180' | '171' | 'high_finish' | 'short_leg', string> = {
  '180': '180er',
  '171': '171er',
  high_finish: 'High Finish (Checkout ≥ 100)',
  short_leg: 'Kürzestes Leg (Darts)',
};
const METHOD_META: Record<NameMatch['method'], { label: string; color: string }> = {
  pass: { label: 'Pass-Nr.', color: 'var(--th-win)' },
  name: { label: 'Name', color: '#A77A00' },
  none: { label: 'offen', color: '#E24B4A' },
};

export default function OcrReviewPage() {
  const { user, loading } = useAuth();
  const params = useParams();
  const uploadId = String(params?.uploadId ?? '');

  interface PagePreview { id: string; pageNumber: number; mimeType: string; url: string | null }

  const [upload, setUpload] = useState<MatchReportUpload | null>(null);
  const [result, setResult] = useState<OcrResultRow | null>(null);
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [matchSel, setMatchSel] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignMsg, setAssignMsg] = useState<string | null>(null);

  async function loadPagePreviews(u: MatchReportUpload): Promise<PagePreview[]> {
    const rows = await getUploadPages(u);
    return Promise.all(rows.map(async r => ({
      id: r.id, pageNumber: r.page_number, mimeType: r.mime_type, url: await getUploadSignedUrl(r.id),
    })));
  }

  async function reload() {
    const [u, r] = await Promise.all([getUpload(uploadId), getOcrResult(uploadId)]);
    setUpload(u); setResult(r);
    setPages(u ? await loadPagePreviews(u) : []);
    setLoaded(true);
  }
  useEffect(() => {
    if (!user || !uploadId) return;
    let cancelled = false;
    (async () => {
      const [u, r] = await Promise.all([getUpload(uploadId), getOcrResult(uploadId)]);
      const pv = u ? await loadPagePreviews(u) : [];
      if (!cancelled) { setUpload(u); setResult(r); setPages(pv); setLoaded(true); }
    })();
    return () => { cancelled = true; };
  }, [user, uploadId]);

  const structured = result?.structured_result ?? null;
  const hasDraft = !!upload?.match_report_id;
  const knownMatch = upload?.match_id ? (MATCHES.find(m => m.id === upload.match_id) ?? null) : null;

  const resolution = useMemo(() => structured ? resolveMatchFromExtraction(structured) : { match: null, candidates: [] }, [structured]);
  const candidateOptions = useMemo<GameMatch[]>(() => {
    if (resolution.candidates.length) return resolution.candidates;
    return user?.teamId ? getMatchesForTeam(user.teamId) : [...MATCHES];
  }, [resolution, user?.teamId]);
  useEffect(() => {
    if (!matchSel && structured && !hasDraft) {
      queueMicrotask(() => setMatchSel(resolution.match?.id ?? resolution.candidates[0]?.id ?? ''));
    }
  }, [structured, hasDraft, resolution, matchSel]);

  const issues: ValidationIssue[] = structured ? validateExtraction(structured) : [];
  const rows = structured ? buildRows(structured) : [];
  const needsMatch = !!structured && !hasDraft;

  async function onAssign() {
    if (!matchSel) { setAssignMsg('Bitte eine Begegnung wählen.'); return; }
    setAssigning(true); setAssignMsg(null);
    const r = await assignMatch(uploadId, matchSel);
    setAssigning(false);
    if (r.error) { setAssignMsg(r.error); return; }
    await reload();
  }

  return (
    <MemberShell title="Spielbericht prüfen">
      {loading || (!loaded && user) ? <Muted>Lade …</Muted>
        : !user ? <Notice title="Bitte einloggen">Nur mit Konto verfügbar.{' '}<LoginLink /></Notice>
        : !upload ? <Notice title="Nicht gefunden">Dieser Upload ist nicht verfügbar.</Notice>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 920 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 10px', borderRadius: 999, background: 'var(--th-accent-a07)', border: '1px solid var(--th-accent-a25)', color: 'var(--th-text-body)' }}>
                Status: {OCR_STATUS_LABELS[upload.ocr_status] ?? upload.ocr_status}
              </span>
              {upload.ocr_provider && <Muted>Provider: {upload.ocr_provider}{upload.ocr_model ? ` · ${upload.ocr_model}` : ''}</Muted>}
            </div>

            {upload.ocr_status === 'failed' && (
              <Notice title="Erkennung fehlgeschlagen">
                {upload.ocr_error ?? 'Der Spielbericht konnte nicht erkannt werden.'}{' '}
                Du kannst es <Link href="/mein-bereich/spielberichte/ocr" style={linkS}>erneut hochladen</Link> oder den Bericht{' '}
                <Link href="/mein-bereich/spielberichte" style={linkS}>manuell erfassen</Link>.
              </Notice>
            )}

            {/* Erkennung läuft noch — kein leerer Bildschirm (REV-061) */}
            {!structured && (upload.ocr_status === 'pending' || upload.ocr_status === 'processing') && (
              <Notice title="Erkennung läuft">
                Der Spielbericht wird gerade ausgewertet — das dauert meist nur wenige Sekunden.
                <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button type="button" onClick={reload} style={btnGhost}>Aktualisieren</button>
                  <Link href="/mein-bereich/spielberichte/uebersicht" style={linkS}>Zur Übersicht</Link>
                </div>
              </Notice>
            )}

            {/* Status „fertig", aber kein Ergebnis vorhanden — ehrlicher Fallback statt Leere. */}
            {!structured && (upload.ocr_status === 'completed' || upload.ocr_status === 'needs_review') && (
              <Notice title="Kein Ergebnis vorhanden">
                Zu diesem Upload liegt keine Auswertung vor. Bitte{' '}
                <Link href="/mein-bereich/spielberichte/ocr" style={linkS}>erneut hochladen</Link> oder den Bericht{' '}
                <Link href="/mein-bereich/spielberichte" style={linkS}>manuell erfassen</Link>.
              </Notice>
            )}

            {structured && (
              <>
                <div className="mdu-ocr-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.2fr)', gap: 16, alignItems: 'start' }}>
                  <Card title={pages.length > 1 ? 'Original (Seiten)' : 'Original'}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {pages.map(pg => {
                        const isImg = pg.mimeType.startsWith('image/') && pg.mimeType !== 'image/heic' && pg.mimeType !== 'image/heif';
                        return (
                          <div key={pg.id}>
                            {pages.length > 1 && (
                              <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--th-text-faint)', marginBottom: 4 }}>
                                Seite {pg.pageNumber}{pg.pageNumber === 2 ? ' · Highlights' : ''}
                              </div>
                            )}
                            {isImg && pg.url
                              ? <a href={pg.url} target="_blank" rel="noreferrer"><img src={pg.url} alt={`Spielbericht-Seite ${pg.pageNumber}`} style={{ width: '100%', borderRadius: 8, border: '1px solid var(--th-line-6)' }} /></a>
                              : pg.url ? <a href={pg.url} target="_blank" rel="noreferrer" style={linkS}>Seite öffnen ({pg.mimeType})</a>
                                : <Muted>Vorschau nicht verfügbar.</Muted>}
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  <Card title="Erkannte Angaben">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {rows.map((r, i) => {
                        const m = LEVEL_META[r.level];
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--th-line-4)' }}>
                            <span title={m.text} style={{ flexShrink: 0, width: 20, height: 20, borderRadius: 5, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: m.color, background: m.bg, border: `1px solid ${m.color}` }}>{m.icon}</span>
                            <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
                            <span style={{ flexShrink: 0, fontFamily: 'var(--font-jetbrains-mono)', fontSize: 12.5, fontWeight: 700, color: 'var(--th-text-strong)' }}>{r.value ?? '—'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </div>

                {/* Aufstellung mit Pass-Nr. + Kader-Zuordnung */}
                <Card title={`Erkannte Aufstellung${knownMatch ? '' : ' (Zuordnung nach Begegnungswahl)'}`}>
                  <div className="mdu-ocr-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {(['home', 'guest'] as const).map(side => (
                      <div key={side}>
                        <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11, color: 'var(--th-accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{side === 'home' ? 'Heim' : 'Gast'}</div>
                        {lineupRows(side, structured, knownMatch).length === 0 && <Muted>Keine Spieler erkannt.</Muted>}
                        {lineupRows(side, structured, knownMatch).map((p, i) => {
                          const mm = p.match ? METHOD_META[p.match.method] : null;
                          const matchedName = p.match && p.match.status !== 'unresolved' ? p.match.matchedName : null;
                          return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: '1px solid var(--th-line-4)', fontFamily: 'var(--font-manrope)', fontSize: 12 }}>
                              <span style={{ width: 26, flexShrink: 0, fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, color: 'var(--th-text-faint)' }}>{p.position}</span>
                              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--th-text-body)' }}>
                                {matchedName ?? p.detected ?? '—'}
                                {p.passNo && <span style={{ color: 'var(--th-text-faint)', fontFamily: 'var(--font-jetbrains-mono)' }}> · {p.passNo}</span>}
                              </span>
                              {mm && <span title={`zugeordnet über ${mm.label}`} style={{ flexShrink: 0, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: mm.color, border: `1px solid ${mm.color}`, borderRadius: 4, padding: '1px 5px' }}>{mm.label}</span>}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Erkannte Highlights (meist von Seite 2) */}
                <Card title="Erkannte Highlights">
                  {structured.highlights.length === 0
                    ? <Muted>Keine Highlights erkannt{pages.length < 2 ? ' (keine zweite Seite hochgeladen).' : '.'}</Muted>
                    : (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {[...structured.highlights]
                          .sort((a, b) => slotOf(a.position) - slotOf(b.position))
                          .map((h, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid var(--th-line-4)', fontFamily: 'var(--font-manrope)', fontSize: 12.5 }}>
                              <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--th-accent)', border: '1px solid var(--th-accent-a25)', borderRadius: 4, padding: '1px 6px' }}>{h.side === 'home' ? 'Heim' : 'Gast'}</span>
                              <span style={{ width: 32, flexShrink: 0, fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, color: 'var(--th-text-faint)' }}>{h.position ?? '—'}</span>
                              <span style={{ flex: 1, minWidth: 0, color: 'var(--th-text-body)' }}>{HIGHLIGHT_LABEL[h.type]}</span>
                              {normalizeHighlightValue(h.type, h.value) != null && <span style={{ flexShrink: 0, fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, color: 'var(--th-text-strong)' }}>{normalizeHighlightValue(h.type, h.value)}{(h.type === '180' || h.type === '171') ? '×' : ''}</span>}
                            </div>
                          ))}
                      </div>
                    )}
                  <Muted>Werden im Editor übernommen — dort bitte gegen die Seite prüfen.</Muted>
                </Card>

                {/* Erkannte Auswechslungen (durchgestrichene Nummer → neue Position) */}
                {structured.substitutions.length > 0 && (
                  <Card title="Erkannte Auswechslungen">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {[...structured.substitutions]
                        .sort((a, b) => (a.fromGameNo ?? 99) - (b.fromGameNo ?? 99))
                        .map((s, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid var(--th-line-4)', fontFamily: 'var(--font-manrope)', fontSize: 12.5 }}>
                            <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--th-accent)', border: '1px solid var(--th-accent-a25)', borderRadius: 4, padding: '1px 6px' }}>{s.side === 'home' ? 'Heim' : 'Gast'}</span>
                            <span style={{ width: 54, flexShrink: 0, fontFamily: 'var(--font-manrope)', color: 'var(--th-text-faint)' }}>{s.fromGameNo != null ? `Spiel ${s.fromGameNo}` : '—'}</span>
                            <span style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-jetbrains-mono)', fontWeight: 700, color: 'var(--th-text-body)' }}>{s.position ?? '—'} → {s.playerIn ?? '—'}</span>
                          </div>
                        ))}
                    </div>
                    <Muted>Die tatsächlich gespielte Position ist bereits in den Spielen berücksichtigt — im Editor gegen den Bogen prüfen.</Muted>
                  </Card>
                )}

                {(issues.length > 0 || (result?.warnings?.length ?? 0) > 0) && (
                  <Card title="Hinweise">
                    {issues.map((iss, i) => (
                      <div key={`i${i}`} style={{ fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: iss.level === 'error' ? '#E24B4A' : '#A77A00', marginBottom: 4 }}>
                        {iss.level === 'error' ? '✕' : '!'} {iss.message}
                      </div>
                    ))}
                    {(result?.warnings ?? []).map((w, i) => (
                      <div key={`w${i}`} style={{ fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-muted)', marginBottom: 4 }}>· {w}</div>
                    ))}
                  </Card>
                )}

                {needsMatch ? (
                  <Card title="Begegnung zuordnen">
                    <Muted>{resolution.match
                      ? 'Eindeutige Begegnung aus den erkannten Teams — bitte bestätigen.'
                      : resolution.candidates.length
                        ? 'Wahrscheinlichste Begegnung vorausgewählt (aus Teams, Spieltag & Datum) — bitte prüfen und bestätigen.'
                        : 'Keine Begegnung sicher erkannt — bitte wählen.'}</Muted>
                    <select value={matchSel} onChange={e => setMatchSel(e.target.value)} style={input}>
                      <option value="">— Begegnung wählen —</option>
                      {candidateOptions.map(m => <option key={m.id} value={m.id}>{matchLabel(m)}</option>)}
                    </select>
                    {assignMsg && <div style={{ color: '#E24B4A', fontFamily: 'var(--font-manrope)', fontSize: 12.5 }}>{assignMsg}</div>}
                    <div>
                      <button type="button" onClick={onAssign} disabled={assigning} style={primary}>{assigning ? 'Wird zugeordnet …' : 'Begegnung übernehmen'}</button>
                    </div>
                  </Card>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Link href={`/mein-bereich/spielberichte?id=${upload.match_report_id}`} style={primary}>Im Editor prüfen & einreichen →</Link>
                      <Link href="/mein-bereich/spielberichte/uebersicht" style={{ ...btnGhost, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>Zur Übersicht</Link>
                    </div>
                    <Muted>Im Editor sind alle Felder vorausgefüllt — bitte gegen das Foto prüfen, Unsicheres korrigieren und anschließend wie gewohnt absenden. Tabelle und Einzelrangliste werden erst nach der Bestätigung durch den Gegner aktualisiert.</Muted>
                  </>
                )}
              </>
            )}
          </div>
        )}
    </MemberShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
      <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 11, letterSpacing: '0.14em', color: 'var(--th-accent)', textTransform: 'uppercase' }}>{title}</div>
      {children}
    </div>
  );
}

const linkS: React.CSSProperties = { color: 'var(--th-accent)', fontWeight: 700, textDecoration: 'none' };
const input: React.CSSProperties = { width: '100%', padding: '10px 12px', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-10)', borderRadius: 8, color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, outline: 'none' };
const primary: React.CSSProperties = { padding: '12px 22px', borderRadius: 8, cursor: 'pointer', background: 'var(--th-accent)', color: '#fff', border: '1px solid var(--th-accent-hover)', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' };
const btnGhost: React.CSSProperties = { padding: '12px 20px', borderRadius: 8, cursor: 'pointer', background: 'transparent', color: 'var(--th-accent)', border: '1.5px solid var(--th-accent)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13 };
