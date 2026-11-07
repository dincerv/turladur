'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  X as XMarkIcon,
  Calendar as CalendarIcon,
  Flame as FireIcon,
  Tag as TagIcon,
  Clock as ClockIcon,
  Sparkles as SparklesIcon,
  ChevronRight as ChevronRightIcon,
} from 'lucide-react';

// Deal types
interface Deal {
  id: string;
  title: string;
  discount: string;
  expiry: string;
  color: string;
  image: string;
  link: string;
  badge?: string;
  description?: string;
  category?: string[];
}

interface DealsPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DealsPopup({ isOpen, onClose }: DealsPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null,
  );

  const router = useRouter();

  // Moved handleClose definition before useEffect hooks that use it
  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    const timer = setTimeout(() => {
      onClose();
      setIsClosing(false);
      setActiveCategory('all');
      setShowAll(false);
    }, 300); // Match animation duration
    return () => clearTimeout(timer); // Cleanup timer
  }, [isClosing, onClose]);

  // Client-side render & portal setup
  useEffect(() => {
    setMounted(true);
    setPortalContainer(document.body);
    return () => {
      setMounted(false);
      setPortalContainer(null);
    };
  }, []);

  // Focus handling
  useEffect(() => {
    if (isOpen && !isClosing && closeButtonRef.current) {
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 150); // Slightly increased delay for smoother focus after animation
      return () => clearTimeout(timer);
    }
  }, [isOpen, isClosing]);

  // Click outside & body scroll lock
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Use popupRef.current checking inside the handler
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    let scrollbarWidth = 0;
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
      // Calculate scrollbar width only if needed
      if (window.innerWidth > document.documentElement.clientWidth) {
        scrollbarWidth =
          window.innerWidth - document.documentElement.clientWidth;
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    } else {
      document.body.style.overflow = 'auto';
      document.body.style.paddingRight = '0';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Ensure style reset on cleanup
      document.body.style.overflow = 'auto';
      document.body.style.paddingRight = '0';
    };
  }, [isOpen, handleClose]); // Now handleClose is defined before this useEffect

  // ESC key handler
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, handleClose]); // Now handleClose is defined before this useEffect

  // Handle card click navigation
  const handleCardClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, link: string) => {
      e.preventDefault();
      router.prefetch(link);
      handleClose();
      // Navigate slightly before animation finishes
      const timer = setTimeout(() => {
        router.push(link);
      }, 150);
      return () => clearTimeout(timer); // Cleanup timer
    },
    [router, handleClose],
  );

  // Örnek fırsat verileri
  const deals: Deal[] = [
    {
      id: '1',
      title: 'Erken Rezervasyon İndirimi',
      discount: '%25',
      expiry: 'Son 3 gün',
      color: 'sky',
      image:
        'https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?q=80&w=2070&auto=format&fit=crop',
      link: '/campaigns/early-booking',
      badge: 'Popüler',
      description: 'Yaz tatilini şimdiden planla, %25 indirim kazan!',
      category: ['popular', 'discount'],
    },
    {
      id: '2',
      title: 'Aile Paketi',
      discount: '1 Çocuk Ücretsiz',
      expiry: 'Sınırlı sayıda',
      color: 'emerald',
      image:
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop',
      link: '/campaigns/family-package',
      description: 'Ailecek tatil yapın, çocuğunuzun konaklaması bizden!',
      category: ['seasonal'],
    },
    {
      id: '3',
      title: 'Son Dakika Fırsatı',
      discount: '%30',
      expiry: 'Bugüne özel',
      color: 'rose',
      image:
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=2070&auto=format&fit=crop',
      link: '/campaigns/last-minute',
      description: 'Hemen kararını ver, ekstra %30 indirim yakala!',
      category: ['limited', 'discount'],
    },
    {
      id: '4',
      title: 'Hafta Sonu Kaçamağı',
      discount: '%15',
      expiry: 'Her hafta sonu',
      color: 'blue',
      image:
        'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?q=80&w=2083&auto=format&fit=crop',
      link: '/campaigns/weekend-getaway',
      badge: 'Yeni',
      description:
        'Hafta sonları şehir stresinden uzaklaşın, %15 indirimle dinlenin.',
      category: ['seasonal'],
    },
    {
      id: '5',
      title: 'Bahar Kampanyası',
      discount: '%20',
      expiry: 'Mayıs sonuna kadar',
      color: 'violet',
      image:
        'https://images.unsplash.com/photo-1488085061387-422e29b40080?q=80&w=2031&auto=format&fit=crop',
      link: '/campaigns/spring-deal',
      description: 'Baharın tadını çıkarın, erken yaz fırsatlarını yakalayın.',
      category: ['seasonal'],
    },
    {
      id: '6',
      title: 'Balayı Paketi',
      discount: 'Özel İndirim',
      expiry: 'Yıl boyunca',
      color: 'pink',
      image:
        'https://images.unsplash.com/photo-1539635278303-d4002c07eae3?q=80&w=2070&auto=format&fit=crop',
      link: '/campaigns/honeymoon',
      description:
        'Hayatınızın en özel tatilini unutulmaz kılın, ücretsiz ekstralar!',
      category: ['popular'],
    },
    {
      id: '7',
      title: 'Tekne Turu Fırsatı',
      discount: '2 Kişi 1 Kişi Öder',
      expiry: 'Yaz sezonu',
      color: 'cyan',
      image:
        'https://images.unsplash.com/photo-1586902197503-e71026292412?q=80&w=2070&auto=format&fit=crop',
      link: '/campaigns/boat-tour',
      description: 'Eşsiz mavilikte tekne turu, iki kişi fiyatına bir kişi',
      category: ['seasonal', 'discount'],
    },
    {
      id: '8',
      title: 'Uzun Konaklama İndirimi',
      discount: '%35',
      expiry: 'Her zaman',
      color: 'amber',
      image:
        'https://images.unsplash.com/photo-1629140727571-9b5c6f6267b4?q=80&w=2070&auto=format&fit=crop',
      link: '/campaigns/long-stay',
      badge: 'Sınırlı',
      description: "7 gece ve üzeri konaklamalarda %35'e varan indirim!",
      category: ['limited', 'discount'],
    },
    {
      id: '9',
      title: 'Kültür Turu Kampanyası',
      discount: '%15 + Müze Kartı',
      expiry: 'Kış sezonu',
      color: 'indigo',
      image:
        'https://images.unsplash.com/photo-1572883454114-1cf0031ede2a?q=80&w=2076&auto=format&fit=crop',
      link: '/campaigns/culture-tour',
      description:
        'Şehrin kültürel zenginliklerini keşfedin, müze kartı hediye',
      category: ['seasonal', 'popular'],
    },
  ];

  const categories = [
    { id: 'all', name: 'Tümü', icon: SparklesIcon },
    { id: 'popular', name: 'Popüler', icon: FireIcon },
    { id: 'seasonal', name: 'Mevsimsel', icon: CalendarIcon },
    { id: 'discount', name: 'İndirimli', icon: TagIcon },
    { id: 'limited', name: 'Sınırlı', icon: ClockIcon },
  ];

  const filteredDeals =
    activeCategory === 'all'
      ? deals
      : deals.filter((deal) => deal.category?.includes(activeCategory));

  const displayedDeals = showAll ? filteredDeals : filteredDeals.slice(0, 6);
  const hasMoreDeals = filteredDeals.length > 6;

  // Eğer component açık değilse veya client-side'da render edilmemişse hiçbir şey gösterme
  if (!isOpen || !mounted || !portalContainer) return null;

  const popupContent = (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        // Sadece arka planın kendisine tıklandığında popup'ı kapat
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      {/* Arkaplan Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        aria-hidden="true"
      />

      <div
        ref={popupRef}
        className={`relative bg-white rounded-lg shadow-2xl mx-auto max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-300 ease-in-out ${
          isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        {/* Header */}
        <div className="bg-indigo-700 pt-5 pb-4 px-6 sm:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="text-white text-xl sm:text-2xl font-extrabold tracking-tight flex items-center"
                id="modal-title"
              >
                <TagIcon className="w-6 h-6 mr-2.5" />
                Özel Fırsatlar
              </h2>
              <p className="text-indigo-100 mt-1 text-sm">
                Size özel en avantajlı kampanyalarımız
              </p>
            </div>

            <button
              ref={closeButtonRef}
              onClick={handleClose}
              className="rounded-full bg-indigo-600 hover:bg-indigo-500 p-1.5 text-indigo-100 hover:text-white transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-700 focus:ring-white active:scale-[0.95]"
              aria-label="Kapat"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Category Pills */}
          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ease-in-out transform active:scale-[0.97] ${
                  activeCategory === category.id
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'bg-indigo-600 text-indigo-100 hover:bg-indigo-500 hover:text-white'
                }`}
              >
                <category.icon className="w-4 h-4" />
                {category.name}
                {activeCategory === category.id && activeCategory !== 'all' && (
                  <span className="ml-1 rounded-full bg-indigo-200 text-indigo-800 text-xs font-medium px-1.5 py-0.5">
                    {filteredDeals.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-y-auto p-6 sm:p-8 flex-grow bg-gray-50/70">
          {/* Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedDeals.map((deal) => (
              <Link
                href={deal.link}
                key={deal.id}
                className={`group relative rounded-lg overflow-hidden flex flex-col bg-white shadow-md hover:shadow-lg transform transition-all duration-300 ease-in-out border border-transparent hover:border-indigo-100 ${
                  hoveredCard === deal.id ? 'scale-[1.03]' : 'scale-100'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                onClick={(e) => handleCardClick(e, deal.link)}
                onMouseEnter={() => setHoveredCard(deal.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={deal.image}
                    alt={deal.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                  />

                  {/* Overlay Gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent mix-blend-multiply`}
                  ></div>

                  {/* Discount Badge */}
                  <div className="absolute top-3 left-3">
                    <div className="bg-white text-gray-900 text-base sm:text-lg font-bold px-2.5 py-1 rounded-md shadow-lg">
                      {deal.discount}
                    </div>
                  </div>

                  {/* Badge (if any) */}
                  {deal.badge && (
                    <div className="absolute top-3 right-3">
                      <div className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-md shadow-md flex items-center">
                        <FireIcon className="w-3 h-3 mr-1" />
                        {deal.badge}
                      </div>
                    </div>
                  )}

                  {/* Title & Expiry */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                    <h3 className="font-semibold tracking-tight text-white text-base sm:text-lg line-clamp-1">
                      {deal.title}
                    </h3>
                    <div className="flex items-center mt-1 text-xs text-white/80">
                      <ClockIcon className="w-3.5 h-3.5 mr-1" />
                      {deal.expiry}
                    </div>
                  </div>
                </div>

                <div className="p-4 flex-grow flex flex-col justify-between">
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {deal.description}
                  </p>

                  <div className="flex justify-between items-end mt-auto pt-2">
                    <div className="flex items-center space-x-1.5 text-gray-400">
                      {deal.category?.map((cat) => {
                        const foundCat = categories.find((c) => c.id === cat);
                        return foundCat ? (
                          <span
                            key={cat}
                            title={foundCat.name}
                            className="p-1.5 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                          >
                            <foundCat.icon className="w-3.5 h-3.5" />
                          </span>
                        ) : null;
                      })}
                    </div>

                    <div className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium text-sm">
                      <span className="tracking-tight">Fırsatı Gör</span>
                      <ChevronRightIcon className="w-4 h-4 ml-0.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Show More Button */}
          {hasMoreDeals && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="inline-flex items-center justify-center bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-medium px-5 py-2.5 rounded-lg transition-all duration-200 ease-in-out text-sm tracking-tight transform active:scale-[0.98]"
              >
                {showAll ? (
                  <>
                    <XMarkIcon className="w-4 h-4 mr-1.5" />
                    <span>Daha Az Göster</span>
                  </>
                ) : (
                  <>
                    <span>Tümünü Göster</span>
                    <span className="ml-2 bg-indigo-200 text-indigo-800 text-xs font-medium rounded-full px-1.5 py-0.5">
                      +{filteredDeals.length - 6}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-100 border-t border-gray-200 p-5">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h4 className="font-semibold tracking-tight text-gray-800 flex items-center text-base">
                Özel Avantajlardan Yararlanın
              </h4>
              <p className="text-gray-600 text-sm mt-0.5">
                turta üyeleri tüm fırsatlardan öncelikli haberdar olur.
              </p>
            </div>

            <Link
              href="/campaigns"
              className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-lg transition-all duration-200 ease-in-out text-sm shadow-sm hover:shadow-md tracking-tight transform active:scale-[0.98]"
              onClick={(e) => handleCardClick(e, '/campaigns')}
            >
              <span>Tüm Kampanyalar</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  // Client-side render kontrolü için createPortal'ı şartlı olarak kullanıyoruz
  return createPortal(popupContent, portalContainer);
}
