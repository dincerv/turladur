'use client';

import { useCallback, useState } from 'react';
import { ImagePlus, Trash2, Upload } from 'lucide-react';

import { getPresignedUpload } from '@/services/partner-admin';

type Props = {
  token: string;
  folder: string;
  /** Storage folder key — use agencyId before entity exists (CDN path only). */
  entityId: string;
  currentUrl?: string | null;
  onUploaded: (publicUrl: string) => void;
  onCleared?: () => void;
  label?: string;
  testId?: string;
};

export function ImageUploadField({
  token,
  folder,
  entityId,
  currentUrl,
  onUploaded,
  onCleared,
  label = 'Görsel',
  testId = 'experience-media-dropzone',
}: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    async (file: File | null) => {
      if (!file || !entityId) return;
      setPending(true);
      setError(null);
      try {
        const contentType = file.type as
          'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
        if (!contentType?.startsWith('image/')) {
          throw new Error('Sadece görsel yükleyin');
        }
        if (file.size > 8 * 1024 * 1024) {
          throw new Error('Görsel en fazla 8MB olabilir');
        }
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const presigned = await getPresignedUpload(
          {
            folder,
            entityId,
            filename: safeName,
            contentType,
          },
          token,
        );
        const uploadRes = await fetch(presigned.uploadUrl, {
          method: 'PUT',
          headers:
            presigned.uploadHeaders ??
            ({ 'Content-Type': contentType } satisfies Record<string, string>),
          body: file,
        });
        if (!uploadRes.ok) throw new Error('Yükleme başarısız');
        onUploaded(presigned.publicUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Yükleme hatası');
      } finally {
        setPending(false);
      }
    },
    [entityId, folder, onUploaded, token],
  );

  return (
    <div className="space-y-2" data-testid={testId}>
      <p className="text-sm font-medium text-neutral-800">{label}</p>
      <div
        role="button"
        tabIndex={0}
        aria-label="Görsel sürükle bırak veya seç"
        data-testid={`${testId}-area`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFile(e.dataTransfer.files?.[0] ?? null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            document.getElementById(`${testId}-file`)?.click();
          }
        }}
        className={`relative flex min-h-36 flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition ${
          dragOver
            ? 'border-neutral-900 bg-neutral-100'
            : 'border-neutral-300 bg-neutral-50'
        }`}
      >
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUrl}
            alt="Önizleme"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 py-6 text-center text-sm text-neutral-500">
            <Upload className="h-8 w-8 text-neutral-400" />
            <span>Sürükle-bırak veya dosya seç</span>
            <span className="text-xs">JPEG, PNG, WebP · max 8MB</span>
          </div>
        )}
        {currentUrl ? (
          <div className="absolute inset-0 flex items-end justify-end gap-2 bg-gradient-to-t from-black/50 to-transparent p-3">
            <button
              type="button"
              data-testid={`${testId}-replace`}
              disabled={pending}
              onClick={() => document.getElementById(`${testId}-file`)?.click()}
              className="inline-flex items-center gap-1 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-neutral-900"
            >
              <ImagePlus className="h-3.5 w-3.5" />
              Değiştir
            </button>
            {onCleared ? (
              <button
                type="button"
                data-testid={`${testId}-remove`}
                disabled={pending}
                onClick={onCleared}
                className="inline-flex items-center gap-1 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Sil
              </button>
            ) : null}
          </div>
        ) : null}
        <input
          id={`${testId}-file`}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={pending || !entityId}
          data-testid={`${testId}-input`}
          onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
          className="sr-only"
        />
        {!currentUrl ? (
          <button
            type="button"
            disabled={pending || !entityId}
            onClick={() => document.getElementById(`${testId}-file`)?.click()}
            className="absolute inset-0 cursor-pointer disabled:cursor-not-allowed"
            aria-hidden
            tabIndex={-1}
          />
        ) : null}
      </div>
      {!entityId ? (
        <p className="text-xs text-neutral-500">Oturum yükleniyor…</p>
      ) : null}
      {pending ? (
        <p
          className="text-xs text-neutral-500"
          data-testid={`${testId}-loading`}
        >
          CDN’e yükleniyor…
        </p>
      ) : null}
      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
