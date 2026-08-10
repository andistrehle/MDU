'use client';

// ============================================================
// Tennis Kail — Bewegung
// ============================================================
//
// Framer Motion (Paket `motion`) übernimmt drei Aufgaben und sonst nichts:
//   1. Inhalte kommen beim Scrollen einmal ruhig herein (`Reveal`).
//   2. Listen erscheinen kurz nacheinander statt alle gleichzeitig (`Stagger`).
//   3. Zahlen zählen hoch, wenn sie ins Bild kommen (`CountUp`).
//
// Grundsatz: Bewegung erklärt Zusammenhänge, sie schmückt nicht. Wer im
// System „weniger Bewegung" eingestellt hat, sieht alles sofort und
// vollständig — `useReducedMotion` schaltet jede Animation ab, nicht nur
// die Dauer.
// ============================================================

import { motion, useInView, useReducedMotion, type Variants } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

const EASE = [0.16, 1, 0.3, 1] as const;

export function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
  as = 'div',
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'article' | 'header';
}) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  if (reduce) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: EASE }}
    >
      {children}
    </Tag>
  );
}

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

/**
 * `tabIndex`/`role`/`ariaLabel` werden durchgereicht, weil manche
 * Stagger-Container zugleich waagerecht scrollende Bereiche sind — die
 * müssen mit der Tastatur erreichbar sein (WCAG 2.1.1).
 */
export function Stagger({
  children,
  className,
  tabIndex,
  role,
  ariaLabel,
}: {
  children: React.ReactNode;
  className?: string;
  tabIndex?: number;
  role?: string;
  ariaLabel?: string;
}) {
  const reduce = useReducedMotion();
  const a11y = { tabIndex, role, 'aria-label': ariaLabel };
  if (reduce)
    return (
      <div className={className} {...a11y}>
        {children}
      </div>
    );
  return (
    <motion.div
      className={className}
      {...a11y}
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-40px' }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

/**
 * Zahl, die beim Sichtbarwerden hochzählt. Der Endwert steht sofort im
 * DOM-Text, falls JavaScript oder Bewegung aus ist — es darf nie „0"
 * stehen bleiben.
 */
export function CountUp({
  to,
  suffix = '',
  decimals = 0,
  duration = 1100,
}: {
  to: number;
  suffix?: string;
  decimals?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(to);

  useEffect(() => {
    if (reduce || !inView) return;
    let frame = 0;
    let start = 0;
    // Der Startwert wird im ersten Frame gesetzt, nicht synchron im Effekt —
    // sonst rendert React zweimal hintereinander, nur um bei 0 anzufangen.
    const tick = (now: number) => {
      if (!start) start = now;
      const p = Math.min(1, (now - start) / duration);
      // Weich auslaufend, damit die Zahl nicht abrupt stehen bleibt.
      setValue(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, to, duration, reduce]);

  return (
    <span ref={ref} className="tabular-nums">
      {value.toLocaleString('de-DE', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
