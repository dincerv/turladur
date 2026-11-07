'use client';

import Link from 'next/link';
import { ArrowRight, BadgeCheck, CalendarCheck, MailCheck } from 'lucide-react';

const advantages = [
  { id: 1, text: 'Onaylı acenteler', icon: BadgeCheck },
  { id: 2, text: 'Rezervasyonlarınız tek yerde', icon: CalendarCheck },
  { id: 3, text: 'Voucher e-postanızda', icon: MailCheck },
];

export function CTA() {
  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-neutral-50 to-white border-y border-neutral-200/60 overflow-hidden">
      <div className="container px-4 mx-auto max-w-6xl relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div>
            <div className="inline-flex items-center justify-center px-4 py-1.5 bg-neutral-100 rounded-full text-neutral-800 font-medium text-sm mb-4">
              Ücretsiz Üyelik
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4 leading-tight">
              Hayalindeki Tatile İlk Adımı At!
            </h2>
            <p className="text-lg text-neutral-600 mb-8">
              Ücretsiz üye ol; rezervasyonlarını tek yerden takip et, yeni
              turlardan ve fırsatlardan ilk sen haberdar ol.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center px-8 py-3.5 bg-neutral-950 text-white hover:bg-neutral-800 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-950 text-sm"
              >
                <span>Ücretsiz Üye Ol</span>
                <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/tours"
                className="group inline-flex items-center justify-center px-8 py-3.5 bg-white text-neutral-800 border border-neutral-200 hover:bg-neutral-50 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-950 text-sm"
              >
                <span>Turları İncele</span>
                <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-4 justify-center">
              {advantages.map((advantage) => {
                const Icon = advantage.icon;
                return (
                  <div
                    key={advantage.id}
                    className="flex items-center text-sm text-neutral-600 group"
                  >
                    <Icon className="w-5 h-5 text-neutral-950 mr-2 flex-shrink-0" />
                    <span className="transition-colors duration-200 group-hover:text-neutral-800 font-medium">
                      {advantage.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CTA;
