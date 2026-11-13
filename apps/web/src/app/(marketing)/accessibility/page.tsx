import type { Metadata } from 'next';

import { LegalPageShell } from '@/components/features/legal/legal-page-shell';
import { MailtoLink } from '@/components/ui/mailto-link';

export const metadata: Metadata = {
  title: 'Erişilebilirlik | turta',
  description:
    'turta web deneyimini herkes için erişilebilir kılma taahhüdümüz.',
};

const TOC = [
  { id: 'taahhut', label: 'Taahhüt' },
  { id: 'geri-bildirim', label: 'Geri bildirim' },
  { id: 'iyilestirme', label: 'Sürekli iyileştirme' },
] as const;

export default function AccessibilityPage() {
  return (
    <LegalPageShell
      title="Erişilebilirlik"
      description="Dijital hizmetlerimizi mümkün olduğunca herkes için kullanılabilir hale getirmeyi hedefliyoruz."
      toc={[...TOC]}
      contactEmailKey="support"
    >
      <section id="taahhut">
        <h2>1. Taahhüt</h2>
        <p>
          Arayüzlerimizi klavye navigasyonu, anlamlı etiketler ve yeterli
          kontrast gibi erişilebilirlik iyi uygulamalarına uygun geliştirmeye
          özen gösteriyoruz.
        </p>
      </section>
      <section id="geri-bildirim">
        <h2>2. Geri bildirim</h2>
        <p>
          Erişim engeli yaşarsanız lütfen{' '}
          <MailtoLink
            emailKey="support"
            subject="Erişilebilirlik geri bildirimi"
            className="underline"
          />{' '}
          üzerinden bildirin; mümkün olan en kısa sürede yardımcı oluruz.
        </p>
      </section>
      <section id="iyilestirme">
        <h2>3. Sürekli iyileştirme</h2>
        <p>
          Bu sayfa bilgilendirme amaçlıdır; ürün geliştikçe erişilebilirlik
          iyileştirmeleri sürdürülür.
        </p>
      </section>
    </LegalPageShell>
  );
}
