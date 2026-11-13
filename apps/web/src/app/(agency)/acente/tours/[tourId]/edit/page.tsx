'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  TourForm,
  type TourFormData,
} from '@/components/features/partner-dashboard/tour-form';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Info,
  ImageIcon,
} from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import {
  getPartnerProfile,
  getPartnerTourById,
  getPresignedUpload,
  getTourAccommodation,
  listPartnerTourDates,
  listTourDateAgeRanges,
  listTourPickupPoints,
} from '@/services/partner-admin';
import {
  isTourSubmitPayload,
  persistPartnerTourUpdate,
} from '@/lib/partner-tour-submit';
import {
  transformNestTourToFormData,
  uploadTourImageFile,
} from '@/lib/partner-tour-helpers';
import { TourDateGuideAssignmentPanel } from '@/components/features/partner-dashboard/tour-date-guide-assignment-panel';
import { TourDateBusAssignmentPanel } from '@/components/features/partner-dashboard/tour-date-bus-assignment-panel';

type FormData = Partial<TourFormData>;

export default function PartnerTourEditPage() {
  const router = useRouter();
  const params = useParams();
  const tourId = params.tourId as string;
  const { accessToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStep, setFormStep] = useState<'basic' | 'details'>('basic');
  const [formData, setFormData] = useState<FormData>({});
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seferDates, setSeferDates] = useState<
    Array<{ id: string; startDate: string; endDate: string }>
  >([]);

  useEffect(() => {
    if (!accessToken || !tourId) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const profile = await getPartnerProfile(accessToken);
        setPartnerId(profile.id);

        const [tour, dates, pickups, accommodation] = await Promise.all([
          getPartnerTourById(tourId, accessToken),
          listPartnerTourDates(tourId, accessToken),
          listTourPickupPoints(tourId, accessToken).catch(() => []),
          getTourAccommodation(tourId).catch(() => null),
        ]);

        setSeferDates(
          dates.map((date) => ({
            id: date.id,
            startDate: date.startDate,
            endDate: date.endDate,
          })),
        );

        const datesWithAge = await Promise.all(
          dates.map(async (date) => ({
            ...date,
            ageRanges: await listTourDateAgeRanges(
              tourId,
              date.id,
              accessToken,
            ).catch(() => []),
          })),
        );

        const transformed = transformNestTourToFormData({
          title: tour.title,
          description: tour.description,
          price: tour.price,
          durationDays: tour.durationDays,
          stayKind: tour.stayKind,
          destinationScope: tour.destinationScope,
          departureCities: tour.departureCities,
          coverUrl: tour.coverUrl,
          galleryUrls: tour.galleryUrls,
          extras: tour.extras,
          accommodation,
          dates: datesWithAge,
          pickupPoints: pickups,
        });
        setFormData(transformed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Tur yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [accessToken, tourId]);

  const handleUpdate = async (data: TourFormData | Record<string, unknown>) => {
    if (formStep === 'basic' && !isTourSubmitPayload(data)) {
      setFormData(data as TourFormData);
      setFormStep('details');
      return;
    }

    if (!accessToken || !partnerId || !isTourSubmitPayload(data)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await persistPartnerTourUpdate(
        tourId,
        {
          formData: data.formData,
          title: String(data.title ?? data.formData.title),
          description: String(data.description ?? data.formData.description),
          duration: Number(data.duration ?? data.formData.duration ?? 1),
          price: Number(data.price ?? data.formData.price ?? 0),
          tourDates:
            (data.tourDates as Array<{
              startDate: string | null;
              endDate: string | null;
              availableSeats: number;
              ageRanges: Array<{
                minAge: number;
                maxAge: number | null;
                pricingType: string;
                value: number;
              }>;
            }>) ?? [],
          pickupPoints:
            (data.pickupPoints as Array<{
              city: string;
              location: string;
              time: string;
              description?: string;
              latitude?: number | null;
              longitude?: number | null;
            }>) ?? [],
          tourType: String(data.tourType ?? data.formData.tourType ?? ''),
          region: String(data.region ?? data.formData.region ?? ''),
          features: (data.features as string[]) ?? data.formData.features,
        },
        accessToken,
        tourId,
      );
      router.push('/acente/tours');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Güncelleme başarısız');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    if (formStep === 'details') {
      setFormStep('basic');
    } else {
      router.push('/acente/tours');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Hata</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => router.push('/acente/tours')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tur Düzenle</h1>
          <p className="text-gray-600">
            Tur bilgilerini güncelleyin ve değişiklikleri kaydedin.
          </p>
        </div>
        <Link
          href="/acente/tours"
          className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          İptal
        </Link>
      </div>

      {/* İlerleme göstergesi */}
      <div className="mb-8">
        <div className="overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-2.5 rounded-full bg-blue-600 transition-all duration-500 ease-in-out"
            style={{ width: formStep === 'basic' ? '50%' : '100%' }}
          ></div>
        </div>
        <div className="mt-4 flex justify-between">
          <div className="flex items-center">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full ${formStep === 'basic' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}
            >
              <CheckCircle className="h-5 w-5" />
            </div>
            <span className="ml-2 font-medium text-gray-900">
              Temel Bilgiler
            </span>
          </div>
          <div className="flex items-center">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full ${formStep === 'details' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}
            >
              {formStep === 'details' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <span>2</span>
              )}
            </div>
            <span
              className={`ml-2 font-medium ${formStep === 'details' ? 'text-gray-900' : 'text-gray-500'}`}
            >
              Detaylar
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-8">
              <TourForm
                initialData={formData}
                onSubmit={handleUpdate}
                onFormDataChange={(data) => setFormData(data)}
                onStepChange={setFormStep}
                isSubmitting={isSubmitting}
                currentStep={formStep}
                partnerId={partnerId || undefined}
                isUpdateMode
                tourId={tourId}
                uploadEntityId={tourId}
                uploadImage={
                  accessToken
                    ? (file) =>
                        uploadTourImageFile(
                          file,
                          tourId,
                          accessToken,
                          getPresignedUpload,
                        )
                    : undefined
                }
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900">Önizleme</h2>
                <div className="mt-4 space-y-4">
                  <div className="h-48 w-full overflow-hidden rounded-lg bg-gray-100 flex items-center justify-center">
                    {(() => {
                      const previewSrc =
                        formData.mainImage?.preview ||
                        formData.mainImage?.url ||
                        formData.galleryImages?.[0]?.preview ||
                        formData.galleryImages?.[0]?.url ||
                        formData.images?.[0]?.preview ||
                        formData.images?.[0]?.url ||
                        null;
                      return previewSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element -- live form preview (blob / proxy)
                        <img
                          src={previewSrc}
                          alt="Tur önizleme"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-14 w-14 text-gray-400" />
                      );
                    })()}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {formData?.title || 'Tur başlığı'}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {formData?.description ||
                      'Tur açıklaması burada görünecek...'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">
                      {formData?.price ? `${formData.price} ₺` : '0 ₺'}
                    </span>
                    <span className="text-sm text-gray-600">
                      {formData?.duration || '0 saat'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-lg bg-blue-50 shadow">
              <div className="p-6">
                <div className="flex items-start">
                  <Info className="h-6 w-6 text-blue-600" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Bilgilendirme
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      {formStep === 'basic' ? (
                        <p>
                          Temel bilgileri eksiksiz doldurmanız önemlidir.
                          Müşterileriniz turunuzu seçerken öncelikle bu
                          bilgilere göre karar verir.
                        </p>
                      ) : (
                        <p>
                          Turunuzun detaylarını ne kadar zengin tutarsanız,
                          müşterilerinizin ilgisini o kadar çekersiniz. Turda
                          neler dahil olduğu ve olmadığı konusunda açık olun.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={goBack}
                className="flex items-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Geri
              </button>
              <button
                type="submit"
                form="tour-form"
                disabled={isSubmitting}
                className="flex items-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
              >
                {formStep === 'basic' ? (
                  <>
                    Devam Et
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                ) : (
                  <>{isSubmitting ? 'Güncelleniyor...' : 'Güncelle'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <TourDateGuideAssignmentPanel tourDates={seferDates} />
        <TourDateBusAssignmentPanel tourId={tourId} tourDates={seferDates} />
      </div>
    </div>
  );
}
