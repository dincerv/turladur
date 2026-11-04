import type { Metadata } from 'next';

import { LegalPageShell } from '@/components/features/legal/legal-page-shell';
import { COMPANY_EMAILS } from '@/config/company';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası | turta',
  description:
    'turta olarak kişisel verilerinizi nasıl topladığımız, kullandığımız ve koruduğumuz.',
};

export default function PrivacyPage() {
  return (
    <LegalPageShell
      title="Gizlilik Politikası"
      description="Kişisel verilerinizin korunması ve KVKK/GDPR uyumu hakkında bilgilendirme."
    >
      <section>
        <h2 className="text-lg font-semibold text-neutral-900">
          1. Veri sorumlusu
        </h2>
        <p>
          turta platformu üzerinden sunulan hizmetlerde kişisel verileriniz,
          yürürlükteki mevzuata (KVKK ve ilgili düzenlemeler) uygun şekilde
          işlenir. Bu sayfa bilgilendirme amaçlıdır; detaylı talepler için{' '}
          <a href={`mailto:${COMPANY_EMAILS.privacy}`} className="underline">
            {COMPANY_EMAILS.privacy}
          </a>{' '}
          adresine yazabilirsiniz.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-neutral-900">
          2. Hangi verileri işleriz?
        </h2>
        <p>
          Hesap oluşturma, rezervasyon ve destek süreçlerinde ad-soyad, e-posta,
          telefon, fatura/iletişim adresi ve işlem kayıtları gibi veriler
          işlenebilir. Ödeme kartı bilgileri PCI DSS kapsamında ödeme
          sağlayıcısında tutulur; turta sunucularına kart numarası/CVV
          kaydedilmez.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-neutral-900">
          3. Haklarınız
        </h2>
        <p>
          Verilerinize erişme, düzeltme, silme (unutulma), işlemeyi kısıtlama ve
          itiraz etme haklarına sahipsiniz. Taleplerinizi hesap ayarlarından
          veya destek kanallarından iletebilirsiniz.
        </p>
      </section>
    </LegalPageShell>
  );
}
