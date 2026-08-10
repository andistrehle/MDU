'use client';

// ============================================================
// Tennis Kail — Pro-Shop
// ============================================================
//
// Bewusste Entscheidung: Der Shop verkauft nichts online. Er reserviert.
// Ein Familienbetrieb mit einer Theke braucht kein Zahlungssystem, keine
// Versandklasse und keine Retourenabwicklung — er braucht, dass jemand
// vorbeikommt und die Ware dann auch da ist. Deshalb heißt der Knopf
// „Zurücklegen lassen" und nicht „In den Warenkorb".
//
// Das ist auch die ehrlichere Demo: Ein Kaufabschluss, den es nicht gibt,
// wäre ein Versprechen, das die Anwendung nicht halten kann.
// ============================================================

import { useMemo, useState } from 'react';
import { SHOP_CATEGORIES, SHOP_ITEMS } from '@/data/tk/shop';
import type { ShopItem } from '@/lib/tk/types';
import { formatPrice } from '@/lib/tk/format';
import { useTkStore } from '@/lib/tk/store';
import { Button, Card, Chip } from '@/components/tk/ui/primitives';
import { Segment } from '@/components/tk/ui/overlay';
import { TkImage } from '@/components/tk/media/tk-image';

export function ShopClient() {
  const [category, setCategory] = useState<ShopItem['category'] | 'alle'>('alle');
  const { addLine, cart } = useTkStore();

  const items = useMemo(
    () => (category === 'alle' ? SHOP_ITEMS : SHOP_ITEMS.filter((i) => i.category === category)),
    [category],
  );

  const reserved = cart.filter((l) => l.type === 'shop');

  return (
    <>
      <div className="tk-shell flex flex-wrap items-center gap-3">
        <Segment
          label="Kategorie"
          value={category}
          onChange={setCategory}
          options={SHOP_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))}
          className="max-w-full"
        />
        {reserved.length > 0 ? (
          <span className="ml-auto text-[0.86rem] text-[var(--tk-ink-dim)]">
            {reserved.length} Artikel zum Abholen vorgemerkt
          </span>
        ) : null}
      </div>

      <div className="tk-shell mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const inCart = cart.some((l) => l.title === item.name && l.type === 'shop');
          return (
            <Card key={item.id} className="flex flex-col overflow-hidden" as="article">
              <TkImage slot={item.imageSlot} ratio="4 / 3" rounded={false} sizes="(max-width: 768px) 92vw, 30vw" />
              <div className="flex flex-1 flex-col gap-2 p-5">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-[1rem] font-semibold">{item.name}</h2>
                  {item.badge ? <Chip tone="clay">{item.badge}</Chip> : null}
                </div>
                <p className="text-[0.9rem] text-[var(--tk-ink-soft)]">{item.teaser}</p>

                <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                  <div>
                    <span className="tk-num text-[1.1rem] font-semibold">{formatPrice(item.priceCents)}</span>
                    {item.compareCents ? (
                      <span className="tk-num ml-2 text-[0.85rem] text-[var(--tk-ink-faint)] line-through">
                        {formatPrice(item.compareCents)}
                      </span>
                    ) : null}
                    <span className="block text-[0.76rem] text-[var(--tk-ink-dim)]">
                      {item.inStock ? 'vorrätig · nur Abholung' : 'nachbestellt'}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    tone={item.inStock ? 'clay' : 'ghost'}
                    disabled={!item.inStock || inCart}
                    onClick={() =>
                      addLine({
                        type: 'shop',
                        title: item.name,
                        subtitle: 'Abholung an der Anlage',
                        priceCents: item.priceCents,
                      })
                    }
                  >
                    {!item.inStock ? 'Nicht da' : inCart ? 'Vorgemerkt' : 'Zurücklegen'}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
