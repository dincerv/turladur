import Image from 'next/image';

import { BLOG_BANNER_IMAGE } from './blog.helpers';

export function BlogHero() {
  return (
    <header className="relative h-[320px] w-full overflow-hidden bg-neutral-900 md:h-[400px]">
      <Image
        src={BLOG_BANNER_IMAGE}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center opacity-30"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-5 text-center text-white sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-balance text-white drop-shadow-lg md:text-5xl">
            Blog
          </h1>
          <p className="mx-auto max-w-prose text-lg font-light leading-relaxed text-neutral-200 drop-shadow md:text-xl">
            Popüler yurtiçi ve yurtdışı rotalar, gastronomi ve seyahat ipuçları
            — tur planlamadan önce okuyun.
          </p>
        </div>
      </div>
    </header>
  );
}
