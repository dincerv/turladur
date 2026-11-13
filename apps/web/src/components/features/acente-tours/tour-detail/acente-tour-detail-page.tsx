'use client';

import { useEffect, useMemo, useState, type ComponentType } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Banknote,
  Building2,
  Calendar,
  Clock,
  Globe2,
  Languages,
  MapPin,
  Tag,
  Truck,
  UserRound,
  Users,
} from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TourDateBusAssignmentPanel } from '@/components/features/partner-dashboard/tour-date-bus-assignment-panel';
import { TourDateGuideAssignmentPanel } from '@/components/features/partner-dashboard/tour-date-guide-assignment-panel';
import { ACENTE_ROUTES } from '@/lib/panel-routes';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';
import {
  getPartnerTourById,
  listPartnerTourDates,
  type PartnerTourDateRow,
  type PartnerTourDetail,
} from '@/services/partner-admin';

import { TourDetailDatesTab } from './tour-detail-dates-tab';
import { TourDetailGallery } from './tour-detail-gallery';
import {
  asStringList,
  departureLabel,
  formatMoney,
  parseExtras,
  sanitizePlainText,
  statusLabel,
} from './tour-detail.helpers';
import type { TourDetailTab } from './tour-detail.types';

type AcenteTourDetailPageProps = {
  tourId: string;
};

export function AcenteTourDetailPage({ tourId }: AcenteTourDetailPageProps) {
  const router = useRouter();
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [tour, setTour] = useState<PartnerTourDetail | null>(null);
  const [dates, setDates] = useState<PartnerTourDateRow[]>([]);
  const [tab, setTab] = useState<TourDetailTab>('overview');
  const [datesLoaded, setDatesLoaded] = useState(false);

  useEffect(() => {
    if (!accessToken || !tourId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      setForbidden(false);
      try {
        const data = await getPartnerTourById(tourId, accessToken);
        if (cancelled) return;
        setTour(data);
      } catch (err) {
        if (cancelled) return;
        if (
          err instanceof ApiError &&
          (err.status === 404 || err.status === 403)
        ) {
          setForbidden(true);
          setError(null);
        } else {
          setError(err instanceof Error ? err.message : 'Tur yüklenemedi');
        }
        setTour(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [accessToken, tourId]);

  useEffect(() => {
    if (!forbidden) return;
    const timer = window.setTimeout(() => {
      router.replace(ACENTE_ROUTES.tours);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [forbidden, router]);

  // Lazy-fetch dates when Dates / Pricing tabs open.
  useEffect(() => {
    if (!accessToken || !tourId || !tour || datesLoaded) return;
    if (tab !== 'dates' && tab !== 'pricing') return;

    let cancelled = false;
    void listPartnerTourDates(tourId, accessToken)
      .then((rows) => {
        if (!cancelled) {
          setDates(rows);
          setDatesLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDates([]);
          setDatesLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, tourId, tour, tab, datesLoaded]);

  const extras = useMemo(() => parseExtras(tour?.extras), [tour]);
  const images = useMemo(() => {
    if (!tour) return [] as string[];
    const gallery = Array.isArray(tour.galleryUrls) ? tour.galleryUrls : [];
    if (tour.coverUrl) {
      return [tour.coverUrl, ...gallery.filter((u) => u !== tour.coverUrl)];
    }
    return gallery;
  }, [tour]);

  const inclusions = asStringList(extras.includes);
  const exclusions = asStringList(extras.excludes);
  const healthPrivileges = asStringList(extras.healthPrivileges);
  const languages = asStringList(extras.languages);
  const tags = asStringList(extras.tags);
  const itinerary = Array.isArray(extras.itinerary) ? extras.itinerary : [];
  const price = tour ? Number(tour.price) : 0;
  const discount = Number(extras.discount ?? 0);
  const agency = tour?.agency ?? tour?.partner;

  if (loading) {
    return (
      <div
        className="flex min-h-[50vh] items-center justify-center"
        data-testid="tour-detail-loading"
      >
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-neutral-900" />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div
        className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center"
        data-testid="tour-detail-forbidden"
      >
        <p className="text-lg font-semibold text-neutral-900">
          Bu tura erişim yetkiniz yok
        </p>
        <Link
          href={ACENTE_ROUTES.tours}
          className="inline-flex rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white"
          data-testid="tour-detail-back-list"
        >
          Tur listesine dön
        </Link>
      </div>
    );
  }

  if (error || !tour) {
    return (
      <div
        className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center"
        data-testid="tour-detail-error"
      >
        <p className="text-lg font-semibold text-neutral-900">
          {error || 'Tur bulunamadı'}
        </p>
        <Link
          href={ACENTE_ROUTES.tours}
          className="inline-flex rounded-lg border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-800"
        >
          Geri Dön
        </Link>
      </div>
    );
  }

  const title = sanitizePlainText(tour.title);
  const description = sanitizePlainText(tour.description);
  const label = statusLabel(tour.status);

  return (
    <div className="space-y-6" data-testid="acente-tour-detail-page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1
            className="truncate text-2xl font-bold tracking-tight text-neutral-950"
            data-testid="tour-detail-title"
          >
            {title}
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            {sanitizePlainText(tour.category)} · {tour.durationDays} gün ·{' '}
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                label === 'Yayında'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-neutral-100 text-neutral-700'
              }`}
            >
              {label}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`${ACENTE_ROUTES.tours}/${tour.id}/edit`}
            data-testid="edit-tour-btn"
            className="inline-flex min-h-11 items-center rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
          >
            Düzenle
          </Link>
          <Link
            href={ACENTE_ROUTES.tours}
            data-testid="back-to-tours-btn"
            className="inline-flex min-h-11 items-center rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
            Geri
          </Link>
        </div>
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as TourDetailTab)}
        className="w-full"
      >
        <TabsList
          className="flex h-auto w-full flex-wrap justify-start gap-1"
          data-testid="tour-detail-tabs"
        >
          <TabsTrigger value="overview" data-testid="tab-overview">
            Genel Bilgiler
          </TabsTrigger>
          <TabsTrigger value="dates" data-testid="tab-dates">
            Tarihler &amp; Koltuklar
          </TabsTrigger>
          <TabsTrigger value="pricing" data-testid="tab-pricing">
            Fiyatlandırma
          </TabsTrigger>
          <TabsTrigger value="media" data-testid="tab-media">
            Medya
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <TourDetailGallery images={images.slice(0, 1)} title={title} />

              <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-neutral-950">
                  Özet
                </h2>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Meta
                    icon={Calendar}
                    label="Tarih aralığı"
                    value={
                      extras.startDate
                        ? `${new Date(extras.startDate).toLocaleDateString('tr-TR')} – ${
                            extras.endDate
                              ? new Date(extras.endDate).toLocaleDateString(
                                  'tr-TR',
                                )
                              : '—'
                          }`
                        : '—'
                    }
                  />
                  <Meta
                    icon={MapPin}
                    label="Kalkış"
                    value={departureLabel(
                      tour.departureCities?.length
                        ? tour.departureCities
                        : extras.departureCity,
                    )}
                  />
                  <Meta
                    icon={Clock}
                    label="Süre"
                    value={`${tour.durationDays} gün`}
                  />
                  <Meta
                    icon={Users}
                    label="Maks. katılımcı"
                    value={
                      extras.maxParticipants
                        ? `${extras.maxParticipants} kişi`
                        : '—'
                    }
                  />
                  <Meta
                    icon={Banknote}
                    label="Fiyat"
                    value={
                      discount > 0 && price > 0
                        ? `${formatMoney(Math.round(price * (1 - discount / 100)), tour.currency)} (%${discount} indirim)`
                        : formatMoney(price, tour.currency)
                    }
                  />
                  <Meta
                    icon={Tag}
                    label="Tur tipi"
                    value={
                      sanitizePlainText(extras.tourType || '') ||
                      sanitizePlainText(tour.category) ||
                      '—'
                    }
                  />
                  <Meta
                    icon={Building2}
                    label="Konaklama"
                    value={
                      sanitizePlainText(extras.accommodationType || '') || '—'
                    }
                  />
                  <Meta
                    icon={Truck}
                    label="Ulaşım"
                    value={
                      sanitizePlainText(extras.transportation || '') || '—'
                    }
                  />
                  <Meta
                    icon={Globe2}
                    label="Bölge"
                    value={sanitizePlainText(extras.region || '') || '—'}
                  />
                  <Meta
                    icon={UserRound}
                    label="Yaş sınırı"
                    value={
                      extras.ageRestriction ? `${extras.ageRestriction}+` : '—'
                    }
                  />
                  <Meta
                    icon={Languages}
                    label="Diller"
                    value={languages.length ? languages.join(', ') : '—'}
                  />
                </div>
              </section>

              <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold text-neutral-950">
                  Açıklama
                </h2>
                <p
                  className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700"
                  data-testid="tour-detail-description"
                >
                  {description || 'Açıklama girilmemiş.'}
                </p>
              </section>

              {itinerary.length > 0 ? (
                <section className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold text-neutral-950">
                    Program
                  </h2>
                  <div className="space-y-4">
                    {itinerary.map((day, index) => (
                      <div
                        key={`${day.title}-${index}`}
                        className="rounded-lg border border-neutral-100 p-4"
                      >
                        <h3 className="font-medium text-neutral-900">
                          {sanitizePlainText(day.title)}
                        </h3>
                        <p className="mt-1 text-sm text-neutral-600">
                          {sanitizePlainText(day.description)}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {(inclusions.length > 0 || exclusions.length > 0) && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <ListCard
                    title="Dahil olanlar"
                    items={inclusions}
                    tone="ok"
                  />
                  <ListCard
                    title="Dahil olmayanlar"
                    items={exclusions}
                    tone="no"
                  />
                </div>
              )}

              {healthPrivileges.length > 0 ? (
                <ListCard
                  title="Sağlık ayrıcalıkları"
                  items={healthPrivileges}
                  tone="info"
                />
              ) : null}
            </div>

            <aside className="space-y-4 lg:col-span-1">
              {agency?.companyName ? (
                <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-3 text-sm font-semibold text-neutral-950">
                    Tur operatörü
                  </h2>
                  <div className="flex items-center gap-3">
                    {agency.logo ? (
                      <Image
                        src={agency.logo}
                        alt={sanitizePlainText(agency.companyName)}
                        width={48}
                        height={48}
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-neutral-100 text-sm font-semibold text-neutral-500">
                        {sanitizePlainText(agency.companyName).charAt(0)}
                      </div>
                    )}
                    <p className="text-sm font-medium text-neutral-900">
                      {sanitizePlainText(agency.companyName)}
                    </p>
                  </div>
                </div>
              ) : null}

              {tags.length > 0 ? (
                <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-3 text-sm font-semibold text-neutral-950">
                    Etiketler
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="dates" className="mt-4">
          <TourDetailDatesTab
            tourId={tourId}
            dates={dates}
            currency={tour.currency}
            basePrice={price}
          >
            {datesLoaded && dates.length > 0 ? (
              <div className="space-y-6 pt-2">
                <TourDateGuideAssignmentPanel
                  tourDates={dates.map((date) => ({
                    id: date.id,
                    startDate: date.startDate,
                    endDate: date.endDate,
                  }))}
                />
                <TourDateBusAssignmentPanel
                  tourId={tourId}
                  tourDates={dates.map((date) => ({
                    id: date.id,
                    startDate: date.startDate,
                    endDate: date.endDate,
                  }))}
                />
              </div>
            ) : null}
          </TourDetailDatesTab>
        </TabsContent>

        <TabsContent value="pricing" className="mt-4">
          <div
            className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm"
            data-testid="tour-pricing-panel"
          >
            <h2 className="text-lg font-semibold text-neutral-950">
              Fiyatlandırma
            </h2>
            <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-neutral-500">
                  Liste fiyatı
                </dt>
                <dd
                  className="mt-1 text-base font-semibold text-neutral-950"
                  data-testid="tour-base-price"
                >
                  {formatMoney(price, tour.currency)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-neutral-500">
                  İndirim
                </dt>
                <dd className="mt-1 text-base font-semibold text-neutral-950">
                  {discount > 0 ? `%${discount}` : 'Yok'}
                </dd>
              </div>
            </dl>
            {datesLoaded && dates.some((d) => d.priceOverride) ? (
              <ul className="mt-6 space-y-2 border-t border-neutral-100 pt-4">
                {dates
                  .filter((d) => d.priceOverride)
                  .map((d) => (
                    <li
                      key={d.id}
                      className="flex justify-between text-sm text-neutral-700"
                    >
                      <span>
                        {new Date(d.startDate).toLocaleDateString('tr-TR')}
                      </span>
                      <span className="font-medium">
                        {formatMoney(Number(d.priceOverride), tour.currency)}
                      </span>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-neutral-500">
                Sefer bazlı fiyat override yok.
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="media" className="mt-4">
          <TourDetailGallery images={images} title={title} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-neutral-400" aria-hidden />
      <div>
        <p className="text-xs font-medium text-neutral-500">{label}</p>
        <p className="mt-0.5 text-sm text-neutral-900">{value}</p>
      </div>
    </div>
  );
}

function ListCard({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: 'ok' | 'no' | 'info';
}) {
  const mark = tone === 'ok' ? '✓' : tone === 'no' ? '×' : '•';
  const color =
    tone === 'ok'
      ? 'text-green-600'
      : tone === 'no'
        ? 'text-red-600'
        : 'text-sky-600';

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-neutral-950">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-neutral-500">Kayıt yok</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={`${item}-${index}`} className="flex items-start gap-2">
              <span className={`mt-0.5 ${color}`}>{mark}</span>
              <span className="text-sm text-neutral-700">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
