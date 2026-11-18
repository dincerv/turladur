'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  agencySettingsPasswordSchema,
  type AgencySettingsPasswordInput,
} from '@turta/shared-validators';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/services/api-client';
import { changePartnerStaffPassword } from '@/services/partner-admin';

import { SettingsToast } from './settings-toast';

type SecurityFormProps = {
  accessToken: string;
};

export function SecurityForm({ accessToken }: SecurityFormProps) {
  const [toast, setToast] = useState<{
    message: string;
    variant: 'success' | 'error';
  } | null>(null);

  const form = useForm<AgencySettingsPasswordInput>({
    resolver: zodResolver(agencySettingsPasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setToast(null);
    try {
      await changePartnerStaffPassword(values, accessToken);
      form.reset();
      setToast({ message: 'Şifreniz güncellendi.', variant: 'success' });
    } catch (err) {
      setToast({
        message: err instanceof ApiError ? err.message : 'Şifre güncellenemedi',
        variant: 'error',
      });
    }
  });

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6"
      data-testid="settings-security-form"
    >
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Güvenlik</h2>
        <p className="mt-1 text-sm text-gray-500">
          Mevcut şifrenizi doğruladıktan sonra yeni şifre bcrypt ile saklanır.
        </p>
      </div>

      <SettingsToast
        message={toast?.message ?? null}
        variant={toast?.variant ?? 'success'}
      />

      <div className="space-y-4 max-w-md">
        <div>
          <label
            htmlFor="settings-current-password"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Mevcut şifre
          </label>
          <Input
            id="settings-current-password"
            type="password"
            autoComplete="current-password"
            data-testid="settings-current-password"
            {...form.register('currentPassword')}
            disabled={form.formState.isSubmitting}
          />
          {form.formState.errors.currentPassword ? (
            <p className="mt-1 text-xs text-red-600">
              {form.formState.errors.currentPassword.message}
            </p>
          ) : null}
        </div>
        <div>
          <label
            htmlFor="settings-new-password"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Yeni şifre
          </label>
          <Input
            id="settings-new-password"
            type="password"
            autoComplete="new-password"
            data-testid="settings-new-password"
            {...form.register('newPassword')}
            disabled={form.formState.isSubmitting}
          />
          {form.formState.errors.newPassword ? (
            <p className="mt-1 text-xs text-red-600">
              {form.formState.errors.newPassword.message}
            </p>
          ) : null}
        </div>
        <div>
          <label
            htmlFor="settings-confirm-password"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Yeni şifre (tekrar)
          </label>
          <Input
            id="settings-confirm-password"
            type="password"
            autoComplete="new-password"
            data-testid="settings-confirm-password"
            {...form.register('confirmPassword')}
            disabled={form.formState.isSubmitting}
          />
          {form.formState.errors.confirmPassword ? (
            <p className="mt-1 text-xs text-red-600">
              {form.formState.errors.confirmPassword.message}
            </p>
          ) : null}
        </div>
      </div>

      <Button
        type="submit"
        data-testid="settings-security-submit"
        disabled={form.formState.isSubmitting || !form.formState.isDirty}
      >
        {form.formState.isSubmitting ? 'Güncelleniyor…' : 'Şifreyi güncelle'}
      </Button>
    </form>
  );
}
