'use client';

import Link from 'next/link';
import {
  Building2,
  ChevronDown,
  Clock,
  Mail,
  MapPin,
  MessageSquare,
  Handshake,
  HelpCircle,
  User,
} from 'lucide-react';

import ContactForm from './contact-form';
import {
  COMPANY,
  getCompanyAddressLines,
  getCompanyMapsDirectionsUrl,
  getCompanyMapsEmbedUrl,
} from '@/lib/company';

const faqData = [
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

const channels = [
  {
    icon: Mail,
    title: 'Genel iletişim',
    text: 'Sorularınız, önerileriniz ve basın talepleri için.',
    email: COMPANY.emails.info,
  },
  {
    icon: MessageSquare,
    title: 'Destek',
    text: 'Rezervasyon, iptal ve hesap işlemleri için yazın. Mesai saatlerinde dönüş yapıyoruz.',
    email: COMPANY.emails.support,
  },
  {
    icon: Handshake,
    title: 'Acente ortaklığı',
    text: 'Turlarınızı turta’da yayınlamak için başvurun.',
    email: COMPANY.emails.partner,
  },
];

export default function ContactPageContent() {
  const addressLines = getCompanyAddressLines();

  return (
    <div className="bg-neutral-50 text-neutral-800">
      <section className="relative overflow-hidden bg-white pt-32 pb-16 lg:pt-40 lg:pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
              <Building2 className="mr-1.5 h-4 w-4" />
              İletişim
            </div>
            <h1 className="mb-5 text-4xl font-bold leading-tight text-neutral-900 md:text-5xl">
              Bize yazın, <span className="text-sky-600">Ankara’dan</span> dönüş
              yapalım
            </h1>
            <p className="mb-8 text-lg leading-relaxed text-neutral-600">
              Ofisimiz Bilkent Cyberpark Dikmen Girişim Ofisi’nde. Tur,
              rezervasyon veya acente ortaklığı için form ya da e-posta yeterli.
            </p>
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-start rounded-lg border border-neutral-200/80 bg-neutral-50 p-5">
                <Mail className="mt-0.5 mr-3 h-5 w-5 shrink-0 text-sky-600" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                    E-posta
                  </p>
                  <a
                    href={`mailto:${COMPANY.emails.info}`}
                    className="text-base font-semibold text-neutral-900 hover:text-sky-700"
                  >
                    {COMPANY.emails.info}
                  </a>
                </div>
              </div>
              <div className="flex items-start rounded-lg border border-neutral-200/80 bg-neutral-50 p-5">
                <MapPin className="mt-0.5 mr-3 h-5 w-5 shrink-0 text-sky-600" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Ofis
                  </p>
                  <p className="text-sm font-medium text-neutral-900">
                    {COMPANY.city} · {COMPANY.district}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="#contactForm"
                className="inline-flex items-center rounded-lg bg-sky-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-sky-700"
              >
                <User className="mr-2 h-4 w-4" />
                İletişim formu
              </a>
              <a
                href="#office"
                className="inline-flex items-center rounded-lg border border-neutral-200 bg-white px-6 py-3 text-sm font-medium text-sky-600 shadow-sm transition-colors hover:bg-neutral-50"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Ofis adresi
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-neutral-100/70 py-16 md:py-20">
        <div className="container mx-auto px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-3 text-3xl font-bold text-neutral-900">
              İletişim kanalları
            </h2>
            <p className="text-neutral-600">
              Size en yakın konu üzerinden yazın; mesai saatlerinde dönüş
              yapıyoruz.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {channels.map((card) => (
              <div
                key={card.title}
                className="flex flex-col rounded-xl border border-neutral-200/80 bg-white p-8 shadow-sm"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-sky-100">
                  <card.icon className="h-6 w-6 text-sky-600" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-neutral-900">
                  {card.title}
                </h3>
                <p className="mb-6 flex-grow text-sm leading-relaxed text-neutral-600">
                  {card.text}
                </p>
                <a
                  href={`mailto:${card.email}`}
                  className="inline-flex items-center gap-2 border-t border-neutral-100 pt-5 text-sm font-medium text-sky-700 hover:text-sky-800"
                >
                  <Mail className="h-4 w-4" />
                  {card.email}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contactForm" className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-3 text-3xl font-bold text-neutral-900">
              Formu doldurun
            </h2>
            <p className="text-neutral-600">
              Mesajınız ilgili ekibe düşer; mümkün olan en kısa sürede dönüş
              yaparız.
            </p>
          </div>
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-5">
            <div className="rounded-xl border border-neutral-200/60 bg-white p-8 shadow-lg lg:col-span-3 lg:p-10">
              <ContactForm />
            </div>
            <div id="office" className="space-y-8 lg:col-span-2">
              <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/80 p-8">
                <h3 className="mb-5 border-b border-neutral-200 pb-4 text-xl font-semibold text-neutral-900">
                  Ofisimiz
                </h3>
                <div className="space-y-4 text-sm text-neutral-700">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
                    <div>
                      {addressLines.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
                    <a
                      href={`mailto:${COMPANY.emails.info}`}
                      className="hover:text-sky-700"
                    >
                      {COMPANY.emails.info}
                    </a>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
                    <p>{COMPANY.hours}</p>
                  </div>
                </div>
                <a
                  href={getCompanyMapsDirectionsUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center text-sm font-medium text-sky-600 hover:text-sky-700"
                >
                  <MapPin className="mr-1.5 h-4 w-4" />
                  Yol tarifi al
                </a>
              </div>
              <div className="relative h-[280px] overflow-hidden rounded-xl border border-neutral-200/80 shadow-md">
                <iframe
                  src={getCompanyMapsEmbedUrl()}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="turta Ankara ofisi"
                  className="absolute inset-0"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-neutral-50 py-16 md:py-20">
        <div className="container mx-auto px-6">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <div className="mb-4 inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
              <HelpCircle className="mr-1.5 h-4 w-4" />
              Sıkça sorulanlar
            </div>
            <h2 className="text-3xl font-bold text-neutral-900">
              Kısa yanıtlar
            </h2>
          </div>
          <div className="mx-auto max-w-3xl space-y-3">
            {faqData.map((faq) => (
              <details
                key={faq.question}
                className="group overflow-hidden rounded-lg border border-neutral-200/80 bg-white"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between p-5 font-semibold text-neutral-800 hover:bg-neutral-50">
                  {faq.question}
                  <ChevronDown className="ml-4 h-5 w-5 shrink-0 text-neutral-500 transition-transform group-open:rotate-180" />
                </summary>
                <div className="border-t border-neutral-200/60 px-5 pt-3 pb-5">
                  <p className="text-sm leading-relaxed text-neutral-600">
                    {faq.answer}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-sky-600 to-blue-700 py-16">
        <div className="container mx-auto px-6 text-center">
          <h3 className="mb-4 text-3xl font-bold text-white">
            Turları keşfetmeye hazır mısınız?
          </h3>
          <p className="mx-auto mb-8 max-w-xl text-sky-100">
            Türkiye’deki acentelerin turlarını karşılaştırın, güvenle rezerve
            edin.
          </p>
          <Link
            href="/tours"
            className="inline-block rounded-lg bg-white px-7 py-3 text-sm font-medium text-sky-700 shadow-sm hover:bg-sky-50"
          >
            Turları incele
          </Link>
        </div>
      </section>
    </div>
  );
}
