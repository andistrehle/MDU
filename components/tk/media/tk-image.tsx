// ============================================================
// Tennis Kail — Bildplatz
// ============================================================
//
// Ein Bauteil für alle Bilder der Demo. Es entscheidet an einer Stelle,
// was gezeigt wird:
//   1. Originalfoto von tennis-kail.de, falls im Manifest vorhanden.
//   2. Sonst die gezeichnete Grafik aus facility-art.tsx.
//
// Dadurch wird aus „Bilder nachliefern" ein Datenschritt, kein Umbau:
// `node scripts/tk-fetch-images.mjs` ausführen — fertig.
// ============================================================

import Image from 'next/image';
import { originalFor, slot as getSlot } from '@/data/tk/images';
import { cn } from '@/lib/utils';
import { FacilityArt } from './facility-art';

export function TkImage({
  slot,
  className,
  imgClassName,
  ratio = '4 / 3',
  priority,
  sizes = '(max-width: 768px) 100vw, 50vw',
  rounded = true,
}: {
  slot: string;
  className?: string;
  imgClassName?: string;
  ratio?: string;
  priority?: boolean;
  sizes?: string;
  rounded?: boolean;
}) {
  const s = getSlot(slot);
  const original = originalFor(slot);

  return (
    <div
      className={cn('relative overflow-hidden bg-[var(--tk-chalk-2)]', rounded && 'rounded-[var(--tk-radius)]', className)}
      style={{ aspectRatio: ratio }}
    >
      {original ? (
        <Image
          src={original.src}
          alt={s.alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn('object-cover', imgClassName)}
        />
      ) : (
        <FacilityArt variant={s.variant} tone={s.tone} className={cn('h-full w-full object-cover', imgClassName)} />
      )}
    </div>
  );
}

/** Runder Ausschnitt für Trainerprofile. */
export function TkAvatar({ slot, size = 72 }: { slot: string; size?: number }) {
  const s = getSlot(slot);
  const original = originalFor(slot);
  return (
    <div
      className="relative flex-none overflow-hidden rounded-full bg-[var(--tk-chalk-2)]"
      style={{ width: size, height: size }}
    >
      {original ? (
        <Image src={original.src} alt={s.alt} fill sizes={`${size}px`} className="object-cover" />
      ) : (
        <FacilityArt variant="portrait" tone={s.tone} className="h-full w-full" />
      )}
    </div>
  );
}
