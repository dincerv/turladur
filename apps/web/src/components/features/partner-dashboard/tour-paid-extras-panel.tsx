'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { createPaidTourExtraSchema } from '@turta/shared-validators';

import { revalidatePartnerTourPaths } from '@/app/(agency)/acente/tours/actions';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';
import {
  createPartnerTourPaidExtra,
  deletePartnerTourPaidExtra,
  listPartnerTourPaidExtras,
  updatePartnerTourPaidExtra,
  type PartnerTourPaidExtra,
} from '@/services/partner-admin';

type TourPaidExtrasPanelProps = {
  tourId: string;
};

export function TourPaidExtrasPanel({ tourId }: TourPaidExtrasPanelProps) {
  const { accessToken } = useAuth();
  const [rows, setRows] = useState<PartnerTourPaidExtra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isRequired, setIsRequired] = useState(false);

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      setRows(await listPartnerTourPaidExtras(tourId, accessToken));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ekstralar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [accessToken, tourId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    const parsed = createPaidTourExtraSchema.safeParse({
      title: title.trim(),
      description: description.trim() || undefined,
      price: Number(price),
      isRequired,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Geçersiz ekstra');
      setBusy(false);
      return;
    }
    try {
      await createPartnerTourPaidExtra(tourId, parsed.data, accessToken);
      setTitle('');
      setPrice('');
      setDescription('');
      setIsRequired(false);
      await revalidatePartnerTourPaths(tourId);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ekstra eklenemedi');
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleActive(row: PartnerTourPaidExtra) {
    if (!accessToken) return;
    setBusy(true);
    try {
      await updatePartnerTourPaidExtra(
        tourId,
        row.id,
        { isActive: !row.isActive },
        accessToken,
      );
      await revalidatePartnerTourPaths(tourId);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Güncellenemedi');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(extraId: string) {
    if (!accessToken) return;
    if (!window.confirm('Bu ekstrayı silmek istediğinize emin misiniz?'))
      return;
    setBusy(true);
    try {
      await deletePartnerTourPaidExtra(tourId, extraId, accessToken);
      await revalidatePartnerTourPaths(tourId);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Silinemedi');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"
      data-testid="tour-paid-extras-panel"
    >
      <h3 className="text-base font-semibold text-neutral-900">
        Ücretli ekstralar
      </h3>
      <p className="mt-1 text-sm text-neutral-600">
        Sigorta, VIP transfer, ekipman vb. Checkout’ta seçilebilir.
      </p>

      {error ? (
        <p
          className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          data-testid="tour-paid-extras-error"
        >
          {error}
        </p>
      ) : null}

      <form
        onSubmit={(e) => void handleCreate(e)}
        className="mt-4 grid gap-3 sm:grid-cols-2"
        data-testid="tour-paid-extras-form"
      >
        <label className="text-sm sm:col-span-2">
          Başlık *
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border px-3 text-sm"
            placeholder="Seyahat sigortası"
            data-testid="tour-extra-title"
          />
        </label>
        <label className="text-sm">
          Fiyat (₺) *
          <input
            required
            type="number"
            min={0.01}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border px-3 text-sm"
            data-testid="tour-extra-price"
          />
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input
            type="checkbox"
            checked={isRequired}
            onChange={(e) => setIsRequired(e.target.checked)}
            data-testid="tour-extra-required"
          />
          Zorunlu (checkout’ta otomatik)
        </label>
        <label className="text-sm sm:col-span-2">
          Açıklama
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border px-3 text-sm"
            data-testid="tour-extra-description"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-neutral-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            data-testid="tour-extra-submit"
          >
            Ekstra ekle
          </button>
        </div>
      </form>

      {loading ? (
        <p className="mt-4 text-sm text-neutral-500">Yükleniyor…</p>
      ) : null}

      <ul
        className="mt-4 divide-y rounded-lg border"
        data-testid="tour-extras-list"
      >
        {rows.length === 0 && !loading ? (
          <li
            className="px-3 py-4 text-sm text-neutral-500"
            data-testid="tour-extras-empty"
          >
            Henüz ücretli ekstra yok.
          </li>
        ) : null}
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex flex-wrap items-center justify-between gap-2 px-3 py-3 text-sm"
            data-testid={`tour-extra-row-${row.id}`}
            data-required={row.isRequired ? 'true' : 'false'}
            data-active={row.isActive ? 'true' : 'false'}
          >
            <div>
              <p className="font-medium">{row.title}</p>
              <p className="text-xs text-neutral-500">
                {Number(row.price).toLocaleString('tr-TR')} {row.currency}
                {row.isRequired ? ' · zorunlu' : ' · opsiyonel'}
                {row.isActive ? '' : ' · pasif'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleToggleActive(row)}
                className="rounded border px-2 py-1 text-xs"
                data-testid={`tour-extra-toggle-${row.id}`}
              >
                {row.isActive ? 'Pasifleştir' : 'Aktifleştir'}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleDelete(row.id)}
                className="rounded border border-red-200 px-2 py-1 text-xs text-red-700"
                data-testid={`tour-extra-delete-${row.id}`}
              >
                Sil
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
