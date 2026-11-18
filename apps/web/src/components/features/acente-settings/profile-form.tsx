'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  agencySettingsProfileSchema,
  type AgencySettingsProfileInput,
} from '@turta/shared-validators';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/services/api-client';
import { updatePartnerStaffProfile } from '@/services/partner-admin';

import { SettingsToast } from './settings-toast';

type ProfileFormProps = {
  accessToken: string;
  initialName: string;
  email: string;
  onSaved: (name: string) => void;
};

export function ProfileForm({
  accessToken,
  initialName,
  email,
  onSaved,
}: ProfileFormProps) {
  const [toast, setToast] = useState<{
    message: string;
    variant: 'success' | 'error';
  } | null>(null);

  const form = useForm<AgencySettingsProfileInput>({
    resolver: zodResolver(agencySettingsProfileSchema),
    defaultValues: { name: initialName },
  });

  useEffect(() => {
    form.reset({ name: initialName });
  }, [initialName, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    setToast(null);
    try {
      const result = await updatePartnerStaffProfile(values, accessToken);
      onSaved(result.name);
      form.reset({ name: result.name });
      setToast({ message: 'Profil güncellendi.', variant: 'success' });
    } catch (err) {
      setToast({
        message: err instanceof ApiError ? err.message : 'Profil kaydedilemedi',
        variant: 'error',
      });
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6"
      data-testid="settings-profile-form"
    >
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Profil</h2>
        <p className="mt-1 text-sm text-gray-500">
          Oturum açmış personel bilgileriniz (kullanıcıya özel).
        </p>
      </div>

      <SettingsToast
        message={toast?.message ?? null}
        variant={toast?.variant ?? 'success'}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label
            htmlFor="settings-name"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Ad Soyad
          </label>
          <Input
            id="settings-name"
            data-testid="settings-profile-name"
            {...form.register('name')}
            disabled={form.formState.isSubmitting}
          />
          {form.formState.errors.name ? (
            <p className="mt-1 text-xs text-red-600">
              {form.formState.errors.name.message}
            </p>
          ) : null}
        </div>
        <div className="sm:col-span-2">
          <label
            htmlFor="settings-email"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            E-posta
          </label>
          <Input
            id="settings-email"
            data-testid="settings-profile-email"
            value={email}
            readOnly
            disabled
          />
        </div>
      </div>

      <Button
        type="submit"
        data-testid="settings-profile-submit"
        disabled={form.formState.isSubmitting || !form.formState.isDirty}
      >
        {form.formState.isSubmitting ? 'Kaydediliyor…' : 'Kaydet'}
      </Button>
    </form>
  );
}
