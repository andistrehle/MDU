'use client';

// ============================================================
// Tennis Kail — Kontaktformular
// ============================================================
//
// Ehrlichkeit statt Bestätigungstheater: Das Formular tut nicht so, als
// würde es etwas verschicken. Es prüft die Eingaben, zeigt an, was
// übermittelt würde, und sagt klar, dass in der Demo nichts rausgeht.
// Genau dieses Bauteil bekäme in der Produktivversion eine Server Action
// mit E-Mail-Versand — die Prüfung bliebe unverändert.
// ============================================================

import { useState } from 'react';
import { BRAND } from '@/data/tk/facility';
import { Button, Card } from '@/components/tk/ui/primitives';

const TOPICS = [
  'Platz oder Abo',
  'Training und Kurse',
  'Probestunde für mein Kind',
  'Camp',
  'Turnier oder Event',
  'Pro-Shop und Bespannung',
  'Etwas anderes',
];

export function ContactForm({ initialTopic }: { initialTopic?: string }) {
  const [topic, setTopic] = useState(
    initialTopic && TOPICS.includes(initialTopic) ? initialTopic : TOPICS[0],
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(
    initialTopic && !TOPICS.includes(initialTopic) ? `Anfrage zu: ${initialTopic}\n\n` : '',
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  function validate() {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = 'Bitte einen Namen angeben.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) e.email = 'Bitte eine gültige E-Mail-Adresse angeben.';
    if (message.trim().length < 10) e.message = 'Ein Satz mehr hilft bei der Antwort.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  if (submitted) {
    return (
      <Card className="flex flex-col gap-4 p-6">
        <h2 className="tk-h3">Das wäre jetzt rausgegangen</h2>
        <dl className="flex flex-col gap-2 rounded-[12px] bg-[var(--tk-chalk)] p-4 text-[0.9rem]">
          {[
            ['Anliegen', topic],
            ['Name', name],
            ['E-Mail', email],
            ['Telefon', phone || '—'],
            ['Nachricht', message],
          ].map(([k, v]) => (
            <div key={k} className="grid grid-cols-[110px_1fr] gap-3">
              <dt className="text-[var(--tk-ink-dim)]">{k}</dt>
              <dd className="whitespace-pre-wrap">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="text-[0.9rem] text-[var(--tk-ink-soft)]">
          In dieser Demo wird nichts versendet und nichts gespeichert. Es gibt keinen Server, der
          die Nachricht entgegennimmt — das steht hier, statt eine Bestätigung vorzutäuschen.
          Wer jetzt wirklich etwas will, ruft an: {BRAND.phone}.
        </p>
        <Button tone="ghost" onClick={() => setSubmitted(false)}>
          Zurück zum Formular
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (validate()) setSubmitted(true);
        }}
        className="flex flex-col gap-4"
      >
        <div className="tk-field">
          <label className="tk-label" htmlFor="c-topic">
            Worum geht es?
          </label>
          <select id="c-topic" className="tk-select" value={topic} onChange={(e) => setTopic(e.target.value)}>
            {TOPICS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="tk-field">
            <label className="tk-label" htmlFor="c-name">
              Name
            </label>
            <input
              id="c-name"
              className="tk-input"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'c-name-err' : undefined}
            />
            {errors.name ? (
              <span id="c-name-err" role="alert" className="text-[0.8rem] text-[var(--tk-blocked)]">
                {errors.name}
              </span>
            ) : null}
          </div>

          <div className="tk-field">
            <label className="tk-label" htmlFor="c-phone">
              Telefon <span className="font-normal text-[var(--tk-ink-dim)]">(freiwillig)</span>
            </label>
            <input
              id="c-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className="tk-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="tk-field">
          <label className="tk-label" htmlFor="c-mail">
            E-Mail
          </label>
          <input
            id="c-mail"
            type="email"
            inputMode="email"
            autoComplete="email"
            className="tk-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'c-mail-err' : undefined}
          />
          {errors.email ? (
            <span id="c-mail-err" role="alert" className="text-[0.8rem] text-[var(--tk-blocked)]">
              {errors.email}
            </span>
          ) : null}
        </div>

        <div className="tk-field">
          <label className="tk-label" htmlFor="c-msg">
            Nachricht
          </label>
          <textarea
            id="c-msg"
            className="tk-textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? 'c-msg-err' : undefined}
          />
          {errors.message ? (
            <span id="c-msg-err" role="alert" className="text-[0.8rem] text-[var(--tk-blocked)]">
              {errors.message}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" size="lg">
            Nachricht prüfen
          </Button>
          <span className="text-[0.84rem] text-[var(--tk-ink-dim)]">
            Demo — es wird nichts versendet.
          </span>
        </div>
      </form>
    </Card>
  );
}
