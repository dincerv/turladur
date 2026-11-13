'use client';

import { useState } from 'react';
import Image from 'next/image';

import { shouldUnoptimizeMedia } from '@/lib/media';

import type { AboutOfficeImage } from './about.types';

type AboutMediaProps = {
  image: AboutOfficeImage;
  sizes: string;
  className?: string;
  roundedClassName?: string;
};

/**
 * Fixed aspect via parent + fill Image → no CLS while the remote asset loads.
 * Broken URLs fall back to a neutral placeholder tile.
 */
export function AboutMedia({
  image,
  sizes,
  className,
  roundedClassName = 'rounded-2xl',
}: AboutMediaProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`relative h-full min-h-0 w-full overflow-hidden border border-neutral-200/70 bg-neutral-100 shadow-sm ${roundedClassName} ${image.cellClassName} ${className ?? ''}`}
    >
      {!failed ? (
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes={sizes}
          priority={image.priority === true}
          loading={image.priority ? 'eager' : 'lazy'}
          unoptimized={shouldUnoptimizeMedia(image.src)}
          onError={() => setFailed(true)}
          className="object-cover"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-neutral-400">
          Görsel yüklenemedi
        </span>
      )}
    </div>
  );
}
