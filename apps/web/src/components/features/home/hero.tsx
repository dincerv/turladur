'use client';

import {
  useState,
  useEffect,
  useMemo,
  useRef,
  type ComponentType,
} from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin as MapPinIcon,
  CalendarDays as CalendarDaysIcon,
  Users as UserGroupIcon,
  Search as MagnifyingGlassIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Plane as PaperAirplaneIcon,
} from 'lucide-react';
import { DEFAULT_DEPARTURE_CITIES } from '@/lib/departure-cities';

type DepartureCityOption = {
  city: string;
  count: number;
};

// Statik arka plan görseli (Daha modern bir görsel seçilebilir)
const staticHeroImage =
  'https://images.unsplash.com/photo-1583062482795-d2bef78e9bc1?q=80&w=2070&auto=format&fit=crop';

// Modal için gerekli veriler
const locations = [
  {
    name: 'İstanbul',
    image:
      'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Kapadokya',
    image:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Antalya',
    image:
      'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?auto=format&fit=crop&w=200&q=80',
  },
  {
    name: 'Bodrum',
    image:
      'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80',
  },
];
const monthNames = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

const routesHeroImage =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=2070&q=80';

const HOME_HERO_SLOGANS = [
  "Aradığın deneyim Turta'da.",
  "Rotan Turta'da.",
  'Türkiye turlarını keşfet.',
] as const;

const HOME_HERO_SLOGAN_INTERVAL_MS = 10_000;
const HOME_HERO_SLOGAN_FADE_MS = 300;

type HeroProps = {
  variant?: 'default' | 'routes';
};

export function Hero({ variant = 'default' }: HeroProps) {
  const router = useRouter();

  // State'ler
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedDepartureCity, setSelectedDepartureCity] = useState<
    string | null
  >(null);
  const [departureCityOptions] = useState<DepartureCityOption[]>(
    (DEFAULT_DEPARTURE_CITIES as readonly string[]).map((city) => ({
      city,
      count: 0,
    })),
  );
  const [departureCitySearch, setDepartureCitySearch] = useState('');
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [adultCount, setAdultCount] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<
    'location' | 'departure' | 'dates' | 'guests'
  >('location');
  const [currentMonth, setCurrentMonth] = useState(0); // Takvim navigasyonu

  const modalRef = useRef<HTMLDivElement>(null);
  const [isBrowser, setIsBrowser] = useState(false);
  const [sloganIndex, setSloganIndex] = useState(0);
  const [sloganOpaque, setSloganOpaque] = useState(true);

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // Ana sayfa hero slogan rotasyonu — sadece default variant; layout aynı.
  useEffect(() => {
    if (variant !== 'default') return;

    let fadeTimeout: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      setSloganOpaque(false);
      fadeTimeout = setTimeout(() => {
        setSloganIndex((prev) => (prev + 1) % HOME_HERO_SLOGANS.length);
        setSloganOpaque(true);
      }, HOME_HERO_SLOGAN_FADE_MS);
    }, HOME_HERO_SLOGAN_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      if (fadeTimeout) clearTimeout(fadeTimeout);
    };
  }, [variant]);

  // Nest’te facet endpoint yok; kalkış şehirleri DEFAULT_DEPARTURE_CITIES ile init.

  // Dışarı tıklama + Escape ile modal kapatma; scroll kilidi
  useEffect(() => {
    if (!isSearchModalOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setIsSearchModalOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSearchModalOpen(false);
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSearchModalOpen]);

  // Arama modalını açma
  const openSearchModal = (
    tab: 'location' | 'departure' | 'dates' | 'guests' = 'location',
  ) => {
    setIsSearchModalOpen(true);
    setActiveModalTab(tab);
  };

  const formatDateParam = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const buildToursSearchUrl = () => {
    const params = new URLSearchParams();
    const destination = selectedLocation || searchQuery.trim();

    if (destination) {
      params.set('q', destination);
    }

    if (selectedDepartureCity) {
      params.set('departureCity', selectedDepartureCity);
    }

    if (selectedStartDate)
      params.set('startDate', formatDateParam(selectedStartDate));
    if (selectedEndDate)
      params.set('endDate', formatDateParam(selectedEndDate));
    if (adultCount >= 1) params.set('adults', adultCount.toString());
    if (childrenCount > 0) params.set('children', childrenCount.toString());

    const query = params.toString();
    return query ? `/tours?${query}` : '/tours';
  };

  // Modal'dan veya hero arama butonundan yönlendirme
  const handleFinalSearch = () => {
    setIsSearchModalOpen(false);
    const url = buildToursSearchUrl();
    router.push(url);
  };

  // --- Yardımcı Fonksiyonlar ---
  const formatDate = (date: Date | null) => {
    if (!date) return 'Tarih Ekle';
    // Daha kısa format
    return new Intl.DateTimeFormat('tr-TR', {
      day: 'numeric',
      month: 'long',
    }).format(date);
  };

  const formatGuests = () => {
    const total = adultCount + childrenCount;
    if (total === 0) return 'Kişi Ekle';
    return `${total} Kişi`;
  };

  const formatGuestsMobile = () => {
    const parts: string[] = [];
    if (adultCount > 0) parts.push(`${adultCount} Yetişkin`);
    if (childrenCount > 0) parts.push(`${childrenCount} Çocuk`);
    return parts.length > 0 ? parts.join(', ') : 'Misafir ekle';
  };

  const formatDestinationDisplay = () => {
    return (
      selectedLocation || searchQuery.trim() || 'Şehir, bölge veya tur adı'
    );
  };

  const formatDepartureDisplay = () => {
    return selectedDepartureCity || 'Kalkış yeri seçin';
  };

  const formatDateRangeDisplay = () => {
    if (!selectedStartDate) return 'Başlangıç - Bitiş tarihi';
    const start = formatDate(selectedStartDate);
    const end = selectedEndDate ? formatDate(selectedEndDate) : 'Bitiş';
    return `${start} - ${end}`;
  };

  const filteredDepartureCities = departureCityOptions.filter((option) =>
    option.city
      .toLocaleLowerCase('tr-TR')
      .includes(departureCitySearch.toLocaleLowerCase('tr-TR')),
  );

  const handleDateSelect = (date: Date) => {
    // Tarih seçme mantığı güncellendi: ilk tıklama başlangıç, ikinci tıklama bitiş
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
    } else if (date < selectedStartDate) {
      // Eğer başlangıçtan önceki bir tarih seçilirse, yeni başlangıç tarihi olur
      setSelectedStartDate(date);
      setSelectedEndDate(null);
    } else {
      // Başlangıç tarihi varken sonraki bir tarih seçilirse, bitiş tarihi olur
      setSelectedEndDate(date);
      // Bitiş tarihi seçildikten sonra otomatik olarak misafir sekmesine geçilebilir
      // setActiveModalTab('guests');
    }
  };

  // Geçmiş tarih kontrolü
  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Seçili tarih kontrolü
  const isSelectedDate = (date: Date) => {
    if (selectedStartDate && date.getTime() === selectedStartDate.getTime())
      return 'start';
    if (selectedEndDate && date.getTime() === selectedEndDate.getTime())
      return 'end';
    return false;
  };

  // Tarih aralığında mı kontrolü
  const isInDateRange = (date: Date) => {
    if (!selectedStartDate || !selectedEndDate) return false;
    return date > selectedStartDate && date < selectedEndDate;
  };

  // Takvim oluşturma fonksiyonu
  const generateCalendar = (monthOffset: number) => {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const targetDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + monthOffset,
      1,
    );
    const month = targetDate.getMonth();
    const year = targetDate.getFullYear();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let firstDayOffset = firstDayOfMonth.getDay(); // Pazar=0, Ptesi=1...
    firstDayOffset = firstDayOffset === 0 ? 6 : firstDayOffset - 1; // Pazartesi=0 yap

    const daysInMonth = lastDayOfMonth.getDate();
    const weeks: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = Array(firstDayOffset).fill(null);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      currentWeek.push(date);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      currentWeek.push(...Array(7 - currentWeek.length).fill(null));
      weeks.push(currentWeek);
    }
    return { month, year, weeks };
  };

  const calendarCurrent = useMemo(
    () => generateCalendar(currentMonth),
    [currentMonth],
  );
  const calendarNext = useMemo(
    () => generateCalendar(currentMonth + 1),
    [currentMonth],
  );
  // --- End Yardımcı Fonksiyonlar ---

  // --- Modal Render Fonksiyonu ---
  const renderSearchModal = () => {
    if (!isSearchModalOpen || !isBrowser) return null;

    return createPortal(
      <div
        className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 p-4 animate-fadeInBg"
        role="dialog"
        aria-modal="true"
        aria-label="Tur arama"
      >
        <div
          ref={modalRef}
          className="bg-white rounded-xl shadow-xl w-full max-w-3xl animate-slideDownEnter overflow-hidden border border-neutral-200/70"
        >
          {/* Modal Tabs */}
          <div
            className="flex border-b border-neutral-200 bg-neutral-50/50 overflow-x-auto"
            role="tablist"
          >
            {(
              [
                { id: 'location', label: 'Konum' },
                { id: 'departure', label: 'Kalkış' },
                { id: 'dates', label: 'Tarihler' },
                { id: 'guests', label: 'Misafirler' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeModalTab === tab.id}
                onClick={() => setActiveModalTab(tab.id)}
                className={`flex-1 min-w-[72px] py-3 px-2 text-center text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-950 ${activeModalTab === tab.id ? 'border-neutral-950 text-neutral-950 font-semibold' : 'border-transparent text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Modal Content */}
          <div className="p-6 md:p-8 min-h-[350px]">
            {/* Konum Sekmesi İçeriği */}
            {activeModalTab === 'location' && (
              <div className="animate-fadeIn">
                <h3 className="text-lg font-semibold mb-4 text-neutral-900">
                  Nereye gitmek istersiniz?
                </h3>
                <div className="relative mb-6">
                  {/* Input stili güncellendi */}
                  <MagnifyingGlassIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-neutral-950 text-neutral-800 placeholder-neutral-400 text-sm"
                    placeholder="Şehir, bölge veya tur adı..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    maxLength={120}
                    autoFocus
                  />
                </div>
                <h4 className="text-xs font-medium text-neutral-500 mb-3 uppercase tracking-wider">
                  Popüler Destinasyonlar
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {locations.map((location) => (
                    <button
                      key={location.name}
                      type="button"
                      onClick={() => {
                        setSelectedLocation(location.name);
                        setSearchQuery(location.name);
                        setActiveModalTab('departure');
                      }}
                      className="text-left group transition-transform duration-200 ease-out hover:scale-[1.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 rounded-lg"
                    >
                      <div className="aspect-[4/3] rounded-lg overflow-hidden mb-2 relative shadow-sm border border-neutral-100">
                        <Image
                          src={location.image}
                          alt=""
                          fill
                          className="object-cover group-hover:brightness-105 transition-all duration-300"
                          sizes="(max-width: 640px) 50vw, 25vw"
                        />
                      </div>
                      <p className="text-sm font-medium text-neutral-800 group-hover:text-neutral-950 transition-colors truncate">
                        {location.name}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeModalTab === 'departure' && (
              <div className="animate-fadeIn">
                <h3 className="text-lg font-semibold mb-4 text-neutral-900">
                  Nereden kalkıyorsunuz?
                </h3>
                <div className="relative mb-4">
                  <MagnifyingGlassIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-neutral-950 text-neutral-800 placeholder-neutral-400 text-sm"
                    placeholder="Kalkış şehri ara..."
                    value={departureCitySearch}
                    onChange={(e) => setDepartureCitySearch(e.target.value)}
                  />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {filteredDepartureCities.map((option) => (
                    <button
                      key={option.city}
                      type="button"
                      onClick={() => {
                        setSelectedDepartureCity(option.city);
                        setDepartureCitySearch('');
                        setActiveModalTab('dates');
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                        selectedDepartureCity === option.city
                          ? 'bg-neutral-100 text-neutral-950 font-medium'
                          : 'text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      <span>{option.city}</span>
                      {option.count > 0 && (
                        <span className="text-xs text-neutral-400">
                          {option.count} tur
                        </span>
                      )}
                    </button>
                  ))}
                  {filteredDepartureCities.length === 0 && (
                    <p className="text-sm text-neutral-500 text-center py-4">
                      Sonuç bulunamadı
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Tarih Sekmesi İçeriği */}
            {activeModalTab === 'dates' && (
              <div className="animate-fadeIn">
                <h3 className="text-lg font-semibold mb-5 text-neutral-900">
                  Tarih Aralığı Seçin
                </h3>
                {/* Takvim stilleri güncellendi */}
                <div className="flex justify-between items-center mb-4">
                  <button
                    type="button"
                    className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    onClick={() => setCurrentMonth(currentMonth - 1)}
                    disabled={currentMonth === 0}
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  {/* Ay gösterimi */}
                  <div className="flex-grow text-center">
                    <div className="font-semibold text-neutral-800 text-sm">
                      {monthNames[calendarCurrent.month]} {calendarCurrent.year}
                    </div>
                    <div className="font-semibold text-neutral-800 text-sm ml-12 hidden sm:inline-block">
                      {monthNames[calendarNext.month]} {calendarNext.year}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
                    onClick={() => setCurrentMonth(currentMonth + 1)}
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                  {[calendarCurrent, calendarNext].map((cal, calIndex) => (
                    <div
                      key={calIndex}
                      className={`${calIndex === 0 ? 'mb-4 sm:mb-0' : 'hidden sm:block'} ${calIndex === 1 ? 'sm:border-l sm:pl-6 sm:border-neutral-200' : ''}`}
                    >
                      {/* Gün isimleri */}
                      <div className="grid grid-cols-7 gap-y-1 text-center text-xs text-neutral-500 font-medium mb-2">
                        <div>Pt</div>
                        <div>Sa</div>
                        <div>Ça</div>
                        <div>Pe</div>
                        <div>Cu</div>
                        <div>Ct</div>
                        <div>Pa</div>
                      </div>
                      {/* Takvim günleri */}
                      {cal.weeks.map((week, weekIdx) => (
                        <div key={weekIdx} className="grid grid-cols-7">
                          {week.map((date, dayIdx) => {
                            if (!date)
                              return (
                                <div key={dayIdx} className="p-0.5">
                                  <div className="h-7"></div>
                                </div>
                              );
                            const isPast = isPastDate(date);
                            const selectionState = isSelectedDate(date);
                            const isInRange = isInDateRange(date);
                            const isStart = selectionState === 'start';
                            const isEnd = selectionState === 'end';

                            // Daha iyi UX için takvim gün stilleri
                            const dayWrapperClasses = `p-0.5 ${isInRange || isStart || isEnd ? 'bg-neutral-200/80' : ''} ${isStart ? 'rounded-l-full' : ''} ${isEnd ? 'rounded-r-full' : ''}`;
                            const buttonClasses = `
                                h-7 w-full flex items-center justify-center rounded-full text-xs transition-colors duration-150 ease-out 
                                ${
                                  isPast
                                    ? 'text-neutral-300 cursor-not-allowed'
                                    : isStart || isEnd
                                      ? 'bg-neutral-950 text-white font-semibold'
                                      : isInRange
                                        ? 'text-neutral-950'
                                        : 'text-neutral-700 hover:bg-neutral-100'
                                }
                              `;

                            return (
                              <div key={dayIdx} className={dayWrapperClasses}>
                                <button
                                  type="button"
                                  disabled={isPast}
                                  onClick={() => handleDateSelect(date)}
                                  className={buttonClasses}
                                >
                                  {date.getDate()}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                {/* Temizle butonu eklenebilir */}
                {(selectedStartDate || selectedEndDate) && (
                  <button
                    onClick={() => {
                      setSelectedStartDate(null);
                      setSelectedEndDate(null);
                    }}
                    className="text-xs text-neutral-500 hover:text-neutral-700 underline mt-4"
                  >
                    Tarihleri Temizle
                  </button>
                )}
              </div>
            )}

            {/* Misafir Sekmesi İçeriği */}
            {activeModalTab === 'guests' && (
              <div className="animate-fadeIn">
                <h3 className="text-lg font-semibold mb-6 text-neutral-900">
                  Misafir Sayısı Seçin
                </h3>
                <div className="space-y-6 max-w-sm mx-auto">
                  {/* Yetişkinler */}
                  <div className="flex justify-between items-center">
                    <div>
                      {/* Misafir etiketleri güncellendi */}
                      <p className="font-medium text-neutral-800">
                        Yetişkinler
                      </p>
                      <p className="text-xs text-neutral-500">
                        13 yaş ve üzeri
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      {/* Sayaç butonları güncellendi */}
                      <button
                        type="button"
                        onClick={() =>
                          setAdultCount(Math.max(1, adultCount - 1))
                        }
                        disabled={adultCount <= 1}
                        className="w-7 h-7 rounded-full border border-neutral-300 text-neutral-600 disabled:opacity-40 flex items-center justify-center hover:border-neutral-500 transition text-lg"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium text-base text-neutral-900">
                        {adultCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setAdultCount(adultCount + 1)}
                        className="w-7 h-7 rounded-full border border-neutral-300 text-neutral-600 flex items-center justify-center hover:border-neutral-500 transition text-lg"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {/* Çocuklar */}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-neutral-800">Çocuklar</p>
                      <p className="text-xs text-neutral-500">2-12 yaş</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() =>
                          setChildrenCount(Math.max(0, childrenCount - 1))
                        }
                        disabled={childrenCount <= 0}
                        className="w-7 h-7 rounded-full border border-neutral-300 text-neutral-600 disabled:opacity-40 flex items-center justify-center hover:border-neutral-500 transition text-lg"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium text-base text-neutral-900">
                        {childrenCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setChildrenCount(childrenCount + 1)}
                        className="w-7 h-7 rounded-full border border-neutral-300 text-neutral-600 flex items-center justify-center hover:border-neutral-500 transition text-lg"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer / Arama Butonu */}
          <div className="bg-neutral-50 p-4 border-t border-neutral-200 flex items-center justify-between">
            {/* Seçimleri temizle butonu */}
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedLocation(null);
                setSelectedDepartureCity(null);
                setDepartureCitySearch('');
                setSelectedStartDate(null);
                setSelectedEndDate(null);
                setAdultCount(2);
                setChildrenCount(0);
                setActiveModalTab('location');
              }}
              className="text-xs text-neutral-500 hover:text-neutral-700 underline"
            >
              Temizle
            </button>
            <button
              type="button"
              onClick={handleFinalSearch}
              // Arama butonu stili güncellendi
              className="px-6 py-2.5 bg-neutral-950 hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-950 text-white font-semibold rounded-lg transition-colors text-sm shadow-sm flex items-center gap-2"
            >
              <MagnifyingGlassIcon className="w-4 h-4" />
              Tur Ara
            </button>
          </div>
        </div>
      </div>,
      document.body,
    );
  };
  // --- End Modal Render Fonksiyonu ---

  const isRoutesVariant = variant === 'routes';

  const renderMobileSearchRow = ({
    icon: Icon,
    label,
    value,
    onClick,
    hasBorder = true,
    hasValue = false,
  }: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: string;
    onClick: () => void;
    hasBorder?: boolean;
    hasValue?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 py-4 min-h-[64px] text-left transition-colors hover:bg-neutral-50/80 ${
        hasBorder ? 'border-b border-neutral-100' : ''
      }`}
    >
      <Icon className="w-5 h-5 text-neutral-950 flex-shrink-0" />
      <div className="flex-1 min-w-0 pr-2">
        <p className="text-[11px] leading-tight text-neutral-500 mb-1">
          {label}
        </p>
        <p
          className={`text-sm leading-snug truncate ${hasValue ? 'font-semibold text-neutral-900' : 'font-normal text-neutral-500'}`}
        >
          {value}
        </p>
      </div>
      <ChevronRightIcon className="w-4 h-4 text-neutral-400 flex-shrink-0 ml-auto" />
    </button>
  );

  const renderMobileSearchCard = () => (
    <div className="w-full animate-slideUp delay-200 relative z-20">
      <div className="mx-4 bg-white rounded-2xl shadow-lg border border-neutral-100/80 px-5 py-4 text-left">
        {renderMobileSearchRow({
          icon: MapPinIcon,
          label: 'Nereye gitmek istersin?',
          value: formatDestinationDisplay(),
          hasValue: !!(selectedLocation || searchQuery.trim()),
          onClick: () => openSearchModal('location'),
        })}
        {renderMobileSearchRow({
          icon: PaperAirplaneIcon,
          label: 'Nereden?',
          value: formatDepartureDisplay(),
          hasValue: !!selectedDepartureCity,
          onClick: () => openSearchModal('departure'),
        })}
        {renderMobileSearchRow({
          icon: CalendarDaysIcon,
          label: 'Tarih',
          value: formatDateRangeDisplay(),
          hasValue: !!selectedStartDate,
          onClick: () => openSearchModal('dates'),
        })}
        {renderMobileSearchRow({
          icon: UserGroupIcon,
          label: 'Kişi',
          value: formatGuestsMobile(),
          hasValue: adultCount > 0 || childrenCount > 0,
          onClick: () => openSearchModal('guests'),
          hasBorder: false,
        })}
        <Link
          href={buildToursSearchUrl()}
          onClick={() => setIsSearchModalOpen(false)}
          className="mt-2 w-full flex items-center justify-center gap-2 bg-neutral-950 hover:bg-neutral-800 text-white font-semibold rounded-full py-3.5 transition-colors shadow-sm relative z-10 touch-manipulation"
        >
          <MagnifyingGlassIcon className="w-5 h-5" />
          Keşfet
        </Link>
      </div>
    </div>
  );

  const renderDesktopSearchBar = () => (
    <div className="w-full max-w-3xl mx-auto animate-slideUp delay-200">
      <div className="w-full grid grid-cols-[1fr_auto_1fr_auto_1fr_auto] items-center bg-white/95 backdrop-blur-sm rounded-full shadow-lg p-2 text-left border border-neutral-200/30 hover:shadow-xl transition-shadow duration-300">
        <button
          type="button"
          onClick={() => openSearchModal('location')}
          className="flex-1 flex items-center pl-3 pr-2 min-w-0 text-left"
        >
          <MapPinIcon className="w-4 h-4 text-neutral-950 mr-2 flex-shrink-0" />
          <span className="text-neutral-700 text-sm truncate font-medium">
            {selectedLocation || searchQuery || 'Nereye?'}
          </span>
        </button>
        <div className="hidden md:block h-6 border-l border-neutral-200 mx-1"></div>
        <button
          type="button"
          onClick={() => openSearchModal('dates')}
          className="flex-1 flex items-center pl-3 pr-2 min-w-0 text-left"
        >
          <CalendarDaysIcon className="w-4 h-4 text-neutral-950 mr-2 flex-shrink-0" />
          <span className="text-neutral-700 text-sm truncate font-medium">
            {selectedStartDate
              ? `${formatDate(selectedStartDate)}${selectedEndDate ? ` - ${formatDate(selectedEndDate)}` : ''}`
              : 'Tarihler'}
          </span>
        </button>
        <div className="hidden md:block h-6 border-l border-neutral-200 mx-1"></div>
        <button
          type="button"
          onClick={() => openSearchModal('guests')}
          className="flex-1 flex items-center pl-3 pr-2 min-w-0 text-left"
        >
          <UserGroupIcon className="w-4 h-4 text-neutral-950 mr-2 flex-shrink-0" />
          <span className="text-neutral-500 text-sm truncate font-medium whitespace-nowrap">
            {formatGuests()}
          </span>
        </button>
        <button
          type="button"
          onClick={handleFinalSearch}
          aria-label="Tur ara"
          className="flex-shrink-0 ml-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-neutral-950 shadow hover:bg-neutral-800 transition-colors"
        >
          <MagnifyingGlassIcon className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );

  return (
    <section
      className={`relative mt-0 w-full overflow-hidden flex ${
        isRoutesVariant
          ? 'min-h-[650px] h-[85vh] max-h-[900px] items-center justify-center'
          : 'flex-col md:items-center md:justify-center min-h-[520px] md:min-h-[650px] h-auto md:h-[85vh] md:max-h-[900px] pb-8 md:pb-0'
      }`}
    >
      {/* Arka Plan Görseli */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        <Image
          src={isRoutesVariant ? routesHeroImage : staticHeroImage}
          alt={
            isRoutesVariant
              ? "Türkiye'nin popüler rotalarını keşfedin"
              : "Türkiye'nin güzelliklerini keşfedin"
          }
          fill
          sizes="100vw"
          priority
          className="object-cover object-center filter brightness-[0.6]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-black/50 md:from-black/40 md:via-black/20 md:to-black/60" />
      </div>

      {/* Hero İçeriği */}
      <div
        className={`relative z-10 container mx-auto px-4 md:px-6 flex flex-col items-center text-center text-white w-full ${
          isRoutesVariant
            ? 'justify-center'
            : 'justify-start md:justify-center pt-20 md:pt-0'
        }`}
      >
        <div
          className={`w-full max-w-4xl animate-fadeIn ${isRoutesVariant ? 'mb-0' : 'mb-4 md:mb-10'}`}
        >
          <h1
            className="text-[1.75rem] leading-tight sm:text-4xl md:text-6xl lg:text-[64px] font-bold mb-3 md:mb-5 tracking-tight text-white"
            aria-live="polite"
          >
            {isRoutesVariant ? (
              <>Popüler Rotaları Keşfet</>
            ) : (
              <span
                className={`inline-block transition-opacity duration-300 ease-out ${
                  sloganOpaque ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {HOME_HERO_SLOGANS[sloganIndex]}
              </span>
            )}
          </h1>
          <p className="text-sm leading-relaxed md:text-xl max-w-2xl mx-auto text-white/85 md:text-white/90 font-light px-1 md:px-2">
            {isRoutesVariant
              ? 'Kapadokya, Likya Yolu, Pamukkale ve daha fazlası için tur seçeneklerini inceleyin.'
              : "Türkiye'nin dört bir yanındaki turları ve deneyimleri kolayca bulun, karşılaştırın ve rezerve edin."}
          </p>
        </div>

        {!isRoutesVariant ? (
          <>
            <div className="md:hidden w-full max-w-lg">
              {renderMobileSearchCard()}
            </div>
            <div className="hidden md:flex md:w-full md:flex-col md:items-center">
              {renderDesktopSearchBar()}
            </div>
          </>
        ) : null}
      </div>

      {!isRoutesVariant && renderSearchModal()}
    </section>
  );
}
export default Hero;
