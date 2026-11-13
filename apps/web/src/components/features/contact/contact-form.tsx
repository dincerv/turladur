'use client';

import { memo, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CONTACT_SUBJECT_LABELS,
  CONTACT_SUBJECTS,
  contactMessageSchema,
  toContactMessagePayload,
  type ContactMessageFormValues,
} from '@turta/shared-validators';
import { AlertCircle, CheckCircle2, Loader2, Send } from 'lucide-react';

import { ApiError } from '@/services/api-client';
import { sendContactMessage } from '@/services/contact';

const INPUT_CLASS =
  'w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:opacity-70';

const ERROR_CLASS = 'mt-1.5 text-xs font-medium text-red-600';

type FormStatus =
  | { type: 'idle' }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string };

function ContactFormBase() {
  const formId = useId();
  const honeypotRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<FormStatus>({ type: 'idle' });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactMessageFormValues>({
    resolver: zodResolver(contactMessageSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: '',
    },
    mode: 'onTouched',
    reValidateMode: 'onChange',
  });

  const onSubmit = handleSubmit(async (values) => {
    if (isSubmitting) return;
    setStatus({ type: 'idle' });

    const payload = toContactMessagePayload(
      values,
      honeypotRef.current?.value ?? '',
    );

    try {
      await sendContactMessage(payload);
      reset();
      if (honeypotRef.current) honeypotRef.current.value = '';
      setStatus({
        type: 'success',
        message:
          'Mesajınız alındı. Mesai saatlerinde en kısa sürede dönüş yapacağız.',
      });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Mesaj gönderilemedi. Lütfen biraz sonra tekrar deneyin.';
      setStatus({ type: 'error', message });
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="relative space-y-6"
      aria-busy={isSubmitting}
    >
      {/* Honeypot — visually hidden, not display:none so bots still fill it */}
      <div
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
        aria-hidden
      >
        <label htmlFor={`${formId}-website`}>Website</label>
        <input
          ref={honeypotRef}
          id={`${formId}-website`}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {status.type === 'success' ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <p>{status.message}</p>
        </div>
      ) : null}

      {status.type === 'error' ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <p>{status.message}</p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label
            htmlFor={`${formId}-name`}
            className="mb-1.5 block text-sm font-medium text-neutral-700"
          >
            Ad Soyad
          </label>
          <input
            id={`${formId}-name`}
            type="text"
            autoComplete="name"
            disabled={isSubmitting}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? `${formId}-name-err` : undefined}
            className={INPUT_CLASS}
            placeholder="Ad Soyad"
            {...register('name')}
          />
          {errors.name ? (
            <p id={`${formId}-name-err`} className={ERROR_CLASS}>
              {errors.name.message}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor={`${formId}-email`}
            className="mb-1.5 block text-sm font-medium text-neutral-700"
          >
            E-posta Adresiniz
          </label>
          <input
            id={`${formId}-email`}
            type="email"
            autoComplete="email"
            disabled={isSubmitting}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? `${formId}-email-err` : undefined}
            className={INPUT_CLASS}
            placeholder="email@example.com"
            {...register('email')}
          />
          {errors.email ? (
            <p id={`${formId}-email-err`} className={ERROR_CLASS}>
              {errors.email.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label
            htmlFor={`${formId}-phone`}
            className="mb-1.5 block text-sm font-medium text-neutral-700"
          >
            Telefon <span className="text-neutral-400">(Opsiyonel)</span>
          </label>
          <input
            id={`${formId}-phone`}
            type="tel"
            autoComplete="tel"
            disabled={isSubmitting}
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? `${formId}-phone-err` : undefined}
            className={INPUT_CLASS}
            placeholder="+90 5XX XXX XX XX"
            {...register('phone')}
          />
          {errors.phone ? (
            <p id={`${formId}-phone-err`} className={ERROR_CLASS}>
              {errors.phone.message}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor={`${formId}-subject`}
            className="mb-1.5 block text-sm font-medium text-neutral-700"
          >
            Konu
          </label>
          <select
            id={`${formId}-subject`}
            disabled={isSubmitting}
            aria-invalid={errors.subject ? true : undefined}
            aria-describedby={
              errors.subject ? `${formId}-subject-err` : undefined
            }
            className={INPUT_CLASS}
            defaultValue=""
            {...register('subject')}
          >
            <option value="" disabled>
              Konu Seçiniz
            </option>
            {CONTACT_SUBJECTS.map((key) => (
              <option key={key} value={key}>
                {CONTACT_SUBJECT_LABELS[key]}
              </option>
            ))}
          </select>
          {errors.subject ? (
            <p id={`${formId}-subject-err`} className={ERROR_CLASS}>
              {errors.subject.message}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label
          htmlFor={`${formId}-message`}
          className="mb-1.5 block text-sm font-medium text-neutral-700"
        >
          Mesajınız
        </label>
        <textarea
          id={`${formId}-message`}
          rows={5}
          disabled={isSubmitting}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={
            errors.message ? `${formId}-message-err` : undefined
          }
          className={`${INPUT_CLASS} resize-y min-h-[120px]`}
          placeholder="Mesajınızı detaylı bir şekilde yazınız..."
          {...register('message')}
        />
        {errors.message ? (
          <p id={`${formId}-message-err`} className={ERROR_CLASS}>
            {errors.message.message}
          </p>
        ) : null}
      </div>

      <div className="flex items-start pt-1">
        <input
          id={`${formId}-privacy`}
          type="checkbox"
          disabled={isSubmitting}
          aria-invalid={errors.privacy ? true : undefined}
          aria-describedby={
            errors.privacy ? `${formId}-privacy-err` : undefined
          }
          className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-sky-600 focus:ring-2 focus:ring-sky-500/40"
          {...register('privacy')}
        />
        <label
          htmlFor={`${formId}-privacy`}
          className="ml-2.5 text-sm leading-relaxed text-neutral-600"
        >
          Kişisel verilerimin işlenmesine ilişkin{' '}
          <Link
            href="/privacy"
            className="text-sky-600 transition-colors hover:text-sky-700 hover:underline"
          >
            aydınlatma metnini
          </Link>{' '}
          okudum ve kabul ediyorum.
        </label>
      </div>
      {errors.privacy ? (
        <p id={`${formId}-privacy-err`} className={ERROR_CLASS}>
          {errors.privacy.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center rounded-lg bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
            Gönderiliyor…
          </>
        ) : (
          <>
            <Send className="mr-2 h-5 w-5" aria-hidden />
            Mesajı Gönder
          </>
        )}
      </button>
    </form>
  );
}

/** Memoized so typing in the form cannot re-render the map / page chrome. */
const ContactForm = memo(ContactFormBase);
export default ContactForm;
