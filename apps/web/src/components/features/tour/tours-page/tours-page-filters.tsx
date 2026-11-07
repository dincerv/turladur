'use client';

import { useEffect } from 'react';
import {
  Calendar,
  ChevronRight,
  Filter,
  MapPin,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
  Globe,
} from 'lucide-react';
import {
  MOBILE_DATE_INPUT_CLASS,
  MOBILE_FILTER_INPUT,
  MOBILE_FILTER_SECTION,
  MOBILE_PRICE_INPUT,
  formatDateParam,
  sanitizeSearchQuery,
} from './tours-page.helpers';
import { useToursPageUi } from './tours-page-context';

const CHIP_BASE =
  'inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 lg:w-full lg:justify-start lg:rounded-lg lg:px-3 lg:font-normal';
const CHIP_ON = 'bg-neutral-950 text-white shadow-sm';
const CHIP_OFF =
  'border border-neutral-200/80 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 lg:border-0 lg:bg-gray-100 lg:hover:bg-gray-200';

export function ToursPageFilters() {
  const ui = useToursPageUi();
  const {
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
  } = ui;

  useEffect(() => {
    if (!isFilterOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFilterOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [isFilterOpen, setIsFilterOpen]);

  return (
    <>
      <div className="mb-4 lg:hidden">
        <button
          type="button"
          onClick={() => setIsFilterOpen(true)}
          className="flex min-h-12 w-full items-center gap-2.5 rounded-2xl border border-neutral-100/80 bg-white px-4 py-3.5 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-neutral-100">
            <SlidersHorizontal className="h-4 w-4 text-neutral-950" />
          </div>
          <span className="font-semibold text-neutral-900">Filtreler</span>
          {activeFilterCount > 0 && (
            <span className="bg-neutral-950 text-white text-[11px] font-bold min-w-[1.25rem] h-5 px-1.5 rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
          <ChevronRight className="h-4 w-4 text-neutral-400 ml-auto" />
        </button>
      </div>

      {/* Overlay */}
      {isFilterOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsFilterOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobil: kapalıyken DOM dışı; desktop: her zaman yan panel */}
      <div
        className={
          isFilterOpen
            ? 'fixed inset-y-0 right-0 z-50 flex w-full max-w-sm transform flex-col bg-neutral-50 shadow-2xl transition-transform duration-300 ease-in-out lg:relative lg:z-auto lg:max-w-none lg:w-72 lg:translate-x-0 lg:shadow-none xl:w-80'
            : 'hidden lg:relative lg:flex lg:w-72 lg:flex-col lg:bg-neutral-50 xl:w-80'
        }
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-neutral-100 px-4 pt-4 pb-3 lg:bg-gray-50 lg:border-gray-100 lg:px-6 lg:pt-0 lg:pb-3 flex justify-between items-center shrink-0">
            <h3 className="font-bold text-neutral-900 flex items-center text-base lg:text-inherit">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-neutral-100 mr-2.5 lg:bg-transparent lg:w-auto lg:h-auto lg:rounded-none lg:mr-2">
                <Filter className="h-4 w-4 lg:h-5 lg:w-5 text-neutral-950" />
              </div>
              Filtreler
              {activeFilterCount > 0 && (
                <span className="ml-2 lg:hidden text-neutral-100 text-neutral-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {activeFilterCount} aktif
                </span>
              )}
            </h3>
            <button
              type="button"
              onClick={() => setIsFilterOpen(false)}
              className="-mr-1 flex h-11 w-11 items-center justify-center rounded-xl text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 lg:hidden"
              aria-label="Filtreleri kapat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable filter content */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 pb-28 lg:pb-6">
            <div className="space-y-4 lg:space-y-6">
              <div className={MOBILE_FILTER_SECTION}>
                <h4 className="font-semibold text-neutral-900 mb-3 text-sm lg:font-medium">
                  Tur Türü
                </h4>
                <div className="flex flex-wrap gap-2 lg:flex-col lg:space-y-2 lg:gap-0">
                  {(
                    [
                      { value: 'DAY_TRIP', label: 'Günübirlik' },
                      { value: 'OVERNIGHT', label: 'Konaklamalı' },
                    ] as const
                  ).map((item) => {
                    const isSelected = filterOptions.stayKind === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() =>
                          setFilterOptions({
                            ...filterOptions,
                            stayKind: isSelected ? null : item.value,
                          })
                        }
                        className={`${CHIP_BASE} ${isSelected ? CHIP_ON : CHIP_OFF}`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={MOBILE_FILTER_SECTION}>
                <h4 className="font-semibold text-neutral-900 mb-3 text-sm lg:font-medium">
                  Rota
                </h4>
                <div className="flex flex-wrap gap-2 lg:flex-col lg:space-y-2 lg:gap-0">
                  {(
                    [
                      { value: 'DOMESTIC', label: 'Yurtiçi' },
                      { value: 'INTERNATIONAL', label: 'Yurtdışı' },
                    ] as const
                  ).map((item) => {
                    const isSelected =
                      filterOptions.destinationScope === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() =>
                          setFilterOptions({
                            ...filterOptions,
                            destinationScope: isSelected ? null : item.value,
                          })
                        }
                        className={`${CHIP_BASE} ${isSelected ? CHIP_ON : CHIP_OFF}`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Kalkış Noktası */}
              <div className={MOBILE_FILTER_SECTION}>
                <h4 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2 text-sm lg:font-medium">
                  <MapPin className="h-4 w-4 text-neutral-950 lg:hidden shrink-0" />
                  Kalkış Noktası
                </h4>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none lg:hidden" />
                  <input
                    type="text"
                    placeholder="Kalkış noktası ara..."
                    value={departureSearch}
                    className={`${MOBILE_FILTER_INPUT} mb-0 lg:mb-2`}
                    maxLength={80}
                    onChange={(e) => {
                      setDepartureSearch(sanitizeSearchQuery(e.target.value));
                    }}
                  />
                </div>
                <div className="max-h-44 lg:max-h-60 overflow-y-auto -mx-1 px-1">
                  {filteredDepartureCities.length > 0 ? (
                    <div className="flex flex-wrap gap-2 lg:flex-col lg:space-y-2 lg:gap-0">
                      {filteredDepartureCities.map((item) => {
                        const isSelected =
                          filterOptions.departureCity === item.city;
                        return (
                          <button
                            key={item.city}
                            onClick={() =>
                              setFilterOptions({
                                ...filterOptions,
                                departureCity: isSelected ? null : item.city,
                              })
                            }
                            type="button"
                            className={`${CHIP_BASE} ${isSelected ? CHIP_ON : CHIP_OFF}`}
                          >
                            <span className="truncate">{item.city}</span>
                            <span
                              className={`shrink-0 text-xs ${
                                isSelected
                                  ? 'text-neutral-200 lg:text-white'
                                  : 'text-neutral-500 lg:text-inherit'
                              }`}
                            >
                              ({item.count})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="px-1 py-2 text-sm text-neutral-500">
                      Kalkış noktası bulunamadı
                    </p>
                  )}
                </div>
              </div>

              {/* Tarih Aralığı */}
              <div className={MOBILE_FILTER_SECTION}>
                <h4 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2 text-sm lg:font-medium">
                  <Calendar className="h-4 w-4 text-neutral-950 lg:hidden shrink-0" />
                  Tarih Aralığı
                </h4>
                <div className="grid grid-cols-2 gap-2.5 lg:gap-2">
                  <div className="relative">
                    <input
                      type="date"
                      aria-label="Başlangıç tarihi"
                      className={MOBILE_DATE_INPUT_CLASS}
                      value={
                        filterOptions.dateRange[0]
                          ? formatDateParam(filterOptions.dateRange[0])
                          : ''
                      }
                      onChange={(e) =>
                        setFilterOptions({
                          ...filterOptions,
                          dateRange: [
                            e.target.value
                              ? new Date(`${e.target.value}T00:00:00`)
                              : null,
                            filterOptions.dateRange[1],
                          ],
                        })
                      }
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 lg:h-5 lg:w-5 text-neutral-400 lg:text-gray-500 pointer-events-none" />
                  </div>
                  <div className="relative">
                    <input
                      type="date"
                      aria-label="Bitiş tarihi"
                      className={MOBILE_DATE_INPUT_CLASS}
                      value={
                        filterOptions.dateRange[1]
                          ? formatDateParam(filterOptions.dateRange[1])
                          : ''
                      }
                      onChange={(e) =>
                        setFilterOptions({
                          ...filterOptions,
                          dateRange: [
                            filterOptions.dateRange[0],
                            e.target.value
                              ? new Date(`${e.target.value}T00:00:00`)
                              : null,
                          ],
                        })
                      }
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 lg:h-5 lg:w-5 text-neutral-400 lg:text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Fiyat Aralığı */}
              <div className={MOBILE_FILTER_SECTION}>
                <h4 className="font-semibold text-neutral-900 mb-3 text-sm lg:font-medium">
                  Fiyat Aralığı
                </h4>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Min ₺"
                      className={MOBILE_PRICE_INPUT}
                      value={
                        filterOptions.minPrice
                          ? filterOptions.minPrice.toLocaleString('tr-TR')
                          : ''
                      }
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d]/g, '');
                        setFilterOptions({
                          ...filterOptions,
                          minPrice: value ? parseInt(value) : null,
                        });
                      }}
                    />
                  </div>
                  <span className="text-neutral-300 font-light lg:text-gray-400">
                    —
                  </span>
                  <div className="relative flex-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Max ₺"
                      className={MOBILE_PRICE_INPUT}
                      value={
                        filterOptions.maxPrice
                          ? filterOptions.maxPrice.toLocaleString('tr-TR')
                          : ''
                      }
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d]/g, '');
                        setFilterOptions({
                          ...filterOptions,
                          maxPrice: value ? parseInt(value) : null,
                        });
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Bölge */}
              <div className={MOBILE_FILTER_SECTION}>
                <h4 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2 text-sm lg:font-medium">
                  <Globe className="h-4 w-4 text-neutral-950 lg:hidden shrink-0" />
                  Bölge
                </h4>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none lg:hidden" />
                  <input
                    type="text"
                    placeholder="Bölge ara..."
                    value={regionSearch}
                    className={`${MOBILE_FILTER_INPUT} mb-0 lg:mb-2`}
                    maxLength={80}
                    onChange={(e) => {
                      setRegionSearch(sanitizeSearchQuery(e.target.value));
                    }}
                  />
                </div>
                <div className="max-h-44 lg:max-h-60 overflow-y-auto -mx-1 px-1">
                  {filteredRegions.length > 0 ? (
                    <div className="flex flex-wrap gap-2 lg:flex-col lg:space-y-2 lg:gap-0">
                      {filteredRegions.map((item) => {
                        const isSelected = filterOptions.region === item.region;
                        return (
                          <button
                            key={item.region}
                            onClick={() =>
                              setFilterOptions({
                                ...filterOptions,
                                region: isSelected ? null : item.region,
                              })
                            }
                            type="button"
                            className={`${CHIP_BASE} ${isSelected ? CHIP_ON : CHIP_OFF}`}
                          >
                            <span className="truncate">{item.region}</span>
                            <span
                              className={`shrink-0 text-xs ${
                                isSelected
                                  ? 'text-neutral-200 lg:text-white'
                                  : 'text-neutral-500 lg:text-inherit'
                              }`}
                            >
                              ({item.count})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="px-1 py-2 text-sm text-neutral-500">
                      Bölge bulunamadı
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sticky mobile footer */}
          <div className="lg:hidden shrink-0 border-t border-neutral-100 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={resetFilters}
                disabled={activeFilterCount === 0}
                className="flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
                Temizle
              </button>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="flex min-h-12 flex-[1.4] items-center justify-center rounded-xl bg-neutral-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
              >
                Filtreleri Uygula
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
