'use client';

// Startet die Willkommens-Tour erneut (Footer-Einstieg „Tour ansehen").
// Auf der Startseite direkt per Custom-Event, sonst Wechsel zu /?tour=1.

const DONE_KEY = 'mdu.tour.v1.done';
const SKIP_KEY = 'mdu.tour.v1.skips';

export function TourRestartLink() {
  const restart = () => {
    try {
      localStorage.removeItem(DONE_KEY);
      localStorage.removeItem(SKIP_KEY);
    } catch { /* ignore */ }
    if (window.location.pathname === '/') {
      window.dispatchEvent(new Event('mdu:start-tour'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.location.href = '/?tour=1';
    }
  };

  return (
    <button
      type="button"
      onClick={restart}
      style={{
        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
        fontFamily: 'var(--font-manrope)', fontSize: 13, color: 'var(--th-text-muted)',
        textDecoration: 'none',
      }}
    >
      Tour ansehen
    </button>
  );
}
