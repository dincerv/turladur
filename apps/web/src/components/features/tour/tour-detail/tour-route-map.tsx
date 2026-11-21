'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import L, { type DivIcon, type Map as LeafletMap } from 'leaflet';
import {
  TOUR_ROUTE_STOP_KIND_LABELS,
  TourRouteStopKind,
  isValidGeoCoordinate,
} from '@turta/shared-constants';

import 'leaflet/dist/leaflet.css';

import type { TourRouteStopView } from './tour-detail.types';
import {
  ROUTE_MAP_FIT_PADDING,
  ROUTE_MAP_MAX_FIT_ZOOM,
  dayColor,
  resolveRegionCenter,
  resolveTourMapTile,
  routeLineStyle,
} from './tour-route-map.helpers';

/** Anahtarsız Esri Street — Carto filigranı / OSM eksik tile yok. */
const { url: TILE_URL, attribution: TILE_ATTRIBUTION } = resolveTourMapTile();

const TURKEY_CENTER: [number, number] = [39.0, 35.2];

const BED_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>`;

function createStopIcon(
  stop: TourRouteStopView,
  sequence: number,
  active: boolean,
): DivIcon {
  const color = dayColor(stop.dayNumber);
  const size = active ? 40 : 34;
  const isLodging = stop.kind === TourRouteStopKind.LODGING;
  const ring = active
    ? `0 0 0 4px ${color}55, 0 4px 12px rgba(0,0,0,.22)`
    : '0 2px 8px rgba(0,0,0,.28)';
  const radius = isLodging ? '10px' : '9999px';
  const inner = isLodging
    ? BED_SVG
    : `<span style="font-size:13px;font-weight:800;font-family:ui-sans-serif,system-ui,sans-serif;letter-spacing:-0.03em;line-height:1;">${sequence}</span>`;

  const body = `<span style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:${radius};background:${color};color:#fff;border:2.5px solid #fff;box-shadow:${ring};">${inner}</span>`;

  return L.divIcon({
    className: 'tour-route-stop-pin',
    html: body,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) + 2],
  });
}

function fitRoute(
  map: LeafletMap,
  points: Array<[number, number]>,
  fallbackCenter: [number, number] = TURKEY_CENTER,
) {
  map.invalidateSize();
  const safe = points.filter(([lat, lng]) => isValidGeoCoordinate(lat, lng));
  if (safe.length === 0) {
    map.setView(fallbackCenter, 9);
    return;
  }
  if (safe.length === 1) {
    map.setView(safe[0], 13);
    return;
  }
  map.fitBounds(L.latLngBounds(safe), {
    padding: ROUTE_MAP_FIT_PADDING,
    maxZoom: ROUTE_MAP_MAX_FIT_ZOOM,
  });
}

/** Tile kırılmasını önlemek için boyut senkronu (mount + resize + visibility). */
function MapResizeSync() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    let raf = 0;
    const sync = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        map.invalidateSize({ pan: false });
      });
    };

    sync();
    const t1 = window.setTimeout(sync, 80);
    const t2 = window.setTimeout(sync, 320);

    const observer = new ResizeObserver(sync);
    observer.observe(container);

    const onWin = () => sync();
    window.addEventListener('resize', onWin);
    window.addEventListener('orientationchange', onWin);
    document.addEventListener('visibilitychange', onWin);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      observer.disconnect();
      window.removeEventListener('resize', onWin);
      window.removeEventListener('orientationchange', onWin);
      document.removeEventListener('visibilitychange', onWin);
    };
  }, [map]);

  return null;
}

function FitBounds({
  points,
  focus,
  fitNonce,
  fallbackCenter,
}: {
  points: Array<[number, number]>;
  focus: [number, number] | null;
  fitNonce: number;
  fallbackCenter: [number, number];
}) {
  const map = useMap();
  const safePoints = points.filter(([lat, lng]) =>
    isValidGeoCoordinate(lat, lng),
  );
  const pointsKey = safePoints.map((p) => p.join(',')).join('|');
  const focusKey =
    focus && isValidGeoCoordinate(focus[0], focus[1])
      ? `${focus[0]},${focus[1]}`
      : '';
  const fallbackKey = fallbackCenter.join(',');

  useEffect(() => {
    map.invalidateSize();
    const size = map.getSize();
    if (!size || size.x < 2 || size.y < 2) {
      const t = window.setTimeout(() => {
        map.invalidateSize();
        if (focusKey && focus && isValidGeoCoordinate(focus[0], focus[1])) {
          map.flyTo(focus, Math.max(map.getZoom() || 0, 13), {
            duration: 0.5,
          });
          return;
        }
        fitRoute(map, safePoints, fallbackCenter);
      }, 140);
      return () => window.clearTimeout(t);
    }

    if (focusKey && focus && isValidGeoCoordinate(focus[0], focus[1])) {
      const currentZoom = map.getZoom();
      const zoom =
        Number.isFinite(currentZoom) && currentZoom > 0
          ? Math.max(currentZoom, 13)
          : 13;
      map.flyTo(focus, zoom, { duration: 0.55 });
      return;
    }

    fitRoute(map, safePoints, fallbackCenter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, pointsKey, focusKey, fitNonce, fallbackKey]);

  return null;
}

function CaptureMap({ onReady }: { onReady: (map: LeafletMap) => void }) {
  const map = useMap();
  useEffect(() => {
    onReady(map);
  }, [map, onReady]);
  return null;
}

function StopMarker({
  stop,
  sequence,
  active,
  onSelect,
}: {
  stop: TourRouteStopView;
  sequence: number;
  active: boolean;
  onSelect: (id: string) => void;
}) {
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    if (active) {
      const t = window.setTimeout(() => {
        marker.openPopup();
      }, 280);
      return () => window.clearTimeout(t);
    }
    marker.closePopup();
  }, [active]);

  return (
    <Marker
      ref={markerRef}
      position={[stop.latitude, stop.longitude]}
      icon={createStopIcon(stop, sequence, active)}
      zIndexOffset={active ? 1000 : sequence}
      eventHandlers={{
        click: () => onSelect(stop.id),
      }}
    >
      <Popup autoPan autoPanPadding={[48, 48]} closeButton>
        <div className="space-y-1 text-sm">
          <p className="font-semibold leading-snug text-neutral-900">
            {sequence}. {stop.name}
          </p>
          <p className="text-xs text-neutral-600">
            <span
              className="mr-1 inline-block h-2 w-2 rounded-full align-middle"
              style={{ backgroundColor: dayColor(stop.dayNumber) }}
            />
            {stop.dayNumber}. Gün ·{' '}
            {
              TOUR_ROUTE_STOP_KIND_LABELS[
                stop.kind === TourRouteStopKind.LODGING
                  ? TourRouteStopKind.LODGING
                  : TourRouteStopKind.VISIT
              ]
            }
          </p>
          {stop.description ? (
            <p className="text-xs leading-relaxed text-neutral-600">
              {stop.description}
            </p>
          ) : null}
        </div>
      </Popup>
    </Marker>
  );
}

export type TourRouteMapProps = {
  stops: TourRouteStopView[];
  selectedStopId: string | null;
  onSelectStop: (stopId: string | null) => void;
  className?: string;
  /** Durak yokken odaklanılacak bölge ipuçları (şehir / destinasyon). */
  regionHints?: Array<string | null | undefined>;
};

export function TourRouteMap({
  stops,
  selectedStopId,
  onSelectStop,
  className,
  regionHints = [],
}: TourRouteMapProps) {
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const [fitNonce, setFitNonce] = useState(0);

  const onMapReady = useCallback((map: LeafletMap) => {
    setMapInstance(map);
  }, []);

  const geoStops = useMemo(
    () =>
      stops.filter((stop) =>
        isValidGeoCoordinate(stop.latitude, stop.longitude),
      ),
    [stops],
  );

  const path = useMemo(
    () =>
      geoStops.map(
        (stop) => [stop.latitude, stop.longitude] as [number, number],
      ),
    [geoStops],
  );

  const segments = useMemo(() => {
    const out: Array<{
      key: string;
      positions: Array<[number, number]>;
      color: string;
    }> = [];
    for (let i = 0; i < geoStops.length - 1; i += 1) {
      const a = geoStops[i];
      const b = geoStops[i + 1];
      out.push({
        key: `${a.id}-${b.id}`,
        positions: [
          [a.latitude, a.longitude],
          [b.latitude, b.longitude],
        ],
        color: dayColor(a.dayNumber),
      });
    }
    return out;
  }, [geoStops]);

  const focus = useMemo(() => {
    const selected = stops.find((s) => s.id === selectedStopId);
    if (
      !selected ||
      !isValidGeoCoordinate(selected.latitude, selected.longitude)
    ) {
      return null;
    }
    return [selected.latitude, selected.longitude] as [number, number];
  }, [selectedStopId, stops]);

  const fallbackCenter = useMemo(
    () => resolveRegionCenter(regionHints),
    [regionHints],
  );
  const center = path[0] ?? fallbackCenter;

  const handleFitRoute = useCallback(() => {
    onSelectStop(null);
    setFitNonce((n) => n + 1);
    if (mapInstance) {
      fitRoute(mapInstance, path, fallbackCenter);
    }
  }, [mapInstance, onSelectStop, path, fallbackCenter]);

  return (
    <div
      className={
        className ??
        'tour-route-map-shell relative z-0 isolate h-72 w-full overflow-hidden rounded-2xl border border-orange-100/80 bg-[#f8f4ec] shadow-inner sm:h-80 lg:h-[28rem]'
      }
      data-testid="tour-route-map"
    >
      <style>{`
        .tour-route-map-shell .leaflet-container {
          height: 100%;
          width: 100%;
          background: #f8f4ec;
          font: inherit;
          z-index: 0;
        }
        .tour-route-map-shell .leaflet-pane,
        .tour-route-map-shell .leaflet-top,
        .tour-route-map-shell .leaflet-bottom {
          z-index: auto;
        }
        .tour-route-map-shell .leaflet-container img,
        .tour-route-map-shell .leaflet-tile,
        .tour-route-map-shell .leaflet-marker-icon,
        .tour-route-map-shell .leaflet-marker-shadow,
        .tour-route-map-shell .leaflet-image-layer {
          max-width: none !important;
          max-height: none !important;
          width: auto !important;
          height: auto !important;
        }
        .tour-route-map-shell .leaflet-tile-pane {
          z-index: 200;
        }
        .tour-route-map-shell .leaflet-overlay-pane {
          z-index: 400;
        }
        .tour-route-map-shell .leaflet-marker-pane {
          z-index: 650;
        }
        .tour-route-map-shell .leaflet-tooltip-pane {
          z-index: 680;
        }
        .tour-route-map-shell .leaflet-popup-pane {
          z-index: 700;
        }
        .tour-route-map-shell .leaflet-control-attribution {
          font-size: 9px;
          line-height: 1.2;
          max-width: 46%;
          margin: 0 !important;
          padding: 2px 6px !important;
          background: rgba(255,255,255,.82) !important;
          border-radius: 6px 0 0 0;
        }
        .tour-route-map-shell .leaflet-bottom.leaflet-left {
          bottom: 0;
          left: 0;
        }
        .tour-route-map-shell .leaflet-popup-content-wrapper {
          border-radius: 14px;
          box-shadow: 0 10px 28px rgba(28, 25, 23, 0.14);
          border: 1px solid #fed7aa;
          padding: 2px 0;
        }
        .tour-route-map-shell .leaflet-popup-content {
          margin: 10px 12px;
          min-width: 9.5rem;
        }
        .tour-route-map-shell .leaflet-popup-tip {
          box-shadow: none;
          border: 1px solid #fed7aa;
        }
        .tour-route-stop-pin {
          background: transparent !important;
          border: none !important;
        }
      `}</style>

      <MapContainer
        center={center}
        zoom={path.length ? 11 : 6}
        scrollWheelZoom
        zoomControl={false}
        className="h-full w-full"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution={TILE_ATTRIBUTION}
          url={TILE_URL}
          maxZoom={19}
          maxNativeZoom={19}
          keepBuffer={2}
          updateWhenIdle={false}
          updateWhenZooming
          detectRetina={false}
        />
        <CaptureMap onReady={onMapReady} />
        <MapResizeSync />
        <FitBounds
          points={path}
          focus={focus}
          fitNonce={fitNonce}
          fallbackCenter={fallbackCenter}
        />
        {segments.map((segment) => (
          <Polyline
            key={segment.key}
            positions={segment.positions}
            pathOptions={routeLineStyle(segment.color)}
          />
        ))}
        {geoStops.map((stop, index) => {
          const active = stop.id === selectedStopId;
          return (
            <StopMarker
              key={stop.id}
              stop={stop}
              sequence={index + 1}
              active={active}
              onSelect={onSelectStop}
            />
          );
        })}
      </MapContainer>

      {/* Attribution sol altta; kontroller sağ altta yukarıda — çakışma yok */}
      <div className="pointer-events-none absolute bottom-8 right-3 z-[500] flex flex-col items-end gap-2">
        <div className="pointer-events-auto flex overflow-hidden rounded-xl border border-white/80 bg-white/95 shadow-lg shadow-stone-900/10 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Yakınlaştır"
            data-testid="tour-route-map-zoom-in"
            onClick={() => mapInstance?.zoomIn()}
            className="flex h-9 w-9 items-center justify-center text-lg font-semibold text-stone-800 transition hover:bg-orange-50"
          >
            +
          </button>
          <span className="w-px self-stretch bg-stone-200" aria-hidden />
          <button
            type="button"
            aria-label="Uzaklaştır"
            data-testid="tour-route-map-zoom-out"
            onClick={() => mapInstance?.zoomOut()}
            className="flex h-9 w-9 items-center justify-center text-lg font-semibold text-stone-800 transition hover:bg-orange-50"
          >
            −
          </button>
        </div>
        <button
          type="button"
          data-testid="tour-route-map-fit"
          onClick={handleFitRoute}
          className="pointer-events-auto rounded-xl border border-white/80 bg-white/95 px-3 py-2 text-xs font-semibold text-stone-800 shadow-lg shadow-stone-900/10 backdrop-blur-sm transition hover:bg-orange-50"
        >
          Rotaya Odaklan
        </button>
      </div>
    </div>
  );
}
