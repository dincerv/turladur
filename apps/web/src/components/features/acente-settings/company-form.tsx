'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload } from 'lucide-react';
import {
  agencySettingsCompanySchema,
  type AgencySettingsCompanyInput,
} from '@turta/shared-validators';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { resolveMediaUrl } from '@/lib/media';
import { ApiError } from '@/services/api-client';
import {
  getPresignedUpload,
  updatePartnerCompanyLogo,
  updatePartnerProfile,
  type PartnerCompanyProfile,
} from '@/services/partner-admin';

import { SettingsToast } from './settings-toast';

const LOGO_MAX_BYTES = 2 * 1024 * 1024;
const LOGO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

type CompanyFormProps = {
  accessToken: string;
  initial: PartnerCompanyProfile;
  onSaved: (company: PartnerCompanyProfile) => void;
};

function toFormValues(
  company: PartnerCompanyProfile,
): AgencySettingsCompanyInput {
  return {
    companyName: company.companyName ?? '',
    legalTitle: company.legalTitle ?? company.companyName ?? '',
    taxNumber: (company.taxNumber ?? '').replace(/\D/g, '').slice(0, 11),
    contactEmail: company.contactEmail ?? '',
    contactPhone: company.contactPhone,
    address: company.address ?? '',
    city: company.city,
    country: company.country,
    website: company.website,
    logo: company.logo,
  };
}

export function CompanyForm({
  accessToken,
  initial,
  onSaved,
}: CompanyFormProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{
    message: string;
    variant: 'success' | 'error';
  } | null>(null);
  const [logoPending, setLogoPending] = useState(false);

  const form = useForm<AgencySettingsCompanyInput>({
    // Zod optional+nullable+transform → input/output mismatch with RHF.
    resolver: zodResolver(
      agencySettingsCompanySchema,
    ) as Resolver<AgencySettingsCompanyInput>,
    defaultValues: toFormValues(initial),
  });

  useEffect(() => {
    form.reset(toFormValues(initial));
  }, [initial, form]);

  const logoPreview = resolveMediaUrl(form.watch('logo') ?? null);

  const onSubmit = form.handleSubmit(async (values) => {
    setToast(null);
    try {
      const result = await updatePartnerProfile(
        {
          companyName: values.companyName,
          legalTitle: values.legalTitle,
          taxNumber: values.taxNumber,
          contactEmail: values.contactEmail,
          contactPhone: values.contactPhone,
          address: values.address,
          city: values.city,
          country: values.country,
          website: values.website,
          logo: values.logo,
        },
        accessToken,
      );
      const next: PartnerCompanyProfile = {
        ...initial,
        ...result,
        legalTitle: result.legalTitle ?? values.legalTitle,
        contactEmail: result.contactEmail ?? values.contactEmail,
        taxNumber: result.taxNumber ?? values.taxNumber,
      };
      onSaved(next);
      form.reset(toFormValues(next));
      setToast({
        message: 'Şirket bilgileri güncellendi.',
        variant: 'success',
      });
    } catch (err) {
      setToast({
        message: err instanceof ApiError ? err.message : 'Şirket kaydedilemedi',
        variant: 'error',
      });
    }
  });

  async function handleLogoFile(file: File | null) {
    if (!file) return;
    if (file.size > LOGO_MAX_BYTES) {
      setToast({
        message: 'Dosya boyutu 2MB sınırını aşıyor.',
        variant: 'error',
      });
      return;
    }
    if (!(LOGO_TYPES as readonly string[]).includes(file.type)) {
      setToast({
        message: 'Sadece JPG, PNG, GIF veya WebP yükleyin.',
        variant: 'error',
      });
      return;
    }
    setLogoPending(true);
    setToast(null);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const presigned = await getPresignedUpload(
        {
          folder: 'operators',
          entityId: initial.id,
          filename: safeName,
          contentType: file.type,
        },
        accessToken,
      );
      const uploadRes = await fetch(presigned.uploadUrl, {
        method: 'PUT',
        headers:
          presigned.uploadHeaders ??
          ({ 'Content-Type': file.type } satisfies Record<string, string>),
        body: file,
      });
      if (!uploadRes.ok) throw new Error('Yükleme başarısız');
      const logoResult = await updatePartnerCompanyLogo(
        presigned.publicUrl,
        accessToken,
      );
      form.setValue('logo', logoResult.logo, { shouldDirty: true });
      onSaved({ ...initial, logo: logoResult.logo });
      setToast({ message: 'Logo güncellendi.', variant: 'success' });
    } catch (err) {
      setToast({
        message: err instanceof ApiError ? err.message : 'Logo yüklenemedi',
        variant: 'error',
      });
    } finally {
      setLogoPending(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6"
      data-testid="settings-company-form"
    >
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Şirket</h2>
        <p className="mt-1 text-sm text-gray-500">
          Yasal unvan, vergi no ve fatura bilgileri yalnızca OWNER tarafından
          güncellenebilir.
        </p>
      </div>

      <SettingsToast
        message={toast?.message ?? null}
        variant={toast?.variant ?? 'success'}
      />

      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border bg-white">
          {logoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoPreview}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs text-gray-400">Logo</span>
          )}
        </div>
        <div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            data-testid="settings-company-logo-input"
            onChange={(e) => void handleLogoFile(e.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            variant="outline"
            disabled={logoPending || form.formState.isSubmitting}
            data-testid="settings-company-logo-btn"
            onClick={() => logoInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {logoPending ? 'Yükleniyor…' : 'Logo yükle'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {(
          [
            ['companyName', 'Şirket adı', 'settings-company-name'],
            ['legalTitle', 'Yasal unvan', 'settings-company-legal'],
            ['taxNumber', 'Vergi numarası', 'settings-company-tax'],
            ['contactEmail', 'İletişim e-posta', 'settings-company-email'],
            ['contactPhone', 'Telefon', 'settings-company-phone'],
            ['city', 'Şehir', 'settings-company-city'],
            ['country', 'Ülke', 'settings-company-country'],
            ['website', 'Web sitesi', 'settings-company-website'],
          ] as const
        ).map(([key, label, testId]) => (
          <div key={key}>
            <label
              htmlFor={testId}
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {label}
            </label>
            <Input
              id={testId}
              data-testid={testId}
              {...form.register(key)}
              disabled={form.formState.isSubmitting}
            />
            {form.formState.errors[key] ? (
              <p className="mt-1 text-xs text-red-600">
                {form.formState.errors[key]?.message as string}
              </p>
            ) : null}
          </div>
        ))}
        <div className="sm:col-span-2">
          <label
            htmlFor="settings-company-address"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Adres
          </label>
          <Input
            id="settings-company-address"
            data-testid="settings-company-address"
            {...form.register('address')}
            disabled={form.formState.isSubmitting}
          />
          {form.formState.errors.address ? (
            <p className="mt-1 text-xs text-red-600">
              {form.formState.errors.address.message}
            </p>
          ) : null}
        </div>
      </div>

      <Button
        type="submit"
        data-testid="settings-company-submit"
        disabled={form.formState.isSubmitting || !form.formState.isDirty}
      >
        {form.formState.isSubmitting ? 'Kaydediliyor…' : 'Şirketi kaydet'}
      </Button>
    </form>
  );
}
