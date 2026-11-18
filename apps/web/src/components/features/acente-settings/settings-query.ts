import {
  AGENCY_SETTINGS_TABS,
  parseAgencySettingsTab,
  type AgencySettingsTab,
} from '@turta/shared-validators';

export type { AgencySettingsTab };

export function parseSettingsTab(
  searchParams: URLSearchParams | { get: (key: string) => string | null },
): AgencySettingsTab {
  return parseAgencySettingsTab(searchParams.get('tab') ?? 'profile');
}

export function settingsTabToQueryString(tab: AgencySettingsTab): string {
  if (tab === 'profile') return '';
  return `tab=${tab}`;
}

export const SETTINGS_TAB_META: Array<{
  id: AgencySettingsTab;
  label: string;
}> = [
  { id: 'profile', label: 'Profil' },
  { id: 'security', label: 'Güvenlik' },
  { id: 'notifications', label: 'Bildirimler' },
  { id: 'company', label: 'Şirket' },
];

export { AGENCY_SETTINGS_TABS };
