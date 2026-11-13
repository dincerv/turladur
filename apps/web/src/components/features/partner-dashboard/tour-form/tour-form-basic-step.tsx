'use client';

import { ImageIcon, Plus, X } from 'lucide-react';
import { DatePicker } from '@/components/booking/date-picker';
import { PickupPointForm } from '@/components/features/partner-dashboard/pickup-point-form';
import { IMAGE_PLACEHOLDER } from '@/lib/partner-tour-helpers';
import {
  AVAILABLE_TAGS,
  TURKEY_CITIES,
  getRegionByCity,
} from './tour-form.constants';
import { useTourFormUi } from './tour-form-context';

/** Split from tour-form.tsx (Faz 7) — Temel Bilgiler step; UI unchanged. */
export function TourFormBasicStep() {
  const {
    formData,
    setFormData,
    errors,
    todayStr,
    isUploadingImages,
    uploadError,
    getRootProps,
    getInputProps,
    newLanguage,
    suggestions,
    newTag,
    setNewTag,
    handleChange,
    handleDestinationsChange,
    handleRemoveDepartureCity,
    handleMainImageChange,
    handleGalleryImagesChange,
    handleGalleryImageDescriptionChange,
    handleRemoveGalleryImage,
    handleReorderGalleryImages,
    handleImageRemove,
    handlePreviewImageError,
    handlePickupPointsChange,
    handleLanguageInputChange,
    handleAddLanguage,
    handleRemoveLanguage,
    handleSuggestionClick,
    handleRemoveTag,
  } = useTourFormUi();

  return (
    <div className="space-y-6 bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900">Temel Bilgiler</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label
            htmlFor="stayKind"
            className="mb-2 block text-sm font-medium text-gray-900"
          >
            Turun türü <span className="text-red-500">*</span>
          </label>
          <select
            id="stayKind"
            name="stayKind"
            data-testid="tour-stay-kind-select"
            value={formData.stayKind}
            onChange={handleChange}
            className={`block w-full rounded-lg border ${errors.stayKind ? 'border-red-500' : 'border-gray-300'} px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900`}
          >
            <option value="">Seçiniz</option>
            <option value="DAY_TRIP">Günübirlik</option>
            <option value="OVERNIGHT">Konaklamalı</option>
          </select>
          {errors.stayKind && (
            <p className="mt-2 text-sm text-red-600">{errors.stayKind}</p>
          )}
        </div>
        {formData.stayKind ? (
          <div>
            <label
              htmlFor="destinationScope"
              className="mb-2 block text-sm font-medium text-gray-900"
            >
              Rota <span className="text-red-500">*</span>
            </label>
            <select
              id="destinationScope"
              name="destinationScope"
              value={formData.destinationScope}
              onChange={handleChange}
              className={`block w-full rounded-lg border ${errors.destinationScope ? 'border-red-500' : 'border-gray-300'} px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900`}
            >
              <option value="">Seçiniz</option>
              <option value="DOMESTIC">Yurtiçi</option>
              <option value="INTERNATIONAL">Yurtdışı</option>
            </select>
            {errors.destinationScope && (
              <p className="mt-2 text-sm text-red-600">
                {errors.destinationScope}
              </p>
            )}
          </div>
        ) : (
          <div />
        )}
      </div>
      <div>
        <label
          htmlFor="title"
          className="mb-2 block text-sm font-medium text-gray-900"
        >
          Tur Başlığı <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          data-testid="tour-name-input"
          value={formData.title}
          onChange={handleChange}
          className={`block w-full rounded-lg border ${errors.title ? 'border-red-500' : 'border-gray-300'} px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900`}
          placeholder="Muhteşem Kapadokya Turu"
        />
        {errors.title && (
          <p
            className="mt-2 text-sm text-red-600"
            data-testid="tour-name-error"
            role="alert"
          >
            {errors.title}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-2 block text-sm font-medium text-gray-900"
        >
          Açıklama <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={formData.description}
          onChange={handleChange}
          className={`block w-full rounded-lg border ${errors.description ? 'border-red-500' : 'border-gray-300'} px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900`}
          placeholder="Turunuzu detaylı bir şekilde açıklayın..."
        />
        {errors.description && (
          <p className="mt-2 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label
            htmlFor="price"
            className="mb-2 block text-sm font-medium text-gray-900"
          >
            Fiyat (₺) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-500">₺</span>
            </div>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price || ''}
              onChange={handleChange}
              className={`block w-full rounded-lg border ${errors.price ? 'border-red-500' : 'border-gray-300'} pl-8 pr-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900`}
              placeholder="1500"
              min="0"
            />
          </div>
          {errors.price && (
            <p className="mt-2 text-sm text-red-600">{errors.price}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="discount"
            className="mb-2 block text-sm font-medium text-gray-900"
          >
            İndirim Oranı (%)
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-gray-500">%</span>
            </div>
            <input
              type="number"
              id="discount"
              name="discount"
              value={formData.discount || ''}
              onChange={handleChange}
              className="block w-full rounded-lg border border-gray-300 pr-8 pl-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
              placeholder="0"
              min="0"
              max="100"
            />
          </div>
        </div>
      </div>

      {/* Kalkış Şehirleri ve Gidilen Yerler */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Kalkış Şehirleri */}
        <div>
          <label
            htmlFor="departureCity"
            className="mb-2 block text-sm font-medium text-gray-900"
          >
            Kalkış Şehirleri <span className="text-red-500">*</span>
            <span className="ml-2 text-xs text-gray-500">
              (Birden fazla şehir seçebilirsiniz)
            </span>
          </label>
          <div className="space-y-3">
            {/* Mevcut kalkış şehirleri */}
            {formData.departureCity.map((city, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <select
                    value={city}
                    onChange={(e) => {
                      const newCities = [...formData.departureCity];
                      newCities[index] = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        departureCity: newCities,
                      }));
                    }}
                    className="block w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="">Şehir seçiniz</option>
                    {TURKEY_CITIES.filter(
                      (availableCity) =>
                        !formData.departureCity.some(
                          (selectedCity, i) =>
                            i !== index && selectedCity === availableCity,
                        ),
                    ).map((availableCity) => (
                      <option key={availableCity} value={availableCity}>
                        {availableCity}
                      </option>
                    ))}
                  </select>
                </div>
                {formData.departureCity.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDepartureCity(city)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                    title="Kalkış şehrini kaldır"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}

            {/* Yeni kalkış şehri ekleme */}
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  departureCity: [...prev.departureCity, ''],
                }));
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
            >
              <Plus className="h-5 w-5 mr-2" />
              Kalkış Şehri Ekle
            </button>
          </div>
          {errors.departureCity && (
            <p className="mt-2 text-sm text-red-600">{errors.departureCity}</p>
          )}
        </div>

        {/* Gidilen Yerler */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900">
            Gidilen Yerler <span className="text-red-500">*</span>
            <span className="ml-2 text-xs text-gray-500">
              (Birden fazla şehir seçebilirsiniz)
            </span>
          </label>
          <div className="space-y-3">
            {/* Mevcut destinasyonlar */}
            {formData.destinations.map((destination, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <select
                    value={destination.city}
                    onChange={(e) =>
                      handleDestinationsChange(index, 'city', e.target.value)
                    }
                    className="block w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
                  >
                    <option value="">Şehir seçiniz</option>
                    {TURKEY_CITIES.filter(
                      (city) =>
                        !formData.departureCity.includes(city) &&
                        !formData.destinations.some(
                          (dest, i) => i !== index && dest.city === city,
                        ),
                    ).map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      destinations: prev.destinations.filter(
                        (_, i) => i !== index,
                      ),
                    }));
                  }}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                  title="Destinasyonu kaldır"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}

            {/* Yeni destinasyon ekleme */}
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  destinations: [
                    ...prev.destinations,
                    { city: '', description: '' },
                  ],
                }));
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
            >
              <Plus className="h-5 w-5 mr-2" />
              Destinasyon Ekle
            </button>
          </div>
          {errors.destinations && (
            <p className="mt-2 text-sm text-red-600">{errors.destinations}</p>
          )}
        </div>
      </div>

      {/* Bölge Bilgisi */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-900">
          Bölge
          <span className="ml-2 text-xs text-gray-500">
            (Otomatik hesaplanır)
          </span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={formData.region || 'Bölge henüz hesaplanmadı'}
            disabled
            className="block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm bg-gray-100 text-gray-900"
          />
          {formData.destinations.length > 0 &&
            formData.destinations.some((dest) => dest.city) && (
              <div className="mt-2 text-xs text-gray-600">
                <span className="font-medium">Hesaplama:</span>
                {(() => {
                  const selectedCities = formData.destinations
                    .map((dest) => dest.city)
                    .filter(
                      (city): city is string =>
                        typeof city === 'string' && city.trim() !== '',
                    );

                  if (selectedCities.length === 1) {
                    return ` Tek şehir (${selectedCities[0]}) seçildiği için ${formData.region} bölgesi belirlendi.`;
                  } else {
                    const cityRegions = selectedCities.map((city) =>
                      getRegionByCity(city),
                    );
                    const uniqueRegions = Array.from(
                      new Set(cityRegions),
                    ).filter((region) => region);

                    if (uniqueRegions.length === 1) {
                      return ` Tüm şehirler ${uniqueRegions[0]} bölgesinde olduğu için ${formData.region} bölgesi belirlendi.`;
                    } else if (uniqueRegions.length === 2) {
                      const regionPairs = [
                        ['Marmara', 'Ege'],
                        ['Ege', 'Akdeniz'],
                        ['Akdeniz', 'İç Anadolu'],
                        ['İç Anadolu', 'Karadeniz'],
                        ['İç Anadolu', 'Doğu Anadolu'],
                        ['Doğu Anadolu', 'Güneydoğu Anadolu'],
                        ['Karadeniz', 'Doğu Anadolu'],
                      ];

                      const isNeighboring = regionPairs.some(
                        (pair) =>
                          (pair[0] === uniqueRegions[0] &&
                            pair[1] === uniqueRegions[1]) ||
                          (pair[0] === uniqueRegions[1] &&
                            pair[1] === uniqueRegions[0]),
                      );

                      if (isNeighboring) {
                        return ` Komşu bölgeler (${uniqueRegions.join(' - ')}) olduğu için daha büyük olan ${formData.region} bölgesi seçildi.`;
                      } else {
                        return ` Farklı bölgeler (${uniqueRegions.join(', ')}) olduğu için en çok şehir olan ${formData.region} bölgesi seçildi.`;
                      }
                    } else {
                      return ` ${uniqueRegions.length} farklı bölge olduğu için en çok şehir olan ${formData.region} bölgesi seçildi.`;
                    }
                  }
                })()}
              </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label
            htmlFor="nights"
            className="mb-2 block text-sm font-medium text-gray-900"
          >
            Gece{' '}
            {formData.stayKind !== 'DAY_TRIP' && (
              <span className="text-red-500">*</span>
            )}
          </label>
          <input
            type="number"
            id="nights"
            name="nights"
            value={formData.nights}
            onChange={handleChange}
            disabled={formData.stayKind === 'DAY_TRIP'}
            className={`block w-full rounded-lg border ${errors.nights ? 'border-red-500' : 'border-gray-300'} px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 ${formData.stayKind === 'DAY_TRIP' ? 'bg-gray-100' : ''}`}
            placeholder="Örn: 3"
            min={formData.stayKind === 'DAY_TRIP' ? 0 : 1}
          />
          {errors.nights && (
            <p className="mt-2 text-sm text-red-600">{errors.nights}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="duration"
            className="mb-2 block text-sm font-medium text-gray-900"
          >
            Gün <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="duration"
            name="duration"
            value={formData.duration}
            disabled
            className="block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm bg-gray-100 text-gray-900"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label
            htmlFor="maxParticipants"
            className="mb-2 block text-sm font-medium text-gray-900"
          >
            Maksimum Katılımcı <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="maxParticipants"
            name="maxParticipants"
            value={formData.maxParticipants || ''}
            onChange={handleChange}
            className={`block w-full rounded-lg border ${errors.maxParticipants ? 'border-red-500' : 'border-gray-300'} px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900`}
            placeholder="20"
            min="1"
          />
          {errors.maxParticipants && (
            <p className="mt-2 text-sm text-red-600">
              {errors.maxParticipants}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label
            htmlFor="startDate"
            className="mb-2 block text-sm font-medium text-gray-900"
          >
            Gidiş Tarihi <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <DatePicker
              label=""
              value={formData.startDate}
              onChange={(val) => {
                setFormData((prev) => {
                  const updatedTourDates = [...prev.tourDates];
                  if (updatedTourDates.length > 0) {
                    // Başlangıç tarihine gece sayısını ekleyerek dönüş tarihini hesapla
                    const startDate = new Date(val);
                    const endDate = new Date(startDate);
                    endDate.setDate(
                      startDate.getDate() + (parseInt(prev.nights) || 0),
                    );

                    const formattedEndDate = endDate
                      .toISOString()
                      .split('T')[0];

                    updatedTourDates[0] = {
                      ...updatedTourDates[0],
                      startDate: val,
                      endDate: formattedEndDate,
                    };
                  }
                  return {
                    ...prev,
                    startDate: val,
                    endDate: updatedTourDates[0]?.endDate || '',
                    tourDates: updatedTourDates,
                  };
                });
              }}
              placeholder="gg.aa.yyyy"
              minDate={todayStr}
            />
            <div className="pointer-events-none absolute right-3 top-1/2 transform -translate-y-1/2 bg-gray-100 rounded-full p-1 border border-gray-200"></div>
          </div>
          {errors.startDate && (
            <p className="mt-2 text-sm text-red-600">{errors.startDate}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900">
            Bitiş Tarihi
          </label>
          <div className="relative mt-1">
            <DatePicker
              label=""
              value={formData.endDate}
              onChange={() => {}} // Değişikliği engelle
              placeholder="gg.aa.yyyy"
              minDate={formData.startDate || todayStr}
              disabled={true} // Düzenlemeyi engelle
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label
            htmlFor="transportation"
            className="mb-2 block text-sm font-medium text-gray-900"
          >
            Ulaşım Tipi <span className="text-red-500">*</span>
          </label>
          <select
            id="transportation"
            name="transportation"
            value={formData.transportation}
            onChange={handleChange}
            className={`block w-full rounded-lg border ${errors.transportation ? 'border-red-500' : 'border-gray-300'} px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900`}
          >
            <option value="">Seçiniz</option>
            <option value="Otobüs">Otobüs</option>
            <option value="Uçak">Uçak</option>
            <option value="Tren">Tren</option>
            <option value="Minibüs">Minibüs</option>
            <option value="Özel Araç">Özel Araç</option>
          </select>
          {errors.transportation && (
            <p className="mt-2 text-sm text-red-600">{errors.transportation}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="tourType"
            className="mb-2 block text-sm font-medium text-gray-900"
          >
            Tur Tipi <span className="text-red-500">*</span>
          </label>
          <select
            id="tourType"
            name="tourType"
            value={formData.tourType}
            onChange={handleChange}
            className={`block w-full rounded-lg border ${errors.tourType ? 'border-red-500' : 'border-gray-300'} px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900`}
          >
            <option value="">Seçiniz</option>
            <option value="Kültür Turu">Kültür Turu</option>
            <option value="Doğa Turu">Doğa Turu</option>
            <option value="Balayı Turu">Balayı Turu</option>
            <option value="Yemek Turu">Yemek Turu</option>
            <option value="Macera Turu">Macera Turu</option>
            <option value="Günübirlik Tur">Günübirlik Tur</option>
          </select>
          {errors.tourType && (
            <p className="mt-2 text-sm text-red-600">{errors.tourType}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="grid grid-cols-2 gap-4 items-end">
          <div>
            <label
              htmlFor="accommodationType"
              className="mb-2 block text-sm font-medium text-gray-900"
            >
              Konaklama Tipi{' '}
              {formData.stayKind !== 'DAY_TRIP' &&
                formData.tourType !== 'Günübirlik Tur' && (
                  <span className="text-red-500">*</span>
                )}
            </label>
            <select
              id="accommodationType"
              name="accommodationType"
              value={formData.accommodationType}
              onChange={handleChange}
              disabled={
                formData.stayKind === 'DAY_TRIP' ||
                formData.tourType === 'Günübirlik Tur'
              }
              className={`block w-full rounded-lg border ${errors.accommodationType ? 'border-red-500' : 'border-gray-300'} px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 ${formData.stayKind === 'DAY_TRIP' || formData.tourType === 'Günübirlik Tur' ? 'bg-gray-100' : ''}`}
            >
              <option value="">Seçiniz</option>
              <option value="Otel">Otel</option>
              <option value="Pansiyon">Pansiyon</option>
              <option value="Apart">Apart</option>
              <option value="Butik Otel">Butik Otel</option>
              <option value="Kamp">Kamp</option>
            </select>
            {errors.accommodationType && (
              <p className="mt-2 text-sm text-red-600">
                {errors.accommodationType}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="accommodationName"
              className="mb-2 block text-sm font-medium text-gray-900"
            >
              Konaklama: {formData.accommodationType || ''}
            </label>
            <input
              type="text"
              id="accommodationName"
              name="accommodationName"
              value={formData.accommodationName || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  accommodationName: e.target.value,
                }))
              }
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
              placeholder={`Konaklama adı örn. A Oteli`}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 items-end">
          <div>
            <label
              htmlFor="ageRestriction"
              className="mb-2 block text-sm font-medium text-gray-900"
            >
              Yaş Sınırı
            </label>
            <input
              type="number"
              id="ageRestriction"
              name="ageRestriction"
              value={formData.ageRestriction || ''}
              onChange={handleChange}
              className="block w-28 rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
              placeholder="0"
              min="0"
            />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-900">
          Tur Resimleri <span className="text-red-500">*</span>
        </label>
        <div
          {...getRootProps()}
          className={`cursor-pointer rounded-lg border-2 border-dashed ${errors.images ? 'border-red-500' : 'border-gray-300'} px-6 py-8 text-center hover:bg-gray-50`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-2">
            <ImageIcon className="h-12 w-12 text-gray-400" />
            <p className="text-sm text-gray-600">
              Resim yüklemek için tıklayın veya sürükleyin
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, GIF dosyaları, 10MB&apos;a kadar
            </p>
          </div>
        </div>
        {errors.images && (
          <p className="mt-2 text-sm text-red-600">{errors.images}</p>
        )}
        {uploadError && (
          <p className="mt-2 text-sm text-red-600">{uploadError}</p>
        )}
        {isUploadingImages && (
          <p className="mt-2 text-sm text-sky-600">Görseller yükleniyor...</p>
        )}

        {formData.images.length > 0 && (
          <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {formData.images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-200 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element -- blob/local preview must bypass next/image */}
                  <img
                    src={image.preview || image.url || IMAGE_PLACEHOLDER}
                    alt={`Tour image ${index + 1}`}
                    className="h-full w-full object-cover"
                    onError={handlePreviewImageError}
                  />
                  <button
                    type="button"
                    onClick={() => handleImageRemove(index)}
                    className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-900">
          Ana Görsel <span className="text-red-500">*</span>
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleMainImageChange}
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
        />
        {formData.mainImage && (
          <div className="mt-4 relative w-full max-w-xs">
            {/* eslint-disable-next-line @next/next/no-img-element -- blob/local preview must bypass next/image */}
            <img
              src={
                formData.mainImage.preview ||
                formData.mainImage.url ||
                IMAGE_PLACEHOLDER
              }
              alt="Ana görsel"
              className="h-[180px] w-full rounded-lg object-cover"
              onError={handlePreviewImageError}
            />
          </div>
        )}
        {errors.mainImage && (
          <p className="mt-2 text-sm text-red-600">{errors.mainImage}</p>
        )}
      </div>

      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-900">
          Galeri Görselleri <span className="text-red-500">*</span>
          <span className="ml-2 text-xs text-gray-500">
            (En az 3, en fazla 10 görsel)
          </span>
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleGalleryImagesChange}
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
          disabled={formData.galleryImages.length >= 10}
        />
        {errors.galleryImages && (
          <p className="mt-2 text-sm text-red-600">{errors.galleryImages}</p>
        )}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {formData.galleryImages.map((img, idx) => (
            <div
              key={idx}
              className="relative group border rounded-lg p-2 bg-white"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- blob/local preview must bypass next/image */}
              <img
                src={img.preview || img.url || IMAGE_PLACEHOLDER}
                alt={`Galeri görseli ${idx + 1}`}
                className="h-[90px] w-full rounded-lg object-cover"
                onError={handlePreviewImageError}
              />
              <input
                type="text"
                value={img.description || ''}
                onChange={(e) =>
                  handleGalleryImageDescriptionChange(idx, e.target.value)
                }
                className="mt-2 block w-full rounded border border-gray-300 px-2 py-1 text-xs"
                placeholder="Açıklama (opsiyonel)"
              />
              <button
                type="button"
                onClick={() => handleRemoveGalleryImage(idx)}
                className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
              <div className="flex justify-between mt-1">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleReorderGalleryImages(idx, idx - 1)}
                  className="text-xs px-2 py-1 bg-gray-100 rounded disabled:opacity-50"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={idx === formData.galleryImages.length - 1}
                  onClick={() => handleReorderGalleryImages(idx, idx + 1)}
                  className="text-xs px-2 py-1 bg-gray-100 rounded disabled:opacity-50"
                >
                  ↓
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Buluşma Noktası ve Saati */}

      {/* Yolcu Alma Noktaları */}
      <div className="space-y-6 bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900">
          Yolcu Alma Noktaları
        </h2>
        <PickupPointForm
          pickupPoints={formData.pickupPoints}
          onChange={handlePickupPointsChange}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900">
            Diller <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newLanguage}
              onChange={handleLanguageInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddLanguage();
                }
              }}
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
              placeholder="Dil ekle ve Enter'a bas"
            />
            <button
              type="button"
              onClick={handleAddLanguage}
              className="px-4 py-3 rounded-lg bg-indigo-600 text-white"
            >
              Ekle
            </button>
          </div>
          {suggestions.length > 0 && (
            <ul className="mt-2 border border-gray-300 rounded-lg bg-white shadow-sm">
              {suggestions.map((suggestion, idx) => (
                <li
                  key={idx}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-900"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.languages.map((lang, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
              >
                {lang}
                <button
                  type="button"
                  onClick={() => handleRemoveLanguage(idx)}
                  className="text-gray-500 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
          {errors.languages && (
            <p className="mt-2 text-sm text-red-600">{errors.languages}</p>
          )}
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-900">
            Etiketler
          </label>
          <div className="mt-2">
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(index)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>
            <div className="relative">
              <select
                value={newTag}
                onChange={(e) => {
                  const selectedTag = e.target.value;
                  if (selectedTag && !formData.tags.includes(selectedTag)) {
                    setFormData((prev) => ({
                      ...prev,
                      tags: [...prev.tags, selectedTag],
                    }));
                    setNewTag('');
                  }
                }}
                className="block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
              >
                <option value="">Etiket seçin</option>
                {AVAILABLE_TAGS.filter(
                  (tag) => !formData.tags.includes(tag),
                ).map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
