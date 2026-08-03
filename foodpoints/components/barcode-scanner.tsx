'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Barcode-Scanner über die Gerätekamera (ZXing: EAN-8/13, UPC-A/E u. a.).
 * Fallback bei fehlender Kamera/Berechtigung: manuelle Eingabe.
 */
export function BarcodeScanner({ onDetected }: { onDetected: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<'starting' | 'scanning' | 'denied' | 'unsupported'>('starting');
  const [manualCode, setManualCode] = useState('');
  const detectedRef = useRef(false);

  useEffect(() => {
    let stopped = false;
    let controls: { stop: () => void } | null = null;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setState('unsupported');
        return;
      }
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const reader = new BrowserMultiFormatReader();
        if (stopped || !videoRef.current) return;
        controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
          if (result && !detectedRef.current) {
            const text = result.getText();
            if (/^\d{6,14}$/.test(text)) {
              detectedRef.current = true;
              controls?.stop();
              onDetected(text);
            }
          }
        });
        if (!stopped) setState('scanning');
      } catch (err) {
        console.error('camera failed:', err);
        if (!stopped) setState('denied');
      }
    }

    void start();
    return () => {
      stopped = true;
      controls?.stop();
    };
  }, [onDetected]);

  return (
    <div className="space-y-3">
      {(state === 'starting' || state === 'scanning') && (
        <div className="relative overflow-hidden rounded-2xl bg-black">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video ref={videoRef} className="aspect-[3/4] w-full object-cover" playsInline muted />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-24 w-64 max-w-[80%] rounded-xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>
          {state === 'starting' && (
            <p className="absolute inset-x-0 bottom-3 text-center text-sm font-semibold text-white">
              Kamera wird gestartet …
            </p>
          )}
        </div>
      )}

      {state === 'denied' && (
        <p className="rounded-xl bg-accent-soft px-3 py-2 text-sm text-body">
          Kein Kamerazugriff. Bitte erlaube die Kamera in den Browser-Einstellungen —
          oder gib den Barcode unten manuell ein.
        </p>
      )}
      {state === 'unsupported' && (
        <p className="rounded-xl bg-accent-soft px-3 py-2 text-sm text-body">
          Dein Browser unterstützt keinen Kamerazugriff. Du kannst den Barcode manuell eingeben.
        </p>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (/^\d{6,14}$/.test(manualCode)) onDetected(manualCode);
        }}
      >
        <Input
          inputMode="numeric"
          pattern="\d*"
          placeholder="Barcode manuell eingeben"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ''))}
          aria-label="Barcode manuell eingeben"
        />
        <Button type="submit" variant="secondary" disabled={!/^\d{6,14}$/.test(manualCode)}>
          Suchen
        </Button>
      </form>
    </div>
  );
}
