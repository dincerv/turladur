'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AGENCY_STAFF_STATUSES,
  AGENCY_STAFF_UI_ROLES,
  createAgencyStaffSchema,
  normalizeStaffModuleAccess,
  type AgencyStaffUiRole,
} from '@turta/shared-validators';
import type { StaffPermissions } from '@turta/shared-types';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ROLE_LABEL } from './role-badge';

/** Formda gösterilen ana modüller (granüler read/write). */
export const STAFF_FORM_PERMISSION_MODULES = [
  { key: 'tours', label: 'Turlar' },
  { key: 'reservations', label: 'Rezervasyonlar' },
  { key: 'financials', label: 'Finans' },
  { key: 'reports', label: 'Raporlar' },
  { key: 'settings', label: 'Ayarlar' },
] as const;

type StaffFormPermissionKey =
  (typeof STAFF_FORM_PERMISSION_MODULES)[number]['key'];

export type StaffPermissionMatrix = Record<
  StaffFormPermissionKey,
  { read: boolean; write: boolean }
>;

function emptyPermissionMatrix(): StaffPermissionMatrix {
  return {
    tours: { read: false, write: false },
    reservations: { read: false, write: false },
    financials: { read: false, write: false },
    reports: { read: false, write: false },
    settings: { read: false, write: false },
  };
}

export function toPermissionMatrix(raw: unknown): StaffPermissionMatrix {
  const base = emptyPermissionMatrix();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  const source = raw as Record<string, unknown>;
  for (const { key } of STAFF_FORM_PERMISSION_MODULES) {
    base[key] = normalizeStaffModuleAccess(source[key]);
  }
  return base;
}

const permissionMatrixSchema = z.object({
  tours: z.object({ read: z.boolean(), write: z.boolean() }),
  reservations: z.object({ read: z.boolean(), write: z.boolean() }),
  financials: z.object({ read: z.boolean(), write: z.boolean() }),
  reports: z.object({ read: z.boolean(), write: z.boolean() }),
  settings: z.object({ read: z.boolean(), write: z.boolean() }),
});

const createFormSchema = createAgencyStaffSchema.extend({
  permissions: permissionMatrixSchema.default(emptyPermissionMatrix()),
});

const editFormSchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  email: z.string().email().optional(),
  role: z.enum(AGENCY_STAFF_UI_ROLES).optional(),
  status: z.enum(AGENCY_STAFF_STATUSES).optional(),
  password: z
    .string()
    .optional()
    .refine(
      (v) => !v || (v.length >= 8 && /[A-Z]/.test(v) && /\d/.test(v)),
      'Şifre en az 8 karakter, 1 büyük harf ve 1 rakam içermelidir',
    ),
  permissions: permissionMatrixSchema.optional(),
});

export type StaffCreateFormValues = z.infer<typeof createFormSchema>;
export type StaffEditFormValues = z.infer<typeof editFormSchema>;

export type StaffFormMode = 'create' | 'edit';

type StaffFormDialogProps = {
  open: boolean;
  mode: StaffFormMode;
  initial?: {
    name: string;
    email: string;
    role: AgencyStaffUiRole;
    status: 'ACTIVE' | 'INACTIVE';
    permissions?: StaffPermissions | unknown;
  };
  /** Self-edit: rol düşürme ve pasife alma UI'da kilitlenir */
  lockOwnerSelf?: boolean;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmitCreate: (values: StaffCreateFormValues) => Promise<void>;
  onSubmitEdit: (values: StaffEditFormValues) => Promise<void>;
};

function PermissionMatrixFields({
  matrix,
  disabled,
  onChange,
}: {
  matrix: StaffPermissionMatrix;
  disabled: boolean;
  onChange: (next: StaffPermissionMatrix) => void;
}) {
  return (
    <div
      className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3"
      data-testid="staff-permissions-matrix"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-neutral-800">
          Modül İzin Matrisi
        </p>
        <p className="text-xs text-neutral-500">Okuma / Yazma</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-neutral-500">
              <th className="pb-2 pr-3 font-semibold">Modül</th>
              <th className="pb-2 px-2 text-center font-semibold">Read</th>
              <th className="pb-2 px-2 text-center font-semibold">Write</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {STAFF_FORM_PERMISSION_MODULES.map(({ key, label }) => {
              const row = matrix[key];
              return (
                <tr key={key} data-testid={`staff-perm-row-${key}`}>
                  <td className="py-2 pr-3 font-medium text-neutral-800">
                    {label}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      data-testid={`staff-perm-${key}-read`}
                      checked={row.read}
                      disabled={disabled}
                      aria-label={`${label} okuma`}
                      onChange={(e) => {
                        const read = e.target.checked;
                        onChange({
                          ...matrix,
                          [key]: {
                            read,
                            write: read ? row.write : false,
                          },
                        });
                      }}
                      className="h-4 w-4 rounded border-neutral-300"
                    />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <input
                      type="checkbox"
                      data-testid={`staff-perm-${key}-write`}
                      checked={row.write}
                      disabled={disabled}
                      aria-label={`${label} yazma`}
                      onChange={(e) => {
                        const write = e.target.checked;
                        onChange({
                          ...matrix,
                          [key]: {
                            read: write ? true : row.read,
                            write,
                          },
                        });
                      }}
                      className="h-4 w-4 rounded border-neutral-300"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StaffFormDialog({
  open,
  mode,
  initial,
  lockOwnerSelf = false,
  submitting,
  error,
  onClose,
  onSubmitCreate,
  onSubmitEdit,
}: StaffFormDialogProps) {
  const isCreate = mode === 'create';

  const createForm = useForm<StaffCreateFormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'AGENT',
      status: 'ACTIVE',
      permissions: emptyPermissionMatrix(),
    },
  });

  const editForm = useForm<StaffEditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'AGENT',
      status: 'ACTIVE',
      permissions: emptyPermissionMatrix(),
    },
  });

  useEffect(() => {
    if (!open) return;
    if (isCreate) {
      createForm.reset({
        name: '',
        email: '',
        password: '',
        role: 'AGENT',
        status: 'ACTIVE',
        permissions: emptyPermissionMatrix(),
      });
    } else if (initial) {
      editForm.reset({
        name: initial.name,
        email: initial.email,
        password: '',
        role: initial.role,
        status: initial.status,
        permissions: toPermissionMatrix(initial.permissions),
      });
    }
  }, [open, isCreate, initial, createForm, editForm]);

  const createPermissions = createForm.watch('permissions');
  const editPermissions = editForm.watch('permissions');

  const activeMatrix = useMemo(() => {
    if (isCreate) {
      return createPermissions ?? emptyPermissionMatrix();
    }
    return editPermissions ?? emptyPermissionMatrix();
  }, [isCreate, createPermissions, editPermissions]);

  const formError = isCreate
    ? createForm.formState.errors
    : editForm.formState.errors;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !submitting) onClose();
      }}
    >
      <DialogContent
        data-testid="staff-form-dialog"
        className="sm:max-w-lg"
        showCloseButton={!submitting}
      >
        <DialogHeader>
          <DialogTitle data-testid="staff-form-title">
            {isCreate ? 'Yeni Personel Ekle' : 'Personel Düzenle'}
          </DialogTitle>
          <DialogDescription>
            {isCreate
              ? 'Rol ve granüler modül izinlerini tanımlayın. OWNER / MANAGER personel yönetebilir.'
              : 'Şifreyi boş bırakırsanız değişmez. Kendinizi düşüremez / silemezsiniz.'}
          </DialogDescription>
        </DialogHeader>

        <form
          data-testid="staff-form"
          className="space-y-4"
          onSubmit={
            isCreate
              ? createForm.handleSubmit(async (values) => {
                  await onSubmitCreate(values);
                })
              : editForm.handleSubmit(async (values) => {
                  await onSubmitEdit(values);
                })
          }
        >
          <div>
            <label
              htmlFor="staff-name"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              Ad Soyad
            </label>
            <Input
              id="staff-name"
              data-testid="staff-name-input"
              {...(isCreate
                ? createForm.register('name')
                : editForm.register('name'))}
              disabled={submitting}
            />
            {formError.name ? (
              <p className="mt-1 text-xs text-red-600">
                {formError.name.message}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="staff-email"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              E-posta
            </label>
            <Input
              id="staff-email"
              type="email"
              data-testid="staff-email-input"
              readOnly={!isCreate}
              {...(isCreate
                ? createForm.register('email')
                : editForm.register('email'))}
              disabled={submitting || !isCreate}
            />
            {isCreate && createForm.formState.errors.email ? (
              <p className="mt-1 text-xs text-red-600">
                {createForm.formState.errors.email.message}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="staff-password"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              {isCreate ? 'Şifre' : 'Yeni şifre (opsiyonel)'}
            </label>
            <Input
              id="staff-password"
              type="password"
              data-testid="staff-password-input"
              autoComplete="new-password"
              {...(isCreate
                ? createForm.register('password')
                : editForm.register('password'))}
              disabled={submitting}
            />
            {formError.password ? (
              <p className="mt-1 text-xs text-red-600">
                {formError.password.message}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="staff-role"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                Rol
              </label>
              <select
                id="staff-role"
                data-testid="staff-role-select"
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                disabled={submitting || lockOwnerSelf}
                {...(isCreate
                  ? createForm.register('role')
                  : editForm.register('role'))}
              >
                {AGENCY_STAFF_UI_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABEL[role]}
                  </option>
                ))}
              </select>
              {lockOwnerSelf ? (
                <p className="mt-1 text-xs text-amber-700">
                  Kendi OWNER rolünüzü düşüremezsiniz
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="staff-status"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                Durum
              </label>
              <select
                id="staff-status"
                data-testid="staff-status-select"
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                disabled={submitting || lockOwnerSelf}
                {...(isCreate
                  ? createForm.register('status')
                  : editForm.register('status'))}
              >
                {AGENCY_STAFF_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status === 'ACTIVE' ? 'Aktif' : 'Pasif'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <PermissionMatrixFields
            matrix={activeMatrix}
            disabled={submitting}
            onChange={(next) => {
              if (isCreate) {
                createForm.setValue('permissions', next, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              } else {
                editForm.setValue('permissions', next, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }
            }}
          />

          {error ? (
            <p
              data-testid="staff-form-error"
              className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              data-testid="staff-form-cancel"
              disabled={submitting}
              onClick={onClose}
            >
              İptal
            </Button>
            <Button
              type="submit"
              data-testid="staff-form-submit"
              disabled={submitting}
            >
              {submitting ? 'Kaydediliyor…' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
