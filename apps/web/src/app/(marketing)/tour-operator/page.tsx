import type { Metadata } from 'next';

import { TourOperatorsDirectory } from '@/components/features/tour-operator/tour-operators-directory';

export const metadata: Metadata = {
  title: 'Acenteler / Tur Operatörleri | turta',
  description:
    'Onaylı tur operatörlerini keşfedin. Her acentenin yayınladığı turlara profilinden ulaşın.',
};

export default function TourOperatorDirectoryPage() {
  return <TourOperatorsDirectory />;
}
