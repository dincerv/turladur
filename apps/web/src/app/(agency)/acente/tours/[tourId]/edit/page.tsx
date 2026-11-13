'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TourForm,
  type TourFormData,
} from '@/components/features/partner-dashboard/tour-form';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Eye,
  Info,
  ImageIcon,
  X,
} from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';
import {
  getPartnerTourEditBundle,
  getPresignedUpload,
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
import { ACENTE_ROUTES } from '@/lib/panel-routes';
import { revalidatePartnerTourPaths } from '../../actions';

type FormData = Partial<TourFormData>;

function EditFormSkeleton() {
  return (
    <div
      className="container mx-auto animate-pulse space-y-8 px-4 py-8"
      data-testid="edit-tour-skeleton"
    >
      <div className="h-8 w-48 rounded bg-neutral-200" />
      <div className="h-3 w-full rounded-full bg-neutral-200" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-8 lg:col-span-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-24 rounded bg-neutral-200" />
              <div className="h-11 w-full rounded-lg bg-neutral-100" />
            </div>
          ))}
        </div>
        <div className="hidden space-y-4 lg:block">
          <div className="h-48 rounded-xl bg-neutral-200" />
          <div className="h-4 w-2/3 rounded bg-neutral-200" />
          <div className="h-20 rounded bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}

export default function PartnerTourEditPage() {
  const router = useRouter();
  const params = useParams();
  const tourId = params.tourId as string;
  const { accessToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStep, setFormStep] = useState<'basic' | 'details'>('basic');
  const [formData, setFormData] = useState<FormData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const [seferDates, setSeferDates] = useState<
    Array<{ id: string; startDate: string; endDate: string }>
  >([]);
  const initialSnapshot = useRef<string>('');

  useEffect(() => {
    if (!accessToken || !tourId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      setForbidden(false);
      try {
        const bundle = await getPartnerTourEditBundle(tourId, accessToken);
        if (cancelled) return;

        setSeferDates(
          bundle.dates.map((date) => ({
            id: date.id,
            startDate: date.startDate,
            endDate: date.endDate,
          })),
        );

        const transformed = transformNestTourToFormData({
          title: bundle.tour.title,
          description: bundle.tour.description,
          price: bundle.tour.price,
          durationDays: bundle.tour.durationDays,
          stayKind: bundle.tour.stayKind,
          destinationScope: bundle.tour.destinationScope,
          departureCities: bundle.tour.departureCities,
          coverUrl: bundle.tour.coverUrl,
          galleryUrls: bundle.tour.galleryUrls,
          extras: bundle.tour.extras,
          accommodation: bundle.accommodation,
          dates: bundle.dates,
          pickupPoints: bundle.pickupPoints,
        });
        setFormData(transformed);
        initialSnapshot.current = JSON.stringify({
          title: transformed.title,
          description: transformed.description,
          price: transformed.price,
        });
        setIsDirty(false);
      } catch (err) {
        if (cancelled) return;
        if (
          err instanceof ApiError &&
          (err.status === 404 || err.status === 403)
        ) {
          setForbidden(true);
        } else {
          setError(err instanceof Error ? err.message : 'Tur yüklenemedi');
        }
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
    const t = window.setTimeout(() => {
      router.replace(ACENTE_ROUTES.tours);
    }, 1000);
    return () => window.clearTimeout(t);
  }, [forbidden, router]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty || isSubmitting) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty, isSubmitting]);

  const markDirtyFromForm = useCallback((data: TourFormData) => {
    setFormData(data);
    const snap = JSON.stringify({
      title: data.title,
      description: data.description,
      price: data.price,
    });
    setIsDirty(snap !== initialSnapshot.current);
  }, []);

  const handleUpdate = async (data: TourFormData | Record<string, unknown>) => {
    if (formStep === 'basic' && !isTourSubmitPayload(data)) {
      setFormData(data as TourFormData);
      setFormStep('details');
      return;
    }

    if (!accessToken || !isTourSubmitPayload(data)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSaveSuccess(false);
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
      setIsDirty(false);
      setSaveSuccess(true);
      await revalidatePartnerTourPaths(tourId);
      router.refresh();
      window.setTimeout(() => {
        router.push(`${ACENTE_ROUTES.tours}/${tourId}`);
      }, 900);
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.status === 403 || err.status === 404)
      ) {
        setForbidden(true);
      } else {
        setError(err instanceof Error ? err.message : 'Güncelleme başarısız');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    if (formStep === 'details') {
      setFormStep('basic');
      return;
    }
    if (
      isDirty &&
      !window.confirm(
        'Kaydedilmemiş değişiklikleriniz var. Çıkmak istiyor musunuz?',
      )
    ) {
      return;
    }
    router.push(`${ACENTE_ROUTES.tours}/${tourId}`);
  };

  if (loading) return <EditFormSkeleton />;

  if (forbidden) {
    return (
      <div
        className="flex min-h-[40vh] flex-col items-center justify-center gap-3"
        data-testid="edit-tour-forbidden"
      >
        <p className="font-semibold text-neutral-900">
          Bu tura erişim yetkiniz yok
        </p>
        <Link href={ACENTE_ROUTES.tours} className="text-sm underline">
          Tur listesine dön
        </Link>
      </div>
    );
  }

  if (error && !formData.title) {
    return (
      <div
        className="flex min-h-[40vh] flex-col items-center justify-center gap-3"
        data-testid="edit-tour-error"
      >
        <p className="font-semibold text-neutral-900">{error}</p>
        <button
          type="button"
          onClick={() => router.push(ACENTE_ROUTES.tours)}
          className="rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white"
        >
          Geri Dön
        </button>
      </div>
    );
  }

  const previewSrc =
    formData.mainImage?.preview ||
    formData.mainImage?.url ||
    formData.galleryImages?.[0]?.preview ||
    formData.galleryImages?.[0]?.url ||
    formData.images?.[0]?.preview ||
    formData.images?.[0]?.url ||
    null;

  return (
    <div
      className="container mx-auto px-4 py-8"
      data-testid="acente-tour-edit-page"
    >
      {saveSuccess ? (
        <div
          role="status"
          data-testid="save-success-toast"
          className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
        >
          Tur başarıyla güncellendi
        </div>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          data-testid="edit-tour-submit-error"
        >
          {error}
        </p>
      ) : null}

      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tur Düzenle</h1>
          <p className="text-gray-600">
            Tur bilgilerini güncelleyin ve değişiklikleri kaydedin.
            {isDirty ? (
              <span
                className="ml-2 text-amber-700"
                data-testid="dirty-indicator"
              >
                Kaydedilmemiş değişiklikler
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            data-testid="preview-toggle-btn"
            onClick={() => setMobilePreviewOpen(true)}
            className="inline-flex items-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 lg:hidden"
          >
            <Eye className="mr-2 h-4 w-4" aria-hidden />
            Önizlemeyi Gör
          </button>
          <Link
            href={`${ACENTE_ROUTES.tours}/${tourId}`}
            onClick={(e) => {
              if (
                isDirty &&
                !window.confirm(
                  'Kaydedilmemiş değişiklikleriniz var. Çıkmak istiyor musunuz?',
                )
              ) {
                e.preventDefault();
              }
            }}
            className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            İptal
          </Link>
        </div>
      </div>

      <div className="mb-8" data-testid="edit-tour-stepper">
        <div className="overflow-hidden rounded-full bg-gray-200">
          <motion.div
            className="h-2.5 rounded-full bg-neutral-950"
            initial={false}
            animate={{ width: formStep === 'basic' ? '50%' : '100%' }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="mt-4 flex justify-between">
          <div className="flex items-center">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full ${formStep === 'basic' ? 'bg-neutral-950 text-white' : 'bg-neutral-200 text-neutral-500'}`}
            >
              <CheckCircle className="h-5 w-5" />
            </div>
            <span className="ml-2 font-medium text-gray-900">
              Temel Bilgiler
            </span>
          </div>
          <div className="flex items-center">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full ${formStep === 'details' ? 'bg-neutral-950 text-white' : 'bg-neutral-200 text-neutral-500'}`}
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
            <div className="p-4 sm:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={formStep}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <TourForm
                    initialData={formData}
                    onSubmit={handleUpdate}
                    onFormDataChange={markDirtyFromForm}
                    onStepChange={setFormStep}
                    isSubmitting={isSubmitting}
                    currentStep={formStep}
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
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="hidden lg:col-span-1 lg:block">
          <div className="sticky top-6">
            <div
              className="overflow-hidden rounded-lg bg-white shadow"
              data-testid="edit-preview-panel"
            >
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900">Önizleme</h2>
                <div className="mt-4 space-y-4">
                  <div className="flex h-48 w-full items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                    {previewSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element -- live form preview
                      <img
                        src={previewSrc}
                        alt="Tur önizleme"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-14 w-14 text-gray-400" />
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {formData?.title || 'Tur başlığı'}
                  </h3>
                  <p className="line-clamp-3 text-sm text-gray-600">
                    {formData?.description ||
                      'Tur açıklaması burada görünecek...'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">
                      {formData?.price ? `${formData.price} ₺` : '0 ₺'}
                    </span>
                    <span className="text-sm text-gray-600">
                      {formData?.duration || formData?.nights || '—'} gün
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-lg bg-blue-50 shadow">
              <div className="p-6">
                <div className="flex items-start">
                  <Info className="h-6 w-6 text-blue-600" />
                  <div className="ml-3 text-sm text-blue-700">
                    {formStep === 'basic'
                      ? 'Temel bilgileri eksiksiz doldurun; müşteriler önce bunlara bakar.'
                      : 'Tarih, pickup ve medya güncellemeleri tek işlemde kaydedilir.'}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                data-testid="edit-back-btn"
                onClick={goBack}
                className="flex items-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Geri
              </button>
              <button
                type="submit"
                form="tour-form"
                data-testid={
                  formStep === 'basic' ? 'edit-step-next-btn' : 'save-tour-btn'
                }
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className="flex items-center rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {formStep === 'basic' ? (
                  <>
                    Devam Et
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                ) : isSubmitting ? (
                  'Güncelleniyor...'
                ) : (
                  'Güncelle'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {formStep === 'details' && seferDates.length > 0 ? (
        <div className="mt-8 space-y-6">
          <TourDateGuideAssignmentPanel tourDates={seferDates} />
          <TourDateBusAssignmentPanel tourId={tourId} tourDates={seferDates} />
        </div>
      ) : null}

      <AnimatePresence>
        {mobilePreviewOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-white lg:hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            data-testid="mobile-preview-drawer"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="font-semibold">Önizleme</h2>
              <button
                type="button"
                data-testid="preview-close-btn"
                onClick={() => setMobilePreviewOpen(false)}
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex h-48 items-center justify-center rounded-lg bg-neutral-100">
                {previewSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewSrc}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-10 w-10 text-neutral-400" />
                )}
              </div>
              <h3 className="mt-4 text-lg font-medium">
                {formData.title || 'Tur başlığı'}
              </h3>
              <p className="mt-2 text-sm text-neutral-600">
                {formData.description || 'Açıklama…'}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
