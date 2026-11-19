'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import { IMAGE_PLACEHOLDER } from '@/lib/image-placeholder';

type DestinationCardImageProps = {
  src: string;
  priority?: boolean;
  sizes: string;
  className?: string;
};

export function DestinationCardImage({
  src,
  priority = false,
  sizes,
  className,
}: DestinationCardImageProps) {
  const [imageSrc, setImageSrc] = useState(src || IMAGE_PLACEHOLDER);

  useEffect(() => {
    setImageSrc(src || IMAGE_PLACEHOLDER);
  }, [src]);

  return (
    <Image
      src={imageSrc}
      alt=""
      fill
      priority={priority}
      sizes={sizes}
      unoptimized={imageSrc.startsWith('data:')}
      className={className}
      onError={() => {
        if (imageSrc !== IMAGE_PLACEHOLDER) {
          setImageSrc(IMAGE_PLACEHOLDER);
        }
      }}
    />
  );
}
