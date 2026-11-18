'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AGENCY_STAFF_STATUSES,
  AGENCY_STAFF_UI_ROLES,
  createAgencyStaffSchema,
  type AgencyStaffUiRole,
} from '@turta/shared-validators';

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

const createFormSchema = createAgencyStaffSchema;
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
  };
  /** Self-edit: rol düşürme ve pasife alma UI'da kilitlenir */
  lockOwnerSelf?: boolean;
  submitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmitCreate: (values: StaffCreateFormValues) => Promise<void>;
  onSubmitEdit: (values: StaffEditFormValues) => Promise<void>;
};

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
      });
    } else if (initial) {
      editForm.reset({
        name: initial.name,
        email: initial.email,
        password: '',
        role: initial.role,
        status: initial.status,
      });
    }
  }, [open, isCreate, initial, createForm, editForm]);

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
        className="sm:max-w-md"
        showCloseButton={!submitting}
      >
        <DialogHeader>
          <DialogTitle data-testid="staff-form-title">
            {isCreate ? 'Yeni Personel Ekle' : 'Personel Düzenle'}
          </DialogTitle>
          <DialogDescription>
            {isCreate
              ? 'Şifre bcrypt ile saklanır. Rol: OWNER, MANAGER veya AGENT.'
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
