'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Bell, Building2, KeyRound, UserCircle } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { hasAgencyOwnerAccess } from '@/lib/partner-permissions';
import { useAuth } from '@/providers/auth-provider';
import { ApiError } from '@/services/api-client';
import {
  getPartnerSettings,
  type PartnerCompanyProfile,
  type PartnerNotificationPrefs,
  type PartnerSettingsBootstrap,
} from '@/services/partner-admin';
import {
  DEFAULT_AGENCY_NOTIFICATIONS,
  type AgencySettingsTab,
} from '@turta/shared-validators';

import { CompanyForm } from './company-form';
import { NotificationsForm } from './notifications-form';
import { ProfileForm } from './profile-form';
import { SecurityForm } from './security-form';
import { parseSettingsTab, settingsTabToQueryString } from './settings-query';

const TAB_ICONS = {
  profile: UserCircle,
  security: KeyRound,
  notifications: Bell,
  company: Building2,
} as const;

export function AcenteSettingsPage() {
  const { accessToken, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const tab = useMemo(() => parseSettingsTab(searchParams), [searchParams]);
  const canEditCompany = hasAgencyOwnerAccess(user?.role);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bootstrap, setBootstrap] = useState<PartnerSettingsBootstrap | null>(
    null,
  );

  const setTab = useCallback(
    (next: AgencySettingsTab) => {
      const qs = settingsTabToQueryString(next);
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router],
  );

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPartnerSettings(accessToken);
      setBootstrap(data);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Ayarlar yüklenemedi. Lütfen tekrar deneyin.',
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (tab === 'company' && !canEditCompany) {
      setTab('profile');
    }
  }, [tab, canEditCompany, setTab]);

  const staffName =
    bootstrap?.staff?.name ??
    [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() ??
    '';
  const staffEmail = bootstrap?.staff?.email ?? user?.email ?? '';

  return (
    <div className="space-y-6" data-testid="acente-settings-page">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hesap Ayarları</h1>
        <p className="mt-1 text-sm text-gray-600">
          Profil ve bildirimler size özeldir; şirket bilgileri yalnızca OWNER
          tarafından güncellenir.
        </p>
      </div>

      {error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          data-testid="settings-error"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {loading ? (
        <div
          className="h-64 animate-pulse rounded-xl border border-gray-100 bg-white"
          data-testid="settings-skeleton"
        />
      ) : (
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as AgencySettingsTab)}
          orientation="vertical"
          className="flex flex-col gap-6 lg:flex-row"
          data-testid="settings-tabs"
        >
          <TabsList
            variant="line"
            className="h-auto w-full shrink-0 flex-row overflow-x-auto lg:w-56 lg:flex-col"
            data-testid="settings-tab-list"
          >
            {(
              [
                'profile',
                'security',
                'notifications',
                'company',
              ] as AgencySettingsTab[]
            ).map((id) => {
              const Icon = TAB_ICONS[id];
              const disabled = id === 'company' && !canEditCompany;
              const labels = {
                profile: 'Profil',
                security: 'Güvenlik',
                notifications: 'Bildirimler',
                company: 'Şirket',
              };
              return (
                <TabsTrigger
                  key={id}
                  value={id}
                  disabled={disabled}
                  data-testid={`settings-tab-${id}`}
                  className="justify-start gap-2 px-3 py-2.5"
                >
                  <Icon className="h-4 w-4" />
                  {labels[id]}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="min-w-0 flex-1 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <TabsContent value="profile" data-testid="settings-panel-profile">
              {accessToken ? (
                <ProfileForm
                  accessToken={accessToken}
                  initialName={staffName}
                  email={staffEmail}
                  onSaved={(name) =>
                    setBootstrap((prev) =>
                      prev?.staff
                        ? {
                            ...prev,
                            staff: { ...prev.staff, name },
                          }
                        : prev,
                    )
                  }
                />
              ) : null}
            </TabsContent>

            <TabsContent value="security" data-testid="settings-panel-security">
              {accessToken ? <SecurityForm accessToken={accessToken} /> : null}
            </TabsContent>

            <TabsContent
              value="notifications"
              data-testid="settings-panel-notifications"
            >
              {accessToken ? (
                <NotificationsForm
                  accessToken={accessToken}
                  initial={
                    bootstrap?.notifications ?? DEFAULT_AGENCY_NOTIFICATIONS
                  }
                  onSaved={(notifications: PartnerNotificationPrefs) =>
                    setBootstrap((prev) =>
                      prev ? { ...prev, notifications } : prev,
                    )
                  }
                />
              ) : null}
            </TabsContent>

            <TabsContent value="company" data-testid="settings-panel-company">
              {!canEditCompany ? (
                <div
                  className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-900"
                  data-testid="settings-company-forbidden"
                >
                  Şirket bilgilerini yalnızca acente sahibi (OWNER)
                  güncelleyebilir.
                </div>
              ) : accessToken && bootstrap?.company ? (
                <CompanyForm
                  accessToken={accessToken}
                  initial={bootstrap.company}
                  onSaved={(company: PartnerCompanyProfile) =>
                    setBootstrap((prev) => (prev ? { ...prev, company } : prev))
                  }
                />
              ) : null}
            </TabsContent>
          </div>
        </Tabs>
      )}
    </div>
  );
}
