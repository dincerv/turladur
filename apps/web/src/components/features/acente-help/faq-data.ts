export type HelpFaqCategory =
  'ALL' | 'RESERVATIONS' | 'PAYMENTS' | 'ASSIGNMENTS' | 'ACCOUNT' | 'OTHER';

export type HelpFaqItem = {
  id: string;
  category: Exclude<HelpFaqCategory, 'ALL'>;
  question: string;
  answer: string;
};

export const HELP_FAQ_CATEGORIES: Array<{
  id: HelpFaqCategory;
  label: string;
}> = [
  { id: 'ALL', label: 'Tümü' },
  { id: 'RESERVATIONS', label: 'Rezervasyonlar' },
  { id: 'PAYMENTS', label: 'Ödemeler' },
  { id: 'ASSIGNMENTS', label: 'Atamalar' },
  { id: 'ACCOUNT', label: 'Hesap' },
  { id: 'OTHER', label: 'Diğer' },
];

export const HELP_FAQS: HelpFaqItem[] = [
  {
    id: 'panel-overview',
    category: 'ACCOUNT',
    question: 'Partner panelini nasıl kullanabilirim?',
    answer:
      'Sol menüden ilgili bölüme tıklayarak tur, aktivite, rezervasyon, atama ve finansal bilgilerinizi yönetebilirsiniz. Yetkiler rolünüze göre kısıtlanabilir.',
  },
  {
    id: 'create-tour',
    category: 'OTHER',
    question: 'Yeni bir tur nasıl oluştururum?',
    answer:
      'Turlar sayfasındaki “Yeni Tur” butonuna tıklayın, formu doldurun ve kaydedin. Yeni turlar admin onayına gidebilir.',
  },
  {
    id: 'manage-reservations',
    category: 'RESERVATIONS',
    question: 'Rezervasyonları nasıl yönetebilirim?',
    answer:
      'Rezervasyonlar menüsünden kayıtları görüntüleyebilir, onaylayabilir, koltuk atayabilir veya iptal edebilirsiniz.',
  },
  {
    id: 'reservation-status',
    category: 'RESERVATIONS',
    question: 'Rezervasyon durumu ne anlama gelir?',
    answer:
      'PENDING ödeme/onay bekler, CONFIRMED kesinleşmiştir, COMPLETED tur sonrası tamamlanır, CANCELLED iptal edilmiştir.',
  },
  {
    id: 'payout-timing',
    category: 'PAYMENTS',
    question: 'Ödemeler ne zaman hesabıma geçer?',
    answer:
      'Rezervasyon tamamlandıktan sonra hakedişler Finansallar sayfasından takip edilir. Aktarım süreleri bankanıza göre değişebilir.',
  },
  {
    id: 'financial-export',
    category: 'PAYMENTS',
    question: 'Finansal raporları dışa aktarabilir miyim?',
    answer:
      'Finansallar sayfasından dönem filtreleyip CSV dışa aktarımını kullanabilirsiniz. Yetki: raporlar izni gerekir.',
  },
  {
    id: 'guide-bus-assign',
    category: 'ASSIGNMENTS',
    question: 'Rehber ve otobüs ataması nasıl yapılır?',
    answer:
      'Atamalar sayfasından tur tarihine rehber veya araç daveti gönderebilir, çakışma uyarılarını kontrol edebilirsiniz.',
  },
  {
    id: 'assignment-overlap',
    category: 'ASSIGNMENTS',
    question: 'Atama çakışması neden engellenir?',
    answer:
      'Aynı rehber veya aracın örtüşen tarihlerde çift atanmasını önlemek için sunucu tarafı çakışma kontrolü uygulanır.',
  },
  {
    id: 'password-reset',
    category: 'ACCOUNT',
    question: 'Şifremi unuttum, ne yapmalıyım?',
    answer:
      'Giriş sayfasındaki şifre sıfırlama akışını kullanın veya Ayarlar > Güvenlik üzerinden şifrenizi güncelleyin. Destek talebi de açabilirsiniz.',
  },
  {
    id: 'staff-users',
    category: 'ACCOUNT',
    question: 'Personel ekleme yalnızca OWNER’a mı açık?',
    answer:
      'Evet. Kullanıcılar sayfasından personel ekleme/düzenleme yalnızca acente sahibi (OWNER) tarafından yapılabilir.',
  },
];

export function filterHelpFaqs(
  items: HelpFaqItem[],
  opts: { q: string; category: HelpFaqCategory },
): HelpFaqItem[] {
  const needle = opts.q.trim().toLocaleLowerCase('tr-TR');
  return items.filter((item) => {
    if (opts.category !== 'ALL' && item.category !== opts.category) {
      return false;
    }
    if (!needle) return true;
    const hay = `${item.question} ${item.answer}`.toLocaleLowerCase('tr-TR');
    return hay.includes(needle);
  });
}
