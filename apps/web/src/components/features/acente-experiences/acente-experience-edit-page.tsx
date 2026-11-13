'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle, Plus, Trash2 } from 'lucide-react';

import { ImageUploadField } from '@/components/features/partner/image-upload-field';
import {
  experienceBasicSchema,
  experienceContentSchema,
  experienceMediaPricingSchema,
  zodErrorsToRecord,
} from '@/components/features/acente-experiences/experience-create-schemas';
import { ACENTE_ROUTES } from '@/lib/panel-routes';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';
import {
  createExperienceDate,
  deleteExperienceDate,
  getPartnerExperienceEditBundle,
  updatePartnerExperience,
} from '@/services/partner-admin';
import { revalidatePartnerExperiencePaths } from '@/app/(agency)/acente/experiences/actions';

const CATEGORIES = [
  'Doğa',
  'Kültür',
  'Macera',
  'Deniz',
  'Tarihi',
  'Yemek',
  'Eğlence',
  'Spor',
  'Sanat',
] as const;

type Step = 'basic' | 'content' | 'media';

type FormState = {
  title: string;
  description: string;
  longDescription: string;
  category: string;
  location: string;
  duration: string;
  meetingPoint: string;
  ageRestriction: 'everyone' | '12+' | '18+';
  included: string[];
  notIncluded: string[];
  highlights: string[];
  price: number;
  imageUrl: string | null;
  gallery: string[];
  status: string;
};

type DateRow = {
  id: string;
  startDate: string;
  endDate: string;
  price: string;
  availableSeats: number;
};

function EditSkeleton() {
  return (
    <div
      className="animate-pulse space-y-6"
      data-testid="edit-experience-skeleton"
    >
      <div className="h-8 w-56 rounded bg-neutral-200" />
      <div className="h-3 w-full rounded-full bg-neutral-200" />
      <div className="max-w-2xl space-y-4 rounded-xl border border-neutral-100 bg-white p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-24 rounded bg-neutral-200" />
            <div className="h-11 w-full rounded-lg bg-neutral-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

function normalizeAge(
  raw: string | null | undefined,
): FormState['ageRestriction'] {
  if (raw === '12+' || raw === '18+') return raw;
  return 'everyone';
}

export function AcenteExperienceEditPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { accessToken } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>('basic');
  const [form, setForm] = useState<FormState | null>(null);
  const [dates, setDates] = useState<DateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [includedDraft, setIncludedDraft] = useState('');
  const [notIncludedDraft, setNotIncludedDraft] = useState('');
  const [highlightsDraft, setHighlightsDraft] = useState('');
  const [newDate, setNewDate] = useState({
    startDate: '',
    endDate: '',
    availableSeats: 12,
  });

  const load = useCallback(async () => {
    if (!accessToken || !id) return;
    setLoading(true);
    setError(null);
    setForbidden(false);
    try {
      const bundle = await getPartnerExperienceEditBundle(id, accessToken);
      const exp = bundle.experience;
      const next: FormState = {
        title: exp.title,
        description: exp.description,
        longDescription: exp.longDescription,
        category: exp.category,
        location: exp.location,
        duration: exp.duration ?? '',
        meetingPoint: exp.meetingPoint ?? '',
        ageRestriction: normalizeAge(exp.ageRestriction),
        included: exp.included ?? [],
        notIncluded: exp.notIncluded ?? [],
        highlights: exp.highlights ?? [],
        price: Number(exp.price),
        imageUrl: exp.imageUrl ?? null,
        gallery: exp.gallery ?? [],
        status: exp.status,
      };
      setForm(next);
      setDates(bundle.dates);
      setIsDirty(false);
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.status === 403 || err.status === 404)
      ) {
        setForbidden(true);
      } else {
        setError(err instanceof Error ? err.message : 'Yüklenemedi');
      }
      setForm(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!forbidden) return;
    const t = window.setTimeout(() => {
      router.replace(ACENTE_ROUTES.experiences);
    }, 1200);
    return () => window.clearTimeout(t);
  }, [forbidden, router]);

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
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setIsDirty(true);
  };

  const stepIndex = useMemo(() => {
    if (step === 'basic') return 0;
    if (step === 'content') return 1;
    return 2;
  }, [step]);

  function validateCurrentStep(): boolean {
    if (!form) return false;
    const schema =
      step === 'basic'
        ? experienceBasicSchema
        : step === 'content'
          ? experienceContentSchema
          : experienceMediaPricingSchema;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      setErrors(zodErrorsToRecord(parsed.error));
      return false;
    }
    setErrors({});
    return true;
  }

  function goNext() {
    if (!validateCurrentStep()) return;
    if (step === 'basic') setStep('content');
    else if (step === 'content') setStep('media');
  }

  function goBack() {
    if (step === 'media') {
      setStep('content');
      return;
    }
    if (step === 'content') {
      setStep('basic');
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
    router.push(ACENTE_ROUTES.experiences);
  }

  async function handleSave() {
    if (!accessToken || !id || !form || !validateCurrentStep()) return;
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      await updatePartnerExperience(
        id,
        {
          title: form.title.trim(),
          description: form.description.trim(),
          longDescription: form.longDescription.trim(),
          category: form.category,
          location: form.location.trim(),
          duration: form.duration.trim(),
          price: Number(form.price),
          meetingPoint: form.meetingPoint.trim() || undefined,
          ageRestriction: form.ageRestriction,
          imageUrl: form.imageUrl || undefined,
          gallery: form.gallery,
          included: form.included,
          notIncluded: form.notIncluded,
          highlights: form.highlights,
          status: form.status,
        },
        accessToken,
      );
      setIsDirty(false);
      setSaveSuccess(true);
      await revalidatePartnerExperiencePaths(id);
      await load();
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
      setSaving(false);
    }
  }

  async function handleAddDate(e: React.FormEvent) {
    e.preventDefault();
    if (
      !accessToken ||
      !id ||
      !form ||
      !newDate.startDate ||
      !newDate.endDate
    ) {
      return;
    }
    try {
      await createExperienceDate(
        id,
        {
          startDate: newDate.startDate,
          endDate: newDate.endDate,
          price: form.price,
          availableSeats: newDate.availableSeats,
        },
        accessToken,
      );
      setNewDate({ startDate: '', endDate: '', availableSeats: 12 });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tarih eklenemedi');
    }
  }

  if (loading) return <EditSkeleton />;

  if (forbidden) {
    return (
      <div
        className="flex min-h-[40vh] flex-col items-center justify-center gap-3"
        data-testid="edit-experience-forbidden"
      >
        <p className="font-semibold text-neutral-900">
          Bu deneyime erişim yetkiniz yok
        </p>
        <Link href={ACENTE_ROUTES.experiences} className="text-sm underline">
          Listeye dön
        </Link>
      </div>
    );
  }

  if (!form) {
    return (
      <div
        className="flex min-h-[40vh] flex-col items-center justify-center gap-3"
        data-testid="edit-experience-error"
      >
        <p className="font-semibold">{error ?? 'Deneyim yüklenemedi'}</p>
        <Link href={ACENTE_ROUTES.experiences} className="text-sm underline">
          Listeye dön
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="acente-experience-edit-page">
      <div>
        <Link
          href={ACENTE_ROUTES.experiences}
          data-testid="edit-experience-back"
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
          ← Deneyimler
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-neutral-900">
          Deneyim düzenle
        </h1>
        {isDirty ? (
          <p
            className="mt-1 text-sm text-amber-700"
            data-testid="edit-experience-dirty"
          >
            Kaydedilmemiş değişiklikler
          </p>
        ) : null}
      </div>

      {saveSuccess ? (
        <div
          role="status"
          data-testid="save-experience-success-toast"
          className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800"
        >
          Deneyim başarıyla güncellendi
        </div>
      ) : null}
      {error ? (
        <p
          role="alert"
          data-testid="edit-experience-submit-error"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <div data-testid="edit-experience-stepper">
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
              ['basic', 'Temel Bilgiler'],
              ['content', 'İçerik'],
              ['media', 'Medya & Fiyat'],
            ] as const
          ).map(([key, label], i) => (
            <button
              key={key}
              type="button"
              data-testid={`edit-experience-step-${key}`}
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
          {step === 'basic' ? (
            <>
              <Field
                label="Başlık"
                testId="edit-experience-title"
                value={form.title}
                error={errors.title}
                onChange={(v) => patch('title', v)}
              />
              <TextArea
                label="Kısa açıklama"
                testId="edit-experience-description"
                value={form.description}
                error={errors.description}
                onChange={(v) => patch('description', v)}
                rows={3}
              />
              <TextArea
                label="Detay açıklama"
                testId="edit-experience-long-description"
                value={form.longDescription}
                error={errors.longDescription}
                onChange={(v) => patch('longDescription', v)}
                rows={5}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  Kategori
                  <select
                    data-testid="edit-experience-category"
                    className="mt-1 h-11 w-full rounded-lg border border-neutral-300 px-3"
                    value={form.category}
                    onChange={(e) => patch('category', e.target.value)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <Field
                  label="Lokasyon"
                  testId="edit-experience-location"
                  value={form.location}
                  error={errors.location}
                  onChange={(v) => patch('location', v)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Süre"
                  testId="edit-experience-duration"
                  value={form.duration}
                  error={errors.duration}
                  onChange={(v) => patch('duration', v)}
                />
                <label className="block text-sm font-medium">
                  Durum
                  <select
                    data-testid="edit-experience-status"
                    className="mt-1 h-11 w-full rounded-lg border border-neutral-300 px-3"
                    value={form.status}
                    onChange={(e) => patch('status', e.target.value)}
                  >
                    <option value="DRAFT">Taslak</option>
                    <option value="PENDING_REVIEW">Onay bekliyor</option>
                    <option value="PUBLISHED">Yayında</option>
                    <option value="ARCHIVED">Arşiv</option>
                  </select>
                </label>
              </div>
              <Field
                label="Buluşma noktası"
                testId="edit-experience-meeting"
                value={form.meetingPoint}
                onChange={(v) => patch('meetingPoint', v)}
              />
            </>
          ) : null}

          {step === 'content' ? (
            <>
              <StringListEditor
                label="Dahil olanlar"
                testId="edit-experience-included"
                items={form.included}
                draft={includedDraft}
                setDraft={setIncludedDraft}
                onAdd={() => {
                  const v = includedDraft.trim();
                  if (!v) return;
                  patch('included', [...form.included, v]);
                  setIncludedDraft('');
                }}
                onRemove={(i) =>
                  patch(
                    'included',
                    form.included.filter((_, idx) => idx !== i),
                  )
                }
              />
              <StringListEditor
                label="Dahil olmayanlar"
                testId="edit-experience-not-included"
                items={form.notIncluded}
                draft={notIncludedDraft}
                setDraft={setNotIncludedDraft}
                onAdd={() => {
                  const v = notIncludedDraft.trim();
                  if (!v) return;
                  patch('notIncluded', [...form.notIncluded, v]);
                  setNotIncludedDraft('');
                }}
                onRemove={(i) =>
                  patch(
                    'notIncluded',
                    form.notIncluded.filter((_, idx) => idx !== i),
                  )
                }
              />
              <StringListEditor
                label="Öne çıkanlar"
                testId="edit-experience-highlights"
                items={form.highlights}
                draft={highlightsDraft}
                setDraft={setHighlightsDraft}
                onAdd={() => {
                  const v = highlightsDraft.trim();
                  if (!v) return;
                  patch('highlights', [...form.highlights, v]);
                  setHighlightsDraft('');
                }}
                onRemove={(i) =>
                  patch(
                    'highlights',
                    form.highlights.filter((_, idx) => idx !== i),
                  )
                }
              />
            </>
          ) : null}

          {step === 'media' ? (
            <>
              <label className="block text-sm font-medium">
                Fiyat (TRY)
                <input
                  type="number"
                  min={0}
                  data-testid="edit-experience-price"
                  className="mt-1 h-11 w-full rounded-lg border border-neutral-300 px-3"
                  value={form.price}
                  onChange={(e) => patch('price', Number(e.target.value))}
                />
                {errors.price ? (
                  <p className="mt-1 text-xs text-red-600">{errors.price}</p>
                ) : null}
              </label>

              {accessToken ? (
                <ImageUploadField
                  token={accessToken}
                  folder="experiences"
                  entityId={id}
                  currentUrl={form.imageUrl}
                  onUploaded={(url) => patch('imageUrl', url)}
                  onCleared={() => patch('imageUrl', null)}
                  label="Kapak görseli"
                  testId="edit-experience-media-dropzone"
                />
              ) : null}

              <div data-testid="edit-experience-gallery">
                <p className="text-sm font-medium text-neutral-800">
                  Galeri ({form.gallery.length})
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {form.gallery.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className="relative overflow-hidden rounded-lg border border-neutral-200"
                      data-testid={`edit-experience-gallery-item-${index}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt=""
                        className="h-28 w-full object-cover"
                      />
                      <button
                        type="button"
                        data-testid={`edit-experience-gallery-remove-${index}`}
                        aria-label="Görseli sil"
                        onClick={() =>
                          patch(
                            'gallery',
                            form.gallery.filter((_, i) => i !== index),
                          )
                        }
                        className="absolute right-2 top-2 rounded-full bg-white/95 p-1.5 text-red-700 shadow"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                {accessToken && form.gallery.length < 10 ? (
                  <div className="mt-3">
                    <ImageUploadField
                      token={accessToken}
                      folder="experiences"
                      entityId={id}
                      currentUrl={null}
                      onUploaded={(url) =>
                        patch('gallery', [...form.gallery, url])
                      }
                      label="Galeriye görsel ekle"
                      testId="edit-experience-gallery-upload"
                    />
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <div className="flex max-w-2xl items-center justify-between gap-3">
        <button
          type="button"
          data-testid="edit-experience-back-btn"
          onClick={goBack}
          className="inline-flex items-center rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri
        </button>
        {step !== 'media' ? (
          <button
            type="button"
            data-testid="edit-experience-next-btn"
            onClick={goNext}
            className="inline-flex items-center rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Devam Et
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            data-testid="save-experience-btn"
            disabled={saving}
            aria-busy={saving}
            onClick={() => void handleSave()}
            className="inline-flex items-center rounded-lg bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        )}
      </div>

      <section className="mt-8 max-w-2xl" data-testid="edit-experience-dates">
        <h2 className="text-lg font-semibold text-neutral-900">
          Müsait tarihler
        </h2>
        <ul className="mt-3 divide-y rounded-xl border border-neutral-200 bg-white">
          {dates.length === 0 ? (
            <li className="p-3 text-sm text-neutral-600">Tarih yok.</li>
          ) : null}
          {dates.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
              data-testid={`edit-experience-date-${d.id}`}
            >
              <span>
                {d.startDate}
                {d.endDate !== d.startDate ? ` → ${d.endDate}` : ''} ·{' '}
                {d.availableSeats} kontenjan · {d.price} TRY
              </span>
              <button
                type="button"
                data-testid={`edit-experience-date-delete-${d.id}`}
                className="text-xs text-red-700"
                onClick={() => {
                  if (!accessToken) return;
                  void deleteExperienceDate(id, d.id, accessToken)
                    .then(load)
                    .catch((err: Error) => setError(err.message));
                }}
              >
                Sil
              </button>
            </li>
          ))}
        </ul>
        <form
          onSubmit={(e) => void handleAddDate(e)}
          className="mt-4 grid gap-2 rounded-xl border border-neutral-200 p-3 sm:grid-cols-4"
        >
          <input
            type="date"
            required
            data-testid="edit-experience-date-start"
            className="h-10 rounded-lg border border-neutral-300 px-2 text-sm"
            value={newDate.startDate}
            onChange={(e) =>
              setNewDate((d) => ({ ...d, startDate: e.target.value }))
            }
          />
          <input
            type="date"
            required
            data-testid="edit-experience-date-end"
            className="h-10 rounded-lg border border-neutral-300 px-2 text-sm"
            value={newDate.endDate}
            onChange={(e) =>
              setNewDate((d) => ({ ...d, endDate: e.target.value }))
            }
          />
          <input
            type="number"
            min={1}
            data-testid="edit-experience-date-seats"
            className="h-10 rounded-lg border border-neutral-300 px-2 text-sm"
            value={newDate.availableSeats}
            onChange={(e) =>
              setNewDate((d) => ({
                ...d,
                availableSeats: Number(e.target.value),
              }))
            }
          />
          <button
            type="submit"
            data-testid="edit-experience-date-add"
            className="inline-flex h-10 items-center justify-center gap-1 rounded-lg bg-neutral-950 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" />
            Tarih ekle
          </button>
        </form>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  testId,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  testId?: string;
  error?: string;
}) {
  return (
    <label className="block text-sm font-medium text-neutral-800">
      {label}
      <input
        data-testid={testId}
        className={`mt-1 h-11 w-full rounded-lg border px-3 text-sm ${
          error ? 'border-red-500' : 'border-neutral-300'
        }`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows,
  testId,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows: number;
  testId?: string;
  error?: string;
}) {
  return (
    <label className="block text-sm font-medium text-neutral-800">
      {label}
      <textarea
        data-testid={testId}
        rows={rows}
        className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${
          error ? 'border-red-500' : 'border-neutral-300'
        }`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </label>
  );
}

function StringListEditor({
  label,
  items,
  draft,
  setDraft,
  onAdd,
  onRemove,
  testId,
}: {
  label: string;
  items: string[];
  draft: string;
  setDraft: (v: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  testId: string;
}) {
  return (
    <div data-testid={testId}>
      <p className="text-sm font-medium text-neutral-800">{label}</p>
      <div className="mt-2 flex gap-2">
        <input
          data-testid={`${testId}-input`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAdd();
            }
          }}
          className="h-10 flex-1 rounded-lg border border-neutral-300 px-3 text-sm"
          placeholder="Madde ekle…"
        />
        <button
          type="button"
          data-testid={`${testId}-add`}
          onClick={onAdd}
          className="inline-flex items-center rounded-lg border border-neutral-300 px-3 text-sm font-medium"
        >
          <Plus className="mr-1 h-4 w-4" />
          Ekle
        </button>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm"
          >
            <span>{item}</span>
            <button
              type="button"
              aria-label="Kaldır"
              onClick={() => onRemove(index)}
              className="text-neutral-500 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
