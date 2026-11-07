import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, MapPin } from 'lucide-react';

import { listRoutes } from '@/services/route';

const HOMEPAGE_ROUTE_LIMIT = 4;

const LG_COLUMNS: Record<number, string> = {
  1: 'max-w-sm lg:grid-cols-1',
  2: 'max-w-3xl lg:grid-cols-2',
  3: 'lg:grid-cols-3',
};

export async function Destinations() {
  let featuredRoutes: Awaited<ReturnType<typeof listRoutes>>['routes'] = [];

  try {
    const result = await listRoutes();
    const sortedByReviews = [...(result.routes ?? [])].sort((a, b) => {
      const aReviews = a.reviewCount ?? 0;
      const bReviews = b.reviewCount ?? 0;
      if (bReviews !== aReviews) return bReviews - aReviews;
      if (b.tourCount !== a.tourCount) return b.tourCount - a.tourCount;
      return (b.avgRating ?? 0) - (a.avgRating ?? 0);
    });
    featuredRoutes = sortedByReviews
      .filter((route) => route.tourCount > 0)
      .slice(0, HOMEPAGE_ROUTE_LIMIT);
  } catch {
    return null;
  }

  if (featuredRoutes.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-neutral-200/60 bg-neutral-50 py-12 md:py-16">
      <div className="container mx-auto max-w-7xl px-6">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center justify-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-800">
            Rotalar
          </div>
          <h2 className="mb-4 text-3xl font-bold text-neutral-900 md:text-4xl">
            Popüler Rotalar
          </h2>
          <p className="text-lg text-neutral-600">
            Türkiye&apos;nin en çok tercih edilen seyahat rotalarını keşfedin.
            Unutulmaz anılar bir tık uzağınızda.
          </p>
        </div>

        <div
          className={`mx-auto grid grid-cols-1 gap-6 sm:grid-cols-2 md:gap-8 ${LG_COLUMNS[featuredRoutes.length] ?? 'lg:grid-cols-4'}`}
        >
          {featuredRoutes.map((route, index) => (
            <Link
              key={route.id}
              href={`/routes/${route.id}`}
              className="group block overflow-hidden rounded-xl border border-neutral-200/80 bg-white transition-all duration-300 ease-out hover:shadow-lg"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={route.image}
                  alt={route.name}
                  fill
                  priority={index < 4}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute right-3 top-3 flex items-center rounded-md bg-white/80 px-2 py-0.5 text-xs font-medium text-neutral-700 shadow-sm backdrop-blur-sm">
                  <MapPin className="mr-1 h-3 w-3 text-neutral-500" />
                  {route.location}
                </div>
              </div>
              <div className="p-5">
                <h3
                  className="mb-1.5 line-clamp-1 text-base font-semibold text-neutral-800 transition-colors duration-200"
                  title={route.name}
                >
                  {route.name}
                </h3>
                <p className="mb-3 line-clamp-2 h-8 text-xs leading-relaxed text-neutral-600">
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
          ))}
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
