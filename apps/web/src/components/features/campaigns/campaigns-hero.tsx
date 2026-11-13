import Image from 'next/image';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1600&auto=format&fit=crop';

export function CampaignsHero() {
  return (
    <header className="relative h-[320px] w-full overflow-hidden bg-neutral-900 md:h-[400px]">
      <Image
        src={HERO_IMAGE}
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
            Kampanyalar
          </h1>
          <p className="mx-auto max-w-prose text-lg font-light leading-relaxed text-neutral-200 drop-shadow md:text-xl">
            Şeffaf fiyatlar ve net koşullar. İndirim yalnızca gerçek
            karşılaştırma fiyatı varken gösterilir.
          </p>
        </div>
      </div>
    </header>
  );
}
