'use client';

// ============================================================
// NotificationBadge — klassische rote Benachrichtigungsziffer
// ============================================================
//
// Zeigt eine kleine rote Zahl (1, 2, 3 … bzw. „99+"). Bei count <= 0 wird
// NICHTS gerendert (kein leerer Kreis). Rot in beiden Themes — eine
// Notification-Ziffer ist universell verständlich.
//
//   absolute  → oben rechts an Kachel/Button positioniert (nicht
//               layoutverschiebend; Container braucht position:relative).
//   ringColor → Trennlinie zum Hintergrund (Standard: Kartenhintergrund).
// ============================================================

import type { CSSProperties } from 'react';

interface NotificationBadgeProps {
  count: number;
  absolute?: boolean;
  ringColor?: string;
  /** Barrierefreie Beschreibung (sonst „N offene Aufgaben"). */
  title?: string;
  style?: CSSProperties;
}

export function NotificationBadge({
  count,
  absolute = false,
  ringColor = 'var(--th-bg-card)',
  title,
  style,
}: NotificationBadgeProps) {
  if (!count || count <= 0) return null;
  const label = count > 99 ? '99+' : String(count);

  return (
    <span
      role="status"
      aria-label={title ?? `${count} offene Aufgaben`}
      title={title}
      style={{
        ...(absolute ? { position: 'absolute', top: -7, right: -7, zIndex: 3 } : {}),
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        minWidth: 20, height: 20, padding: '0 6px',
        borderRadius: 999,
        background: '#D40000', color: '#fff',
        fontFamily: 'var(--font-saira-condensed)', fontWeight: 900,
        fontSize: 12, lineHeight: 1, letterSpacing: '0.01em',
        boxShadow: `0 0 0 2px ${ringColor}`,
        pointerEvents: 'none',
        ...style,
      }}
    >
      {label}
    </span>
  );
}
