'use client';

import { useCallback, useEffect, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  prepareTourImageFile,
  type PixelCrop,
  type PrepareTourImageOptions,
} from '@/lib/prepare-tour-image';

type ImageCropDialogProps = {
  open: boolean;
  file: File | null;
  aspect: number;
  title?: string;
  prepareOptions?: PrepareTourImageOptions;
  onCancel: () => void;
  onConfirm: (prepared: File) => void;
};

export function ImageCropDialog({
  open,
  file,
  aspect,
  title = 'Görseli kırp',
  prepareOptions,
  onCancel,
  onConfirm,
}: ImageCropDialogProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setSrc(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setSrc(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setError(null);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!file || !croppedAreaPixels) return;
    setBusy(true);
    setError(null);
    try {
      const pixelCrop: PixelCrop = {
        x: Math.round(croppedAreaPixels.x),
        y: Math.round(croppedAreaPixels.y),
        width: Math.round(croppedAreaPixels.width),
        height: Math.round(croppedAreaPixels.height),
      };
      const prepared = await prepareTourImageFile(file, {
        aspectRatio: aspect,
        ...prepareOptions,
        pixelCrop,
      });
      onConfirm(prepared);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kırpma başarısız');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !busy) onCancel();
      }}
    >
      <DialogContent
        className="sm:max-w-lg"
        data-testid="image-crop-dialog"
        showCloseButton={!busy}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Oranı koruyarak kırpın. Mobilde iki parmakla yakınlaştırabilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-64 w-full overflow-hidden rounded-lg bg-neutral-900 sm:h-80">
          {src ? (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              objectFit="contain"
            />
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="crop-zoom"
            className="text-xs font-medium text-neutral-600"
          >
            Yakınlaştır
          </label>
          <input
            id="crop-zoom"
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
            data-testid="image-crop-zoom"
          />
        </div>

        {error ? (
          <p className="text-sm text-red-600" data-testid="image-crop-error">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onCancel}
          >
            İptal
          </Button>
          <Button
            type="button"
            disabled={busy || !croppedAreaPixels}
            onClick={() => void handleConfirm()}
            data-testid="image-crop-confirm"
          >
            {busy ? 'Hazırlanıyor…' : 'Kırp ve kullan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
