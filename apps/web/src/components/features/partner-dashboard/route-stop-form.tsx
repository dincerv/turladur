'use client';

import { ArrowDown, ArrowUp, BedDouble, MapPin, Trash2 } from 'lucide-react';
import {
  TOUR_ROUTE_STOP_KIND_LABELS,
  TourRouteStopKind,
} from '@turta/shared-constants';

import { PlaceSearchInput } from '@/components/features/partner-dashboard/place-search-input';
import { PickupLocationMap } from '@/components/ui/pickup-location-map-loader';

export type RouteStopFormItem = {
  id?: string;
  dayNumber: number;
  order: number;
  name: string;
  description?: string;
  latitude: number | null;
  longitude: number | null;
  kind: 'VISIT' | 'LODGING';
};

type RouteStopFormProps = {
  routeStops: RouteStopFormItem[];
  onChange: (stops: RouteStopFormItem[]) => void;
  maxDay?: number;
};

function reindex(stops: RouteStopFormItem[]): RouteStopFormItem[] {
  return stops.map((stop, index) => ({ ...stop, order: index }));
}

export function RouteStopForm({
  routeStops,
  onChange,
  maxDay = 14,
}: RouteStopFormProps) {
  const handleAdd = () => {
    const lastDay = routeStops[routeStops.length - 1]?.dayNumber ?? 1;
    onChange(
      reindex([
        ...routeStops,
        {
          dayNumber: Math.min(Math.max(1, lastDay), maxDay),
          order: routeStops.length,
          name: '',
          description: '',
          latitude: null,
          longitude: null,
          kind: TourRouteStopKind.VISIT,
        },
      ]),
    );
  };

  const handleRemove = (index: number) => {
    onChange(reindex(routeStops.filter((_, i) => i !== index)));
  };

  const handleMove = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= routeStops.length) return;
    const next = [...routeStops];
    const tmp = next[index];
    next[index] = next[target];
    next[target] = tmp;
    onChange(reindex(next));
  };

  const patch = (index: number, partial: Partial<RouteStopFormItem>) => {
    const next = [...routeStops];
    next[index] = { ...next[index], ...partial };
    onChange(next);
  };

  return (
    <div className="space-y-4" data-testid="tour-route-stops-form">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Gezi Durakları</h3>
          <p className="mt-1 text-sm text-neutral-500">
            Tur programındaki gezilecek noktalar. Kalkış / biniş noktalarından
            ayrıdır.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          data-testid="tour-route-stop-add-btn"
          className="inline-flex items-center rounded-lg border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Durak Ekle
        </button>
      </div>

      {routeStops.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-500">
          Henüz gezi durağı yok. Haritada çizilecek rota için durak ekleyin.
        </p>
      ) : null}

      <div className="space-y-4">
        {routeStops.map((stop, index) => (
          <div
            key={stop.id ?? `stop-${index}`}
            data-testid={`tour-route-stop-card-${index}`}
            className="space-y-4 rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-neutral-700">
                {stop.kind === TourRouteStopKind.LODGING ? (
                  <BedDouble className="h-4 w-4" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
                <span>
                  {index + 1}. Durak · {stop.dayNumber}. Gün
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Yukarı taşı"
                  disabled={index === 0}
                  onClick={() => handleMove(index, -1)}
                  className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100 disabled:opacity-40"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Aşağı taşı"
                  disabled={index === routeStops.length - 1}
                  onClick={() => handleMove(index, 1)}
                  className="rounded p-1.5 text-neutral-500 hover:bg-neutral-100 disabled:opacity-40"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Durağı sil"
                  onClick={() => handleRemove(index)}
                  className="rounded p-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Gün
                </label>
                <input
                  type="number"
                  min={1}
                  max={maxDay}
                  value={stop.dayNumber}
                  data-testid={`tour-route-stop-day-${index}`}
                  onChange={(e) =>
                    patch(index, {
                      dayNumber: Math.min(
                        maxDay,
                        Math.max(1, Number(e.target.value) || 1),
                      ),
                    })
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900">
                  Tip
                </label>
                <select
                  value={stop.kind}
                  data-testid={`tour-route-stop-kind-${index}`}
                  onChange={(e) =>
                    patch(index, {
                      kind: e.target.value as RouteStopFormItem['kind'],
                    })
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {(
                    Object.keys(TOUR_ROUTE_STOP_KIND_LABELS) as Array<
                      keyof typeof TOUR_ROUTE_STOP_KIND_LABELS
                    >
                  ).map((key) => (
                    <option key={key} value={key}>
                      {TOUR_ROUTE_STOP_KIND_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-900">
                  Durak adı
                </label>
                <PlaceSearchInput
                  value={stop.name}
                  inputTestId={`tour-route-stop-name-${index}`}
                  placeholder="Örn. Göreme Açık Hava Müzesi"
                  onChange={(name) => patch(index, { name })}
                  onSelect={(place) => {
                    const shortName =
                      place.label.split(',')[0]?.trim() || place.label;
                    patch(index, {
                      name: shortName,
                      latitude: place.latitude,
                      longitude: place.longitude,
                    });
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900">
                Kısa açıklama
              </label>
              <input
                type="text"
                value={stop.description ?? ''}
                data-testid={`tour-route-stop-description-${index}`}
                onChange={(e) => patch(index, { description: e.target.value })}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Opsiyonel"
              />
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium text-gray-900">
                Harita konumu
              </p>
              <PickupLocationMap
                latitude={stop.latitude}
                longitude={stop.longitude}
                interactive
                onChange={(latitude, longitude) =>
                  patch(index, { latitude, longitude })
                }
              />
              <p className="mt-1 text-xs text-gray-500">
                Yer aramasından seçin veya haritaya tıklayın.
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RouteStopForm;
