'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Tag as TagIcon,
  X as XMarkIcon,
  ChevronDown as ChevronDownIcon,
  Building2 as BuildingOfficeIcon,
  Menu as Bars3Icon,
  Search as MagnifyingGlassIcon,
} from 'lucide-react';

import { BrandLogo } from '@/components/brand/brand-logo';
import DealsPopup from '@/components/layout/deals-popup';
import { useAuth } from '@/providers/auth-provider';
import { getPanelHrefForRole } from '@/lib/panel-routes';
import {
  AUTH_LINKS,
  MOBILE_TOUR_EXTRA_LINKS,
  NAV_LINKS,
  TOUR_DROPDOWN_LINKS,
} from '@/lib/site-nav';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dealsOpen, setDealsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const signingOutRef = useRef(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();
  const panelHref = getPanelHrefForRole(user?.role);
  const authStatus = isSigningOut
    ? 'unauthenticated'
    : isAuthenticated
      ? 'authenticated'
      : 'unauthenticated';
  // AuthProvider has no async "loading" gate; keep skeleton branch for future parity.
  const isAuthLoading = false as boolean;
  const sessionUser = user
    ? {
        name:
          [user.firstName, user.lastName].filter(Boolean).join(' ') ||
          user.email,
        email: user.email,
        image: null as string | null,
        provider:
          user.role === 'PARTNER' || user.role === 'PARTNER_STAFF'
            ? 'partner-credentials'
            : 'credentials',
      }
    : null;

  // Client-side kontrolü için mounted state'i
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Scroll listener to update isScrolled state
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20); // Daha erken tetiklensin
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Başlangıç durumu
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sayfa değiştiğinde dropdown ve menüyü kapat
  useEffect(() => {
    setActiveDropdown(null);
    setIsMenuOpen(false);
    setSearchOpen(false);
    setDealsOpen(false);
  }, [pathname]);

  // Arama açıldığında input'a odaklan
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const toggleDropdown = useCallback((dropdown: string) => {
    setActiveDropdown((prev) => (prev === dropdown ? null : dropdown));
    setSearchOpen(false);
  }, []);

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
    setActiveDropdown(null);
    setIsMenuOpen(false);
  };

  // Dışarı tıklandığında dropdown'ları kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activeDropdown &&
        !(event.target as Element).closest('.dropdown-container')
      ) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  // Mobil menü dışına tıklandığında menüyü kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('.mobile-menu-button')
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Menü açıkken body scroll kilidi (CLS / arka plan kayması yok)
  useEffect(() => {
    if (!isMenuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isMenuOpen]);

  // Arama dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchOpen &&
        searchRef.current &&
        !searchRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('.search-button')
      ) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchOpen]);

  const openDealsPopup = useCallback(() => {
    if (mounted) {
      setDealsOpen(true);
      setIsMenuOpen(false);
      setActiveDropdown(null);
    }
  }, [mounted]);

  const handleSignOut = useCallback(() => {
    if (signingOutRef.current) return;
    signingOutRef.current = true;
    setIsSigningOut(true);
    setActiveDropdown(null);
    setIsMenuOpen(false);
    setSearchOpen(false);
    setDealsOpen(false);

    logout();
    window.location.replace('/');
  }, [logout]);

  const handleAuthClick = () => {
    // Nest auth: no partner-credentials session on marketing header
  };

  const handlePartnerPortalClick = () => {
    router.push('/acente/giris');
  };

  // Açık zeminli sayfalar: şeffaf + beyaz link (hero stili) kullanılmaz
  const lightBackgroundRoutes = [
    '/about',
    '/contact',
    '/profile',
    '/bookings',
    '/login',
    '/register',
    '/acente/giris',
    '/partner-register',
    '/blog',
    '/tours',
    '/activities',
    '/routes',
    '/campaigns',
    '/careers',
    '/gastronomi',
    '/kultur-turlari',
    '/macera-aktiviteleri',
  ];
  // Sadece gerçek App Router path'leri — ghost EN slug'lar ve silinmiş
  // `/destinations/`, `/agency/` kaldırıldı (Sprint 25.3).
  const lightBackgroundPrefixes = [
    '/blog',
    '/checkout',
    '/tours/',
    '/activities/',
    '/routes/',
    '/gastronomi',
    '/kultur-turlari',
    '/macera-aktiviteleri',
    '/tour-operator',
    '/faq',
    '/privacy',
    '/terms',
    '/cookie-policy',
    '/accessibility',
  ];
  const forceScrolledAppearance =
    lightBackgroundRoutes.includes(pathname) ||
    lightBackgroundPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix),
    );

  // Eski sistem: scrollY > 20 → beyaz navbar + koyu logo; en üstte şeffaf + beyaz logo/metin
  const shouldAppearScrolled = isScrolled || forceScrolledAppearance;

  const headerBg = shouldAppearScrolled
    ? 'bg-white/95 backdrop-blur-md shadow-sm'
    : 'bg-transparent';
  const headerPadding = shouldAppearScrolled ? 'py-2' : 'py-4';
  const linkColor = shouldAppearScrolled ? 'text-neutral-800' : 'text-white';
  const linkHoverColor = shouldAppearScrolled
    ? 'hover:text-neutral-950'
    : 'hover:text-neutral-200';
  const linkBgHoverColor = shouldAppearScrolled
    ? 'hover:bg-neutral-100'
    : 'hover:bg-white/10';
  const iconColor = shouldAppearScrolled
    ? 'text-neutral-600'
    : 'text-neutral-300';
  const iconHoverColor = shouldAppearScrolled
    ? 'hover:text-neutral-950'
    : 'hover:text-white';
  const iconBgHoverColor = shouldAppearScrolled
    ? 'hover:bg-neutral-100'
    : 'hover:bg-white/10';
  // Eski navbar: hero’da beyaz pill CTA’lar; scroll sonrası ink dolgu (turta paleti)
  const buttonPrimaryBg = shouldAppearScrolled
    ? 'bg-neutral-950 hover:bg-neutral-800'
    : 'bg-white hover:bg-neutral-100';
  const buttonPrimaryText = shouldAppearScrolled
    ? 'text-white'
    : 'text-neutral-950';
  const dealsTagColor = shouldAppearScrolled
    ? 'text-white'
    : 'text-neutral-950';
  const buttonSecondaryBorder = shouldAppearScrolled
    ? 'border-neutral-950 text-neutral-950 hover:bg-neutral-100'
    : 'border-white text-white hover:bg-white/10';
  const authButtonBgHover = shouldAppearScrolled
    ? 'hover:bg-neutral-100'
    : 'hover:bg-white/10';
  const authImageBg = shouldAppearScrolled
    ? 'bg-neutral-200 text-neutral-600'
    : 'bg-white/20 text-white';
  const authChevronColor = shouldAppearScrolled
    ? 'text-neutral-500'
    : 'text-neutral-300';
  const pulseBg = shouldAppearScrolled ? 'bg-neutral-200' : 'bg-white/20';

  const logoSurface = shouldAppearScrolled ? 'light' : 'dark';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${headerBg} ${headerPadding}${shouldAppearScrolled ? ' border-b border-neutral-100' : ''}`}
    >
      <div className="container mx-auto px-6">
        {' '}
        {/* Padding px-6 olarak güncellendi */}
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            {/* Ana Logo */}
            <Link href="/" className="group flex shrink-0 items-center">
              <BrandLogo
                variant="wordmark"
                surface={logoSurface}
                adaptive
                href={null}
                priority
                className="transition-transform duration-300 group-hover:scale-[1.02]"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {/* Turlar Dropdown */}
            <div className="relative group dropdown-container">
              <button
                onClick={() => toggleDropdown('tours')}
                className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 ${linkColor} ${linkHoverColor} ${linkBgHoverColor}`}
              >
                Turlar
                <ChevronDownIcon
                  className={`w-4 h-4 ml-1 transition-transform duration-200 ${activeDropdown === 'tours' ? 'rotate-180' : ''}`}
                />
              </button>
              {activeDropdown === 'tours' && (
                <div className="absolute left-0 z-50 mt-2 w-56 animate-fadeIn rounded-lg bg-white p-1.5 shadow-lg ring-1 ring-black/5">
                  {TOUR_DROPDOWN_LINKS.map((link, index) => (
                    <span key={link.href}>
                      {index === 1 ? (
                        <div className="my-1 border-t border-neutral-100" />
                      ) : null}
                      <Link
                        href={link.href}
                        className="block rounded px-3 py-1.5 text-sm text-neutral-700 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-950"
                      >
                        {link.label}
                      </Link>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-200 ${linkColor} ${linkHoverColor} ${linkBgHoverColor}`}
              >
                {link.label}
              </Link>
            ))}

            {/* Fırsatlar — mevcut popup akışı (navbar davranışı) */}
            <button
              type="button"
              onClick={openDealsPopup}
              className={`ml-2 flex items-center px-3.5 py-1.5 rounded-md text-sm font-medium transition-all duration-300 transform hover:scale-[1.03] shadow-sm ${buttonPrimaryBg} ${buttonPrimaryText}`}
            >
              <TagIcon className={`w-4 h-4 mr-1.5 ${dealsTagColor}`} />
              Fırsatlar
            </button>

            {/* Arama Butonu */}
            <button
              onClick={toggleSearch}
              className={`search-button ml-1 p-2 rounded-full transition-colors duration-200 ${iconColor} ${iconHoverColor} ${iconBgHoverColor}`}
              aria-label="Aramayı aç"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>
          </nav>

          {/* Desktop Auth Area */}
          <div className="hidden lg:flex items-center space-x-2 flex-shrink-0">
            {isAuthLoading ? (
              <div className="flex space-x-2">
                <div
                  className={`h-8 w-20 rounded-md animate-pulse ${pulseBg}`}
                ></div>
                <div
                  className={`h-8 w-20 rounded-md animate-pulse ${pulseBg}`}
                ></div>
              </div>
            ) : authStatus === 'authenticated' &&
              !!sessionUser &&
              sessionUser.provider !== 'partner-credentials' ? (
              <div className="relative group dropdown-container">
                <button
                  className={`flex items-center space-x-2 p-1 rounded-full text-sm font-medium transition-colors duration-200 ${linkColor} ${authButtonBgHover}`}
                  onClick={() => toggleDropdown('profile')}
                >
                  {sessionUser?.image ? (
                    <Image
                      src={sessionUser?.image}
                      alt={sessionUser?.name || 'Profil'}
                      width={28}
                      height={28}
                      className="rounded-full border border-transparent group-hover:border-neutral-300/50 transition-colors"
                    />
                  ) : (
                    <span
                      className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-medium ${authImageBg}`}
                    >
                      {(
                        sessionUser?.name?.[0] ||
                        sessionUser?.email?.[0] ||
                        'U'
                      ).toUpperCase()}
                    </span>
                  )}
                  <span className="hidden xl:block text-xs mr-0.5">
                    {sessionUser?.name?.split(' ')[0]}
                  </span>
                  <ChevronDownIcon
                    className={`w-4 h-4 ${authChevronColor} transition-transform duration-200 ${activeDropdown === 'profile' ? 'rotate-180' : ''}`}
                  />
                </button>

                {activeDropdown === 'profile' && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 p-1.5 z-50 animate-fadeIn dropdown-container">
                    {/* Profil dropdown link stilleri */}
                    <Link
                      href={AUTH_LINKS.profile}
                      className="block px-3 py-1.5 text-sm text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 rounded transition-colors duration-150"
                    >
                      Profilim
                    </Link>
                    <Link
                      href={AUTH_LINKS.bookings}
                      className="block px-3 py-1.5 text-sm text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 rounded transition-colors duration-150"
                    >
                      Rezervasyonlarım
                    </Link>
                    {panelHref ? (
                      <Link
                        href={panelHref}
                        className="block px-3 py-1.5 text-sm text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 rounded transition-colors duration-150"
                      >
                        Panele Dön
                      </Link>
                    ) : null}
                    <div className="border-t border-neutral-100 my-1"></div>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50/70 rounded transition-colors duration-150 disabled:opacity-60"
                    >
                      {isSigningOut ? 'Çıkış yapılıyor...' : 'Çıkış Yap'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href={AUTH_LINKS.login}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors duration-200 ${buttonSecondaryBorder}`}
                  onClick={handleAuthClick}
                >
                  Giriş Yap
                </Link>
                <Link
                  href={AUTH_LINKS.register}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 shadow-sm ${buttonPrimaryBg} ${buttonPrimaryText}`}
                  onClick={handleAuthClick}
                >
                  Kayıt Ol
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center space-x-1">
            <button
              onClick={toggleSearch}
              className={`search-button p-2 rounded-full transition-colors duration-200 ${iconColor} ${iconHoverColor} ${iconBgHoverColor}`}
              aria-label="Aramayı aç"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`mobile-menu-button p-2 rounded-md transition-colors duration-200 ${iconColor} ${iconHoverColor} ${iconBgHoverColor}`}
              aria-label={isMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            >
              {isMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          ></div>
          <div
            ref={searchRef}
            className="relative max-w-lg mx-auto mt-[15vh] bg-white rounded-lg shadow-xl p-4 animate-fadeIn"
          >
            <div className="flex items-center">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Ne aramak istersiniz? (örn: Kapadokya turu)"
                className="flex-1 px-4 py-2.5 text-neutral-800 bg-neutral-100 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:border-neutral-950 border border-transparent focus:bg-white placeholder-neutral-400 text-sm"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="ml-2 p-2 text-neutral-400 hover:text-neutral-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            {/* İsteğe bağlı: Arama sonuçları veya öneriler burada gösterilebilir */}
          </div>
        </div>
      )}

      {/* Mobile Menu — mounted with transform (no layout jump) */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-300 ${
          isMenuOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!isMenuOpen}
      >
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        />
        <div
          ref={mobileMenuRef}
          className={`relative z-10 ml-auto flex h-screen w-full max-w-xs flex-col overflow-y-auto bg-white shadow-xl transition-transform duration-300 ease-out ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Mobile Menu Header */}
          <div className="sticky top-0 flex justify-between items-center px-4 py-3 border-b border-neutral-100 bg-white z-20">
            <Link
              href="/"
              className="flex items-center"
              onClick={() => setIsMenuOpen(false)}
            >
              <BrandLogo
                variant="wordmark"
                surface="light"
                href={null}
                className="h-7 w-auto"
              />
            </Link>
            <button
              className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
              onClick={() => setIsMenuOpen(false)}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Menu Content */}
          <div className="flex-1 py-3 px-3">
            {isAuthLoading ? (
              <div className="p-3 space-y-4">
                <div className="h-12 bg-neutral-200 animate-pulse rounded-md"></div>
                <div className="h-10 bg-neutral-200 animate-pulse rounded-md"></div>
                <div className="h-10 bg-neutral-200 animate-pulse rounded-md"></div>
              </div>
            ) : authStatus === 'authenticated' &&
              !!sessionUser &&
              sessionUser.provider !== 'partner-credentials' ? (
              <>
                <Link
                  href={AUTH_LINKS.profile}
                  className="flex items-center space-x-3 p-3 mb-3 rounded-lg hover:bg-neutral-100 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {sessionUser?.image ? (
                    <Image
                      src={sessionUser?.image}
                      alt={sessionUser?.name || 'Profil'}
                      width={36}
                      height={36}
                      className="rounded-full"
                    />
                  ) : (
                    <span className="flex items-center justify-center h-9 w-9 rounded-full bg-neutral-200 text-neutral-800 text-sm font-medium">
                      {(
                        sessionUser?.name?.[0] ||
                        sessionUser?.email?.[0] ||
                        'U'
                      ).toUpperCase()}
                    </span>
                  )}
                  <div>
                    <p className="font-medium text-sm text-neutral-800">
                      {sessionUser?.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      Profili Görüntüle
                    </p>
                  </div>
                </Link>
                {panelHref ? (
                  <Link
                    href={panelHref}
                    className="mb-3 block rounded-md px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Panele Dön
                  </Link>
                ) : null}
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 mb-4 px-2 pt-1">
                <Link
                  href={AUTH_LINKS.login}
                  className="px-4 py-2 rounded-md text-sm font-medium text-center border border-neutral-950 text-neutral-800 hover:bg-neutral-100 transition-colors"
                  onClick={() => {
                    handleAuthClick();
                    setIsMenuOpen(false);
                  }}
                >
                  Giriş Yap
                </Link>
                <Link
                  href={AUTH_LINKS.register}
                  className="px-4 py-2 rounded-md text-sm font-medium text-center bg-neutral-950 text-white hover:bg-neutral-800 transition-colors"
                  onClick={() => {
                    handleAuthClick();
                    setIsMenuOpen(false);
                  }}
                >
                  Kayıt Ol
                </Link>
              </div>
            )}

            <div className="space-y-1 border-t border-neutral-100 pt-3">
              {/* Mobil Turlar Dropdown */}
              <div className="dropdown-container">
                <button
                  className={`w-full flex justify-between items-center py-2.5 px-3 rounded-md text-left ${activeDropdown === 'tours-mobile' ? 'bg-neutral-100' : ''} text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 transition-colors`}
                  onClick={() => toggleDropdown('tours-mobile')}
                >
                  <span className="font-medium text-sm">Turlar</span>
                  <ChevronDownIcon
                    className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === 'tours-mobile' ? 'rotate-180 text-neutral-950' : 'text-neutral-400'}`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${activeDropdown === 'tours-mobile' ? 'max-h-96' : 'max-h-0'}`}
                  style={{
                    maxHeight:
                      activeDropdown === 'tours-mobile' ? '500px' : '0px',
                  }} // Max-height transition
                >
                  <div className="mt-1 ml-3 space-y-0.5 border-l border-neutral-200 py-1 pl-6">
                    {[...TOUR_DROPDOWN_LINKS, ...MOBILE_TOUR_EXTRA_LINKS].map(
                      (link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="block rounded-md px-2 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {link.label}
                        </Link>
                      ),
                    )}
                  </div>
                </div>
              </div>

              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-md px-3 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-950"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div
                role="button"
                tabIndex={0}
                className="w-full text-left block py-2.5 px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 rounded-md transition-colors flex items-center cursor-pointer"
                onClick={() => {
                  handlePartnerPortalClick();
                  setIsMenuOpen(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handlePartnerPortalClick();
                    setIsMenuOpen(false);
                  }
                }}
              >
                <BuildingOfficeIcon className="w-4 h-4 mr-1.5" />
                Partner Portal
              </div>
              <button
                onClick={() => {
                  openDealsPopup();
                  setIsMenuOpen(false);
                }}
                className="w-full text-left flex items-center py-2.5 px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950 rounded-md transition-colors"
              >
                <TagIcon className="w-4 h-4 mr-2 text-neutral-500" />
                Fırsatlar
              </button>
            </div>
          </div>

          {/* Mobile Footer Buttons (Authenticated) */}
          {authStatus === 'authenticated' &&
            !!sessionUser &&
            sessionUser.provider !== 'partner-credentials' && (
              <div className="sticky bottom-0 bg-white border-t border-neutral-100 p-3 mt-auto">
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="w-full text-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors disabled:opacity-60"
                >
                  {isSigningOut ? 'Çıkış yapılıyor...' : 'Çıkış Yap'}
                </button>
              </div>
            )}
        </div>
      </div>

      {mounted && (
        <DealsPopup isOpen={dealsOpen} onClose={() => setDealsOpen(false)} />
      )}
    </header>
  );
}
export default Header;
