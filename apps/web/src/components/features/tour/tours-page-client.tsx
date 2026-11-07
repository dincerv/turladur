'use client';

import { useState, useEffect, Suspense, useMemo, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { LegacyTourCard as Tour } from '@/lib/tours/legacy-tour';
import { ApiError } from '@/services/api-client';
import { searchToursByQueryString } from '@/services/catalog';
import { DEFAULT_DEPARTURE_CITIES } from '@/lib/departure-cities';
import {
  DEFAULT_TOUR_REGIONS,
  TOURS_FACET_FETCH_LIMIT,
  TOURS_SEARCH_DEBOUNCE_MS,
  buildDepartureFacets,
  buildRegionFacets,
  buildToursListQuery,
  countActiveFilters,
  isToursSortBy,
  mapTourFromApi,
  matchesClientExtrasFilters,
  normalizeFilterText,
  parseOptionalInt,
  sanitizeSearchQueryStrict,
} from './tours-page/tours-page.helpers';
import {
  ToursPageUiProvider,
  type ToursPageUiContextValue,
} from './tours-page/tours-page-context';
import { ToursPageHero } from './tours-page/tours-page-hero';
import { ToursPageFilters } from './tours-page/tours-page-filters';
import { ToursPageResults } from './tours-page/tours-page-results';
import type {
  DepartureCityOption,
  FilterOptions,
  RegionOption,
} from './tours-page/tours-page.types';

const EMPTY_FILTERS: FilterOptions = {
  stayKind: null,
  destinationScope: null,
  departureCity: null,
  region: null,
  transportation: null,
  duration: null,
  period: null,
  priceRange: [0, 10000],
  featured: false,
  month: null,
  remainingDays: null,
  minPrice: null,
  maxPrice: null,
  tourType: null,
  accommodationType: null,
  difficultyLevel: null,
  ageRestriction: null,
  rating: null,
  dateRange: [null, null],
  isPopular: false,
  isLastMinute: false,
  isEarlyBird: false,
  languages: [],
  tags: [],
};

function ToursPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const readyToSyncUrl = useRef(false);

  const durationParam = searchParams.get('duration');
  const featuredParam = searchParams.get('featured');
  const urlSearch = sanitizeSearchQueryStrict(
    searchParams.get('search') || searchParams.get('q'),
  );
  const urlDepartureCity = sanitizeSearchQueryStrict(
    searchParams.get('departureCity'),
  );
  const urlRegion = sanitizeSearchQueryStrict(searchParams.get('region'));
  const urlStayKind = searchParams.get('stayKind');
  const urlDestinationScope = searchParams.get('destinationScope');
  const urlStartDate = searchParams.get('startDate');
  const urlEndDate = searchParams.get('endDate');
  const urlMinPrice = parseOptionalInt(searchParams.get('minPrice'));
  const urlMaxPrice = parseOptionalInt(searchParams.get('maxPrice'));
  const urlSortRaw = searchParams.get('sort') || 'popular';
  const urlSort = isToursSortBy(urlSortRaw) ? urlSortRaw : 'popular';
  const urlView = searchParams.get('view') === 'list' ? 'list' : 'grid';

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- hero search loading state reserved for filter UI
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(urlSearch);
  const [apiTourRows, setApiTourRows] = useState<Record<string, unknown>[]>([]);
  /** Facet counts — exclude region/departure so selecting one chip doesn’t zero the others. */
  const [facetSourceRows, setFacetSourceRows] = useState<
    Record<string, unknown>[]
  >([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState(urlSort);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for desktop filter panel toggle
  const [showFilters, setShowFilters] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [view, setView] = useState<'grid' | 'list'>(urlView);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(() => ({
    ...EMPTY_FILTERS,
    stayKind:
      urlStayKind === 'DAY_TRIP' || urlStayKind === 'OVERNIGHT'
        ? urlStayKind
        : null,
    destinationScope:
      urlDestinationScope === 'DOMESTIC' ||
      urlDestinationScope === 'INTERNATIONAL'
        ? urlDestinationScope
        : null,
    departureCity: urlDepartureCity || null,
    region: urlRegion || null,
    duration: durationParam,
    featured: featuredParam === 'true',
    minPrice: urlMinPrice,
    maxPrice: urlMaxPrice,
    dateRange: [
      urlStartDate ? new Date(`${urlStartDate}T00:00:00`) : null,
      urlEndDate ? new Date(`${urlEndDate}T00:00:00`) : null,
    ],
  }));

  const [departureCityOptions, setDepartureCityOptions] = useState<
    DepartureCityOption[]
  >([]);
  const [filteredDepartureCities, setFilteredDepartureCities] = useState<
    DepartureCityOption[]
  >([]);
  const [regionOptions, setRegionOptions] = useState<RegionOption[]>([]);
  const [filteredRegions, setFilteredRegions] = useState<RegionOption[]>([]);
  const [departureSearch, setDepartureSearch] = useState('');
  const [regionSearch, setRegionSearch] = useState('');

  // Sayfalama ve gösterim seçenekleri
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [isLoading, setIsLoading] = useState(true);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for infinite scroll pagination
  const [loadingMore, setLoadingMore] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for mobile filter drawer
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const activeFilterCount = useMemo(
    () => countActiveFilters(filterOptions),
    [filterOptions],
  );

  useEffect(() => {
    const cities = (
      Array.isArray(DEFAULT_DEPARTURE_CITIES) &&
      DEFAULT_DEPARTURE_CITIES.length > 0
        ? DEFAULT_DEPARTURE_CITIES
        : ['İstanbul', 'Ankara', 'İzmir', 'Antalya']
    ).map((city) => ({ city, count: 0 }));
    const regions = DEFAULT_TOUR_REGIONS.map((region) => ({
      region,
      count: 0,
    }));
    setDepartureCityOptions(cities);
    setFilteredDepartureCities(cities);
    setRegionOptions(regions);
    setFilteredRegions(regions);
  }, []);

  // Facet sayaçları: region/departure seçiminden bağımsız kaynak
  useEffect(() => {
    const cities = buildDepartureFacets(facetSourceRows);
    const regions = buildRegionFacets(facetSourceRows);
    setDepartureCityOptions(cities);
    setRegionOptions(regions);

    const departureQuery = normalizeFilterText(departureSearch);
    setFilteredDepartureCities(
      departureQuery
        ? cities.filter((item) =>
            normalizeFilterText(item.city).includes(departureQuery),
          )
        : cities,
    );

    const regionQuery = normalizeFilterText(regionSearch);
    setFilteredRegions(
      regionQuery
        ? regions.filter((item) =>
            normalizeFilterText(item.region).includes(regionQuery),
          )
        : regions,
    );
  }, [facetSourceRows, departureSearch, regionSearch]);

  // URL → state (paylaşılabilir link / geri-ileri)
  useEffect(() => {
    setSearchTerm((prev) => (prev === urlSearch ? prev : urlSearch));
    setSortBy((prev) => (prev === urlSort ? prev : urlSort));
    setView((prev) => (prev === urlView ? prev : urlView));

    setFilterOptions((prev) => {
      const nextDateRange: [Date | null, Date | null] = [
        urlStartDate ? new Date(`${urlStartDate}T00:00:00`) : null,
        urlEndDate ? new Date(`${urlEndDate}T00:00:00`) : null,
      ];
      const nextStayKind: FilterOptions['stayKind'] =
        urlStayKind === 'DAY_TRIP' || urlStayKind === 'OVERNIGHT'
          ? urlStayKind
          : null;
      const nextDestinationScope: FilterOptions['destinationScope'] =
        urlDestinationScope === 'DOMESTIC' ||
        urlDestinationScope === 'INTERNATIONAL'
          ? urlDestinationScope
          : null;
      const next: FilterOptions = {
        ...prev,
        stayKind: nextStayKind,
        destinationScope: nextDestinationScope,
        departureCity: urlDepartureCity || null,
        region: urlRegion || null,
        duration: durationParam,
        featured: featuredParam === 'true',
        minPrice: urlMinPrice,
        maxPrice: urlMaxPrice,
        dateRange: nextDateRange,
      };

      const same =
        prev.stayKind === next.stayKind &&
        prev.destinationScope === next.destinationScope &&
        prev.departureCity === next.departureCity &&
        prev.region === next.region &&
        prev.duration === next.duration &&
        prev.featured === next.featured &&
        prev.minPrice === next.minPrice &&
        prev.maxPrice === next.maxPrice &&
        (prev.dateRange[0]?.getTime() ?? null) ===
          (next.dateRange[0]?.getTime() ?? null) &&
        (prev.dateRange[1]?.getTime() ?? null) ===
          (next.dateRange[1]?.getTime() ?? null);

      return same ? prev : next;
    });

    readyToSyncUrl.current = true;
  }, [
    searchParamsKey,
    urlSearch,
    urlDepartureCity,
    urlRegion,
    urlStartDate,
    urlEndDate,
    urlStayKind,
    urlDestinationScope,
    durationParam,
    featuredParam,
    urlMinPrice,
    urlMaxPrice,
    urlSort,
    urlView,
  ]);

  // state → URL
  useEffect(() => {
    if (!readyToSyncUrl.current) return;
    const qs = buildToursListQuery({
      searchTerm,
      filterOptions,
      sortBy,
      view,
    });
    if (qs === searchParamsKey) return;
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [
    searchTerm,
    filterOptions,
    sortBy,
    view,
    pathname,
    router,
    searchParamsKey,
  ]);

  // Sayfalama seçenekleri
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for page size selector UI
  const pageSizeOptions = [15, 30, 45, 60]; // Seçenekleri 15'ten başlayacak şekilde güncelledim

  // Sıralama seçenekleri
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for sort dropdown UI
  const sortOptions = [
    { value: 'popular', label: 'Popülerlik' },
    { value: 'price-low', label: 'Fiyat (Artan)' },
    { value: 'price-high', label: 'Fiyat (Azalan)' },
    { value: 'duration', label: 'Süre' },
    { value: 'rating', label: 'Değerlendirme' },
    { value: 'date', label: 'Tarih' },
    { value: 'discount', label: 'İndirim Oranı' },
  ];

  // Sıralama fonksiyonu
  const sortTours = (tours: Tour[]) => {
    const sorted = [...tours];
    switch (sortBy) {
      case 'price-low':
        sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'duration':
        sorted.sort(
          (a, b) => (Number(a.duration) || 0) - (Number(b.duration) || 0),
        );
        break;
      case 'rating':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'date':
        sorted.sort((a, b) => {
          const dateA = new Date(a.startDate || '');
          const dateB = new Date(b.startDate || '');
          return dateA.getTime() - dateB.getTime();
        });
        break;
      case 'discount':
        sorted.sort((a, b) => (b.discount || 0) - (a.discount || 0));
        break;
      default: // popular
        sorted.sort((a, b) => {
          const scoreA = (b.rating || 0) * 0.7 + (b.reviewCount || 0) * 0.3;
          const scoreB = (a.rating || 0) * 0.7 + (a.reviewCount || 0) * 0.3;
          return scoreA - scoreB;
        });
        break;
    }
    return sorted;
  };

  useEffect(() => {
    // API isteği simülasyonu
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  // Nest’e giden parametreler — bölge hâlâ client-side extras.
  const serverMinPrice = filterOptions.minPrice;
  const serverMaxPrice = filterOptions.maxPrice;
  const serverFeatured = filterOptions.featured;
  const serverRating = filterOptions.rating;
  const serverDuration = filterOptions.duration;
  const serverTourType = filterOptions.tourType;
  const serverStayKind = filterOptions.stayKind;
  const serverDestinationScope = filterOptions.destinationScope;
  const serverDepartureCity = filterOptions.departureCity;
  const serverRegion = filterOptions.region;

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void (async () => {
        setIsLoading(true);
        setFetchError(null);

        const nestSort =
          sortBy === 'price-low' || sortBy === 'price-high'
            ? 'price'
            : sortBy === 'rating'
              ? 'rating'
              : sortBy === 'duration'
                ? 'durationDays'
                : 'createdAt';

        const params = new URLSearchParams({
          page: '1',
          limit: String(TOURS_FACET_FETCH_LIMIT),
          sortBy: nestSort,
          sortOrder: sortBy === 'price-low' ? 'asc' : 'desc',
        });

        const q = searchTerm.trim();
        if (q) params.set('q', q);

        if (serverMinPrice != null) {
          params.set('minPrice', String(serverMinPrice));
        }
        if (serverMaxPrice != null) {
          params.set('maxPrice', String(serverMaxPrice));
        }
        if (serverFeatured) params.set('featured', 'true');
        if (serverRating != null) {
          params.set('minRating', String(serverRating));
        }
        if (serverStayKind) {
          params.set('stayKind', serverStayKind);
        }
        if (serverDestinationScope) {
          params.set('destinationScope', serverDestinationScope);
        }
        if (serverDuration) {
          const allowedDurations = new Set(['1', '2-3', '4-6', '7+']);
          if (allowedDurations.has(serverDuration)) {
            params.set('duration', serverDuration);
          } else if (serverDuration !== '7') {
            const days = Number(serverDuration);
            if (Number.isFinite(days) && days >= 1) {
              params.set('durationDays', String(Math.floor(days)));
            }
          } else {
            params.set('duration', '7+');
          }
        }
        if (serverTourType) {
          const category = serverTourType.toUpperCase();
          if (
            [
              'CULTURAL',
              'ADVENTURE',
              'GASTRONOMY',
              'NATURE',
              'CITY',
              'BEACH',
            ].includes(category)
          ) {
            params.set('category', category);
          }
        }

        // List query: include region + departure (narrow results)
        const listParams = new URLSearchParams(params);
        if (serverDepartureCity) {
          listParams.set('departureCity', serverDepartureCity);
        }
        if (serverRegion) {
          listParams.set('region', serverRegion);
        }
        // Facet query: omit region + departure so chip counts stay stable
        const facetParams = new URLSearchParams(params);

        try {
          const [listResult, facetResult] = await Promise.all([
            searchToursByQueryString(listParams.toString(), controller.signal),
            searchToursByQueryString(facetParams.toString(), controller.signal),
          ]);
          const listRows = Array.isArray(listResult.data)
            ? listResult.data
            : [];
          const facetRows = Array.isArray(facetResult.data)
            ? facetResult.data
            : [];
          setApiTourRows(listRows as unknown as Record<string, unknown>[]);
          setFacetSourceRows(facetRows as unknown as Record<string, unknown>[]);
        } catch (error) {
          if (controller.signal.aborted) {
            return;
          }
          if (error instanceof ApiError && error.status === 429) {
            setFetchError(
              'Çok hızlı filtrelediniz. Birkaç saniye bekleyip tekrar deneyin.',
            );
            return;
          }
          if (error instanceof DOMException && error.name === 'AbortError') {
            return;
          }
          if (
            error instanceof ApiError &&
            error.code === 'TIMEOUT' &&
            controller.signal.aborted
          ) {
            return;
          }
          setFetchError(
            error instanceof ApiError
              ? error.message
              : 'Turlar yüklenirken bir sorun oluştu.',
          );
          setApiTourRows([]);
          setFacetSourceRows([]);
        } finally {
          if (!controller.signal.aborted) {
            setIsLoading(false);
          }
        }
      })();
    }, TOURS_SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    searchTerm,
    sortBy,
    serverMinPrice,
    serverMaxPrice,
    serverFeatured,
    serverRating,
    serverDuration,
    serverTourType,
    serverStayKind,
    serverDestinationScope,
    serverDepartureCity,
    serverRegion,
  ]);

  const filteredTours = useMemo(() => {
    const mapped = apiTourRows
      .filter((tour) => matchesClientExtrasFilters(tour, filterOptions))
      .map(mapTourFromApi);
    return sortTours(mapped);
  }, [apiTourRows, filterOptions, sortBy]);

  const totalTours = filteredTours.length;

  // Filtre veya arama değişince sayfayı başa al
  useEffect(() => {
    setCurrentPage(1);
  }, [filterOptions, searchTerm, sortBy, itemsPerPage]);

  const resetFilters = () => {
    setSearchTerm('');
    setFilterOptions({ ...EMPTY_FILTERS });
    setDepartureSearch('');
    setRegionSearch('');
    setFilteredDepartureCities(departureCityOptions);
    setFilteredRegions(regionOptions);
    setSortBy('popular');
    setView('grid');
  };

  // Sayfalama için hesaplamalar
  const totalItems = filteredTours.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentTours = filteredTours.slice(startIndex, endIndex);

  // Sayfa değiştirme fonksiyonu
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const heroSection = document.querySelector(
      '.bg-gradient-to-r.from-neutral-900.to-neutral-950',
    );
    if (heroSection) {
      const heroBottom =
        heroSection.getBoundingClientRect().bottom + window.scrollY - 20;
      window.scrollTo({ top: heroBottom, behavior: 'smooth' });
    }
  };

  // Sayfalama ve sıralama işlevleri
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for page size selector UI
  const handlePageSizeChange = (size: number) => {
    setItemsPerPage(size);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: string) => {
    if (!isToursSortBy(sort)) return;
    setSortBy(sort);
    setCurrentPage(1);
  };

  const ui: ToursPageUiContextValue = {
    searchTerm,
    setSearchTerm,
    setLoading,
    isFilterOpen,
    setIsFilterOpen,
    activeFilterCount,
    filterOptions,
    setFilterOptions,
    filteredDepartureCities,
    filteredRegions,
    departureSearch,
    setDepartureSearch,
    regionSearch,
    setRegionSearch,
    resetFilters,
    view,
    setView,
    sortBy,
    handleSortChange,
    isLoading,
    loading,
    itemsPerPage,
    filteredTours,
    currentTours,
    totalItems,
    totalTours,
    currentPage,
    setCurrentPage,
    totalPages,
    startIndex,
    endIndex,
    handlePageChange,
    fetchError,
    loadingMore,
  };

  return (
    <ToursPageUiProvider value={ui}>
      <div className="bg-gray-50 min-h-screen">
        <ToursPageHero />

        <div
          id="tours-results"
          className="container mx-auto scroll-mt-28 px-4 sm:px-6 lg:px-8 xl:px-20 py-10"
        >
          <div className="flex flex-col lg:flex-row gap-6">
            <ToursPageFilters />
            <ToursPageResults />
          </div>
        </div>
      </div>
    </ToursPageUiProvider>
  );
}

export default function ToursPageClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-neutral-950" />
        </div>
      }
    >
      <ToursPageContent />
    </Suspense>
  );
}
