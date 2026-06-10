import { Icon } from '@/components/mdu/icon';

export default function AdminNewsPage() {
  return (
    <div style={{ color: 'var(--th-text-strong)' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: 'var(--th-text-faint2)', textTransform: 'uppercase', marginBottom: 6 }}>Admin · Inhalt</div>
        <h1 style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 900, fontSize: 32, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--th-text-strong)', margin: 0 }}>News Editor</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>
        {/* Editor */}
        <div style={{ background: 'linear-gradient(180deg, var(--th-bg-card3), var(--th-bg-card2))', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, color: 'var(--th-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Titel</label>
              <input
                type="text"
                placeholder="Artikeltitel eingeben…"
                style={{ width: '100%', padding: '11px 14px', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-8)', borderRadius: 8, color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, color: 'var(--th-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Kategorie</label>
              <select style={{ width: '100%', padding: '11px 14px', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-8)', borderRadius: 8, color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, outline: 'none' }}>
                <option>Allgemein</option>
                <option>Turnier</option>
                <option>Interview</option>
                <option>Verein</option>
                <option>Saison</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, color: 'var(--th-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Slug</label>
              <input type="text" placeholder="artikel-slug-hier" style={{ width: '100%', padding: '11px 14px', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-8)', borderRadius: 8, color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, color: 'var(--th-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Datum</label>
              <input type="date" style={{ width: '100%', padding: '11px 14px', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-8)', borderRadius: 8, color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, outline: 'none' }} />
            </div>
          </div>

          {/* Format toolbar */}
          <div style={{ display: 'flex', gap: 4, padding: '10px 0', borderBottom: '1px solid var(--th-line-6)', marginBottom: 12, flexWrap: 'wrap' }}>
            {['B', 'I', 'U', 'S', 'H1', 'H2', '¶'].map(t => (
              <button key={t} style={{ padding: '6px 10px', background: 'var(--th-line-4)', border: '1px solid var(--th-line-6)', borderRadius: 6, color: 'var(--th-text-body)', fontFamily: 'var(--font-manrope)', fontWeight: t === 'B' ? 900 : t === 'I' ? 400 : 700, fontSize: 13, cursor: 'pointer', fontStyle: t === 'I' ? 'italic' : 'normal' }}>
                {t}
              </button>
            ))}
            {['image', 'file'].map(icon => (
              <button key={icon} style={{ padding: '6px 8px', background: 'var(--th-line-4)', border: '1px solid var(--th-line-6)', borderRadius: 6, color: 'var(--th-text-body)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Icon name={icon} size={14} />
              </button>
            ))}
          </div>

          <textarea
            placeholder="Artikelinhalt hier eingeben…"
            rows={12}
            style={{ width: '100%', padding: '14px', background: 'var(--th-bg-header)', border: '1px solid var(--th-line-8)', borderRadius: 8, color: 'var(--th-text-strong)', fontFamily: 'var(--font-manrope)', fontSize: 14, resize: 'vertical', outline: 'none', lineHeight: 1.6 }}
          />

          {/* Image dropzone */}
          <div style={{ marginTop: 16, padding: '28px 20px', border: '1.5px dashed rgba(212,0,0,0.4)', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <Icon name="upload" size={22} style={{ color: '#D40000' }} />
            <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)' }}>Bild hier ablegen oder klicken zum Hochladen</span>
          </div>
        </div>

        {/* Sidebar: existing articles */}
        <div style={{ background: 'linear-gradient(180deg, var(--th-bg-card3), var(--th-bg-card2))', border: '1px solid var(--th-line-6)', borderRadius: 14, padding: 20 }}>
          <div style={{ fontFamily: 'var(--font-saira-condensed)', fontWeight: 800, fontSize: 16, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>Letzte Artikel</div>
          {[
            { title: 'Endspurt der Saison 2025/26…', date: '18.05.2026', status: 'Veröffentlicht' },
            { title: '„Wir sind hungrig wie nie" – Captain…', date: '16.05.2026', status: 'Veröffentlicht' },
            { title: 'Neue Spielstätte in Pasing…',           date: '14.05.2026', status: 'Entwurf' },
          ].map((a, i) => (
            <div key={i} style={{ padding: '14px 0', borderBottom: i < 2 ? '1px solid var(--th-line-6)' : 'none', cursor: 'pointer' }}>
              <div style={{ fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, color: 'var(--th-text-strong)', marginBottom: 6, lineHeight: 1.4 }}>{a.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-jetbrains-mono)', fontSize: 11, color: 'var(--th-text-muted)' }}>{a.date}</span>
                <span style={{ fontFamily: 'var(--font-manrope)', fontSize: 11, fontWeight: 700, color: a.status === 'Entwurf' ? 'var(--th-text-muted)' : 'var(--th-win)' }}>{a.status}</span>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <button style={{ flex: 1, padding: '11px', background: '#D40000', color: '#fff', border: '1px solid #FF1F1F', borderRadius: 8, fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Veröffentlichen</button>
            <button style={{ padding: '11px 16px', background: 'var(--th-line-4)', color: 'var(--th-text-body)', border: '1px solid var(--th-line-8)', borderRadius: 8, fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Entwurf</button>
          </div>
        </div>
      </div>
    </div>
  );
}
