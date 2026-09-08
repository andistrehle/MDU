'use client';

// ============================================================
// MDC — News schreiben
// ============================================================
//
// Ein Formular, eine Liste. Kein Editor mit Werkzeugleiste: Der Text kennt
// genau eine Auszeichnung (**fett**), und dafür lohnt keine Oberfläche, die
// man erst lernen muss.
//
// Was der Beitrag wird, sieht man daneben — Titel, Teaser und Absätze genau so
// gesetzt wie später auf der Seite. Das ersetzt die Vorschau-Seite, die sonst
// jeder als Erstes vermisst.
// ============================================================

import { useState } from 'react';
import { AlertTriangle, Check, ExternalLink, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import type { NewsPost } from '@/data/news';
import { NewsAbsatz } from './news';
import { formatDate } from '@/lib/mdc/format';
import { speichereBeitrag, entferneBeitrag } from '@/app/mdc/admin/news/actions';

export interface NewsEditorStatus {
  canPublish: boolean;
  missing: string[];
}

const KATEGORIEN = ['Ranking', 'Termine', 'Spielorte', 'Spielbetrieb', 'MDC'];

/** Leere Vorlage für einen neuen Beitrag. */
function leer(heute: string) {
  return {
    ersetzt: undefined as string | undefined,
    date: heute,
    title: '',
    teaser: '',
    category: 'MDC',
    text: '',
    published: true,
  };
}

export function NewsEditor(
  { posts, heute, status }: { posts: NewsPost[]; heute: string; status: NewsEditorStatus },
) {
  const [entwurf, setEntwurf] = useState(() => leer(heute));
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const [erfolg, setErfolg] = useState<{ url: string; neu: boolean; published: boolean } | null>(null);

  const absaetze = entwurf.text
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map(a => a.trim().replace(/\n+/g, ' '))
    .filter(Boolean);

  const vollstaendig = entwurf.title.trim().length >= 3
    && entwurf.teaser.trim().length >= 10
    && absaetze.length > 0;

  function bearbeite(post: NewsPost) {
    setEntwurf({
      ersetzt: post.id,
      date: post.date,
      title: post.title,
      teaser: post.teaser,
      category: post.category,
      text: post.paragraphs.join('\n\n'),
      published: post.published,
    });
    setErfolg(null);
    setFehler(null);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function speichern() {
    setLaeuft(true);
    setFehler(null);
    setErfolg(null);
    const antwort = await speichereBeitrag(entwurf);
    setLaeuft(false);
    if (!antwort.ok) { setFehler(antwort.fehler); return; }
    setErfolg({ url: antwort.url, neu: antwort.neu, published: antwort.published });
    setEntwurf(leer(heute));
  }

  async function loeschen(post: NewsPost) {
    if (!window.confirm(`„${post.title}" wirklich löschen? Das lässt sich nur im Repository rückgängig machen.`)) return;
    setLaeuft(true);
    setFehler(null);
    setErfolg(null);
    const antwort = await entferneBeitrag(post.id);
    setLaeuft(false);
    if (!antwort.ok) { setFehler(antwort.fehler); return; }
    setErfolg({ url: antwort.url, neu: false, published: false });
  }

  if (!status.canPublish) {
    return (
      <div className="mdc-card" style={{ padding: '22px 20px' }}>
        <h2 className="mdc-display" style={{ fontSize: '1.2rem' }}>Noch nicht eingerichtet</h2>
        <p style={{ marginTop: 8, fontSize: '0.94rem', lineHeight: 1.7, color: 'var(--mdc-ink-soft)' }}>
          Beiträge werden wie die Ergebnisse im Repository abgelegt. Dafür fehlt die Zugangsdatei:
        </p>
        <ul style={{ marginTop: 12, paddingLeft: 18, listStyle: 'disc', lineHeight: 1.8 }}>
          {status.missing.map(m => <li key={m}><code>{m}</code></li>)}
        </ul>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {fehler && (
        <div className="mdc-card" style={{ padding: '16px 18px', display: 'flex', gap: 12, borderColor: 'var(--mdc-red-a35)' }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2, color: 'var(--mdc-red)' }} />
          <p style={{ fontSize: '0.92rem', lineHeight: 1.65, whiteSpace: 'pre-line' }}>{fehler}</p>
        </div>
      )}

      {erfolg && (
        <div className="mdc-card mdc-card-accent" style={{ padding: '18px 20px' }}>
          <p style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 600 }}>
            <Check size={18} style={{ color: 'var(--mdc-win)' }} />
            {erfolg.neu ? 'Beitrag angelegt' : 'Beitrag gespeichert'}
            {!erfolg.published && ' — als Entwurf, noch nicht sichtbar'}
          </p>
          <p style={{ marginTop: 8, fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--mdc-ink-soft)' }}>
            Die Seite baut sich neu; in ein bis zwei Minuten steht der Beitrag online. Die Liste
            unten zeigt ihn erst nach dem Neubau.
          </p>
          <a href={erfolg.url} target="_blank" rel="noopener noreferrer" className="mdc-btn mdc-btn-ghost mdc-btn-sm" style={{ marginTop: 12 }}>
            Was geschrieben wurde
            <ExternalLink size={14} />
          </a>
        </div>
      )}

      {/* ── Formular ── */}
      <div className="mdc-card" style={{ padding: '22px 20px' }}>
        <h2 className="mdc-display" style={{ fontSize: '1.2rem' }}>
          {entwurf.ersetzt ? 'Beitrag bearbeiten' : 'Neuer Beitrag'}
        </h2>
        {entwurf.ersetzt && (
          <p style={{ marginTop: 6, fontSize: '0.85rem', color: 'var(--mdc-ink-dim)' }}>
            Kennung <code>{entwurf.ersetzt}</code> — sie bleibt, damit verschickte Links weiter
            funktionieren.
          </p>
        )}

        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', marginTop: 16 }}>
          <label style={feld}>
            <span style={label}>Datum</span>
            <input type="date" value={entwurf.date} style={eingabe}
              onChange={e => setEntwurf({ ...entwurf, date: e.target.value })} />
          </label>
          <label style={feld}>
            <span style={label}>Schlagwort</span>
            <input list="mdc-news-kategorien" value={entwurf.category} maxLength={24} style={eingabe}
              onChange={e => setEntwurf({ ...entwurf, category: e.target.value })} />
            <datalist id="mdc-news-kategorien">
              {KATEGORIEN.map(k => <option key={k} value={k} />)}
            </datalist>
          </label>
        </div>

        <label style={{ ...feld, marginTop: 14 }}>
          <span style={label}>Titel</span>
          <input value={entwurf.title} maxLength={120} placeholder="Worum geht es?" style={eingabe}
            onChange={e => setEntwurf({ ...entwurf, title: e.target.value })} />
        </label>

        <label style={{ ...feld, marginTop: 14 }}>
          <span style={label}>Teaser</span>
          <textarea value={entwurf.teaser} maxLength={300} rows={2} style={{ ...eingabe, resize: 'vertical' }}
            placeholder="Ein Satz für die Übersicht und die Startseite."
            onChange={e => setEntwurf({ ...entwurf, teaser: e.target.value })} />
          <span style={hinweis}>{entwurf.teaser.trim().length} von 300 Zeichen</span>
        </label>

        <label style={{ ...feld, marginTop: 14 }}>
          <span style={label}>Text</span>
          <textarea value={entwurf.text} rows={10} style={{ ...eingabe, resize: 'vertical', lineHeight: 1.6 }}
            placeholder={'Der Fließtext.\n\nEine Leerzeile beginnt einen neuen Absatz.\n\nMit **zwei Sternchen** wird etwas fett.'}
            onChange={e => setEntwurf({ ...entwurf, text: e.target.value })} />
          <span style={hinweis}>
            Leerzeile = neuer Absatz · **Sternchen** = fett · {absaetze.length}{' '}
            {absaetze.length === 1 ? 'Absatz' : 'Absätze'}
          </span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, cursor: 'pointer' }}>
          <input type="checkbox" checked={entwurf.published}
            onChange={e => setEntwurf({ ...entwurf, published: e.target.checked })} />
          <span style={{ fontSize: '0.92rem' }}>
            Sofort veröffentlichen
            <span style={{ color: 'var(--mdc-ink-dim)' }}>
              {' '}— ohne Haken wird der Beitrag als Entwurf abgelegt und ist nirgends sichtbar
            </span>
          </span>
        </label>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 20, alignItems: 'center' }}>
          <button type="button" onClick={speichern} disabled={laeuft || !vollstaendig}
            className="mdc-btn mdc-btn-primary" style={{ opacity: vollstaendig ? 1 : 0.5 }}>
            {laeuft ? <Loader2 size={17} className="mdc-spin" /> : <Check size={17} />}
            {laeuft ? 'Wird abgelegt …' : entwurf.ersetzt ? 'Änderung speichern' : 'Beitrag anlegen'}
          </button>
          {entwurf.ersetzt && (
            <button type="button" onClick={() => setEntwurf(leer(heute))} className="mdc-btn mdc-btn-ghost mdc-btn-sm">
              <Plus size={15} />
              Stattdessen neuen Beitrag
            </button>
          )}
          {!vollstaendig && (
            <span style={{ fontSize: '0.85rem', color: 'var(--mdc-ink-dim)' }}>
              Titel, Teaser und Text werden gebraucht.
            </span>
          )}
        </div>
      </div>

      {/* ── Vorschau ── */}
      {vollstaendig && (
        <div className="mdc-card" style={{ padding: '22px 20px' }}>
          <h2 className="mdc-display" style={{ fontSize: '1.2rem' }}>So sieht es aus</h2>
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--mdc-line)' }}>
            <span className="mdc-chip mdc-chip-red">{entwurf.category || 'MDC'}</span>
            <h3 className="mdc-display" style={{ fontSize: '1.5rem', marginTop: 10 }}>{entwurf.title}</h3>
            <p style={{ marginTop: 10, fontSize: '1rem', lineHeight: 1.7 }}>{entwurf.teaser}</p>
            {absaetze.map((a, i) => <NewsAbsatz key={i} text={a} />)}
          </div>
        </div>
      )}

      {/* ── Vorhandene Beiträge ── */}
      <div className="mdc-card" style={{ padding: '22px 20px' }}>
        <h2 className="mdc-display" style={{ fontSize: '1.2rem' }}>
          Vorhandene Beiträge ({posts.length})
        </h2>
        {posts.length === 0 ? (
          <p style={{ marginTop: 10, fontSize: '0.92rem', color: 'var(--mdc-ink-soft)' }}>
            Noch keiner geschrieben.
          </p>
        ) : (
          <ul style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {posts.map(post => (
              <li key={post.id}
                style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap',
                  padding: '12px 14px', borderRadius: 10,
                  border: '1px solid var(--mdc-line)',
                  background: post.published ? 'var(--mdc-card)' : 'var(--mdc-warn-tint)',
                }}
              >
                <div style={{ flex: '1 1 240px', minWidth: 200 }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--mdc-ink-dim)' }}>
                    {formatDate(post.date)} · {post.category}
                    {!post.published && (
                      <strong style={{ color: 'var(--mdc-warn-ink)' }}> · Entwurf, nicht sichtbar</strong>
                    )}
                  </div>
                  <div style={{ fontWeight: 600, marginTop: 3 }}>{post.title}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => bearbeite(post)} disabled={laeuft}
                    className="mdc-btn mdc-btn-ghost mdc-btn-sm">
                    <Pencil size={14} />
                    Bearbeiten
                  </button>
                  <button type="button" onClick={() => loeschen(post)} disabled={laeuft}
                    className="mdc-btn mdc-btn-ghost mdc-btn-sm">
                    <Trash2 size={14} />
                    Löschen
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const feld: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6 };

const label: React.CSSProperties = {
  fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em',
  textTransform: 'uppercase', color: 'var(--mdc-ink-dim)',
};

const hinweis: React.CSSProperties = { fontSize: '0.78rem', color: 'var(--mdc-ink-dim)' };

const eingabe: React.CSSProperties = {
  padding: '9px 11px', borderRadius: 9,
  border: '1px solid var(--mdc-line)', background: 'var(--mdc-card)',
  color: 'var(--mdc-ink)', fontSize: '0.94rem', fontFamily: 'inherit', width: '100%',
};
