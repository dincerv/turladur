import type { Metadata } from 'next';

import { LegalPageShell } from '@/components/features/legal/legal-page-shell';
import { MailtoLink } from '@/components/ui/mailto-link';
import { COMPANY, getCompanyAddressOneLine } from '@/lib/company';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası | turta',
  description:
    'turta olarak kişisel verilerinizi nasıl topladığımız, kullandığımız ve koruduğumuz.',
};

const TOC = [
  { id: 'veri-sorumlusu', label: 'Veri sorumlusu' },
  { id: 'islenen-veriler', label: 'İşlenen veriler' },
  { id: 'amac-ve-dayanak', label: 'Amaç ve dayanak' },
  { id: 'haklariniz', label: 'Haklarınız' },
  { id: 'iletisim', label: 'İletişim' },
] as const;

export default function PrivacyPage() {
  return (
    <LegalPageShell
      title="Gizlilik Politikası"
      description="Kişisel verilerinizin korunması ve KVKK/GDPR uyumu hakkında bilgilendirme."
      toc={[...TOC]}
      contactEmailKey="privacy"
    >
      <section id="veri-sorumlusu">
        <h2>1. Veri sorumlusu</h2>
        <p>
          {COMPANY.brand} platformu üzerinden sunulan hizmetlerde kişisel
          verileriniz, yürürlükteki mevzuata (KVKK ve ilgili düzenlemeler) uygun
          şekilde işlenir. Veri sorumlusu iletişim adresi:{' '}
          {getCompanyAddressOneLine()}.
        </p>
        <p>
          Bu sayfa bilgilendirme amaçlıdır; detaylı talepler için{' '}
          <MailtoLink
            emailKey="privacy"
            subject="KVKK / Gizlilik talebi"
            className="underline"
          />{' '}
          adresine yazabilirsiniz.
        </p>
      </section>

      <section id="islenen-veriler">
        <h2>2. Hangi verileri işleriz?</h2>
        <p>
          Hesap oluşturma, rezervasyon ve destek süreçlerinde ad-soyad, e-posta,
          telefon, fatura/iletişim adresi ve işlem kayıtları gibi veriler
          işlenebilir. Ödeme kartı bilgileri PCI DSS kapsamında ödeme
          sağlayıcısında tutulur; turta sunucularına kart numarası/CVV
          kaydedilmez.
        </p>
        <ul>
          <li>Kimlik ve iletişim bilgileri</li>
          <li>Rezervasyon ve işlem kayıtları</li>
          <li>Destek yazışmaları</li>
          <li>Teknik günlükler (güvenlik ve performans)</li>
        </ul>
      </section>

      <section id="amac-ve-dayanak">
        <h2>3. Amaç ve hukuki dayanak</h2>
        <p>
          Veriler; sözleşmenin ifası, yasal yükümlülükler, meşru menfaat
          (güvenlik/dolandırıcılık önleme) ve açık rızanız (pazarlama
          iletişimleri) kapsamında işlenebilir. Pazarlama iletişimleri için her
          zaman vazgeçme hakkınız vardır.
        </p>
      </section>

      <section id="haklariniz">
        <h2>4. Haklarınız</h2>
        <p>
          Verilerinize erişme, düzeltme, silme (unutulma), işlemeyi kısıtlama ve
          itiraz etme haklarına sahipsiniz. Taleplerinizi hesap ayarlarından
          veya <MailtoLink emailKey="privacy" className="underline" /> üzerinden
          iletebilirsiniz.
        </p>
      </section>

      <section id="iletisim">
        <h2>5. İletişim</h2>
        <p>
          Gizlilik ve KVKK başvuruları için:{' '}
          <MailtoLink
            emailKey="privacy"
            subject="KVKK başvurusu"
            className="underline"
          />
          . Genel destek için{' '}
          <MailtoLink emailKey="support" className="underline" /> veya{' '}
          <a href="/contact">iletişim formu</a>.
        </p>
      </section>
    </LegalPageShell>
  );
}
