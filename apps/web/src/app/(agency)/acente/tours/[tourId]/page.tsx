'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Users,
  Banknote,
  Tag,
  Building2,
  Truck,
  Globe2,
  Star,
  UserRound,
  Languages,
  Hash,
} from 'lucide-react';
import { tourCategoryLabel } from '@turta/shared-constants';

import { useAuth } from '@/providers/auth-provider';
import { getPartnerTourById } from '@/services/partner-admin';
import { getTourDates } from '@/services/catalog';
import { TourDateGuideAssignmentPanel } from '@/components/features/partner-dashboard/tour-date-guide-assignment-panel';
import { TourDateBusAssignmentPanel } from '@/components/features/partner-dashboard/tour-date-bus-assignment-panel';

type TourExtras = {
  includes?: string[];
  excludes?: string[];
  healthPrivileges?: string[];
  itinerary?: { title: string; description: string }[];
  destinations?: string[];
  languages?: string[];
  tags?: string[];
  region?: string;
  transportation?: string;
  tourType?: string;
  accommodationType?: string;
  maxParticipants?: number;
  departureCity?: string | string[];
  ageRestriction?: number;
  discount?: number;
  isPopular?: boolean;
  isLastMinute?: boolean;
  isEarlyBird?: boolean;
  startDate?: string;
  endDate?: string;
};

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function departureLabel(value: unknown): string {
  if (Array.isArray(value)) {
    return (
      value.filter((v): v is string => typeof v === 'string').join(', ') || '-'
    );
  }
  if (typeof value === 'string' && value.trim()) return value;
  return '-';
}

export default function PartnerTourDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tourId = params.tourId as string;
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tour, setTour] = useState<Awaited<
    ReturnType<typeof getPartnerTourById>
  > | null>(null);
  const [tourDates, setTourDates] = useState<
    Awaited<ReturnType<typeof getTourDates>>
  >([]);

  useEffect(() => {
    if (!accessToken || !tourId) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [data, dates] = await Promise.all([
          getPartnerTourById(tourId, accessToken),
          getTourDates(tourId),
        ]);
        setTour(data);
        setTourDates(dates);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Tur yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [accessToken, tourId]);

  const extras = useMemo<TourExtras>(() => {
    if (!tour?.extras || typeof tour.extras !== 'object') return {};
    return tour.extras as TourExtras;
  }, [tour]);

  const images = useMemo(() => {
    if (!tour) return [] as string[];
    const gallery = Array.isArray(tour.galleryUrls) ? tour.galleryUrls : [];
    if (tour.coverUrl)
      return [tour.coverUrl, ...gallery.filter((u) => u !== tour.coverUrl)];
    return gallery;
  }, [tour]);

  const itinerary = Array.isArray(extras.itinerary) ? extras.itinerary : [];
  const inclusions = asStringList(extras.includes);
  const exclusions = asStringList(extras.excludes);
  const healthPrivileges = asStringList(extras.healthPrivileges);
  const languages = asStringList(extras.languages);
  const tags = asStringList(extras.tags);
  const price = tour ? Number(tour.price) : 0;
  const discount = Number(extras.discount ?? 0);
  const statusLabel =
    tour?.status === 'PUBLISHED' || tour?.status === 'ACTIVE'
      ? 'Aktif'
      : 'Taslak';

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-sky-600" />
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-semibold text-gray-900">Hata</h2>
          <p className="text-gray-600">{error || 'Tur bulunamadı'}</p>
          <button
            type="button"
            onClick={() => router.push('/acente/tours')}
            className="mt-4 inline-flex items-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  const partner = (
    tour as typeof tour & {
      partner?: { companyName?: string; logo?: string | null };
    }
  ).partner;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tour.title}</h1>
          <p className="text-gray-600">Tur detayları</p>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href={`/acente/tours/${tour.id}/edit`}
            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Düzenle
          </Link>
          <Link
            href="/acente/tours"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Geri
          </Link>
        </div>
      </div>

      <TourDateGuideAssignmentPanel
        tourDates={tourDates.map((date) => ({
          id: date.id,
          startDate: date.startDate,
          endDate: date.endDate,
        }))}
      />

      <TourDateBusAssignmentPanel
        tourId={tourId}
        tourDates={tourDates.map((date) => ({
          id: date.id,
          startDate: date.startDate,
          endDate: date.endDate,
        }))}
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-8">
            <div className="relative h-96 overflow-hidden rounded-lg">
              {images.length > 0 ? (
                <Image
                  src={images[0]}
                  alt={tour.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-200">
                  <span className="text-gray-400">Görsel yok</span>
                </div>
              )}
            </div>
          </div>

          <div className="mb-8 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Tur Detayları
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex items-start">
                <Calendar className="mr-3 h-6 w-6 text-gray-400" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Tarih</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {extras.startDate
                      ? new Date(extras.startDate).toLocaleDateString('tr-TR')
                      : '-'}{' '}
                    -{' '}
                    {extras.endDate
                      ? new Date(extras.endDate).toLocaleDateString('tr-TR')
                      : '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <MapPin className="mr-3 h-6 w-6 text-gray-400" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Kalkış Şehri
                  </h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {departureLabel(extras.departureCity)}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Clock className="mr-3 h-6 w-6 text-gray-400" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Süre</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {tour.durationDays} gün
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Users className="mr-3 h-6 w-6 text-gray-400" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Maksimum Katılımcı
                  </h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {extras.maxParticipants
                      ? `${extras.maxParticipants} kişi`
                      : '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Banknote className="mr-3 h-6 w-6 text-gray-400" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Fiyat</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {discount > 0 ? (
                      <>
                        <span className="mr-2 text-gray-500 line-through">
                          {price.toLocaleString('tr-TR')} {tour.currency}
                        </span>
                        <span className="text-red-600">
                          {Math.round(
                            price * (1 - discount / 100),
                          ).toLocaleString('tr-TR')}{' '}
                          {tour.currency}
                        </span>
                      </>
                    ) : (
                      `${price.toLocaleString('tr-TR')} ${tour.currency}`
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Tag className="mr-3 h-6 w-6 text-gray-400" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Tur Tipi
                  </h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {extras.tourType || tour.category || '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Building2 className="mr-3 h-6 w-6 text-gray-400" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Konaklama Tipi
                  </h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {extras.accommodationType || '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Truck className="mr-3 h-6 w-6 text-gray-400" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Ulaşım</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {extras.transportation || '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Globe2 className="mr-3 h-6 w-6 text-gray-400" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Bölge</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {extras.region || '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Star className="mr-3 h-6 w-6 text-gray-400" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Kategori
                  </h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {tourCategoryLabel(tour.category) || '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <UserRound className="mr-3 h-6 w-6 text-gray-400" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Yaş Sınırı
                  </h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {extras.ageRestriction ? `${extras.ageRestriction}+` : '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Languages className="mr-3 h-6 w-6 text-gray-400" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Diller</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {languages.length > 0 ? languages.join(', ') : '-'}
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Hash className="mr-3 h-6 w-6 text-gray-400" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Etiketler
                  </h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {tags.length > 0 ? tags.join(', ') : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Tur Açıklaması
            </h2>
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap text-gray-600">
                {tour.description}
              </p>
            </div>
          </div>

          {itinerary.length > 0 ? (
            <div className="mb-8 rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Tur Programı
              </h2>
              <div className="space-y-6">
                {itinerary.map((day, index) => (
                  <div
                    key={`${day.title}-${index}`}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <h3 className="mb-2 text-lg font-medium text-gray-900">
                      {day.title}
                    </h3>
                    <p className="text-gray-600">{day.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {(inclusions.length > 0 || exclusions.length > 0) && (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-xl font-semibold text-gray-900">
                  Dahil Olanlar
                </h2>
                <ul className="space-y-2">
                  {inclusions.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex items-start">
                      <span className="mr-2 h-6 w-6 text-green-500">✓</span>
                      <span className="text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-xl font-semibold text-gray-900">
                  Dahil Olmayanlar
                </h2>
                <ul className="space-y-2">
                  {exclusions.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex items-start">
                      <span className="mr-2 h-6 w-6 text-red-500">×</span>
                      <span className="text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {healthPrivileges.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                Sağlık Ayrıcalıkları
              </h2>
              <ul className="space-y-2">
                {healthPrivileges.map((item, index) => (
                  <li key={`${item}-${index}`} className="flex items-start">
                    <span className="mr-2 h-6 w-6 text-sky-500">♥</span>
                    <span className="text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-6">
            {partner?.companyName ? (
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Tur Operatörü
                </h2>
                <div className="flex items-center">
                  {partner.logo ? (
                    <Image
                      src={partner.logo}
                      alt={partner.companyName}
                      width={48}
                      height={48}
                      className="rounded-lg"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200">
                      <span className="text-lg font-medium text-gray-400">
                        {partner.companyName.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-900">
                      {partner.companyName}
                    </h3>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Tur Durumu
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Durum</span>
                  <span
                    className={`inline-flex rounded-full px-2 text-xs leading-5 font-semibold ${
                      statusLabel === 'Aktif'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {statusLabel}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Popüler</span>
                  <span
                    className={`inline-flex rounded-full px-2 text-xs leading-5 font-semibold ${
                      extras.isPopular
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {extras.isPopular ? 'Evet' : 'Hayır'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Son Dakika</span>
                  <span
                    className={`inline-flex rounded-full px-2 text-xs leading-5 font-semibold ${
                      extras.isLastMinute
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {extras.isLastMinute ? 'Evet' : 'Hayır'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Erken Rezervasyon
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2 text-xs leading-5 font-semibold ${
                      extras.isEarlyBird
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {extras.isEarlyBird ? 'Evet' : 'Hayır'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
