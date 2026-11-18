'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle, Plus, Trash2 } from 'lucide-react';

import { ImageUploadField } from '@/components/features/partner/image-upload-field';
import {
  TOUR_CREATE_CATEGORIES,
  tourCreateDatesPricingSchema,
  tourCreateGeneralSchema,
  tourCreateMediaSchema,
  zodErrorsToRecord,
  type TourCreateCategory,
} from '@/components/features/acente-tours/tour-create-schemas';
import { ACENTE_ROUTES } from '@/lib/panel-routes';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';
import { createPartnerTour, getPartnerProfile } from '@/services/partner-admin';
import { revalidatePartnerTourPaths } from '@/app/(agency)/acente/tours/actions';

type Step = 'general' | 'dates' | 'media';

type FormState = {
  title: string;
  description: string;
  category: TourCreateCategory;
  stayKind: 'DAY_TRIP' | 'OVERNIGHT';
  destinationScope: 'DOMESTIC' | 'INTERNATIONAL';
  durationDays: number;
  departureCity: string;
  price: number;
  dateStart: string;
  dateEnd: string;
  capacity: number;
  coverUrl: string | null;
  galleryUrls: string[];
  asDraft: boolean;
};

const CATEGORY_LABELS: Record<TourCreateCategory, string> = {
  CULTURAL: 'Kültür',
  ADVENTURE: 'Macera',
  GASTRONOMY: 'Gastronomi',
  NATURE: 'Doğa',
  CITY: 'Şehir',
  BEACH: 'Plaj',
};

function isoDateOffset(days: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const INITIAL: FormState = {
  title: '',
  description: '',
  category: 'CULTURAL',
  stayKind: 'OVERNIGHT',
  destinationScope: 'DOMESTIC',
  durationDays: 2,
  departureCity: 'Ankara',
  price: 2500,
  dateStart: isoDateOffset(30),
  dateEnd: isoDateOffset(32),
  capacity: 20,
  coverUrl: null,
  galleryUrls: [],
  asDraft: false,
};

export function AcenteTourCreatePage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>('general');
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [uploadEntityId, setUploadEntityId] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    void getPartnerProfile(accessToken)
      .then((profile) => setUploadEntityId(profile.id))
      .catch((err: Error) => setError(err.message));
  }, [accessToken]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty || saving || saveSuccess) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty, saving, saveSuccess]);

  const patch = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const stepIndex = useMemo(() => {
    if (step === 'general') return 0;
    if (step === 'dates') return 1;
    return 2;
  }, [step]);

  function validateCurrentStep(): boolean {
    if (step === 'general') {
      const parsed = tourCreateGeneralSchema.safeParse(form);
      if (!parsed.success) {
        setErrors(zodErrorsToRecord(parsed.error));
        return false;
      }
    } else if (step === 'dates') {
      const parsed = tourCreateDatesPricingSchema.safeParse(form);
      if (!parsed.success) {
        setErrors(zodErrorsToRecord(parsed.error));
        return false;
      }
    } else {
      const parsed = tourCreateMediaSchema.safeParse(form);
      if (!parsed.success) {
        setErrors(zodErrorsToRecord(parsed.error));
        return false;
      }
    }
    setErrors({});
    return true;
  }

  function goNext() {
    if (!validateCurrentStep()) return;
    if (step === 'general') setStep('dates');
    else if (step === 'dates') setStep('media');
  }

  function goBack() {
    if (step === 'media') setStep('dates');
    else if (step === 'dates') setStep('general');
    else if (
      isDirty &&
      !window.confirm(
        'Kaydedilmemiş değişiklikleriniz var. Çıkmak istiyor musunuz?',
      )
    ) {
      return;
    } else {
      router.push(ACENTE_ROUTES.tours);
    }
  }

  async function handleSubmit() {
    if (!accessToken || !validateCurrentStep()) return;
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      const created = await createPartnerTour(
        {
          title: form.title.trim(),
          description: form.description.trim(),
          price: Number(form.price),
          category: form.category,
          durationDays:
            form.stayKind === 'DAY_TRIP' ? 1 : Number(form.durationDays) || 1,
          stayKind: form.stayKind,
          destinationScope: form.destinationScope,
          departureCities: [form.departureCity.trim()],
          coverUrl: form.coverUrl || undefined,
          galleryUrls: form.galleryUrls.length ? form.galleryUrls : undefined,
          asDraft: form.asDraft,
          dates: [
            {
              startDate: form.dateStart,
              endDate: form.dateEnd,
              capacity: Number(form.capacity),
              priceOverride: Number(form.price),
            },
          ],
        },
        accessToken,
      );
      setIsDirty(false);
      setSaveSuccess(true);
      await revalidatePartnerTourPaths(created.id);
      window.setTimeout(() => {
        router.push(ACENTE_ROUTES.tours);
      }, 900);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message || 'Kayıt başarısız'
          : err instanceof Error
            ? err.message
            : 'Kayıt başarısız',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6" data-testid="acente-tour-create-page">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={ACENTE_ROUTES.tours}
            data-testid="tour-create-back"
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
            className="text-sm text-neutral-600 hover:underline"
          >
            ← Turlar
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-neutral-900">
            Yeni tur oluştur
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Kaydedilince inceleme kuyruğuna düşer (taslak seçilirse hemen
            saklanır).
            {isDirty ? (
              <span
                className="ml-2 text-amber-700"
                data-testid="tour-dirty-indicator"
              >
                Kaydedilmemiş değişiklikler
              </span>
            ) : null}
          </p>
        </div>
      </div>

      {saveSuccess ? (
        <div
          role="status"
          data-testid="create-success-toast"
          className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
        >
          Tur başarıyla oluşturuldu
        </div>
      ) : null}
      {error ? (
        <p
          role="alert"
          data-testid="tour-create-error"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <div data-testid="tour-create-stepper">
        <div className="overflow-hidden rounded-full bg-neutral-200">
          <motion.div
            className="h-2.5 rounded-full bg-neutral-950"
            initial={false}
            animate={{ width: `${((stepIndex + 1) / 3) * 100}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between text-sm">
          {(
            [
              ['general', 'Genel Bilgiler'],
              ['dates', 'Tarih & Fiyat'],
              ['media', 'Medya Görselleri'],
            ] as const
          ).map(([key, label], i) => (
            <button
              key={key}
              type="button"
              data-testid={`tour-step-${key}`}
              onClick={() => {
                if (i <= stepIndex || validateCurrentStep()) setStep(key);
              }}
              className={`font-medium ${
                step === key ? 'text-neutral-900' : 'text-neutral-500'
              }`}
            >
              <span className="mr-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-xs">
                {i < stepIndex ? (
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                ) : (
                  i + 1
                )}
              </span>
              {label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="max-w-2xl space-y-4 rounded-xl border border-neutral-100 bg-white p-5 shadow-sm"
        >
          {step === 'general' ? (
            <>
              <Field
                label="Başlık"
                testId="tour-title-input"
                error={errors.title}
                errorTestId="tour-title-error"
              >
                <input
                  id="tour-title-input"
                  data-testid="tour-title-input"
                  value={form.title}
                  onChange={(e) => patch('title', e.target.value.slice(0, 200))}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  placeholder="Kapadokya Keşif Turu"
                />
              </Field>
              <Field
                label="Açıklama"
                testId="tour-description-input"
                error={errors.description}
                errorTestId="tour-description-error"
              >
                <textarea
                  id="tour-description-input"
                  data-testid="tour-description-input"
                  rows={5}
                  value={form.description}
                  onChange={(e) =>
                    patch('description', e.target.value.slice(0, 20_000))
                  }
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  placeholder="Tur programı, dahil hizmetler ve önemli notlar…"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Kategori" error={errors.category}>
                  <select
                    data-testid="tour-category-select"
                    value={form.category}
                    onChange={(e) =>
                      patch('category', e.target.value as TourCreateCategory)
                    }
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  >
                    {TOUR_CREATE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Kalkış şehri" error={errors.departureCity}>
                  <input
                    data-testid="tour-departure-input"
                    value={form.departureCity}
                    onChange={(e) =>
                      patch('departureCity', e.target.value.slice(0, 80))
                    }
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Tur türü" error={errors.stayKind}>
                  <select
                    data-testid="tour-stay-kind-select"
                    value={form.stayKind}
                    onChange={(e) => {
                      const value = e.target.value as FormState['stayKind'];
                      patch('stayKind', value);
                      if (value === 'DAY_TRIP') patch('durationDays', 1);
                    }}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  >
                    <option value="DAY_TRIP">Günübirlik</option>
                    <option value="OVERNIGHT">Konaklamalı</option>
                  </select>
                </Field>
                <Field label="Kapsam" error={errors.destinationScope}>
                  <select
                    data-testid="tour-scope-select"
                    value={form.destinationScope}
                    onChange={(e) =>
                      patch(
                        'destinationScope',
                        e.target.value as FormState['destinationScope'],
                      )
                    }
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  >
                    <option value="DOMESTIC">Yurtiçi</option>
                    <option value="INTERNATIONAL">Yurtdışı</option>
                  </select>
                </Field>
                <Field label="Süre (gün)" error={errors.durationDays}>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    data-testid="tour-duration-input"
                    disabled={form.stayKind === 'DAY_TRIP'}
                    value={form.durationDays}
                    onChange={(e) =>
                      patch('durationDays', Number(e.target.value) || 1)
                    }
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-100"
                  />
                </Field>
              </div>
            </>
          ) : null}

          {step === 'dates' ? (
            <>
              <Field
                label="Baz fiyat (TRY)"
                error={errors.price}
                errorTestId="tour-price-error"
              >
                <input
                  type="number"
                  min={0}
                  step="1"
                  data-testid="tour-price-input"
                  value={form.price}
                  onChange={(e) => patch('price', Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Başlangıç tarihi"
                  error={errors.dateStart}
                  errorTestId="tour-date-start-error"
                >
                  <input
                    type="date"
                    data-testid="tour-date-start-input"
                    value={form.dateStart}
                    onChange={(e) => patch('dateStart', e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  />
                </Field>
                <Field
                  label="Bitiş tarihi"
                  error={errors.dateEnd}
                  errorTestId="tour-date-end-error"
                >
                  <input
                    type="date"
                    data-testid="tour-date-end-input"
                    value={form.dateEnd}
                    onChange={(e) => patch('dateEnd', e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  />
                </Field>
              </div>
              <Field
                label="Kontenjan"
                error={errors.capacity}
                errorTestId="tour-capacity-error"
              >
                <input
                  type="number"
                  min={1}
                  max={500}
                  data-testid="tour-capacity-input"
                  value={form.capacity}
                  onChange={(e) =>
                    patch('capacity', Number(e.target.value) || 1)
                  }
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />
              </Field>
            </>
          ) : null}

          {step === 'media' ? (
            <>
              {accessToken && uploadEntityId ? (
                <ImageUploadField
                  token={accessToken}
                  folder="tours"
                  entityId={uploadEntityId}
                  currentUrl={form.coverUrl}
                  label="Kapak görseli"
                  testId="tour-media-dropzone"
                  onUploaded={(url) => patch('coverUrl', url)}
                  onCleared={() => patch('coverUrl', null)}
                />
              ) : (
                <p className="text-sm text-neutral-500">
                  Görsel yükleme için oturum bekleniyor…
                </p>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium text-neutral-800">
                  Galeri ({form.galleryUrls.length}/12)
                </p>
                {accessToken && uploadEntityId ? (
                  <ImageUploadField
                    token={accessToken}
                    folder="tours"
                    entityId={uploadEntityId}
                    label="Galeriye görsel ekle"
                    testId="tour-gallery-dropzone"
                    onUploaded={(url) =>
                      patch(
                        'galleryUrls',
                        [...form.galleryUrls, url].slice(0, 12),
                      )
                    }
                  />
                ) : null}
                {form.galleryUrls.length > 0 ? (
                  <ul className="space-y-2" data-testid="tour-gallery-list">
                    {form.galleryUrls.map((url) => (
                      <li
                        key={url}
                        className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-xs"
                      >
                        <span className="truncate text-neutral-600">{url}</span>
                        <button
                          type="button"
                          aria-label="Görseli kaldır"
                          onClick={() =>
                            patch(
                              'galleryUrls',
                              form.galleryUrls.filter((u) => u !== url),
                            )
                          }
                          className="rounded p-1 text-neutral-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <label className="flex items-center gap-2 text-sm text-neutral-800">
                <input
                  type="checkbox"
                  data-testid="tour-as-draft-checkbox"
                  checked={form.asDraft}
                  onChange={(e) => patch('asDraft', e.target.checked)}
                />
                Taslak olarak kaydet (incelemeye gönderme)
              </label>
            </>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <div className="flex max-w-2xl items-center justify-between gap-3">
        <button
          type="button"
          data-testid="tour-step-back-btn"
          onClick={goBack}
          className="inline-flex items-center rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
          Geri
        </button>
        {step !== 'media' ? (
          <button
            type="button"
            data-testid="tour-step-next-btn"
            onClick={goNext}
            className="inline-flex items-center rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            Devam
            <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            data-testid="submit-tour-btn"
            disabled={saving || !accessToken}
            aria-busy={saving}
            onClick={() => void handleSubmit()}
            className="inline-flex items-center rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            <Plus className="mr-1.5 h-4 w-4" aria-hidden />
            {saving ? 'Kaydediliyor…' : 'Turu oluştur'}
          </button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  error,
  testId,
  errorTestId,
}: {
  label: string;
  children: ReactNode;
  error?: string;
  testId?: string;
  errorTestId?: string;
}) {
  return (
    <div
      className="space-y-1.5"
      data-testid={testId ? `${testId}-field` : undefined}
    >
      <label className="block text-sm font-medium text-neutral-800">
        {label}
      </label>
      {children}
      {error ? (
        <p
          role="alert"
          data-testid={errorTestId}
          className="text-xs text-red-600"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
