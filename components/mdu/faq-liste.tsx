'use client';

// ============================================================
// FAQ — Suche + aufklappbare Fragen (Inhalt: lib/data/faq.ts)
// ============================================================
//
// Die Antworten kennen genau zwei Auszeichnungen: **fett** und
// [Linktext](/pfad). Leerzeile = neuer Absatz, Zeile mit „- “ = Aufzählung.
// Jede Frage hat eine Kennung (#kennung) — so lässt sich ein Link direkt auf
// eine Antwort teilen; sie springt dann auf und wird angescrollt.
// ============================================================

import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { FAQ, type FaqEintrag } from '@/lib/data/faq';
import { Icon } from '@/components/mdu/icon';

const norm = (s: string) => s.toLowerCase()
  .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
  .normalize('NFD').replace(/[̀-ͯ]/g, '');

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[(.+?)\]\((.+?)\)/g;
  let last = 0; let m: RegExpExecArray | null; let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) out.push(<strong key={`${key}-${i++}`} style={{ color: 'var(--th-text-strong)' }}>{m[1]}</strong>);
    else {
      const href = m[3]; const extern = /^(https?:|mailto:)/.test(href);
      const st = { color: 'var(--th-accent)', fontWeight: 700, textDecoration: 'none' } as const;
      out.push(extern
        ? <a key={`${key}-${i++}`} href={href} style={st}>{m[2]}</a>
        : <Link key={`${key}-${i++}`} href={href} style={st}>{m[2]}</Link>);
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function Antwort({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {text.trim().split(/\n\s*\n/).map((absatz, ai) => {
        const zeilen = absatz.split('\n');
        if (zeilen.every(z => z.trim().startsWith('- '))) {
          return (
            <ul key={ai} style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {zeilen.map((z, zi) => <li key={zi}>{inline(z.trim().slice(2), `${ai}-${zi}`)}</li>)}
            </ul>
          );
        }
        return <p key={ai} style={{ margin: 0 }}>{inline(zeilen.join(' '), String(ai))}</p>;
      })}
    </div>
  );
}

export function FaqListe() {
  const [suche, setSuche] = useState('');
  const [offen, setOffen] = useState<Set<string>>(new Set());

  // Direktlink #kennung: aufklappen und hinscrollen.
  useEffect(() => {
    const oeffne = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (!id || !FAQ.some(k => k.fragen.some(f => f.id === id))) return;
      setSuche('');
      setOffen(prev => new Set(prev).add(id));
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
    };
    const raf = requestAnimationFrame(oeffne);
    window.addEventListener('hashchange', oeffne);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('hashchange', oeffne); };
  }, []);

  const q = norm(suche.trim());
  const gefiltert = useMemo(() => {
    if (!q) return FAQ;
    const woerter = q.split(/\s+/);
    return FAQ.map(k => ({
      ...k,
      fragen: k.fragen.filter(f => {
        const heu = norm(`${f.frage} ${f.antwort} ${(f.stichworte ?? []).join(' ')} ${k.titel}`);
        return woerter.every(w => heu.includes(w));
      }),
    })).filter(k => k.fragen.length > 0);
  }, [q]);
  const treffer = gefiltert.reduce((n, k) => n + k.fragen.length, 0);

  const umschalten = (f: FaqEintrag) => setOffen(prev => {
    const n = new Set(prev);
    if (n.has(f.id)) n.delete(f.id); else n.add(f.id);
    return n;
  });

  return (
    <div>
      <label style={{ position: 'relative', display: 'block' }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--th-text-faint)', display: 'flex' }}>
          <Icon name="search" size={16} stroke={2} />
        </span>
        <input
          type="search" value={suche} onChange={e => setSuche(e.target.value)}
          placeholder="Frage suchen, z. B. „Spielbericht“ oder „Passwort“"
          aria-label="FAQ durchsuchen"
          style={{
            width: '100%', boxSizing: 'border-box', padding: '13px 14px 13px 40px', borderRadius: 12,
            background: 'var(--th-bg-card)', border: '1px solid var(--th-line-8)', color: 'var(--th-text-strong)',
            fontFamily: 'var(--font-manrope)', fontSize: 15, outline: 'none',
          }}
        />
      </label>

      {!q && (
        <nav aria-label="Themen" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          {FAQ.map(k => (
            <a key={k.id} href={`#thema-${k.id}`} style={{
              fontFamily: 'var(--font-manrope)', fontSize: 12.5, fontWeight: 700, textDecoration: 'none',
              color: 'var(--th-text-muted)', background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)',
              borderRadius: 999, padding: '6px 12px',
            }}>{k.titel}</a>
          ))}
        </nav>
      )}

      {q && (
        <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-faint)', margin: '14px 0 0' }}>
          {treffer === 0 ? 'Keine passende Frage gefunden.' : `${treffer} ${treffer === 1 ? 'Frage' : 'Fragen'} gefunden`}
        </p>
      )}

      {gefiltert.map(k => (
        <section key={k.id} id={`thema-${k.id}`} style={{ marginTop: 28, scrollMarginTop: 80 }}>
          <h2 style={{
            fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 12, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--th-text-faint)', margin: '0 0 10px',
          }}>{k.titel}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {k.fragen.map(f => {
              const auf = offen.has(f.id) || (!!q && treffer <= 3);
              return (
                <div key={f.id} id={f.id} style={{
                  background: 'var(--th-bg-card)', border: `1px solid ${auf ? 'var(--th-accent-a25)' : 'var(--th-line-6)'}`,
                  borderRadius: 12, scrollMarginTop: 80,
                }}>
                  <button
                    type="button" onClick={() => umschalten(f)} aria-expanded={auf}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                      background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                      fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14.5, color: 'var(--th-text-strong)',
                    }}
                  >
                    <span style={{ flex: 1 }}>{f.frage}</span>
                    <span style={{ display: 'flex', color: 'var(--th-text-faint)', transform: auf ? 'rotate(90deg)' : 'none', transition: 'transform 150ms' }}>
                      <Icon name="arrow-right" size={15} stroke={2} />
                    </span>
                  </button>
                  {auf && (
                    <div style={{
                      padding: '0 16px 16px', fontFamily: 'var(--font-manrope)', fontSize: 14,
                      lineHeight: 1.65, color: 'var(--th-text-muted)',
                    }}>
                      <Antwort text={f.antwort} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
