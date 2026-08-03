'use client';

import { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, RotateCcw } from 'lucide-react';
import { compressImageToBase64 } from '@/lib/media/compress-image';
import { Button } from '@/components/ui/button';

/**
 * Foto aufnehmen oder hochladen, mit Vorschau und „Neu aufnehmen“.
 * Bilder werden vor der Übergabe komprimiert und von EXIF-Daten befreit.
 */
export function PhotoPicker({
  onImage,
  label = 'Foto aufnehmen',
  busy = false,
}: {
  onImage: (img: { base64: string; mimeType: 'image/jpeg'; previewUrl: string }) => void;
  label?: string;
  busy?: boolean;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      const { base64, mimeType } = await compressImageToBase64(file);
      const previewUrl = `data:${mimeType};base64,${base64}`;
      setPreview(previewUrl);
      onImage({ base64, mimeType, previewUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bild konnte nicht verarbeitet werden.');
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {preview ? (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Aufgenommenes Foto (Vorschau)"
            className="max-h-72 w-full rounded-2xl object-cover"
          />
          <Button
            variant="outline"
            className="w-full"
            disabled={busy}
            onClick={() => cameraRef.current?.click()}
          >
            <RotateCcw size={16} aria-hidden /> Neu aufnehmen
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Button size="lg" disabled={busy} onClick={() => cameraRef.current?.click()}>
            <Camera size={18} aria-hidden /> {label}
          </Button>
          <Button size="lg" variant="outline" disabled={busy} onClick={() => galleryRef.current?.click()}>
            <ImageIcon size={18} aria-hidden /> Hochladen
          </Button>
        </div>
      )}
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}
