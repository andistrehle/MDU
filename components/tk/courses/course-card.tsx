'use client';

// ============================================================
// Tennis Kail — Kurskarte
// ============================================================
//
// Ein Baustein für Kids-Kurse, Camps, Erwachsenenkurse und Events. Die
// Belegung steht immer sichtbar: freie Plätze in Grün, ausgebucht mit
// Warteliste statt einer toten Schaltfläche. Nichts ist ärgerlicher, als
// einen Kurs erst im letzten Schritt als voll zu erkennen.
// ============================================================

import { useState } from 'react';
import type { Course } from '@/lib/tk/types';
import { getCoach } from '@/data/tk/coaches';
import { getLocation } from '@/data/tk/facility';
import { seatsLeft } from '@/data/tk/courses';
import { formatPrice, formatRange } from '@/lib/tk/format';
import { useTkStore } from '@/lib/tk/store';
import { Button, Card, Chip, Meter } from '@/components/tk/ui/primitives';
import { TkImage } from '@/components/tk/media/tk-image';

export function CourseCard({ course, dense }: { course: Course; dense?: boolean }) {
  const { addLine, cart } = useTkStore();
  const [waitlisted, setWaitlisted] = useState(false);
  const left = seatsLeft(course);
  const full = left === 0;
  const loc = getLocation(course.locationId);
  const inCart = cart.some((l) => l.courseId === course.id);

  return (
    <Card className="flex h-full flex-col overflow-hidden" as="article">
      <TkImage
        slot={course.imageSlot}
        ratio={dense ? '16 / 9' : '4 / 3'}
        rounded={false}
        sizes="(max-width: 768px) 92vw, 33vw"
      />

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="clay">{formatRange(course.startDate, course.endDate)}</Chip>
          {course.ageFrom ? (
            <Chip tone="outline">
              {course.ageTo ? `${course.ageFrom}–${course.ageTo} Jahre` : `ab ${course.ageFrom} Jahren`}
            </Chip>
          ) : null}
          {course.level !== 'alle' ? (
            <Chip tone="outline">{course.level === 'einsteiger' ? 'Einsteiger' : 'Fortgeschritten'}</Chip>
          ) : null}
        </div>

        <div>
          <h3 className="tk-h3">{course.title}</h3>
          <p className="mt-1 text-[0.86rem] text-[var(--tk-ink-dim)]">
            {course.schedule} · {loc?.shortName}
          </p>
        </div>

        <p className="text-[0.92rem] text-[var(--tk-ink-soft)]">
          {dense ? course.teaser : course.description}
        </p>

        {!dense && course.highlights.length > 0 ? (
          <ul className="flex flex-col gap-1 text-[0.86rem] text-[var(--tk-ink-soft)]">
            {course.highlights.map((h) => (
              <li key={h} className="flex gap-2">
                <span aria-hidden className="text-[var(--tk-clay)]">
                  ·
                </span>
                {h}
              </li>
            ))}
          </ul>
        ) : null}

        <p className="text-[0.84rem] text-[var(--tk-ink-dim)]">
          Mit{' '}
          {course.coachIds
            .map((id) => getCoach(id)?.name)
            .filter(Boolean)
            .join(' und ')}
        </p>

        <div className="mt-auto flex flex-col gap-2 pt-3">
          <div className="flex items-center justify-between gap-3 text-[0.84rem]">
            <span className={full ? 'text-[var(--tk-ink-dim)]' : 'font-semibold text-[var(--tk-free)]'}>
              {full ? 'Ausgebucht' : `${left} von ${course.seats} Plätzen frei`}
            </span>
            <span className="tk-num text-[1.05rem] font-semibold">{formatPrice(course.priceCents)}</span>
          </div>
          <Meter
            value={(course.seatsTaken / course.seats) * 100}
            tone={full ? 'var(--tk-busy)' : undefined}
          />

          {full ? (
            <Button
              tone="ghost"
              block
              onClick={() => setWaitlisted(true)}
              disabled={waitlisted}
            >
              {waitlisted ? 'Auf der Warteliste vorgemerkt' : 'Auf die Warteliste'}
            </Button>
          ) : (
            <Button
              block
              disabled={inCart}
              onClick={() =>
                addLine({
                  type: 'kurs',
                  title: course.title,
                  subtitle: `${formatRange(course.startDate, course.endDate)} · ${course.schedule}`,
                  priceCents: course.priceCents,
                  date: course.startDate,
                  courseId: course.id,
                })
              }
            >
              {inCart ? 'In der Auswahl' : 'Platz sichern'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
