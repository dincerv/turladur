import type { Metadata } from 'next';

import { LegalPageShell } from '@/components/features/legal/legal-page-shell';

export const metadata: Metadata = {
  title: 'Çerez Politikası | turta',
  description: 'turta web sitesinde kullanılan çerezler ve tercih yönetimi.',
};

const TOC = [
  { id: 'nedir', label: 'Çerez nedir?' },
  { id: 'turler', label: 'Kullandığımız türler' },
  { id: 'yonetim', label: 'Yönetim' },
  { id: 'ucuncu-taraf', label: 'Üçüncü taraflar' },
] as const;

export default function CookiePolicyPage() {
  return (
    <LegalPageShell
      title="Çerez Politikası"
      description="Sitemizde kullanılan çerez türleri ve amaçları hakkında bilgilendirme."
      toc={[...TOC]}
      contactEmailKey="privacy"
    >
      <section id="nedir">
        <h2>1. Çerez nedir?</h2>
        <p>
          Çerezler, siteyi ziyaret ettiğinizde tarayıcınıza kaydedilen küçük
          metin dosyalarıdır. Oturum, güvenlik ve tercihlerinizi hatırlamak için
          kullanılır.
        </p>
      </section>

      <section id="turler">
        <h2>2. Kullandığımız türler</h2>
        <p>
          Zorunlu çerezler (oturum/güvenlik), performans çerezleri (anonim
          istatistik) ve tercih çerezleri kullanılabilir. Pazarlama çerezleri
          yalnızca onayınızla etkinleşir.
        </p>
        <ul>
          <li>
            <strong>Zorunlu:</strong> giriş, güvenlik, rezervasyon akışı
          </li>
          <li>
            <strong>Performans:</strong> anonim kullanım istatistikleri
          </li>
          <li>
            <strong>Tercih:</strong> dil ve arayüz tercihleri
          </li>
        </ul>
      </section>

      <section id="yonetim">
        <h2>3. Yönetim</h2>
        <p>
          Tarayıcı ayarlarından çerezleri silebilir veya engelleyebilirsiniz.
          Zorunlu çerezler olmadan bazı özellikler (giriş, rezervasyon)
          çalışmayabilir.
        </p>
      </section>

      <section id="ucuncu-taraf">
        <h2>4. Üçüncü taraflar</h2>
        <p>
          Analitik veya ödeme sağlayıcıları kendi çerezlerini kullanabilir. Bu
          sağlayıcıların politikaları kendi sitelerinde yayınlanır; onay
          verdiğiniz ölçüde işler.
        </p>
      </section>
    </LegalPageShell>
  );
}
