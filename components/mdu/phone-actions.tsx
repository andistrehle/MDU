'use client';

// ============================================================
// PhoneActions — Telefonnummer mit Aktionsauswahl
// ============================================================
//
// Zeigt eine Telefonnummer als antippbaren Button. Beim Klick öffnet sich ein
// kleines Menü mit drei Optionen: Anrufen (tel:), WhatsApp (wa.me) und SMS
// (sms:). Das Menü wird per fixed positioniert, damit es nicht in Tabellen mit
// overflow:hidden abgeschnitten wird.
// ============================================================

import { useEffect, useRef, useState } from 'react';

/** Nummer für wa.me normalisieren: nur Ziffern inkl. Ländervorwahl (DE-Default). */
function waNumber(raw: string): string {
  let d = raw.replace(/[^\d+]/g, '');
  if (d.startsWith('+')) d = d.slice(1);
  else if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = '49' + d.slice(1);
  return d.replace(/\D/g, '');
}

export function PhoneActions({ phone }: { phone: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onDoc = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const tel = phone.replace(/\s+/g, '');
  const wa = waNumber(phone);

  const toggle = () => {
    if (open) { setOpen(false); return; }
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 4, left: r.left });
    setOpen(true);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4, padding: 0,
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: 'var(--th-accent)', fontFamily: 'var(--font-manrope)', fontWeight: 800, fontSize: 'inherit',
        }}
      >
        📞 {phone}
      </button>

      {open && pos && (
        <div
          role="menu"
          style={{
            position: 'fixed', top: pos.top, left: pos.left, zIndex: 300,
            minWidth: 168, background: 'var(--th-bg-card)', border: '1px solid var(--th-line-10)',
            borderRadius: 10, boxShadow: '0 14px 34px rgba(0,0,0,0.35)', overflow: 'hidden',
          }}
        >
          <a href={`tel:${tel}`} role="menuitem" onClick={() => setOpen(false)} style={itemStyle}>📞 Anrufen</a>
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" role="menuitem" onClick={() => setOpen(false)} style={{ ...itemStyle, borderTop: '1px solid var(--th-line-6)' }}>💬 WhatsApp</a>
          <a href={`sms:${tel}`} role="menuitem" onClick={() => setOpen(false)} style={{ ...itemStyle, borderTop: '1px solid var(--th-line-6)' }}>✉️ SMS</a>
        </div>
      )}
    </>
  );
}

const itemStyle: React.CSSProperties = {
  display: 'block', padding: '11px 14px', textDecoration: 'none',
  fontFamily: 'var(--font-manrope)', fontWeight: 700, fontSize: 13.5,
  color: 'var(--th-text-strong)',
};
