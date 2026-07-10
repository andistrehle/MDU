'use client';

import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { AdminGuard } from '@/components/mdu/admin-guard';
import { useAuth } from '@/lib/auth/auth-context';
import {
  listAllNews, saveNews, deleteNews, setNewsStatus,
  type NewsRecord, type NewsStatus,
} from '@/lib/supabase/news';

interface FormState {
  id?: string;
  title: string;
  category: string;
  display_date: string;
  source: string;
  teaser: string;
  contentText: string;   // Absätze durch Leerzeile getrennt
  status: NewsStatus;
}

const STATUS_LABEL: Record<NewsStatus, string> = {
  draft: 'Entwurf', published: 'Veröffentlicht', archived: 'Archiviert',
};
const STATUS_COLOR: Record<NewsStatus, string> = {
  draft: 'var(--th-text-faint)', published: 'var(--th-win)', archived: 'var(--th-text-muted)',
};
const STATUS_ORDER: NewsStatus[] = ['published', 'draft', 'archived'];

function todayDe(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

const EMPTY_FORM: FormState = {
  title: '', category: 'MDU News', display_date: '', source: 'Münchner Dart Union',
  teaser: '', contentText: '', status: 'draft',
};

const inputStyle: CSSProperties = {
  width: '100%', boxSizing: 'border-box', padding: '9px 11px', borderRadius: 8,
  background: 'var(--th-bg-page)', border: '1px solid var(--th-line-8)',
  color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 13,
};
const labelStyle: CSSProperties = {
  fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
  textTransform: 'uppercase', color: 'var(--th-text-muted)', marginBottom: 5, display: 'block',
};
function btn(bg: string, fg: string, border: string): CSSProperties {
  return {
    padding: '8px 14px', borderRadius: 8, background: bg, color: fg, border: `1px solid ${border}`,
    fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 12.5, cursor: 'pointer',
  };
}

export default function AdminNewsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<NewsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data, error } = await listAllNews();
    setItems(data);
    setLoadError(error);
    setLoading(false);
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const startNew = () => { setFormError(null); setForm({ ...EMPTY_FORM, display_date: todayDe() }); };
  const startEdit = (n: NewsRecord) => {
    setFormError(null);
    setForm({
      id: n.id, title: n.title, category: n.category, display_date: n.display_date,
      source: n.source ?? '', teaser: n.teaser, contentText: n.content.join('\n\n'), status: n.status,
    });
  };

  const submit = async () => {
    if (!form || !user) return;
    if (!form.title.trim()) { setFormError('Bitte einen Titel eingeben.'); return; }
    const content = form.contentText.split(/\n\s*\n+/).map(s => s.trim()).filter(Boolean);
    if (content.length === 0) { setFormError('Bitte einen Inhalt (mindestens einen Absatz) eingeben.'); return; }
    setSaving(true); setFormError(null);
    const { error } = await saveNews({
      id: form.id, title: form.title, teaser: form.teaser, source: form.source || null,
      display_date: form.display_date, category: form.category, content, status: form.status,
    }, user.id);
    setSaving(false);
    if (error) { setFormError(error); return; }
    setForm(null);
    await reload();
  };

  const quickStatus = async (n: NewsRecord, status: NewsStatus) => {
    if (!user) return;
    setBusyId(n.id);
    const { error } = await setNewsStatus(n.id, status, user.id);
    setBusyId(null);
    if (error) { setLoadError(error); return; }
    await reload();
  };

  const remove = async (n: NewsRecord) => {
    if (!user) return;
    if (!window.confirm(`Meldung „${n.title}" wirklich unwiderruflich löschen?`)) return;
    setBusyId(n.id);
    const { error } = await deleteNews(n.id);
    setBusyId(null);
    if (error) { setLoadError(error); return; }
    await reload();
  };

  type StringField = 'title' | 'category' | 'display_date' | 'source' | 'teaser' | 'contentText';
  const field = (key: StringField, value: string) => setForm(f => (f ? { ...f, [key]: value } : f));

  return (
    <AdminGuard title="News" subtitle="Aktuelles verwalten.">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, maxWidth: 820 }}>
        <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)' }}>
          {loading ? 'Lädt …' : `${items.length} ${items.length === 1 ? 'Meldung' : 'Meldungen'}`}
        </div>
        {!form && (
          <button type="button" onClick={startNew} style={btn('var(--th-accent)', '#fff', 'var(--th-accent-hover)')}>
            + Neue Meldung
          </button>
        )}
      </div>

      {loadError && (
        <div style={{ maxWidth: 820, marginBottom: 14, padding: '11px 14px', borderRadius: 10, background: 'var(--th-loss-a12, rgba(220,60,60,0.12))', border: '1px solid var(--th-line-8)', fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-text-strong)' }}>
          {loadError}
        </div>
      )}

      {/* ── Editor ─────────────────────────────────────────── */}
      {form && (
        <div style={{ maxWidth: 820, marginBottom: 22, background: 'var(--th-bg-card)', border: '1px solid var(--th-accent-a25)', borderRadius: 14, padding: 20 }}>
          <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 20, textTransform: 'uppercase', letterSpacing: '0.03em', color: 'var(--th-text-strong)', marginBottom: 16 }}>
            {form.id ? 'Meldung bearbeiten' : 'Neue Meldung'}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Titel</label>
            <input style={inputStyle} value={form.title} onChange={e => field('title', e.target.value)} placeholder="Überschrift der Meldung" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Kategorie</label>
              <input style={inputStyle} value={form.category} onChange={e => field('category', e.target.value)} placeholder="MDU News" />
            </div>
            <div>
              <label style={labelStyle}>Anzeige-Datum</label>
              <input style={inputStyle} value={form.display_date} onChange={e => field('display_date', e.target.value)} placeholder="06.07.2026" />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={inputStyle} value={form.status} onChange={e => { const v = e.target.value as NewsStatus; setForm(f => (f ? { ...f, status: v } : f)); }}>
                {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Quelle</label>
            <input style={inputStyle} value={form.source} onChange={e => field('source', e.target.value)} placeholder="Münchner Dart Union" />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Teaser (Kurzbeschreibung)</label>
            <textarea style={{ ...inputStyle, minHeight: 52, resize: 'vertical' }} value={form.teaser} onChange={e => field('teaser', e.target.value)} placeholder="Ein bis zwei Sätze Anriss." />
          </div>

          <div style={{ marginBottom: 6 }}>
            <label style={labelStyle}>Inhalt</label>
            <textarea style={{ ...inputStyle, minHeight: 180, resize: 'vertical', lineHeight: 1.6 }} value={form.contentText} onChange={e => field('contentText', e.target.value)} placeholder={'Absätze durch eine Leerzeile trennen.\n\nFür Fettschrift **so** schreiben.'} />
            <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11.5, color: 'var(--th-text-faint)', marginTop: 6 }}>
              Absätze durch eine Leerzeile trennen. <code style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>**fett**</code> wird unterstützt.
            </div>
          </div>

          {formError && (
            <div style={{ marginTop: 10, fontFamily: 'var(--font-manrope)', fontSize: 12.5, color: 'var(--th-loss, #d64545)', fontWeight: 700 }}>
              {formError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button type="button" onClick={submit} disabled={saving} style={{ ...btn('var(--th-accent)', '#fff', 'var(--th-accent-hover)'), opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Speichert …' : (form.id ? 'Änderungen speichern' : 'Meldung anlegen')}
            </button>
            <button type="button" onClick={() => { setForm(null); setFormError(null); }} disabled={saving} style={btn('transparent', 'var(--th-text-strong)', 'var(--th-line-10)')}>
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* ── Liste ──────────────────────────────────────────── */}
      <div style={{ background: 'var(--th-bg-card)', border: '1px solid var(--th-line-6)', borderRadius: 14, overflow: 'hidden', maxWidth: 820 }}>
        {!loading && items.length === 0 && (
          <div style={{ padding: '20px 18px', fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)' }}>
            Noch keine Meldungen. Lege oben die erste an.
          </div>
        )}
        {items.map((n, i) => (
          <div key={n.id} style={{ padding: '14px 18px', borderBottom: i < items.length - 1 ? '1px solid var(--th-line-4)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 14, color: 'var(--th-text-strong)' }}>{n.title}</div>
                <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-muted)', marginTop: 2 }}>
                  {n.display_date} · {n.category}
                </div>
              </div>
              <span style={{ flexShrink: 0, fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: STATUS_COLOR[n.status] }}>
                {STATUS_LABEL[n.status]}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              <button type="button" onClick={() => startEdit(n)} disabled={busyId === n.id} style={btn('transparent', 'var(--th-text-strong)', 'var(--th-line-10)')}>
                Bearbeiten
              </button>
              {STATUS_ORDER.filter(s => s !== n.status).map(s => (
                <button key={s} type="button" onClick={() => quickStatus(n, s)} disabled={busyId === n.id}
                  style={btn('transparent', s === 'published' ? 'var(--th-win)' : 'var(--th-text-muted)', 'var(--th-line-8)')}>
                  → {STATUS_LABEL[s]}
                </button>
              ))}
              <button type="button" onClick={() => remove(n)} disabled={busyId === n.id} style={btn('transparent', 'var(--th-loss, #d64545)', 'var(--th-line-8)')}>
                Löschen
              </button>
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontFamily: 'var(--font-manrope)', fontSize: 12, color: 'var(--th-text-faint)', marginTop: 16, maxWidth: 820, lineHeight: 1.6 }}>
        Öffentlich sichtbar sind nur <strong>veröffentlichte</strong> Meldungen. Entwürfe und archivierte
        Meldungen siehst nur du hier. Die Startseite zeigt die neuesten Meldungen des letzten Monats
        (mindestens drei), <code style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>/news</code> alle.
      </p>
    </AdminGuard>
  );
}
