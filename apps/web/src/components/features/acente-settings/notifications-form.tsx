'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  agencySettingsNotificationsSchema,
  type AgencySettingsNotificationsInput,
} from '@turta/shared-validators';

import { Button } from '@/components/ui/button';
import { ApiError } from '@/services/api-client';
import {
  updatePartnerNotifications,
  type PartnerNotificationPrefs,
} from '@/services/partner-admin';

import { SettingsToast } from './settings-toast';

const TOGGLES: Array<{
  key: keyof AgencySettingsNotificationsInput;
  label: string;
  hint: string;
}> = [
  {
    key: 'emailReservations',
    label: 'Rezervasyon e-postaları',
    hint: 'Yeni ve güncellenen rezervasyonlar',
  },
  {
    key: 'emailReviews',
    label: 'Değerlendirme e-postaları',
    hint: 'Yeni müşteri yorumları',
  },
  {
    key: 'emailFinancials',
    label: 'Finans e-postaları',
    hint: 'Ödeme ve hakediş bildirimleri',
  },
  {
    key: 'emailMarketing',
    label: 'Pazarlama e-postaları',
    hint: 'Ürün duyuruları ve ipuçları',
  },
  {
    key: 'pushEnabled',
    label: 'Anlık bildirimler',
    hint: 'Tarayıcı / uygulama bildirimleri',
  },
];

type NotificationsFormProps = {
  accessToken: string;
  initial: PartnerNotificationPrefs;
  onSaved: (prefs: PartnerNotificationPrefs) => void;
};

export function NotificationsForm({
  accessToken,
  initial,
  onSaved,
}: NotificationsFormProps) {
  const [toast, setToast] = useState<{
    message: string;
    variant: 'success' | 'error';
  } | null>(null);

  const form = useForm<AgencySettingsNotificationsInput>({
    resolver: zodResolver(agencySettingsNotificationsSchema),
    defaultValues: initial,
  });

  useEffect(() => {
    form.reset(initial);
  }, [initial, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setToast(null);
    try {
      const result = await updatePartnerNotifications(values, accessToken);
      onSaved(result.notifications);
      form.reset(result.notifications);
      setToast({
        message: 'Bildirim tercihleri kaydedildi.',
        variant: 'success',
      });
    } catch (err) {
      setToast({
        message:
          err instanceof ApiError ? err.message : 'Bildirimler kaydedilemedi',
        variant: 'error',
      });
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6"
      data-testid="settings-notifications-form"
    >
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Bildirimler</h2>
        <p className="mt-1 text-sm text-gray-500">
          Tercihler yalnızca sizin personel hesabınıza kaydedilir.
        </p>
      </div>

      <SettingsToast
        message={toast?.message ?? null}
        variant={toast?.variant ?? 'success'}
      />

      <div className="space-y-3">
        {TOGGLES.map((item) => (
          <label
            key={item.key}
            className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-gray-100 bg-gray-50/60 px-4 py-3"
            data-testid={`settings-notify-${item.key}`}
          >
            <span>
              <span className="block text-sm font-medium text-gray-900">
                {item.label}
              </span>
              <span className="block text-xs text-gray-500">{item.hint}</span>
            </span>
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
              checked={!!form.watch(item.key)}
              onChange={(e) =>
                form.setValue(item.key, e.target.checked, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              disabled={form.formState.isSubmitting}
            />
          </label>
        ))}
      </div>

      <Button
        type="submit"
        data-testid="settings-notifications-submit"
        disabled={form.formState.isSubmitting || !form.formState.isDirty}
      >
        {form.formState.isSubmitting ? 'Kaydediliyor…' : 'Kaydet'}
      </Button>
    </form>
  );
}
