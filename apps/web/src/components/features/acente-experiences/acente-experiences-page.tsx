'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { LayoutGrid, List, Plus, Search, Trash2, X } from 'lucide-react';

import { useDebouncedInput } from '@/components/features/activity/activities-page/use-debounced-input';
import { ACENTE_ROUTES } from '@/lib/panel-routes';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';
import {
  deletePartnerExperience,
  listPartnerExperiences,
  updatePartnerExperience,
  type PartnerExperience,
  type PartnerExperienceListMeta,
} from '@/services/partner-admin';
import { revalidatePartnerExperiencePaths } from '@/app/(agency)/acente/experiences/actions';

import { ExperiencesSkeleton } from './experiences-skeleton';
import {
  EXPERIENCE_STATUS_FILTERS,
  experiencesSearchToQueryString,
  isExperienceLive,
  nextExperienceToggleStatus,
  parseExperiencesSearchParams,
  sanitizeExperienceText,
  type ExperienceStatusFilter,
  type ExperiencesSearchParams,
} from './experiences-query';

const PAGE_SIZE = 12;
const SAFE_ERROR = 'Aktivite listesi yüklenemedi. Lütfen tekrar deneyin.';

const STATUS_LABELS: Record<ExperienceStatusFilter, string> = {
  DRAFT: 'Taslak',
  PENDING_REVIEW: 'İncelemede',
  PUBLISHED: 'Yayında',
  ARCHIVED: 'Pasif',
};

function statusBadgeClass(status: string) {
  if (isExperienceLive(status)) return 'bg-emerald-50 text-emerald-700';
  if (status === 'ARCHIVED') return 'bg-neutral-100 text-neutral-600';
  return 'bg-amber-50 text-amber-700';
}

export function AcenteExperiencesPage() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const filters = useMemo(
    () => parseExperiencesSearchParams(searchParams),
    [searchParams],
  );

  const [items, setItems] = useState<PartnerExperience[]>([]);
  const [meta, setMeta] = useState<PartnerExperienceListMeta>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const replaceFilters = useCallback(
    (next: Partial<ExperiencesSearchParams>) => {
      const merged: ExperiencesSearchParams = {
        q: next.q ?? filters.q,
        status: 'status' in next ? next.status : filters.status,
        category: 'category' in next ? next.category : filters.category,
        page: next.page ?? filters.page,
        view: next.view ?? filters.view,
      };
      if (next.q !== undefined || 'status' in next || 'category' in next) {
        merged.page = next.page ?? 1;
      }
      const qs = experiencesSearchToQueryString(merged);
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [filters, pathname, router],
  );

  const { draft, setDraft, flush } = useDebouncedInput(
    filters.q,
    (value) => replaceFilters({ q: value.trim().slice(0, 80), page: 1 }),
    { delay: 400 },
  );

  const load = useCallback(async () => {
    if (!accessToken) return;
    setError(null);
    try {
      const result = await listPartnerExperiences(accessToken, {
        q: filters.q || undefined,
        status: filters.status,
        category: filters.category,
        page: filters.page,
        pageSize: PAGE_SIZE,
      });
      setItems(result.items);
      setMeta(result.meta);
    } catch (err) {
      console.error('[acente-experiences] load failed', {
        code: err instanceof ApiError ? err.code : 'UNKNOWN',
        status: err instanceof ApiError ? err.status : undefined,
      });
      setError(SAFE_ERROR);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, filters.q, filters.status, filters.category, filters.page]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  async function handleToggleStatus(item: PartnerExperience) {
    if (!accessToken || togglingId) return;
    const nextStatus = nextExperienceToggleStatus(item.status);
    const previous = item.status;
    setTogglingId(item.id);
    setError(null);
    // Optimistic UI
    setItems((prev) =>
      prev.map((row) =>
        row.id === item.id ? { ...row, status: nextStatus } : row,
      ),
    );
    try {
      await updatePartnerExperience(
        item.id,
        { status: nextStatus },
        accessToken,
      );
      await revalidatePartnerExperiencePaths(item.id);
    } catch (err) {
      setItems((prev) =>
        prev.map((row) =>
          row.id === item.id ? { ...row, status: previous } : row,
        ),
      );
      setError(err instanceof Error ? err.message : 'Durum güncellenemedi');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!accessToken) return;
    if (!confirm('Bu aktiviteyi silmek istiyor musunuz?')) return;
    setDeletingId(id);
    setError(null);
    try {
      await deletePartnerExperience(id, accessToken);
      await revalidatePartnerExperiencePaths(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silinemedi');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <ExperiencesSkeleton />;

  return (
    <div className="space-y-6" data-testid="acente-experiences-page">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aktiviteler</h1>
          <p className="mt-1 text-sm text-gray-600">
            Müşteri sitesinde Aktiviteler olarak görünür.
          </p>
        </div>
        <Link
          href={`${ACENTE_ROUTES.experiences}/new`}
          data-testid="new-experience-btn"
          className="inline-flex items-center justify-center rounded-lg bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Yeni Aktivite
        </Link>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={flush}
              onKeyDown={(e) => {
                if (e.key === 'Enter') flush();
              }}
              placeholder="Başlık, kategori, lokasyon…"
              data-testid="search-experience-input"
              aria-label="Aktivite ara"
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-9 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
            {draft ? (
              <button
                type="button"
                data-testid="clear-experience-search"
                aria-label="Aramayı temizle"
                onClick={() => {
                  setDraft('');
                  replaceFilters({ q: '', page: 1 });
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              data-testid="experience-status-filter"
              value={filters.status ?? ''}
              onChange={(e) =>
                replaceFilters({
                  status: (e.target.value || undefined) as
                    ExperienceStatusFilter | undefined,
                  page: 1,
                })
              }
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              aria-label="Durum filtresi"
            >
              <option value="">Tüm durumlar</option>
              {EXPERIENCE_STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>

            <div
              className="inline-flex rounded-lg border border-gray-200 p-0.5"
              role="group"
              aria-label="Görünüm"
            >
              <button
                type="button"
                data-testid="experience-view-grid"
                aria-pressed={filters.view === 'grid'}
                onClick={() => replaceFilters({ view: 'grid' })}
                className={`rounded-md p-2 ${
                  filters.view === 'grid'
                    ? 'bg-neutral-950 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                data-testid="experience-view-list"
                aria-pressed={filters.view === 'list'}
                onClick={() => replaceFilters({ view: 'list' })}
                className={`rounded-md p-2 ${
                  filters.view === 'list'
                    ? 'bg-neutral-950 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        {isPending ? (
          <p className="mt-2 text-xs text-gray-500">Filtreler güncelleniyor…</p>
        ) : null}
      </div>

      {error ? (
        <p
          role="alert"
          data-testid="experiences-error"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      {items.length === 0 ? (
        <div
          className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center"
          data-testid="experiences-empty-state"
        >
          <p className="text-lg font-semibold text-gray-700">
            Aktivite bulunamadı
          </p>
          <p className="mt-2 text-sm text-gray-500">
            {filters.q || filters.status
              ? 'Arama veya filtre kriterlerinizi değiştirmeyi deneyin.'
              : 'Henüz aktivite eklenmemiş.'}
          </p>
          {!filters.q && !filters.status ? (
            <Link
              href={`${ACENTE_ROUTES.experiences}/new`}
              className="mt-6 inline-flex rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
            >
              İlk aktiviteyi ekle
            </Link>
          ) : null}
        </div>
      ) : filters.view === 'list' ? (
        <div
          className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm"
          data-testid="experiences-list-view"
        >
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-neutral-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Başlık</th>
                <th className="px-4 py-3 font-semibold">Kategori</th>
                <th className="px-4 py-3 font-semibold">Fiyat</th>
                <th className="px-4 py-3 font-semibold">Süre</th>
                <th className="px-4 py-3 font-semibold">Durum</th>
                <th className="px-4 py-3 font-semibold">Aksiyon</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <ExperienceRow
                  key={item.id}
                  item={item}
                  toggling={togglingId === item.id}
                  deleting={deletingId === item.id}
                  onToggle={() => void handleToggleStatus(item)}
                  onDelete={() => void handleDelete(item.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
          data-testid="experiences-grid-view"
        >
          {items.map((item) => (
            <ExperienceCard
              key={item.id}
              item={item}
              toggling={togglingId === item.id}
              deleting={deletingId === item.id}
              onToggle={() => void handleToggleStatus(item)}
              onDelete={() => void handleDelete(item.id)}
            />
          ))}
        </div>
      )}

      {meta.totalPages > 1 ? (
        <div
          className="flex items-center justify-between gap-3"
          data-testid="experiences-pagination"
        >
          <p className="text-sm text-gray-600">
            Toplam {meta.total} · Sayfa {meta.page}/{meta.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              data-testid="experiences-prev-page"
              disabled={meta.page <= 1}
              onClick={() => replaceFilters({ page: meta.page - 1 })}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Önceki
            </button>
            <button
              type="button"
              data-testid="experiences-next-page"
              disabled={meta.page >= meta.totalPages}
              onClick={() => replaceFilters({ page: meta.page + 1 })}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Sonraki
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ExperienceCard({
  item,
  toggling,
  deleting,
  onToggle,
  onDelete,
}: {
  item: PartnerExperience;
  toggling: boolean;
  deleting: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const live = isExperienceLive(item.status);
  return (
    <div
      className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
      data-testid={`experience-card-${item.id}`}
    >
      <div className="border-b border-gray-100 bg-gradient-to-br from-neutral-50 to-neutral-100 p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-base font-semibold text-gray-900">
            {sanitizeExperienceText(item.title, 100)}
          </h3>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(item.status)}`}
            data-testid={`experience-status-${item.id}`}
          >
            {STATUS_LABELS[item.status as ExperienceStatusFilter] ??
              item.status}
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          {sanitizeExperienceText(item.category, 40)} ·{' '}
          {sanitizeExperienceText(item.location, 40)}
        </p>
        {item.duration ? (
          <p className="mt-1 text-xs text-gray-500">
            Süre: {sanitizeExperienceText(item.duration, 40)}
            {item.ageRestriction
              ? ` · Yaş: ${sanitizeExperienceText(item.ageRestriction, 40)}`
              : ''}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-lg font-bold text-neutral-900">
          {Number(item.price).toLocaleString('tr-TR')} {item.currency}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={live}
            aria-label={live ? 'Pasife al' : 'Aktif et'}
            data-testid={`toggle-status-btn-${item.id}`}
            disabled={toggling}
            onClick={onToggle}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:opacity-50 ${
              live ? 'bg-emerald-600' : 'bg-neutral-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                live ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <Link
            href={`${ACENTE_ROUTES.experiences}/${item.id}/edit`}
            data-testid={`edit-experience-btn-${item.id}`}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Düzenle
          </Link>
          <button
            type="button"
            data-testid={`delete-experience-btn-${item.id}`}
            disabled={deleting}
            onClick={onDelete}
            className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            aria-label="Sil"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ExperienceRow({
  item,
  toggling,
  deleting,
  onToggle,
  onDelete,
}: {
  item: PartnerExperience;
  toggling: boolean;
  deleting: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const live = isExperienceLive(item.status);
  return (
    <tr
      className="border-b border-gray-50 last:border-0"
      data-testid={`experience-row-${item.id}`}
    >
      <td className="px-4 py-3 font-medium text-gray-900">
        {sanitizeExperienceText(item.title, 80)}
      </td>
      <td className="px-4 py-3 text-gray-600">
        {sanitizeExperienceText(item.category, 40)}
      </td>
      <td className="px-4 py-3 text-gray-900">
        {Number(item.price).toLocaleString('tr-TR')} {item.currency}
      </td>
      <td className="px-4 py-3 text-gray-600">
        {sanitizeExperienceText(item.duration ?? '—', 40)}
      </td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(item.status)}`}
          data-testid={`experience-status-${item.id}`}
        >
          {STATUS_LABELS[item.status as ExperienceStatusFilter] ?? item.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={live}
            data-testid={`toggle-status-btn-${item.id}`}
            disabled={toggling}
            onClick={onToggle}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:opacity-50 ${
              live ? 'bg-emerald-600' : 'bg-neutral-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                live ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <Link
            href={`${ACENTE_ROUTES.experiences}/${item.id}/edit`}
            data-testid={`edit-experience-btn-${item.id}`}
            className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium"
          >
            Düzenle
          </Link>
          <button
            type="button"
            data-testid={`delete-experience-btn-${item.id}`}
            disabled={deleting}
            onClick={onDelete}
            className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:text-red-600 disabled:opacity-50"
            aria-label="Sil"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
