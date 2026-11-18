/**
 * Client-side crop + resize before tour image upload.
 * Interactive crop pixels come from ImageCropDialog; otherwise center-crop.
 */

export type PixelCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type PrepareTourImageOptions = {
  /** width / height — cover uses 16/9 */
  aspectRatio?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputType?: 'image/jpeg' | 'image/webp';
  /** When set, use this crop instead of center-crop */
  pixelCrop?: PixelCrop;
};

const COVER_DEFAULTS: Required<Omit<PrepareTourImageOptions, 'pixelCrop'>> & {
  pixelCrop?: PixelCrop;
} = {
  aspectRatio: 16 / 9,
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.82,
  outputType: 'image/webp',
};

const GALLERY_DEFAULTS: Required<Omit<PrepareTourImageOptions, 'pixelCrop'>> & {
  pixelCrop?: PixelCrop;
} = {
  aspectRatio: 16 / 10,
  maxWidth: 1600,
  maxHeight: 1000,
  quality: 0.8,
  outputType: 'image/webp',
};

export const TOUR_COVER_IMAGE_OPTIONS = COVER_DEFAULTS;
export const TOUR_GALLERY_IMAGE_OPTIONS = GALLERY_DEFAULTS;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Görsel okunamadı'));
    };
    image.src = url;
  });
}

function extensionForMime(mime: string): string {
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/png') return 'png';
  return 'jpg';
}

function centerCropRect(
  srcW: number,
  srcH: number,
  targetAspect: number,
): PixelCrop {
  let cropW = srcW;
  let cropH = srcH;
  let cropX = 0;
  let cropY = 0;
  const srcAspect = srcW / srcH;
  if (srcAspect > targetAspect) {
    cropW = Math.round(srcH * targetAspect);
    cropX = Math.round((srcW - cropW) / 2);
  } else if (srcAspect < targetAspect) {
    cropH = Math.round(srcW / targetAspect);
    cropY = Math.round((srcH - cropH) / 2);
  }
  return { x: cropX, y: cropY, width: cropW, height: cropH };
}

/**
 * Crop to aspect ratio (or explicit pixels), downscale, encode as WebP/JPEG.
 */
export async function prepareTourImageFile(
  file: File,
  options: PrepareTourImageOptions = COVER_DEFAULTS,
): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  const opts = { ...COVER_DEFAULTS, ...options };
  const image = await loadImage(file);
  const srcW = image.naturalWidth || image.width;
  const srcH = image.naturalHeight || image.height;
  if (!srcW || !srcH) return file;

  const crop =
    opts.pixelCrop && opts.pixelCrop.width > 0 && opts.pixelCrop.height > 0
      ? opts.pixelCrop
      : centerCropRect(srcW, srcH, opts.aspectRatio);

  let outW = Math.round(crop.width);
  let outH = Math.round(crop.height);
  if (outW > opts.maxWidth) {
    outW = opts.maxWidth;
    outH = Math.round(outW / (crop.width / crop.height));
  }
  if (outH > opts.maxHeight) {
    outH = opts.maxHeight;
    outW = Math.round(outH * (crop.width / crop.height));
  }
  outW = Math.max(1, outW);
  outH = Math.max(1, outH);

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outW,
    outH,
  );

  let blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), opts.outputType, opts.quality);
  });
  // Safari may fail WebP encode — fall back to JPEG.
  if (!blob && opts.outputType === 'image/webp') {
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), 'image/jpeg', opts.quality);
    });
  }
  if (!blob) return file;

  const mime = blob.type || opts.outputType;
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'tour-image';
  const nextName = `${baseName}.${extensionForMime(mime)}`;
  return new File([blob], nextName, {
    type: mime,
    lastModified: Date.now(),
  });
}
