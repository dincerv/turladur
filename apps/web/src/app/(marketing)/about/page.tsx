import type { Metadata } from 'next';

import AboutPageContent from '@/components/features/about/about-page';

export const metadata: Metadata = {
  title: 'Hakkımızda',
  description:
    'turta, Türkiye’deki tur acentelerini tek platformda buluşturur. Ofisimiz Ankara Çankaya’dadır.',
};

export default function AboutPage() {
  return <AboutPageContent />;
}
