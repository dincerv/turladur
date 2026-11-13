'use client';

import Image from 'next/image';

import { sanitizePlainText } from './tour-detail.helpers';

type TourDetailGalleryProps = {
  images: string[];
  title: string;
};

export function TourDetailGallery({ images, title }: TourDetailGalleryProps) {
  const safeTitle = sanitizePlainText(title) || 'Tur';

  if (images.length === 0) {
    return (
      <div
        className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-sm text-neutral-500"
        data-testid="media-empty-state"
      >
        Medya yüklenmemiş
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="tour-media-gallery">
      <div className="relative aspect-video overflow-hidden rounded-xl bg-neutral-100">
        <Image
          src={images[0]}
          alt={safeTitle}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 66vw"
          priority
        />
      </div>
      {images.length > 1 ? (
        <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory md:grid md:grid-cols-4 md:overflow-visible">
          {images.slice(1).map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="relative aspect-video w-40 shrink-0 snap-start overflow-hidden rounded-lg bg-neutral-100 md:w-auto"
            >
              <Image
                src={url}
                alt={`${safeTitle} ${index + 2}`}
                fill
                className="object-cover"
                sizes="160px"
              />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
