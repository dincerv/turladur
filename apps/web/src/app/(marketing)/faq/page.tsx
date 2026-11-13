import type { Metadata } from 'next';

import { FaqSection } from '@/components/features/faq/faq-section';

export const metadata: Metadata = {
  title: 'Sıkça Sorulan Sorular | turta',
  description:
    'Rezervasyon, ödeme ve partner süreçleriyle ilgili sıkça sorulan sorular.',
};

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-white pt-16 md:pt-20">
      <FaqSection contactHref="/contact" compact />
    </main>
  );
}
