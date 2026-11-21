import Link from 'next/link';
import { ChevronRight, MapPin } from 'lucide-react';

import { DestinationCardImage } from '@/components/features/home/destination-card-image';
import { listRoutes } from '@/services/route';

/** Ankara çıkışlı faz-1 vitrin kümeleri (API route id sırası). */
const HOMEPAGE_ROUTE_IDS = [
  'kapadokya',
  'amasra-safranbolu',
  'gap-mezopotamya',
  'abant-yedigoller',
] as const;

const CLUSTER_FALLBACK: Record<string, string> = {
  kapadokya: 'Hafta Sonu Kaçamağı',
  'amasra-safranbolu': 'Batı Karadeniz',
  'gap-mezopotamya': 'Kültür Rotaları',
  'abant-yedigoller': 'Doğa & Günübirlik',
};

export async function Destinations() {
  let featuredRoutes: Awaited<ReturnType<typeof listRoutes>>['routes'] = [];

  try {
    const result = await listRoutes({ fresh: true });
    const byId = new Map(
      (result.routes ?? []).map((route) => [route.id, route]),
    );
    featuredRoutes = HOMEPAGE_ROUTE_IDS.map((id) => byId.get(id)).filter(
      (route): route is NonNullable<typeof route> => Boolean(route),
    );

    // API henüz yeni rotaları dönmüyorsa: anahtar kelimeye göre yedek seç.
    if (featuredRoutes.length < HOMEPAGE_ROUTE_IDS.length) {
      const sorted = [...(result.routes ?? [])].sort(
        (a, b) => b.tourCount - a.tourCount,
      );
      for (const id of HOMEPAGE_ROUTE_IDS) {
        if (featuredRoutes.some((r) => r.id === id)) continue;
        const hit = sorted.find((r) => r.id === id);
        if (hit) featuredRoutes.push(hit);
      }
    }
  } catch {
    return null;
  }

  if (featuredRoutes.length === 0) {
    return null;
  }

  return (
    <section
      data-testid="home-destinations"
      className="scroll-mt-24 border-t border-neutral-200/60 bg-neutral-50 py-12 md:py-16"
    >
      <div className="container mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center justify-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-800">
            Ankara Çıkışlı
          </div>
          <h2 className="mb-4 text-3xl font-bold text-neutral-900 md:text-4xl">
            Popüler Rotalar
          </h2>
          <p className="text-lg text-neutral-600">
            Ankara&apos;dan kalkan gezginler için en çok tercih edilen dört rota
            kümesini keşfedin.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {featuredRoutes.map((route, index) => {
            const cluster =
              route.clusterLabel ??
              CLUSTER_FALLBACK[route.id] ??
              route.location;
            return (
              <Link
                key={route.id}
                href={`/routes/${route.id}`}
                data-testid="home-route-card"
                className="group block overflow-hidden rounded-xl border border-neutral-200/80 bg-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-neutral-200">
                  <DestinationCardImage
                    src={route.image}
                    priority={index < 2}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute right-3 top-3 flex max-w-[75%] items-center rounded-md bg-white/80 px-2 py-0.5 text-xs font-medium text-neutral-700 shadow-sm backdrop-blur-sm">
                    <MapPin className="mr-1 h-3 w-3 shrink-0 text-neutral-500" />
                    <span data-testid="home-route-location">{cluster}</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3
                    data-testid="home-route-name"
                    className="mb-1.5 text-base font-semibold break-words text-neutral-800 transition-colors duration-200"
                    title={route.name}
                  >
                    {route.name}
                  </h3>
                  <p className="mb-3 line-clamp-3 min-h-8 text-xs leading-relaxed break-words text-neutral-600">
                    {route.description}
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-3 text-xs text-neutral-500">
                    <span>{route.tourCount} Tur Seçeneği</span>
                    <span className="flex items-center font-medium text-neutral-950 transition-transform duration-200 group-hover:translate-x-0.5">
                      Keşfet
                      <ChevronRight className="ml-0.5 h-4 w-4" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-16 text-center md:mt-20">
          <Link
            href="/routes"
            className="inline-flex items-center justify-center rounded-lg border border-neutral-300 bg-white px-7 py-3 text-sm font-medium text-neutral-800 shadow-sm transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:ring-offset-2"
          >
            Tüm Rotaları Gör
            <ChevronRight className="ml-1.5 h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Destinations;
