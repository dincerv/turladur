export type FaqItem = {
  question: string;
  answer: string;
};

/** /contact sayfasına özel kısa SSS (ortak Accordion ile). */
export const CONTACT_FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Rezervasyon iptali nasıl yapılır?',
    answer:
      'Hesabınızdaki Rezervasyonlarım bölümünden iptal talebi oluşturabilirsiniz. İptal koşulları turun kendi politikasına göre değişir; detay rezervasyon onayınızda yer alır.',
  },
  {
    question: 'Ödeme nasıl yapılır?',
    answer:
      'Rezervasyon sırasında kredi veya banka kartı ile ödeme alıyoruz. Ödeme altyapısı güvenli ödeme kuruluşu üzerinden çalışır.',
  },
  {
    question: 'Rezervasyon sonrası değişiklik yapabilir miyim?',
    answer:
      'Tarih veya kişi sayısı değişikliği, turun müsaitliğine ve acentenin kurallarına bağlıdır. Destek ekibimiz veya acente ile iletişime geçebilirsiniz.',
  },
  {
    question: 'Acente olarak tur yayınlamak istiyorum, ne yapmalıyım?',
    answer:
      'Acente başvurusu sayfasından kayıt olun. Başvurunuz incelendikten sonra tur yayınlamaya başlayabilirsiniz.',
  },
  {
    question: 'Ofisinizi ziyaret edebilir miyim?',
    answer:
      'Evet. Ankara Çankaya’daki ofisimiz randevu ile ziyaret edilebilir. Form üzerinden veya e-posta ile randevu talep edin.',
  },
];

/** Platform genel SSS — /faq, blog, kampanya gibi marketing yüzeylerinde ortak. */
export const PLATFORM_FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Rezervasyon iptali nasıl yapılır?',
    answer:
      "Rezervasyon iptallerinizi hesabınızın 'Rezervasyonlarım' bölümünden yapabilirsiniz. İptal koşulları rezervasyon tipine göre değişiklik gösterebilir. Detaylı bilgi için müşteri hizmetlerimizle iletişime geçebilirsiniz.",
  },
  {
    question: 'Ödeme seçenekleri nelerdir?',
    answer:
      'turta üzerinden kredi kartı, banka kartı, havale/EFT ve online ödeme sistemleri ile ödeme yapabilirsiniz. Bazı rezervasyonlarda taksit seçenekleri de sunulmaktadır.',
  },
  {
    question: 'Rezervasyon sonrası değişiklik yapabilir miyim?',
    answer:
      'Evet, çoğu rezervasyonda değişiklik yapabilirsiniz. Değişiklik koşulları ve ücretleri, rezervasyon tipine ve otel/tur politikasına göre değişiklik gösterebilir.',
  },
  {
    question: 'Grup rezervasyonları için özel fiyatlar mevcut mu?',
    answer:
      'Evet, 10 kişi ve üzeri grup rezervasyonları için özel fiyat ve avantajlar sunuyoruz. Grup rezervasyonları için iletişim formumuz üzerinden bize ulaşabilirsiniz.',
  },
  {
    question: 'Yurt dışı turlarında vize desteği sağlıyor musunuz?',
    answer:
      'Evet, yurt dışı turlarımızda vize süreçlerinize destek sağlıyoruz. Gerekli evraklar ve başvuru süreci hakkında detaylı bilgilendirme yapıyoruz.',
  },
];
