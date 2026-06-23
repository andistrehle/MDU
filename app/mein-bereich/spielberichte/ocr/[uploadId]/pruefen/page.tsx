'use client';
/* eslint-disable @next/next/no-img-element */

// ============================================================
// Mein Bereich — OCR-Prüfansicht
// ============================================================
//
// Zeigt das hochgeladene Original + das erkannte Ergebnis mit Konfidenz/Status
// (Farbe + Icon + Text), Validierungshinweisen und übergibt zur finalen
// Prüfung/Einreichung an den bestehenden digitalen Editor. OCR erkennt und
// befüllt — der Mensch prüft und bestätigt.
// ============================================================

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MemberShell, Notice, Muted, LoginLink } from '@/components/mdu/member-area';
import { useAuth } from '@/lib/auth/auth-context';
import {
  getUpload, getOcrResult, getUploadSignedUrl, OCR_STATUS_LABELS,
  type MatchReportUpload, type OcrResultRow,
} from '@/lib/supabase/match-report-uploads';
import { validateExtraction, type ValidationIssue } from '@/lib/ocr/validate-match-report';
import type { MatchReportExtraction } from '@/lib/ocr/schemas';

type Level = 'ok' | 'review' | 'missing';
function levelOf(confidence: number | null | undefined, hasValue: boolean): Level {
  if (!hasValue) return 'missing';
  if (confidence == null) return 'review';
  if (confidence >= 0.9) return 'ok';
  if (confidence >= 0.7) return 'review';
  return 'missing';
}
const LEVEL_META: Record<Level, { icon: string; text: string; color: string; bg: string }> = {
  ok:      { icon: '✓', text: 'Sicher erkannt', color: 'var(--th-win)', bg: 'rgba(34,197,94,0.10)' },
  review:  { icon: '!', text: 'Bitte prüfen', color: '#A77A00', bg: 'rgba(232,184,74,0.12)' },
  missing: { icon: '✕', text: 'Nicht erkannt', color: '#E24B4A', bg: 'rgba(212,0,0,0.10)' },
};

interface FieldRow { label: string; value: string | null; level: Level }

function buildRows(d: MatchReportExtraction): FieldRow[] {
  const rows: FieldRow[] = [
    { label: 'Heimmannschaft', value: d.match.homeTeam, level: levelOf(null, !!d.match.homeTeam) },
    { label: 'Gastmannschaft', value: d.match.guestTeam, level: levelOf(null, !!d.match.guestTeam) },
    { label: 'Liga', value: d.match.league, level: levelOf(null, !!d.match.league) },
    { label: 'Spieltag', value: d.match.matchday != null ? String(d.match.matchday) : null, level: levelOf(null, d.match.matchday != null) },
    { label: 'Datum', value: d.match.date, level: levelOf(null, !!d.match.date) },
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

export default function OcrReviewPage() {
  const { user, loading } = useAuth();
  const params = useParams();
  const uploadId = String(params?.uploadId ?? '');

  const [upload, setUpload] = useState<MatchReportUpload | null>(null);
  const [result, setResult] = useState<OcrResultRow | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user || !uploadId) return;
    let cancelled = false;
    (async () => {
      const [u, r, url] = await Promise.all([getUpload(uploadId), getOcrResult(uploadId), getUploadSignedUrl(uploadId)]);
      if (cancelled) return;
      setUpload(u); setResult(r); setSignedUrl(url); setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [user, uploadId]);

  const structured = result?.structured_result ?? null;
  const issues: ValidationIssue[] = structured ? validateExtraction(structured) : [];
  const rows = structured ? buildRows(structured) : [];
  const isImage = upload?.mime_type?.startsWith('image/') && upload.mime_type !== 'image/heic' && upload.mime_type !== 'image/heif';

  return (
    <MemberShell title="Spielbericht prüfen">
      {loading || (!loaded && user) ? <Muted>Lade …</Muted>
        : !user ? <Notice title="Bitte einloggen">Nur mit Konto verfügbar.{' '}<LoginLink /></Notice>
        : !upload ? <Notice title="Nicht gefunden">Dieser Upload ist nicht verfügbar.</Notice>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 860 }}>
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

            {(upload.ocr_status === 'completed' || upload.ocr_status === 'needs_review') && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.2fr)', gap: 16, alignItems: 'start' }} className="mdu-ocr-grid">
                  {/* Vorschau */}
                  <Card title="Original">
                    {isImage && signedUrl
                      ? <a href={signedUrl} target="_blank" rel="noreferrer"><img src={signedUrl} alt="Spielbericht-Upload" style={{ width: '100%', borderRadius: 8, border: '1px solid var(--th-line-6)' }} /></a>
                      : signedUrl
                        ? <a href={signedUrl} target="_blank" rel="noreferrer" style={linkS}>Original öffnen ({upload.mime_type})</a>
                        : <Muted>Vorschau nicht verfügbar.</Muted>}
                  </Card>

                  {/* Erkannte Felder */}
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

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  {upload.match_report_id ? (
                    <Link href={`/mein-bereich/spielberichte?id=${upload.match_report_id}`} style={primary}>
                      Im Editor prüfen & einreichen →
                    </Link>
                  ) : <Muted>Kein Entwurf verknüpft.</Muted>}
                  <Link href="/mein-bereich/spielberichte/uebersicht" style={{ ...btnGhost, display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>Zur Übersicht</Link>
                </div>
                <Muted>Im Editor sind alle Felder vorausgefüllt — bitte gegen das Foto prüfen, Unsicheres korrigieren und anschließend wie gewohnt absenden. Tabelle und Einzelrangliste werden erst nach der Bestätigung durch den Gegner aktualisiert.</Muted>
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
const primary: React.CSSProperties = { padding: '12px 22px', borderRadius: 8, cursor: 'pointer', background: 'var(--th-accent)', color: '#fff', border: '1px solid var(--th-accent-hover)', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' };
const btnGhost: React.CSSProperties = { padding: '12px 20px', borderRadius: 8, cursor: 'pointer', background: 'transparent', color: 'var(--th-accent)', border: '1.5px solid var(--th-accent)', fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13 };
