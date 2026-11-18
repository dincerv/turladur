'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';

import { InviteAssignmentModal } from '@/components/features/acente-assignments/invite-assignment-modal';
import { ACENTE_ROUTES } from '@/lib/panel-routes';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';
import {
  cancelTourDateAssignment,
  listAgencyAssignments,
  withdrawTourDateAssignment,
  type TourDateAssignmentRow,
} from '@/services/tour-date-assignment';

import { revalidateAssignmentsPath } from './actions';

type FilterStatus = 'all' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
type FilterRole = 'all' | 'GUIDE' | 'BUS';

type ToastState = {
  type: 'success' | 'error';
  message: string;
} | null;

type ResendPrefill = {
  role: 'GUIDE' | 'BUS';
  tourDateId?: string;
  guideId?: string;
  busCompanyId?: string;
};

function toDay(iso: string): string {
  return iso.slice(0, 10);
}

function formatRange(start: string, end: string): string {
  const from = toDay(start);
  const to = toDay(end);
  return from === to ? from : `${from} → ${to}`;
}

function statusLabel(status: string): string {
  if (status === 'PENDING') return 'Beklemede';
  if (status === 'ACCEPTED') return 'Kabul edildi';
  if (status === 'REJECTED') return 'Reddedildi';
  return status;
}

function statusClass(status: string): string {
  if (status === 'PENDING')
    return 'bg-amber-50 text-amber-800 border-amber-200';
  if (status === 'ACCEPTED')
    return 'bg-green-50 text-green-800 border-green-200';
  if (status === 'REJECTED') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-gray-50 text-gray-700 border-gray-200';
}

function roleLabel(role: string): string {
  if (role === 'GUIDE') return 'Rehber';
  if (role === 'BUS') return 'Otobüs';
  return role;
}

function assigneeLabel(row: TourDateAssignmentRow): string {
  if (row.role === 'GUIDE') {
    const guide = row.guide;
    if (!guide) return row.guideId ?? 'Rehber';
    return `${guide.firstName} ${guide.lastName}`.trim() || guide.email;
  }
  return row.busCompany?.companyName ?? row.busCompanyId ?? 'Otobüs firması';
}

const STATUS_TABS: Array<{ key: FilterStatus; label: string }> = [
  { key: 'all', label: 'Tümü' },
  { key: 'PENDING', label: 'Bekleyen Davetler' },
  { key: 'ACCEPTED', label: 'Kabul Edilenler' },
  { key: 'REJECTED', label: 'Reddedilenler' },
];

export default function AgencyAssignmentsPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<TourDateAssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [roleFilter, setRoleFilter] = useState<FilterRole>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [resendPrefill, setResendPrefill] = useState<
    ResendPrefill | undefined
  >();

  const showToast = useCallback(
    (type: 'success' | 'error', message: string) => {
      setToast({ type, message });
      window.setTimeout(() => setToast(null), 4000);
    },
    [],
  );

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await listAgencyAssignments(accessToken);
      setRows(data);
    } catch (err) {
      showToast(
        'error',
        err instanceof ApiError ? err.message : 'Atamalar yüklenemedi',
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (roleFilter !== 'all' && row.role !== roleFilter) return false;
      return true;
    });
  }, [rows, statusFilter, roleFilter]);

  const counts = useMemo(() => {
    return {
      all: rows.length,
      PENDING: rows.filter((r) => r.status === 'PENDING').length,
      ACCEPTED: rows.filter((r) => r.status === 'ACCEPTED').length,
      REJECTED: rows.filter((r) => r.status === 'REJECTED').length,
    };
  }, [rows]);

  async function afterMutation() {
    await revalidateAssignmentsPath();
    router.refresh();
    await load();
  }

  async function handleWithdraw(assignmentId: string) {
    if (!accessToken) return;
    const snapshot = rows;
    setBusyId(assignmentId);
    setRows((prev) => prev.filter((r) => r.id !== assignmentId));
    try {
      await withdrawTourDateAssignment(accessToken, assignmentId);
      showToast('success', 'Davet geri çekildi');
      await afterMutation();
    } catch (err) {
      setRows(snapshot);
      showToast(
        'error',
        err instanceof ApiError ? err.message : 'Geri çekme başarısız',
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel(assignmentId: string) {
    if (!accessToken) return;
    const snapshot = rows;
    setBusyId(assignmentId);
    setRows((prev) =>
      prev.map((r) =>
        r.id === assignmentId
          ? { ...r, status: 'REJECTED', note: 'Cancelled by agency' }
          : r,
      ),
    );
    try {
      await cancelTourDateAssignment(accessToken, assignmentId);
      showToast('success', 'Atama iptal edildi');
      await afterMutation();
    } catch (err) {
      setRows(snapshot);
      showToast(
        'error',
        err instanceof ApiError ? err.message : 'İptal başarısız',
      );
    } finally {
      setBusyId(null);
    }
  }

  function openNewInvite() {
    setResendPrefill(undefined);
    setModalOpen(true);
  }

  function openResend(row: TourDateAssignmentRow) {
    setResendPrefill({
      role: row.role === 'BUS' ? 'BUS' : 'GUIDE',
      tourDateId: row.tourDateId,
      guideId: row.guideId ?? undefined,
      busCompanyId: row.busCompanyId ?? undefined,
    });
    setModalOpen(true);
  }

  return (
    <div className="space-y-6" data-testid="acente-assignments-page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Atamalar</h1>
          <p className="mt-1 text-sm text-gray-600">
            Rehber ve otobüs / araç davetlerini buradan yönetin. Çakışan tarih
            aralıklarında aktif görev engellenir.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
            data-testid="assignments-refresh-btn"
          >
            <RefreshCw className="h-4 w-4" />
            Yenile
          </button>
          <button
            type="button"
            onClick={openNewInvite}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700"
            data-testid="assignments-new-invite-btn"
          >
            <Plus className="h-4 w-4" />
            Yeni Atama / Davet Gönder
          </button>
        </div>
      </div>

      <div
        className="rounded-xl border border-gray-100 bg-white p-2 shadow-sm"
        data-testid="assignments-tabs"
        role="tablist"
        aria-label="Atama durumu"
      >
        <div className="flex flex-wrap gap-1">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={statusFilter === tab.key}
              data-testid={`assignments-tab-${tab.key}`}
              onClick={() => setStatusFilter(tab.key)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                statusFilter === tab.key
                  ? 'bg-blue-50 text-blue-800'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-[10px] text-gray-400">
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1 border-t border-gray-100 pt-2">
          {(
            [
              ['all', 'Rol: Tümü'],
              ['GUIDE', 'Rehber'],
              ['BUS', 'Otobüs'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              data-testid={`assignments-role-${key}`}
              onClick={() => setRoleFilter(key)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                roleFilter === key
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {toast ? (
        <p
          role="status"
          data-testid="assignments-toast"
          data-toast-type={toast.type}
          className={`rounded-lg border px-3 py-2 text-sm ${
            toast.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {toast.message}
        </p>
      ) : null}

      {loading ? (
        <div
          className="flex h-40 items-center justify-center"
          data-testid="assignments-loading"
        >
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-blue-500" />
        </div>
      ) : null}

      {!loading && filtered.length === 0 ? (
        <div
          className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center text-sm text-gray-500"
          data-testid="assignments-empty"
        >
          Atama bulunamadı. Yeni davet göndermek için yukarıdaki butonu
          kullanın.
        </div>
      ) : null}

      {!loading && filtered.length > 0 ? (
        <div
          className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm"
          data-testid="assignments-table"
        >
          <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Tur</th>
                <th className="px-4 py-3 font-medium">Tarih</th>
                <th className="px-4 py-3 font-medium">Personel / Araç</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="px-4 py-3 font-medium text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((row) => {
                const tourId = row.tourDate?.tour.id;
                const tourTitle = row.tourDate?.tour.title ?? 'Tur';
                const range =
                  row.tourDate != null
                    ? formatRange(row.tourDate.startDate, row.tourDate.endDate)
                    : '—';
                return (
                  <tr
                    key={row.id}
                    data-testid={`assignment-row-${row.id}`}
                    className="align-top"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {tourTitle}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{range}</td>
                    <td className="px-4 py-3 text-gray-800">
                      {assigneeLabel(row)}
                      {row.note ? (
                        <span className="mt-1 block text-xs text-gray-400">
                          {row.note}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                        {roleLabel(row.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusClass(row.status)}`}
                        data-testid={`assignment-status-${row.id}`}
                      >
                        {statusLabel(row.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {tourId ? (
                          <Link
                            href={`${ACENTE_ROUTES.tours}/${tourId}`}
                            className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Tur
                          </Link>
                        ) : null}
                        {row.role === 'BUS' &&
                        row.status === 'ACCEPTED' &&
                        tourId &&
                        row.tourDateId ? (
                          <Link
                            href={ACENTE_ROUTES.tourDateSeats(
                              tourId,
                              row.tourDateId,
                            )}
                            className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                          >
                            Koltuk
                          </Link>
                        ) : null}
                        {row.status === 'PENDING' ? (
                          <button
                            type="button"
                            disabled={busyId === row.id}
                            data-testid={`assignment-withdraw-${row.id}`}
                            onClick={() => void handleWithdraw(row.id)}
                            className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Geri çek
                          </button>
                        ) : null}
                        {row.status === 'ACCEPTED' ? (
                          <button
                            type="button"
                            disabled={busyId === row.id}
                            data-testid={`assignment-cancel-${row.id}`}
                            onClick={() => void handleCancel(row.id)}
                            className="rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            İptal
                          </button>
                        ) : null}
                        {row.status === 'REJECTED' ||
                        row.status === 'PENDING' ? (
                          <button
                            type="button"
                            data-testid={`assignment-resend-${row.id}`}
                            onClick={() => openResend(row)}
                            className="rounded-md border border-blue-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                          >
                            Yeniden gönder
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {accessToken ? (
        <InviteAssignmentModal
          open={modalOpen}
          accessToken={accessToken}
          prefills={resendPrefill}
          onClose={() => {
            setModalOpen(false);
            setResendPrefill(undefined);
          }}
          onSuccess={(message) => {
            showToast('success', message);
            void afterMutation();
          }}
        />
      ) : null}
    </div>
  );
}
