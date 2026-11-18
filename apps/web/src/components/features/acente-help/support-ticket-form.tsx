'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  agencySupportTicketCreateSchema,
  SUPPORT_TICKET_CATEGORIES,
  SUPPORT_TICKET_PRIORITIES,
  type AgencySupportTicketCreateInput,
} from '@turta/shared-validators';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/services/api-client';
import {
  createPartnerSupportTicket,
  type PartnerSupportTicket,
} from '@/services/partner-admin';

const PRIORITY_LABEL: Record<
  (typeof SUPPORT_TICKET_PRIORITIES)[number],
  string
> = {
  LOW: 'Düşük',
  MEDIUM: 'Orta',
  HIGH: 'Yüksek',
};

const CATEGORY_LABEL: Record<
  (typeof SUPPORT_TICKET_CATEGORIES)[number],
  string
> = {
  RESERVATIONS: 'Rezervasyonlar',
  PAYMENTS: 'Ödemeler',
  ASSIGNMENTS: 'Atamalar',
  ACCOUNT: 'Hesap',
  OTHER: 'Diğer',
};

type SupportTicketFormProps = {
  accessToken: string;
  onCreated: (ticket: PartnerSupportTicket) => void;
};

export function SupportTicketForm({
  accessToken,
  onCreated,
}: SupportTicketFormProps) {
  const [toast, setToast] = useState<{
    message: string;
    variant: 'success' | 'error';
  } | null>(null);

  const form = useForm<AgencySupportTicketCreateInput>({
    resolver: zodResolver(agencySupportTicketCreateSchema),
    defaultValues: {
      subject: '',
      message: '',
      priority: 'MEDIUM',
      category: 'OTHER',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setToast(null);
    try {
      const ticket = await createPartnerSupportTicket(values, accessToken);
      form.reset({
        subject: '',
        message: '',
        priority: 'MEDIUM',
        category: 'OTHER',
      });
      onCreated(ticket);
      setToast({
        message: 'Destek talebiniz oluşturuldu.',
        variant: 'success',
      });
    } catch (err) {
      setToast({
        message:
          err instanceof ApiError
            ? err.message
            : 'Talep oluşturulamadı. Lütfen tekrar deneyin.',
        variant: 'error',
      });
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4"
      data-testid="help-ticket-form"
    >
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Destek talebi oluştur
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Talebiniz acentenize bağlanır. Spam koruması için dakikada en fazla 5
          istek gönderilebilir.
        </p>
      </div>

      {toast ? (
        <p
          role="status"
          data-testid="help-ticket-toast"
          data-variant={toast.variant}
          className={`rounded-md px-3 py-2 text-sm ${
            toast.variant === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {toast.message}
        </p>
      ) : null}

      <div>
        <label
          htmlFor="help-ticket-subject"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Konu
        </label>
        <Input
          id="help-ticket-subject"
          data-testid="help-ticket-subject"
          {...form.register('subject')}
          disabled={form.formState.isSubmitting}
        />
        {form.formState.errors.subject ? (
          <p className="mt-1 text-xs text-red-600">
            {form.formState.errors.subject.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="help-ticket-priority"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Öncelik
          </label>
          <select
            id="help-ticket-priority"
            data-testid="help-ticket-priority"
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            {...form.register('priority')}
            disabled={form.formState.isSubmitting}
          >
            {SUPPORT_TICKET_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="help-ticket-category"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Kategori
          </label>
          <select
            id="help-ticket-category"
            data-testid="help-ticket-category"
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
            {...form.register('category')}
            disabled={form.formState.isSubmitting}
          >
            {SUPPORT_TICKET_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="help-ticket-message"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Mesaj
        </label>
        <textarea
          id="help-ticket-message"
          data-testid="help-ticket-message"
          rows={5}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          {...form.register('message')}
          disabled={form.formState.isSubmitting}
        />
        {form.formState.errors.message ? (
          <p className="mt-1 text-xs text-red-600">
            {form.formState.errors.message.message}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        data-testid="help-ticket-submit"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? 'Gönderiliyor…' : 'Talep gönder'}
      </Button>
    </form>
  );
}
