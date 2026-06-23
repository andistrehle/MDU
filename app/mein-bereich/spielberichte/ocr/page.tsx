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
import { MATCHES, getMatchesForTeam, type GameMatch } from '@/lib/data';
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
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'err' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    getOcrAvailability().then(a => { setAvailable(a.enabled); setMaxMb(a.maxFileMb); });
  }, [user]);

  const matches = useMemo(() => {
    const list = isAdmin ? [...MATCHES] : (user?.teamId ? getMatchesForTeam(user.teamId) : []);
    return [...list].sort((a, b) => (b.matchday ?? -1) - (a.matchday ?? -1) || (b.date ?? '').localeCompare(a.date ?? ''));
  }, [isAdmin, user?.teamId]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files, ...Array.from(list)].slice(0, 2); // max 2 Seiten
    setFiles(next);
  }

  async function onStart() {
    if (!matchId) { setMsg({ kind: 'err', text: 'Bitte zuerst die Begegnung wählen.' }); return; }
    if (files.length === 0) { setMsg({ kind: 'err', text: 'Bitte mindestens ein Foto/PDF auswählen.' }); return; }
    setBusy(true); setMsg({ kind: 'info', text: 'Lade hoch …' });
    let firstUploadId: string | null = null;
    for (let i = 0; i < files.length; i++) {
      const r = await uploadReportFile(matchId, files[i], i + 1);
      if (r.error || !r.uploadId) { setBusy(false); setMsg({ kind: 'err', text: r.error ?? 'Upload fehlgeschlagen.' }); return; }
      if (!firstUploadId) firstUploadId = r.uploadId;
    }
    setMsg({ kind: 'info', text: 'Erkennung läuft … das kann einen Moment dauern.' });
    const ocr = await startOcr(firstUploadId!);
    setBusy(false);
    if (ocr.error && !ocr.status) { setMsg({ kind: 'err', text: ocr.error }); return; }
    router.push(`/mein-bereich/spielberichte/ocr/${firstUploadId}/pruefen`);
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

            <Card title="1 · Begegnung wählen">
              <select value={matchId} onChange={e => setMatchId(e.target.value)} style={input}>
                <option value="">— Begegnung wählen —</option>
                {matches.map(m => <option key={m.id} value={m.id}>{matchLabel(m)}</option>)}
              </select>
              {matches.length === 0 && <Muted>Keine Begegnungen gefunden.</Muted>}
            </Card>

            <Card title="2 · Foto oder PDF (max. 2 Seiten)">
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <label style={btn}>
                  📷 Foto aufnehmen
                  <input type="file" accept="image/*" capture="environment" hidden onChange={e => addFiles(e.target.files)} />
                </label>
                <label style={btn}>
                  📄 Datei wählen
                  <input type="file" accept="image/*,application/pdf" hidden onChange={e => addFiles(e.target.files)} />
                </label>
              </div>
              {files.length > 0 && (
                <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-body)' }}>
                  {files.map((f, i) => (
                    <li key={i} style={{ marginBottom: 4 }}>
                      Seite {i + 1}: {f.name} ({Math.round(f.size / 1024)} KB)
                      <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} style={{ marginLeft: 8, background: 'none', border: 'none', color: 'var(--th-loss)', cursor: 'pointer' }}>entfernen</button>
                    </li>
                  ))}
                </ul>
              )}
              <Muted>JPG/PNG/PDF · max. {maxMb} MB je Datei · bei gutem Licht und gerade fotografieren.</Muted>
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
