import type { Metadata } from 'next';

import { LegalPageShell } from '@/components/features/legal/legal-page-shell';
import { COMPANY } from '@/lib/company';

export const metadata: Metadata = {
  title: 'Kullanım Şartları | turta',
  description:
    'turta platformunu kullanırken geçerli olan şartlar ve sorumluluklar.',
};

const TOC = [
  { id: 'hizmet-kapsami', label: 'Hizmet kapsamı' },
  { id: 'hesap-guvenlik', label: 'Hesap ve güvenlik' },
  { id: 'rezervasyon', label: 'Rezervasyon ve iptal' },
  { id: 'sorumluluk', label: 'Sorumluluk sınırı' },
] as const;

export default function TermsPage() {
  return (
    <LegalPageShell
      title="Kullanım Şartları"
      description="Platformu kullanarak aşağıdaki şartları kabul etmiş sayılırsınız."
      toc={[...TOC]}
      contactEmailKey="info"
    >
      <section id="hizmet-kapsami">
        <h2>1. Hizmet kapsamı</h2>
        <p>
          {COMPANY.brand}; turlar, aktiviteler ve ilgili rezervasyon
          hizmetlerini dijital olarak sunar. Partner içerikleri partnerlerin
          sorumluluğundadır; platform aracılık ve teknik altyapı sağlar.
        </p>
      </section>

      <section id="hesap-guvenlik">
        <h2>2. Hesap ve güvenlik</h2>
        <p>
          Hesap bilgilerinizin gizliliğinden siz sorumlusunuz. Yetkisiz erişim
          şüphesinde derhal destek ekibine bildirin. Yanıltıcı bilgi veya kötüye
          kullanım hesap kısıtlamasına yol açabilir.
        </p>
      </section>

      <section id="rezervasyon">
        <h2>3. Rezervasyon ve iptal</h2>
        <p>
          Rezervasyon koşulları seçilen ürün ve partner politikasına göre
          değişir. Ödeme, iptal ve iade kuralları rezervasyon anında gösterilen
          bilgilere tabidir.
        </p>
        <ul>
          <li>Fiyat ve müsaitlik rezervasyon anındaki bilgilere göredir</li>
          <li>İptal/iade partner politikasına bağlıdır</li>
          <li>Platform ücretleri ayrıca belirtilir</li>
        </ul>
      </section>

      <section id="sorumluluk">
        <h2>4. Sorumluluk sınırı</h2>
        <p>
          {COMPANY.brand}, partnerlerin sunduğu tur/aktivite içeriğinin
          doğruluğu ve ifası konusunda aracı konumundadır. Zorunlu haller
          dışında dolaylı zararlardan sorumlu tutulamaz.
        </p>
      </section>
    </LegalPageShell>
  );
}
