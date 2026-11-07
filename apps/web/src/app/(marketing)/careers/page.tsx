import type { Metadata } from 'next';

import { CareersPageContent } from '@/components/features/careers/careers-page';

export const metadata: Metadata = {
  title: 'Kariyer',
  description:
    'turta ekibine katılın. Ofisimiz Ankara Çankaya, Bilkent Cyberpark Dikmen Girişim Ofisi’ndedir.',
};

export default function CareersPage() {
  return <CareersPageContent />;
}
