import type { Metadata } from 'next';

import { LegalPageShell } from '@/components/features/legal/legal-page-shell';
import { COMPANY_EMAILS } from '@/config/company';

export const metadata: Metadata = {
  title: 'Erişilebilirlik | turta',
  description:
    'turta web deneyimini herkes için erişilebilir kılma taahhüdümüz.',
};

export default function AccessibilityPage() {
  return (
    <LegalPageShell
      title="Erişilebilirlik"
      description="Dijital hizmetlerimizi mümkün olduğunca herkes için kullanılabilir hale getirmeyi hedefliyoruz."
    >
      <section>
        <h2 className="text-lg font-semibold text-neutral-900">1. Taahhüt</h2>
        <p>
          Arayüzlerimizi klavye navigasyonu, anlamlı etiketler ve yeterli
          kontrast gibi erişilebilirlik iyi uygulamalarına uygun geliştirmeye
          özen gösteriyoruz.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-neutral-900">
          2. Geri bildirim
        </h2>
        <p>
          Erişim engeli yaşarsanız lütfen{' '}
          <a href={`mailto:${COMPANY_EMAILS.support}`} className="underline">
            {COMPANY_EMAILS.support}
          </a>{' '}
          üzerinden bildirin; mümkün olan en kısa sürede yardımcı oluruz.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-neutral-900">
          3. Sürekli iyileştirme
        </h2>
        <p>
          Bu sayfa bilgilendirme amaçlıdır; ürün geliştikçe erişilebilirlik
          iyileştirmeleri sürdürülür.
        </p>
      </section>
    </LegalPageShell>
  );
}
