// Route-Level-Ladezustand für „Mein Bereich" (dynamische, DB-gestützte Seiten).
// Bewusst NUR hier (und in /admin), NICHT global — siehe app/admin/loading.tsx
// (globale loading.tsx → Soft-404 auf öffentlichen [param]-Routen, REV2-N01).

export default function Loading() {
  return (
    <div style={{
      background: 'var(--th-bg-page)', color: 'var(--th-text-strong)', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18,
    }}>
      <div className="mdu-load-spinner" aria-hidden="true" />
      <div style={{ fontFamily: 'var(--font-manrope)', fontSize: 13, fontWeight: 600, color: 'var(--th-text-muted)', letterSpacing: '0.04em' }}>
        Lädt …
      </div>
      <style>{`
        .mdu-load-spinner {
          width: 40px; height: 40px; border-radius: 50%;
          border: 3px solid var(--th-line-10);
          border-top-color: var(--th-accent);
          animation: mdu-spin 0.8s linear infinite;
        }
        @keyframes mdu-spin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .mdu-load-spinner { animation-duration: 2s; } }
      `}</style>
    </div>
  );
}
