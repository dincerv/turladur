'use client';

import { Plus, X } from 'lucide-react';
import { ItineraryProgramForm } from '@/components/features/tour/itinerary/itinerary-program-form';
import { syncItineraryDays } from '@/lib/tours/itinerary-day';
import { TOUR_OPTIONS } from './tour-form.constants';
import { useTourFormUi } from './tour-form-context';

/** Split from tour-form.tsx (Faz 7) — Detaylar step; zengin günlük program. */
export function TourFormDetailsStep() {
  const {
    formData,
    setFormData,
    newInclude,
    setNewInclude,
    newExclude,
    setNewExclude,
    newHealthPrivilege,
    setNewHealthPrivilege,
    newFeature,
    setNewFeature,
    handleRemoveInclude,
    handleRemoveExclude,
    handleRemoveHealthPrivilege,
    handleRemoveFeature,
  } = useTourFormUi();

  const durationDays = Math.max(1, Number(formData.duration) || 1);
  const stayKind =
    formData.stayKind === 'DAY_TRIP' || formData.tourType === 'Günübirlik Tur'
      ? 'DAY_TRIP'
      : 'OVERNIGHT';

  return (
    <div className="space-y-6 bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900">Detaylar</h2>

      {/* Dahil Olanlar */}
      <div>
        <label className="block text-sm font-medium text-gray-900">
          Dahil Olanlar
        </label>
        <div className="mt-2 space-y-4">
          <div className="flex flex-wrap gap-2">
            {TOUR_OPTIONS.includes.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  if (!formData.includes.includes(item)) {
                    setFormData((prev) => ({
                      ...prev,
                      includes: [...prev.includes, item],
                    }));
                  }
                }}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                  formData.includes.includes(item)
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newInclude}
              onChange={(e) => setNewInclude(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newInclude.trim()) {
                  e.preventDefault();
                  if (!formData.includes.includes(newInclude.trim())) {
                    setFormData((prev) => ({
                      ...prev,
                      includes: [...prev.includes, newInclude.trim()],
                    }));
                    setNewInclude('');
                  }
                }
              }}
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
              placeholder="Özel dahil olan ekleyin..."
            />
            <button
              type="button"
              onClick={() => {
                if (
                  newInclude.trim() &&
                  !formData.includes.includes(newInclude.trim())
                ) {
                  setFormData((prev) => ({
                    ...prev,
                    includes: [...prev.includes, newInclude.trim()],
                  }));
                  setNewInclude('');
                }
              }}
              className="inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
            >
              Ekle
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.includes.map((item, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
              >
                {item}
                <button
                  type="button"
                  onClick={() => handleRemoveInclude(index)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Dahil Olmayanlar */}
      <div>
        <label className="block text-sm font-medium text-gray-900">
          Dahil Olmayanlar
        </label>
        <div className="mt-2 space-y-4">
          <div className="flex flex-wrap gap-2">
            {TOUR_OPTIONS.excludes.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  if (!formData.excludes.includes(item)) {
                    setFormData((prev) => ({
                      ...prev,
                      excludes: [...prev.excludes, item],
                    }));
                  }
                }}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                  formData.excludes.includes(item)
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newExclude}
              onChange={(e) => setNewExclude(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newExclude.trim()) {
                  e.preventDefault();
                  if (!formData.excludes.includes(newExclude.trim())) {
                    setFormData((prev) => ({
                      ...prev,
                      excludes: [...prev.excludes, newExclude.trim()],
                    }));
                    setNewExclude('');
                  }
                }
              }}
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
              placeholder="Özel dahil olmayan ekleyin..."
            />
            <button
              type="button"
              onClick={() => {
                if (
                  newExclude.trim() &&
                  !formData.excludes.includes(newExclude.trim())
                ) {
                  setFormData((prev) => ({
                    ...prev,
                    excludes: [...prev.excludes, newExclude.trim()],
                  }));
                  setNewExclude('');
                }
              }}
              className="inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
            >
              Ekle
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.excludes.map((item, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-red-100 text-red-800"
              >
                {item}
                <button
                  type="button"
                  onClick={() => handleRemoveExclude(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Sağlık Ayrıcalıkları */}
      <div>
        <label className="block text-sm font-medium text-gray-900">
          Sağlık Ayrıcalıkları
        </label>
        <p className="mt-1 text-sm text-gray-500">
          Bu turda saygı duyulan / desteklenen sağlık durumlarını seçin.
          Seçilmezse tur detayında bu bölüm görünmez.
        </p>
        <div className="mt-2 space-y-4">
          <div className="flex flex-wrap gap-2">
            {TOUR_OPTIONS.healthPrivileges.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  if (!formData.healthPrivileges.includes(item)) {
                    setFormData((prev) => ({
                      ...prev,
                      healthPrivileges: [...prev.healthPrivileges, item],
                    }));
                  }
                }}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                  formData.healthPrivileges.includes(item)
                    ? 'bg-sky-100 text-sky-800'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              id="health-privilege-input"
              value={newHealthPrivilege}
              onChange={(e) => setNewHealthPrivilege(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newHealthPrivilege.trim()) {
                  e.preventDefault();
                  if (
                    !formData.healthPrivileges.includes(
                      newHealthPrivilege.trim(),
                    )
                  ) {
                    setFormData((prev) => ({
                      ...prev,
                      healthPrivileges: [
                        ...prev.healthPrivileges,
                        newHealthPrivilege.trim(),
                      ],
                    }));
                    setNewHealthPrivilege('');
                  }
                }
              }}
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
              placeholder="Özel sağlık ayrıcalığı ekleyin..."
            />
            <button
              type="button"
              onClick={() => {
                if (
                  newHealthPrivilege.trim() &&
                  !formData.healthPrivileges.includes(newHealthPrivilege.trim())
                ) {
                  setFormData((prev) => ({
                    ...prev,
                    healthPrivileges: [
                      ...prev.healthPrivileges,
                      newHealthPrivilege.trim(),
                    ],
                  }));
                  setNewHealthPrivilege('');
                }
              }}
              className="inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
            >
              Ekle
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.healthPrivileges.map((item, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-sky-100 text-sky-800"
              >
                {item}
                <button
                  type="button"
                  onClick={() => handleRemoveHealthPrivilege(index)}
                  className="text-sky-600 hover:text-sky-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Özellikler */}
      <div>
        <label className="block text-sm font-medium text-gray-900">
          Özellikler
        </label>
        <div className="mt-2 space-y-4">
          <div className="flex flex-wrap gap-2">
            {TOUR_OPTIONS.features.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  if (!formData.features.includes(item)) {
                    setFormData((prev) => ({
                      ...prev,
                      features: [...prev.features, item],
                    }));
                  }
                }}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                  formData.features.includes(item)
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              id="feature-input"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newFeature.trim()) {
                  e.preventDefault();
                  if (!formData.features.includes(newFeature.trim())) {
                    setFormData((prev) => ({
                      ...prev,
                      features: [...prev.features, newFeature.trim()],
                    }));
                    setNewFeature('');
                  }
                }
              }}
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900"
              placeholder="Özel özellik ekleyin..."
            />
            <button
              type="button"
              onClick={() => {
                if (
                  newFeature.trim() &&
                  !formData.features.includes(newFeature.trim())
                ) {
                  setFormData((prev) => ({
                    ...prev,
                    features: [...prev.features, newFeature.trim()],
                  }));
                  setNewFeature('');
                }
              }}
              className="inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
            >
              Ekle
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.features.map((item, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
              >
                {item}
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(index)}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Program */}
      <div className="mt-2">
        <ItineraryProgramForm
          days={syncItineraryDays(formData.itinerary, durationDays, {
            clearAccommodation: stayKind === 'DAY_TRIP',
          })}
          durationDays={durationDays}
          stayKind={stayKind}
          availableImageUrls={[
            ...(formData.mainImage?.url ? [formData.mainImage.url] : []),
            ...formData.galleryImages
              .map((img) => img.url)
              .filter((url): url is string => Boolean(url)),
            ...formData.images
              .map((img) => img.url)
              .filter((url): url is string => Boolean(url)),
          ]}
          onChange={(itinerary) =>
            setFormData((prev) => ({ ...prev, itinerary }))
          }
          testIdPrefix="partner-tour-itinerary"
        />
      </div>
    </div>
  );
}
