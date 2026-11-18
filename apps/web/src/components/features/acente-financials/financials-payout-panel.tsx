'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import { Building2, Plus, Star, Wallet } from 'lucide-react';
import {
  normalizeIban,
  parseAgencyBankAccountCreate,
  parseAgencyPayoutRequest,
  TR_IBAN_REGEX,
} from '@turta/shared-validators';
import { ZodError } from 'zod';

import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';
import {
  createPartnerBankAccount,
  createPartnerPayoutRequest,
  listPartnerBankAccounts,
  listPartnerPayouts,
  setDefaultPartnerBankAccount,
  type PartnerBankAccount,
  type PartnerPayoutRequest,
} from '@/services/partner-admin';

const PAYOUT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Bekliyor',
  APPROVED: 'Onaylandı',
  REJECTED: 'Reddedildi',
  COMPLETED: 'Tamamlandı',
  PAID: 'Ödendi',
  FAILED: 'Başarısız',
};

function payoutStatusClass(status: string) {
  if (status === 'PENDING')
    return 'bg-amber-50 text-amber-800 border-amber-200';
  if (status === 'APPROVED') return 'bg-sky-50 text-sky-800 border-sky-200';
  if (status === 'COMPLETED' || status === 'PAID')
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  if (status === 'REJECTED' || status === 'FAILED')
    return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-neutral-50 text-neutral-700 border-neutral-200';
}

function money(value: string | number, currency = 'TRY') {
  return `${Number(value).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function maskIban(iban: string) {
  const n = normalizeIban(iban);
  if (n.length < 8) return n;
  return `${n.slice(0, 4)} **** **** ${n.slice(-4)}`;
}

type Props = {
  withdrawableBalance: string;
  currency: string;
  onBalanceMaybeChanged?: () => void;
};

export function FinancialsPayoutPanel({
  withdrawableBalance,
  currency,
  onBalanceMaybeChanged,
}: Props) {
  const { accessToken } = useAuth();
  const [accounts, setAccounts] = useState<PartnerBankAccount[]>([]);
  const [payouts, setPayouts] = useState<PartnerPayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [iban, setIban] = useState('');
  const [accountName, setAccountName] = useState('');
  const [bankName, setBankName] = useState('');
  const [makeDefault, setMakeDefault] = useState(true);
  const [bankErrors, setBankErrors] = useState<Record<string, string>>({});
  const [bankBusy, setBankBusy] = useState(false);

  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutBankId, setPayoutBankId] = useState('');
  const [payoutNote, setPayoutNote] = useState('');
  const [payoutErrors, setPayoutErrors] = useState<Record<string, string>>({});
  const [payoutBusy, setPayoutBusy] = useState(false);

  const defaultAccount = useMemo(
    () => accounts.find((a) => a.isDefault) ?? accounts[0] ?? null,
    [accounts],
  );

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const [banks, pay] = await Promise.all([
        listPartnerBankAccounts(accessToken),
        listPartnerPayouts(accessToken),
      ]);
      setAccounts(banks.items);
      setPayouts(pay.items);
      if (!payoutBankId && banks.items[0]) {
        const preferred =
          banks.items.find((a) => a.isDefault)?.id ?? banks.items[0].id;
        setPayoutBankId(preferred);
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Banka / payout verileri yüklenemedi',
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, payoutBankId]);

  useEffect(() => {
    void load();
  }, [load]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 3500);
  }

  async function handleCreateBank(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setBankErrors({});
    try {
      const body = parseAgencyBankAccountCreate({
        iban,
        accountName,
        bankName,
        isDefault: makeDefault,
      });
      setBankBusy(true);
      await createPartnerBankAccount(body, accessToken);
      setBankModalOpen(false);
      setIban('');
      setAccountName('');
      setBankName('');
      showToast('Banka hesabı eklendi');
      await load();
    } catch (err) {
      if (err instanceof ZodError) {
        const map: Record<string, string> = {};
        for (const issue of err.issues) {
          const key = String(issue.path[0] ?? 'iban');
          if (!map[key]) map[key] = issue.message;
        }
        setBankErrors(map);
        return;
      }
      setBankErrors({
        form:
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Kayıt başarısız',
      });
    } finally {
      setBankBusy(false);
    }
  }

  async function handleSetDefault(id: string) {
    if (!accessToken) return;
    try {
      await setDefaultPartnerBankAccount(id, accessToken);
      showToast('Varsayılan hesap güncellendi');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Güncellenemedi');
    }
  }

  async function handleCreatePayout(e: FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setPayoutErrors({});
    try {
      const body = parseAgencyPayoutRequest({
        amount: Number(payoutAmount),
        bankInfoId: payoutBankId,
        note: payoutNote,
      });
      setPayoutBusy(true);
      await createPartnerPayoutRequest(body, accessToken);
      setPayoutModalOpen(false);
      setPayoutAmount('');
      setPayoutNote('');
      showToast('Para çekme talebi oluşturuldu');
      await load();
      onBalanceMaybeChanged?.();
    } catch (err) {
      if (err instanceof ZodError) {
        const map: Record<string, string> = {};
        for (const issue of err.issues) {
          const key = String(issue.path[0] ?? 'amount');
          if (!map[key]) map[key] = issue.message;
        }
        setPayoutErrors(map);
        return;
      }
      setPayoutErrors({
        form:
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Talep oluşturulamadı',
      });
    } finally {
      setPayoutBusy(false);
    }
  }

  const liveIban = normalizeIban(iban);
  const ibanHint =
    liveIban && !TR_IBAN_REGEX.test(liveIban)
      ? 'IBAN TR ile başlamalı ve 26 karakter olmalı'
      : null;

  return (
    <section className="space-y-4" data-testid="financials-payout-panel">
      {toast ? (
        <div
          role="status"
          data-testid="payout-toast"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
        >
          {toast}
        </div>
      ) : null}
      {error ? (
        <p
          role="alert"
          data-testid="payout-panel-error"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div
          className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
          data-testid="bank-accounts-card"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-neutral-950">
                Banka hesapları
              </h2>
              <p className="text-xs text-neutral-500">
                IBAN kayıtları ve varsayılan hesap
              </p>
            </div>
            <button
              type="button"
              data-testid="add-bank-account-btn"
              onClick={() => setBankModalOpen(true)}
              className="inline-flex items-center rounded-lg bg-neutral-950 px-3 py-2 text-xs font-semibold text-white hover:bg-neutral-800"
            >
              <Plus className="mr-1 h-3.5 w-3.5" aria-hidden />
              IBAN ekle
            </button>
          </div>

          {loading ? (
            <div className="h-20 animate-pulse rounded-lg bg-neutral-100" />
          ) : accounts.length === 0 ? (
            <p
              className="rounded-lg border border-dashed border-neutral-200 px-3 py-6 text-center text-sm text-neutral-500"
              data-testid="bank-accounts-empty"
            >
              Henüz banka hesabı yok. Payout için IBAN ekleyin.
            </p>
          ) : (
            <ul className="space-y-2" data-testid="bank-accounts-list">
              {accounts.map((account) => (
                <li
                  key={account.id}
                  data-testid={`bank-account-row-${account.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-100 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-neutral-900">
                      {account.accountName}
                    </p>
                    <p className="font-mono text-xs text-neutral-600">
                      {maskIban(account.iban)}
                    </p>
                    {account.bankName ? (
                      <p className="text-xs text-neutral-500">
                        {account.bankName}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {account.isDefault ? (
                      <span
                        data-testid={`bank-default-badge-${account.id}`}
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                      >
                        <Star className="h-3 w-3" aria-hidden />
                        Varsayılan
                      </span>
                    ) : (
                      <button
                        type="button"
                        data-testid={`set-default-bank-${account.id}`}
                        onClick={() => void handleSetDefault(account.id)}
                        className="rounded-lg border border-neutral-200 px-2 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        Varsayılan yap
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div
          className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
          data-testid="payout-request-card"
        >
          <div className="mb-3 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-neutral-950">
                Para çekme
              </h2>
              <p className="text-xs text-neutral-500">
                Çekilebilir bakiye üzerinden talep oluşturun
              </p>
            </div>
            <Building2 className="h-5 w-5 text-neutral-400" aria-hidden />
          </div>

          <div
            className="mb-4 rounded-lg bg-neutral-50 px-3 py-3"
            data-testid="withdrawable-kpi"
            data-withdrawable={withdrawableBalance}
          >
            <p className="text-xs font-medium text-neutral-500">
              Çekilebilir bakiye
            </p>
            <p className="mt-1 flex items-center gap-2 text-xl font-bold text-neutral-950">
              <Wallet className="h-5 w-5 text-neutral-500" aria-hidden />
              {money(withdrawableBalance, currency)}
            </p>
          </div>

          <button
            type="button"
            data-testid="create-payout-btn"
            disabled={!defaultAccount || Number(withdrawableBalance) <= 0}
            onClick={() => {
              setPayoutBankId(defaultAccount?.id ?? '');
              setPayoutModalOpen(true);
            }}
            className="inline-flex w-full items-center justify-center rounded-lg bg-neutral-950 px-3 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Para Çekme Talebi Oluştur
          </button>
        </div>
      </div>

      <div
        className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
        data-testid="payout-history-card"
      >
        <div className="border-b border-neutral-100 px-4 py-3">
          <h2 className="text-base font-semibold text-neutral-950">
            Payout geçmişi
          </h2>
        </div>
        {loading ? (
          <div className="h-24 animate-pulse bg-neutral-50" />
        ) : payouts.length === 0 ? (
          <p
            className="px-4 py-8 text-center text-sm text-neutral-500"
            data-testid="payouts-empty"
          >
            Henüz para çekme talebi yok.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="min-w-full text-left text-sm"
              data-testid="payouts-table"
            >
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-2">Tarih</th>
                  <th className="px-4 py-2">Tutar</th>
                  <th className="px-4 py-2">IBAN</th>
                  <th className="px-4 py-2">Durum</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-neutral-100"
                    data-testid={`payout-row-${row.id}`}
                  >
                    <td className="px-4 py-2 text-neutral-700">
                      {new Date(row.createdAt).toLocaleString('tr-TR')}
                    </td>
                    <td className="px-4 py-2 font-medium text-neutral-950">
                      {money(row.amount, row.currency)}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-neutral-600">
                      {row.bankInfo ? maskIban(row.bankInfo.iban) : '—'}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        data-testid={`payout-status-${row.id}`}
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${payoutStatusClass(row.status)}`}
                      >
                        {PAYOUT_STATUS_LABELS[row.status] ?? row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {bankModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          data-testid="bank-account-modal"
        >
          <form
            onSubmit={(e) => void handleCreateBank(e)}
            className="w-full max-w-md space-y-3 rounded-xl bg-white p-5 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-neutral-950">
              Yeni banka hesabı
            </h3>
            <div>
              <label className="text-sm font-medium text-neutral-800">
                IBAN
              </label>
              <input
                data-testid="bank-iban-input"
                value={iban}
                onChange={(e) => setIban(e.target.value.toUpperCase())}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 font-mono text-sm"
              />
              {(bankErrors.iban || ibanHint) && (
                <p
                  role="alert"
                  data-testid="bank-iban-error"
                  className="mt-1 text-xs text-red-600"
                >
                  {bankErrors.iban || ibanHint}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-800">
                Hesap sahibi
              </label>
              <input
                data-testid="bank-account-name-input"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
              {bankErrors.accountName ? (
                <p className="mt-1 text-xs text-red-600">
                  {bankErrors.accountName}
                </p>
              ) : null}
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-800">
                Banka adı
              </label>
              <input
                data-testid="bank-name-input"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-neutral-800">
              <input
                type="checkbox"
                data-testid="bank-default-checkbox"
                checked={makeDefault}
                onChange={(e) => setMakeDefault(e.target.checked)}
              />
              Varsayılan hesap yap
            </label>
            {bankErrors.form ? (
              <p className="text-sm text-red-600">{bankErrors.form}</p>
            ) : null}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                data-testid="bank-modal-cancel"
                onClick={() => setBankModalOpen(false)}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium"
              >
                İptal
              </button>
              <button
                type="submit"
                data-testid="bank-modal-submit"
                disabled={bankBusy}
                className="rounded-lg bg-neutral-950 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {bankBusy ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {payoutModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          data-testid="payout-request-modal"
        >
          <form
            onSubmit={(e) => void handleCreatePayout(e)}
            className="w-full max-w-md space-y-3 rounded-xl bg-white p-5 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-neutral-950">
              Para çekme talebi
            </h3>
            <p className="text-xs text-neutral-500">
              Maksimum: {money(withdrawableBalance, currency)}
            </p>
            <div>
              <label className="text-sm font-medium text-neutral-800">
                Tutar (TRY)
              </label>
              <input
                type="number"
                min={1}
                step="0.01"
                data-testid="payout-amount-input"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
              {payoutErrors.amount ? (
                <p
                  data-testid="payout-amount-error"
                  className="mt-1 text-xs text-red-600"
                >
                  {payoutErrors.amount}
                </p>
              ) : null}
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-800">
                Banka hesabı
              </label>
              <select
                data-testid="payout-bank-select"
                value={payoutBankId}
                onChange={(e) => setPayoutBankId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {maskIban(a.iban)}
                    {a.isDefault ? ' (varsayılan)' : ''}
                  </option>
                ))}
              </select>
              {payoutErrors.bankInfoId ? (
                <p className="mt-1 text-xs text-red-600">
                  {payoutErrors.bankInfoId}
                </p>
              ) : null}
            </div>
            <div>
              <label className="text-sm font-medium text-neutral-800">
                Not (opsiyonel)
              </label>
              <input
                data-testid="payout-note-input"
                value={payoutNote}
                onChange={(e) => setPayoutNote(e.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            {payoutErrors.form ? (
              <p
                data-testid="payout-form-error"
                className="text-sm text-red-600"
              >
                {payoutErrors.form}
              </p>
            ) : null}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                data-testid="payout-modal-cancel"
                onClick={() => setPayoutModalOpen(false)}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium"
              >
                İptal
              </button>
              <button
                type="submit"
                data-testid="payout-modal-submit"
                disabled={payoutBusy}
                className="rounded-lg bg-neutral-950 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {payoutBusy ? 'Gönderiliyor…' : 'Talep oluştur'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
