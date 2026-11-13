import Image from 'next/image';

import { shouldUnoptimizeMedia } from '@/lib/media';

import { toCoverImageUrl } from './blog.helpers';

type BlogPostCoverProps = {
  src: string | null | undefined;
  alt: string;
};

export function BlogPostCover({ src, alt }: BlogPostCoverProps) {
  const cover = toCoverImageUrl(src);
  if (!cover) return null;

  return (
    <figure className="mt-8 max-w-3xl">
      <div className="relative aspect-[21/9] max-h-[320px] overflow-hidden rounded-2xl bg-neutral-100 sm:max-h-[360px]">
        <Image
          src={cover}
          alt={alt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 768px"
          unoptimized={shouldUnoptimizeMedia(cover)}
          className="object-cover"
        />
      </div>
    </figure>
  );
}
