import Image from 'next/image';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1600&auto=format&fit=crop';

export function CampaignsHero() {
  return (
    <section className="relative overflow-hidden border-b border-sky-900/10 bg-slate-900 pt-28 pb-12 md:pb-16">
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_35%]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-sky-950/80 via-teal-900/55 to-slate-900/75"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-sky-950/30"
      />

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 xl:px-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-sky-50 shadow-sm backdrop-blur-md">
            <span className="mr-2 h-2 w-2 rounded-full bg-teal-300" />
            Güncel fırsatlar
          </div>
          <h1 className="mb-3 text-3xl leading-tight font-bold tracking-tight text-white md:text-5xl">
            Kampanyaları <span className="text-teal-200">keşfet</span>
          </h1>
          <p className="text-base text-sky-50/85 md:px-6 md:text-lg">
            Şeffaf fiyatlar ve net koşullar. İndirim yalnızca gerçek
            karşılaştırma fiyatı varken gösterilir.
          </p>
        </div>
      </div>
    </section>
  );
}
