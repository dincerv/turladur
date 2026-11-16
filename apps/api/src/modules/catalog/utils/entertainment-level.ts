import type { EntertainmentLevel } from '@turta/shared-types';

export function entertainmentLevelFromExtras(
  extras: Record<string, unknown>,
  category?: string | null,
): { level: EntertainmentLevel | null; label: string | null } {
  const raw =
    typeof extras.entertainmentLevel === 'string'
      ? extras.entertainmentLevel.toUpperCase()
      : typeof extras.tempo === 'string'
        ? extras.tempo.toUpperCase()
        : null;

  if (raw === 'LOW' || raw === 'SAKIN' || raw === 'CALM') {
    return { level: 'LOW', label: 'Sakin tempo' };
  }
  if (raw === 'HIGH' || raw === 'PARTY' || raw === 'YOĞUN' || raw === 'YOGUN') {
    return { level: 'HIGH', label: 'Yüksek tempo / eğlence' };
  }
  if (raw === 'MEDIUM' || raw === 'DENGELI' || raw === 'DENGELİ') {
    return { level: 'MEDIUM', label: 'Dengeli tempo' };
  }

  if (category === 'ADVENTURE' || category === 'BEACH') {
    return { level: 'HIGH', label: 'Yüksek tempo / eğlence' };
  }
  if (
    category === 'CULTURAL' ||
    category === 'GASTRONOMY' ||
    category === 'CITY'
  ) {
    return { level: 'LOW', label: 'Sakin tempo' };
  }
  if (category === 'NATURE') {
    return { level: 'MEDIUM', label: 'Dengeli tempo' };
  }
  return { level: null, label: null };
}
