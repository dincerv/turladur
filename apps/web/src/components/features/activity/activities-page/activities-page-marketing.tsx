'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar,
  ChevronRight,
  MapPin,
  Star,
  Timer,
  Users,
} from 'lucide-react';
import { useCountdown } from './use-countdown';

const OFFER_DURATION_MS =
  21 * 86_400_000 + 18 * 3_600_000 + 45 * 60_000 + 37_000;

const TIME_UNITS = [
  { key: 'days', label: 'Gün' },
  { key: 'hours', label: 'Saat' },
  { key: 'minutes', label: 'Dakika' },
  { key: 'seconds', label: 'Saniye' },
] as const;

export function ActivitiesPageMarketing() {
  const timeLeft = useCountdown(OFFER_DURATION_MS);
  const isExpired =
    timeLeft != null &&
    timeLeft.days + timeLeft.hours + timeLeft.minutes + timeLeft.seconds === 0;

  return (
    <>
      {/* --- Popular Categories: Stil Güncellendi */}
      <div className="mt-16 md:mt-20">
        <div className="mb-6 md:mb-8">
          <h2 className="text-xl lg:text-2xl font-semibold text-neutral-900">
            Popüler Kategorilerimiz
          </h2>
          <p className="mt-1 text-xs text-neutral-600">
            En çok tercih edilen deneyim türlerini keşfedin.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {[
            {
              id: 'doga',
              name: 'Doğa Turları',
              image:
                'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=2070&auto=format&fit=crop',
              count: 24,
            },
            {
              id: 'macera',
              name: 'Macera Turları',
              image:
                'https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=2070&auto=format&fit=crop',
              count: 18,
            },
            {
              id: 'kultur',
              name: 'Kültür Turları',
              image:
                'https://images.unsplash.com/photo-1639580636443-7e739c13bbde?q=80&w=2070&auto=format&fit=crop',
              count: 32,
            },
            {
              id: 'gastronomi',
              name: 'Gastronomi Turları',
              image:
                'https://images.unsplash.com/photo-1561758033-7e924f619b47?q=80&w=2070&auto=format&fit=crop',
              count: 12,
            },
          ].map((category) => (
            <Link
              href={`/activities?category=${category.id}`}
              key={category.id}
              className="group relative overflow-hidden rounded-lg h-64 shadow-sm block border border-neutral-100/80 hover:shadow-lg transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10 transition-opacity duration-300 group-hover:from-black/70" />
              <Image
                src={category.image}
                alt={category.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 z-20 flex flex-col justify-end p-5 text-white">
                <h3 className="text-lg font-semibold mb-1 transition-transform duration-300 group-hover:-translate-y-1">
                  {category.name}
                </h3>
                <p className="text-xs text-white/80 mb-2 transition-opacity duration-300 group-hover:opacity-0">
                  {category.count} aktivite
                </p>
                <div className="flex items-center text-xs font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <span>Kategoriyi Keşfet</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* --- Limited Time Offer - Stil Güncellendi */}
      <div className="mt-16 md:mt-20">
        <div className="bg-gradient-to-r from-sky-600 to-blue-700 rounded-xl overflow-hidden shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="p-8 lg:p-10 flex flex-col justify-center text-white">
              <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 text-sky-700 mb-3 self-start shadow-sm">
                <Timer className="w-3 h-3 mr-1" /> SINIRLI SÜRE TEKLİFİ
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold mb-3 tracking-tight">
                Yaz Tatili Erken Rezervasyon Fırsatı
              </h2>
              <p className="text-sky-100/90 mb-5 text-sm font-light">
                Yaz aylarındaki tüm tur paketlerinde %25&apos;e varan indirim
                fırsatını kaçırmayın. Erken rezervasyon avantajlarıyla
                hayalinizdeki tatili şimdiden planlayın.
              </p>
              <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
                {TIME_UNITS.map(({ key, label }) => (
                  <div
                    key={key}
                    className="bg-white/15 backdrop-blur-sm rounded-md p-2 text-center min-w-[60px] sm:min-w-[70px]"
                  >
                    <div className="text-xl sm:text-2xl font-bold tabular-nums">
                      {timeLeft ? String(timeLeft[key]).padStart(2, '0') : '--'}
                    </div>
                    <div className="text-[10px] text-sky-200/80 uppercase tracking-wider">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
              {isExpired && (
                <p className="text-amber-300 font-medium text-xs w-full">
                  Bu fırsat sona erdi!
                </p>
              )}
            </div>
            <div className="relative h-64 lg:h-auto min-h-[300px]">
              <Image
                src="https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?q=80&w=2070&auto=format&fit=crop"
                alt="Yaz Tatili Fırsatları"
                fill
                className="object-cover lg:rounded-r-xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- Special Events - Stil Güncellendi */}
      <div className="mt-16 md:mt-20">
        <div className="mb-6 md:mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-xl lg:text-2xl font-semibold text-neutral-900">
              Özel Etkinlikler
            </h2>
            <p className="mt-1 text-xs text-neutral-600">
              Bu yaz unutulmaz deneyimler yaşayabileceğiniz özel etkinlikler
            </p>
          </div>
          <Link
            href="/special-events"
            className="text-sky-600 hover:text-sky-800 font-medium flex items-center text-xs"
          >
            Tümünü Görüntüle
            <ChevronRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {[
            {
              id: 1,
              title: 'Kapadokya Festival Haftası',
              date: '15-22 Temmuz 2023',
              image:
                'https://images.unsplash.com/photo-1486911278844-a81c5267e227?q=80&w=2070&auto=format&fit=crop',
              location: 'Kapadokya Vadisi',
            },
            {
              id: 2,
              title: 'Efes Antik Tiyatro Konserleri',
              date: '5-12 Ağustos 2023',
              image:
                'https://images.unsplash.com/photo-1607998802009-26ce5b682ad1?q=80&w=2070&auto=format&fit=crop',
              location: 'Efes Antik Kenti, İzmir',
            },
            {
              id: 3,
              title: "Boğaz'da Yemek Festivali",
              date: '3-10 Haziran 2023',
              image:
                'https://images.unsplash.com/photo-1527547637224-a93d42c7b332?q=80&w=2070&auto=format&fit=crop',
              location: 'İstanbul Boğazı',
            },
          ].map((event) => (
            <Link
              href={`/event/${event.id}`}
              key={event.id}
              className="group relative block overflow-hidden rounded-lg shadow-sm border border-neutral-100/80 hover:shadow-lg transition-all duration-300"
            >
              <div className="relative h-64 w-full">
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent transition-opacity duration-300 group-hover:from-black/80" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="text-sky-300 text-[11px] font-semibold mb-0.5 uppercase tracking-wider">
                  {event.date}
                </div>
                <h3 className="text-white text-base font-semibold mb-0.5 line-clamp-2 transition-transform duration-300 group-hover:-translate-y-0.5">
                  {event.title}
                </h3>
                <div className="flex items-center text-white/70 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <MapPin className="h-3 w-3 mr-0.5" />
                  {event.location}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* --- Statistics Section - Stil Güncellendi */}
      <div className="mt-16 md:mt-20 bg-neutral-100/70 rounded-xl py-10 px-6 md:px-8 border border-neutral-200/60 relative overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center relative z-10">
          {[
            {
              icon: Users,
              val: '10K+',
              text: 'Mutlu Müşteri',
              color: 'text-sky-600',
            },
            {
              icon: MapPin,
              val: '500+',
              text: 'Benzersiz Tur',
              color: 'text-amber-600',
            },
            {
              icon: Star,
              val: '4.8/5',
              text: 'Ortalama Puan',
              color: 'text-emerald-600',
            },
            {
              icon: Calendar,
              val: '7+',
              text: 'Yıllık Deneyim',
              color: 'text-rose-600',
            },
          ].map((stat, index) => (
            <div key={index} className="flex flex-col items-center">
              <stat.icon
                className={`w-8 h-8 md:w-10 md:h-10 mb-2 ${stat.color}`}
                strokeWidth={1.5}
              />
              <div className="text-2xl md:text-3xl font-bold text-neutral-800 tracking-tight">
                {stat.val}
              </div>
              <div className="mt-0.5 text-xs md:text-sm text-neutral-600">
                {stat.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Customer Testimonials - Stil Güncellendi */}
      <div className="mt-16 md:mt-20 mb-12 md:mb-16">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-2xl lg:text-3xl font-semibold text-neutral-900 tracking-tight">
            Müşterilerimiz Ne Diyor?
          </h2>
          <p className="mt-2 text-sm text-neutral-600 max-w-xl mx-auto">
            Misafirlerimizin bizimle yaşadıkları unutulmaz deneyimlere göz atın.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {[
            {
              name: 'Ayşe Y.',
              avatar: 'https://picsum.photos/100/100?random=20',
              text: 'Kapadokya balon turu hayatımda yaşadığım en güzel deneyimlerden biriydi. Her şey sorunsuz ilerledi ve rehberimiz çok bilgiliydi.',
              tour: 'Kapadokya Balon Turu',
              rating: 5,
            },
            {
              name: 'Mehmet K.',
              avatar: 'https://picsum.photos/100/100?random=21',
              text: "İstanbul Boğaz Turu'nda harika bir gün geçirdik. Tekne çok konforluydu ve boğaz manzarası muhteşemdi. Kesinlikle tavsiye ederim!",
              tour: 'İstanbul Boğaz Turu',
              rating: 4,
            },
            {
              name: 'Zeynep A.',
              avatar: 'https://picsum.photos/100/100?random=22',
              text: 'Efes Antik Kenti turu beklentilerimin ötesindeydi. Rehberimiz çok bilgiliydi ve tarih hakkında çok şey öğrendim.',
              tour: 'Efes Antik Kenti Turu',
              rating: 5,
            },
          ].map((testimonial, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-sm border border-neutral-100/80 hover:shadow-lg transition-shadow duration-300 flex flex-col"
            >
              <div className="flex items-center mb-2.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-neutral-300'}`}
                  />
                ))}
              </div>
              <p className="text-neutral-600 italic mb-4 text-sm flex-grow">
                {`"${testimonial.text}"`}
              </p>
              <div className="flex items-center mt-auto pt-3.5 border-t border-neutral-100/80">
                <div className="relative w-9 h-9 mr-3 flex-shrink-0">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    fill
                    sizes="44px"
                    className="rounded-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-900 text-sm">
                    {testimonial.name}
                  </h4>
                  <p className="text-xs text-neutral-500">
                    Katıldığı Tur: {testimonial.tour}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
