'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
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
import {
  createPartnerExperience,
  getPartnerProfile,
} from '@/services/partner-admin';
import { revalidatePartnerExperiencePaths } from '../actions';

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
  dateStart: string;
  dateEnd: string;
  dateSeats: number;
};

const INITIAL: FormState = {
  title: '',
  description: '',
  longDescription: '',
  category: 'Kültür',
  location: '',
  duration: '2 saat',
  meetingPoint: '',
  ageRestriction: 'everyone',
  included: [],
  notIncluded: [],
  highlights: [],
  price: 500,
  imageUrl: null,
  gallery: [],
  dateStart: '',
  dateEnd: '',
  dateSeats: 12,
};

export default function PartnerNewExperiencePage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>('basic');
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [uploadEntityId, setUploadEntityId] = useState<string | null>(null);
  const [includedDraft, setIncludedDraft] = useState('');
  const [notIncludedDraft, setNotIncludedDraft] = useState('');
  const [highlightsDraft, setHighlightsDraft] = useState('');

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
    if (step === 'basic') return 0;
    if (step === 'content') return 1;
    return 2;
  }, [step]);

  function validateCurrentStep(): boolean {
    if (step === 'basic') {
      const parsed = experienceBasicSchema.safeParse(form);
      if (!parsed.success) {
        setErrors(zodErrorsToRecord(parsed.error));
        return false;
      }
    } else if (step === 'content') {
      const parsed = experienceContentSchema.safeParse(form);
      if (!parsed.success) {
        setErrors(zodErrorsToRecord(parsed.error));
        return false;
      }
    } else {
      const parsed = experienceMediaPricingSchema.safeParse(form);
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
    if (step === 'basic') setStep('content');
    else if (step === 'content') setStep('media');
  }

  function goBack() {
    if (step === 'media') setStep('content');
    else if (step === 'content') setStep('basic');
    else if (
      isDirty &&
      !window.confirm(
        'Kaydedilmemiş değişiklikleriniz var. Çıkmak istiyor musunuz?',
      )
    ) {
      return;
    } else {
      router.push(ACENTE_ROUTES.experiences);
    }
  }

  function addListItem(
    field: 'included' | 'notIncluded' | 'highlights',
    draft: string,
    clear: () => void,
  ) {
    const value = draft.trim();
    if (!value) return;
    patch(field, [...form[field], value].slice(0, 50));
    clear();
  }

  async function handleSubmit() {
    if (!accessToken || !validateCurrentStep()) return;
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      const created = await createPartnerExperience(
        {
          title: form.title.trim(),
          description: form.description.trim(),
          longDescription: form.longDescription.trim(),
          category: form.category,
          location: form.location.trim(),
          duration: form.duration.trim(),
          price: Number(form.price),
          meetingPoint: form.meetingPoint.trim() || undefined,
          ageRestriction: form.ageRestriction || undefined,
          imageUrl: form.imageUrl || undefined,
          gallery: form.gallery.length ? form.gallery : undefined,
          included: form.included,
          notIncluded: form.notIncluded,
          highlights: form.highlights,
          dateStart: form.dateStart || undefined,
          dateEnd: form.dateEnd || undefined,
          dateSeats: form.dateStart ? form.dateSeats : undefined,
        },
        accessToken,
      );
      setIsDirty(false);
      setSaveSuccess(true);
      await revalidatePartnerExperiencePaths(created.id);
      window.setTimeout(() => {
        router.push(`${ACENTE_ROUTES.experiences}/${created.id}/edit`);
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6" data-testid="acente-experience-create-page">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={ACENTE_ROUTES.experiences}
            data-testid="experience-create-back"
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
            Yeni deneyim
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Kaydedilince aktiviteler kataloğuna (onay sonrası) yansır.
            {isDirty ? (
              <span
                className="ml-2 text-amber-700"
                data-testid="experience-dirty-indicator"
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
          Deneyim başarıyla oluşturuldu
        </div>
      ) : null}
      {error ? (
        <p
          role="alert"
          data-testid="experience-create-error"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <div data-testid="experience-create-stepper">
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
              ['content', 'İçerik & Kurallar'],
              ['media', 'Medya & Fiyat'],
            ] as const
          ).map(([key, label], i) => (
            <button
              key={key}
              type="button"
              data-testid={`experience-step-${key}`}
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
                testId="experience-title-input"
                value={form.title}
                error={errors.title}
                onChange={(v) => patch('title', v)}
                required
              />
              <TextArea
                label="Kısa açıklama"
                testId="experience-description-input"
                value={form.description}
                error={errors.description}
                onChange={(v) => patch('description', v)}
                rows={3}
              />
              <TextArea
                label="Detay açıklama"
                testId="experience-long-description-input"
                value={form.longDescription}
                error={errors.longDescription}
                onChange={(v) => patch('longDescription', v)}
                rows={5}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-neutral-800">
                  Kategori
                  <select
                    data-testid="experience-category-select"
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
                  testId="experience-location-input"
                  value={form.location}
                  error={errors.location}
                  onChange={(v) => patch('location', v)}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Süre"
                  testId="experience-duration-input"
                  value={form.duration}
                  error={errors.duration}
                  onChange={(v) => patch('duration', v)}
                  required
                />
                <label className="block text-sm font-medium text-neutral-800">
                  Yaş kısıtı
                  <select
                    data-testid="experience-age-select"
                    className="mt-1 h-11 w-full rounded-lg border border-neutral-300 px-3"
                    value={form.ageRestriction}
                    onChange={(e) =>
                      patch(
                        'ageRestriction',
                        e.target.value as FormState['ageRestriction'],
                      )
                    }
                  >
                    <option value="everyone">Herkes</option>
                    <option value="12+">12+</option>
                    <option value="18+">18+</option>
                  </select>
                </label>
              </div>
              <Field
                label="Buluşma noktası"
                testId="experience-meeting-input"
                value={form.meetingPoint}
                onChange={(v) => patch('meetingPoint', v)}
              />
            </>
          ) : null}

          {step === 'content' ? (
            <>
              <StringListEditor
                label="Dahil olanlar"
                testId="experience-included"
                items={form.included}
                draft={includedDraft}
                setDraft={setIncludedDraft}
                onAdd={() =>
                  addListItem('included', includedDraft, () =>
                    setIncludedDraft(''),
                  )
                }
                onRemove={(i) =>
                  patch(
                    'included',
                    form.included.filter((_, idx) => idx !== i),
                  )
                }
              />
              <StringListEditor
                label="Dahil olmayanlar"
                testId="experience-not-included"
                items={form.notIncluded}
                draft={notIncludedDraft}
                setDraft={setNotIncludedDraft}
                onAdd={() =>
                  addListItem('notIncluded', notIncludedDraft, () =>
                    setNotIncludedDraft(''),
                  )
                }
                onRemove={(i) =>
                  patch(
                    'notIncluded',
                    form.notIncluded.filter((_, idx) => idx !== i),
                  )
                }
              />
              <StringListEditor
                label="Öne çıkanlar"
                testId="experience-highlights"
                items={form.highlights}
                draft={highlightsDraft}
                setDraft={setHighlightsDraft}
                onAdd={() =>
                  addListItem('highlights', highlightsDraft, () =>
                    setHighlightsDraft(''),
                  )
                }
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
              <label className="block text-sm font-medium text-neutral-800">
                Fiyat (TRY)
                <input
                  type="number"
                  min={0}
                  step="1"
                  data-testid="experience-price-input"
                  className="mt-1 h-11 w-full rounded-lg border border-neutral-300 px-3"
                  value={form.price}
                  onChange={(e) => patch('price', Number(e.target.value))}
                />
                {errors.price ? (
                  <p className="mt-1 text-xs text-red-600">{errors.price}</p>
                ) : null}
              </label>

              {accessToken && uploadEntityId ? (
                <ImageUploadField
                  token={accessToken}
                  folder="experiences"
                  entityId={uploadEntityId}
                  currentUrl={form.imageUrl}
                  onUploaded={(url) => patch('imageUrl', url)}
                  onCleared={() => patch('imageUrl', null)}
                  label="Kapak görseli (CDN)"
                  testId="experience-media-dropzone"
                />
              ) : (
                <p className="text-xs text-neutral-500">
                  Görsel yükleme için oturum bekleniyor…
                </p>
              )}

              <div className="rounded-xl border border-neutral-200 p-4">
                <p className="text-sm font-semibold text-neutral-900">
                  İlk müsait tarih (opsiyonel)
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <label className="text-xs font-medium text-neutral-700">
                    Başlangıç
                    <input
                      type="date"
                      data-testid="experience-date-start"
                      className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-2"
                      value={form.dateStart}
                      onChange={(e) => patch('dateStart', e.target.value)}
                    />
                  </label>
                  <label className="text-xs font-medium text-neutral-700">
                    Bitiş
                    <input
                      type="date"
                      data-testid="experience-date-end"
                      className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-2"
                      value={form.dateEnd}
                      onChange={(e) => patch('dateEnd', e.target.value)}
                    />
                  </label>
                  <label className="text-xs font-medium text-neutral-700">
                    Kontenjan
                    <input
                      type="number"
                      min={1}
                      data-testid="experience-date-seats"
                      className="mt-1 h-10 w-full rounded-lg border border-neutral-300 px-2"
                      value={form.dateSeats}
                      onChange={(e) =>
                        patch('dateSeats', Number(e.target.value))
                      }
                    />
                  </label>
                </div>
                {errors.dateStart || errors.dateEnd ? (
                  <p className="mt-2 text-xs text-red-600">
                    {errors.dateStart || errors.dateEnd}
                  </p>
                ) : null}
              </div>
            </>
          ) : null}
        </motion.div>
      </AnimatePresence>

      <div className="flex max-w-2xl items-center justify-between gap-3">
        <button
          type="button"
          data-testid="experience-step-back-btn"
          onClick={goBack}
          className="inline-flex items-center rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Geri
        </button>
        {step !== 'media' ? (
          <button
            type="button"
            data-testid="experience-step-next-btn"
            onClick={goNext}
            className="inline-flex items-center rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Devam Et
            <ArrowRight className="ml-2 h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            data-testid="submit-experience-btn"
            disabled={saving || !accessToken}
            aria-busy={saving}
            onClick={() => void handleSubmit()}
            className="inline-flex items-center rounded-lg bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  testId,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  testId?: string;
  error?: string;
}) {
  return (
    <label className="block text-sm font-medium text-neutral-800">
      {label}
      <input
        required={required}
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
