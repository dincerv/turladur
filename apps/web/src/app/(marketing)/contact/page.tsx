import type { Metadata } from 'next';

import ContactPageContent from '@/components/features/contact/contact-page';

export const metadata: Metadata = {
  title: 'İletişim',
  description: 'turta ile iletişime geçin — destek, SSS ve iletişim formu.',
};

export default function ContactPage() {
  return <ContactPageContent />;
}
