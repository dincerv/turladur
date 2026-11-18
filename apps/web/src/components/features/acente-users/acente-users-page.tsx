'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Trash2, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hasAgencyOwnerAccess } from '@/lib/partner-permissions';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';
import {
  createPartnerSubUser,
  deletePartnerSubUser,
  getPartnerProfile,
  listPartnerSubUsers,
  updatePartnerSubUser,
  type PartnerSubUser,
} from '@/services/partner-admin';

import { revalidateAgencyUsersPath } from '@/app/(agency)/acente/users/actions';

import { RoleBadge, resolveUiRole } from './role-badge';
import {
  StaffFormDialog,
  toPermissionMatrix,
  type StaffCreateFormValues,
  type StaffEditFormValues,
} from './staff-form-dialog';

const SAFE_ERROR = 'Personel listesi yüklenemedi. Lütfen tekrar deneyin.';

function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

function UsersSkeleton() {
  return (
    <div className="animate-pulse space-y-2" data-testid="users-skeleton">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-14 rounded-lg border border-neutral-100 bg-white"
        />
      ))}
    </div>
  );
}

export function AcenteUsersPage() {
  const { accessToken, user } = useAuth();
  const canManage = hasAgencyOwnerAccess(user?.role);

  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [rows, setRows] = useState<PartnerSubUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [selected, setSelected] = useState<PartnerSubUser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const currentStaffId = user?.id ?? null;

  const load = useCallback(async () => {
    if (!accessToken || !canManage) return;
    setLoading(true);
    setError(null);
    try {
      const [profile, list] = await Promise.all([
        getPartnerProfile(accessToken),
        listPartnerSubUsers(accessToken),
      ]);
      setPartnerId(profile.id);
      setRows(list);
    } catch (err) {
      setRows([]);
      setError(err instanceof ApiError ? err.message : SAFE_ERROR);
    } finally {
      setLoading(false);
    }
  }, [accessToken, canManage]);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    if (!canManage) {
      setLoading(false);
      return;
    }
    void load();
  }, [accessToken, canManage, load]);

  const openCreate = () => {
    setDialogMode('create');
    setSelected(null);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (row: PartnerSubUser) => {
    setDialogMode('edit');
    setSelected(row);
    setFormError(null);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (submitting) return;
    setDialogOpen(false);
    setSelected(null);
    setFormError(null);
  };

  const handleCreate = async (values: StaffCreateFormValues) => {
    if (!accessToken || !partnerId) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await createPartnerSubUser(
        partnerId,
        {
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role,
          permissions: values.permissions,
        },
        accessToken,
      );
      await revalidateAgencyUsersPath();
      setDialogOpen(false);
      setFlash('Personel eklendi');
      await load();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'Personel eklenemedi',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (values: StaffEditFormValues) => {
    if (!accessToken || !partnerId || !selected) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const body: {
        name?: string;
        role?: string;
        status?: string;
        password?: string;
        permissions?: StaffCreateFormValues['permissions'];
      } = {};
      if (values.name) body.name = values.name;
      if (values.role) body.role = values.role;
      if (values.status) body.status = values.status;
      if (values.password) body.password = values.password;
      if (values.permissions) body.permissions = values.permissions;

      await updatePartnerSubUser(partnerId, selected.id, body, accessToken);
      await revalidateAgencyUsersPath();
      setDialogOpen(false);
      setSelected(null);
      setFlash('Personel güncellendi');
      await load();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'Personel güncellenemedi',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (row: PartnerSubUser) => {
    if (!accessToken || !partnerId) return;
    if (currentStaffId && row.id === currentStaffId) {
      setFlash('Kendi hesabınızı pasife alamazsınız');
      return;
    }
    const next = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setTogglingId(row.id);
    setRows((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, status: next } : r)),
    );
    try {
      await updatePartnerSubUser(
        partnerId,
        row.id,
        { status: next },
        accessToken,
      );
      setFlash(
        next === 'ACTIVE' ? 'Personel aktif edildi' : 'Personel pasife alındı',
      );
    } catch (err) {
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, status: row.status } : r)),
      );
      setError(err instanceof ApiError ? err.message : 'Durum güncellenemedi');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (row: PartnerSubUser) => {
    if (!accessToken || !partnerId) return;
    if (currentStaffId && row.id === currentStaffId) {
      setFlash('Kendinizi silemezsiniz');
      return;
    }
    if (
      !window.confirm(
        `"${row.name}" personelini silmek istediğinize emin misiniz?`,
      )
    ) {
      return;
    }
    try {
      await deletePartnerSubUser(partnerId, row.id, accessToken);
      await revalidateAgencyUsersPath();
      setFlash('Personel silindi');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Personel silinemedi');
    }
  };

  const editInitial = useMemo(() => {
    if (!selected) return undefined;
    return {
      name: selected.name,
      email: selected.email,
      role: resolveUiRole(selected.role, selected.uiRole),
      status: (selected.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE') as
        'ACTIVE' | 'INACTIVE',
      permissions: toPermissionMatrix(selected.permissions),
    };
  }, [selected]);

  const lockOwnerSelf = Boolean(
    selected &&
    currentStaffId &&
    selected.id === currentStaffId &&
    resolveUiRole(selected.role, selected.uiRole) === 'OWNER',
  );

  if (!canManage) {
    return (
      <div
        className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-10 text-center"
        data-testid="users-forbidden"
      >
        <Users className="mx-auto mb-3 h-10 w-10 text-amber-700" />
        <h1 className="text-lg font-semibold text-amber-950">
          Yetkisiz erişim
        </h1>
        <p className="mt-2 text-sm text-amber-800">
          Personel yönetimi yalnızca OWNER veya MANAGER rollerine açıktır.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="acente-users-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Personel Yönetimi
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Yalnızca bu acentenin personeli listelenir. OWNER / MANAGER ve
            tenant izolasyonu sunucu tarafında zorunludur.
          </p>
        </div>
        <Button
          type="button"
          data-testid="users-add-button"
          onClick={openCreate}
        >
          <UserPlus className="h-4 w-4" />
          Yeni Personel Ekle
        </Button>
      </div>

      {flash ? (
        <div
          data-testid="users-flash"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800"
        >
          {flash}
        </div>
      ) : null}

      {error ? (
        <div
          data-testid="users-error"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
          <button
            type="button"
            className="ml-3 underline"
            onClick={() => void load()}
          >
            Yenile
          </button>
        </div>
      ) : null}

      {loading ? (
        <UsersSkeleton />
      ) : rows.length === 0 ? (
        <div
          data-testid="users-empty"
          className="rounded-xl border border-dashed border-neutral-200 bg-white px-6 py-16 text-center text-neutral-500"
        >
          Henüz personel eklenmemiş
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
          data-testid="users-table"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-100 text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Personel</th>
                  <th className="px-4 py-3">E-posta</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3">Son işlem</th>
                  <th className="px-4 py-3 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((row) => {
                  const isSelf = Boolean(
                    currentStaffId && row.id === currentStaffId,
                  );
                  const uiRole = resolveUiRole(row.role, row.uiRole);
                  const active = row.status === 'ACTIVE';
                  return (
                    <tr
                      key={row.id}
                      data-testid={`staff-row-${row.id}`}
                      data-staff-email={row.email}
                      className="hover:bg-neutral-50/80"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700">
                            {row.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-neutral-900">
                              {row.name}
                              {isSelf ? (
                                <span className="ml-2 text-xs font-normal text-neutral-400">
                                  (siz)
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {row.email}
                      </td>
                      <td className="px-4 py-3">
                        <RoleBadge role={row.role} uiRole={uiRole} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={active}
                          data-testid={`staff-status-toggle-${row.id}`}
                          disabled={togglingId === row.id || isSelf}
                          onClick={() => void handleToggleStatus(row)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-50 ${
                            active ? 'bg-emerald-500' : 'bg-neutral-300'
                          }`}
                          title={
                            isSelf
                              ? 'Kendi hesabınızı pasife alamazsınız'
                              : active
                                ? 'Pasife al'
                                : 'Aktif et'
                          }
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                              active ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className="ml-2 text-xs text-neutral-500">
                          {active ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-500">
                        {formatDateTime(row.updatedAt ?? row.lastLoginAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            data-testid={`staff-edit-${row.id}`}
                            aria-label="Düzenle"
                            onClick={() => openEdit(row)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            data-testid={`staff-delete-${row.id}`}
                            aria-label="Sil"
                            disabled={isSelf}
                            onClick={() => void handleDelete(row)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <StaffFormDialog
        open={dialogOpen}
        mode={dialogMode}
        initial={editInitial}
        lockOwnerSelf={lockOwnerSelf}
        submitting={submitting}
        error={formError}
        onClose={closeDialog}
        onSubmitCreate={handleCreate}
        onSubmitEdit={handleEdit}
      />
    </div>
  );
}
