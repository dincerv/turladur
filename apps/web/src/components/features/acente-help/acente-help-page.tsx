'use client';

import { useCallback, useEffect, useState } from 'react';
import { Mail, MessageSquare, Phone } from 'lucide-react';

import { COMPANY_EMAILS } from '@/config/company';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';
import {
  listPartnerSupportTickets,
  type PartnerSupportTicket,
} from '@/services/partner-admin';

import { HelpFaqSection } from './help-faq-section';
import { SupportTicketForm } from './support-ticket-form';
import { SupportTicketList } from './support-ticket-list';

export function AcenteHelpPage() {
  const { accessToken } = useAuth();
  const [tickets, setTickets] = useState<PartnerSupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    if (!accessToken) {
      setLoadingTickets(false);
      return;
    }
    setLoadingTickets(true);
    setListError(null);
    try {
      const result = await listPartnerSupportTickets(accessToken, {
        page: 1,
        pageSize: 20,
      });
      setTickets(result.items);
    } catch (err) {
      setTickets([]);
      setListError(
        err instanceof ApiError
          ? err.message
          : 'Talepler yüklenemedi. Lütfen yenileyin.',
      );
    } finally {
      setLoadingTickets(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  return (
    <div
      className="mx-auto max-w-5xl space-y-10"
      data-testid="acente-help-page"
    >
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Yardım ve Destek Merkezi
        </h1>
        <p className="mt-1 text-gray-500">
          SSS, destek talebi oluşturma ve geçmiş talepleriniz
        </p>
      </div>

      <HelpFaqSection />

      <section
        className="grid gap-4 md:grid-cols-3"
        data-testid="help-contact-cards"
      >
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <Mail className="mb-3 h-6 w-6 text-sky-600" />
          <h3 className="font-semibold text-gray-900">E-posta</h3>
          <a
            href={`mailto:${COMPANY_EMAILS.support}`}
            className="mt-1 block text-sm text-gray-600 underline-offset-2 hover:underline"
          >
            {COMPANY_EMAILS.support}
          </a>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <Phone className="mb-3 h-6 w-6 text-emerald-600" />
          <h3 className="font-semibold text-gray-900">Telefon</h3>
          <p className="mt-1 text-sm text-gray-600">+90 850 000 00 00</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <MessageSquare className="mb-3 h-6 w-6 text-amber-600" />
          <h3 className="font-semibold text-gray-900">Canlı Destek</h3>
          <p className="mt-1 text-sm text-gray-600">Hafta içi 09:00–18:00</p>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          {accessToken ? (
            <SupportTicketForm
              accessToken={accessToken}
              onCreated={(ticket) => setTickets((prev) => [ticket, ...prev])}
            />
          ) : (
            <p className="text-sm text-gray-500">
              Destek talebi için oturum gerekli.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Talepleriniz
            </h2>
            <button
              type="button"
              className="text-xs font-medium text-sky-700 hover:underline"
              data-testid="help-ticket-refresh"
              onClick={() => void loadTickets()}
            >
              Yenile
            </button>
          </div>
          {listError ? (
            <p
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              data-testid="help-ticket-list-error"
            >
              {listError}
            </p>
          ) : null}
          <SupportTicketList items={tickets} loading={loadingTickets} />
        </div>
      </section>
    </div>
  );
}
