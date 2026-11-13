'use client';

import { useState } from 'react';
import {
  ChevronDown,
  CircleHelp,
  Mail,
  MessageSquare,
  Phone,
} from 'lucide-react';

const FAQS = [
  {
    question: 'Partner panelini nasıl kullanabilirim?',
    answer:
      'Sol menüden ilgili bölüme tıklayarak tur, aktivite, rezervasyon ve finansal bilgilerinizi yönetebilirsiniz.',
  },
  {
    question: 'Yeni bir tur nasıl oluştururum?',
    answer:
      'Turlar sayfasındaki “Yeni Tur” butonuna tıklayın, formu doldurun ve kaydedin. Yeni turlar admin onayına gider.',
  },
  {
    question: 'Rezervasyonları nasıl yönetebilirim?',
    answer:
      'Rezervasyonlar menüsünden kayıtları görüntüleyebilir, onaylayabilir veya iptal edebilirsiniz.',
  },
  {
    question: 'Ödemeler ne zaman hesabıma geçer?',
    answer:
      'Rezervasyon tamamlandıktan sonra ödemeler Finansal Durum sayfasından takip edilir. Aktarım süreleri bankanıza göre değişebilir.',
  },
  {
    question: 'Şifremi unuttum, ne yapmalıyım?',
    answer:
      'Giriş sayfasındaki şifre sıfırlama akışını kullanın veya destek ekibiyle iletişime geçin.',
  },
];

export default function PartnerHelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div className="mb-4 text-center">
        <h1 className="mb-2 text-2xl font-bold text-gray-800">
          Yardım ve Destek Merkezi
        </h1>
        <p className="text-gray-500">
          Sıkça sorulan sorular ve destek bilgileri
        </p>
      </div>

      <section>
        <h2 className="mb-6 flex items-center text-xl font-semibold text-gray-800">
          <CircleHelp className="mr-2 h-6 w-6 text-indigo-600" />
          Sıkça Sorulan Sorular
        </h2>
        <div className="space-y-4">
          {FAQS.map((faq, index) => (
            <div
              key={faq.question}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
            >
              <button
                type="button"
                className="flex w-full items-center justify-between px-6 py-4 text-left focus:outline-none"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <span className="font-medium text-gray-800">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                    openFaq === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openFaq === index ? (
                <div className="border-t border-gray-100 px-6 pb-4 text-gray-600">
                  <p className="pt-3 text-sm leading-relaxed">{faq.answer}</p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <Mail className="mb-3 h-6 w-6 text-blue-600" />
          <h3 className="font-semibold text-gray-900">E-posta</h3>
          <p className="mt-1 text-sm text-gray-600">destek@turta.com.tr</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <Phone className="mb-3 h-6 w-6 text-green-600" />
          <h3 className="font-semibold text-gray-900">Telefon</h3>
          <p className="mt-1 text-sm text-gray-600">+90 850 000 00 00</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <MessageSquare className="mb-3 h-6 w-6 text-amber-600" />
          <h3 className="font-semibold text-gray-900">Canlı Destek</h3>
          <p className="mt-1 text-sm text-gray-600">Hafta içi 09:00–18:00</p>
        </div>
      </section>
    </div>
  );
}
