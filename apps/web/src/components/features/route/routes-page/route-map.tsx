'use client';

import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L, {
  type DivIcon,
  type LeafletEventHandlerFnMap,
  type Map as LeafletMap,
  type PathOptions,
  type PointExpression,
} from 'leaflet';
import { ArrowRight, List } from 'lucide-react';

import 'leaflet/dist/leaflet.css';

import { RouteMetaBadges } from './route-meta-badges';
import { useRouteSelection } from './route-selection-context';
import {
  collectPathPoints,
  TURKEY_CENTER,
  TURKEY_ZOOM,
} from './routes-explorer.helpers';
import type {
  RouteListItem,
  RouteSelectionSource,
} from './routes-explorer.types';

const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const customTileUrl = process.env.NEXT_PUBLIC_MAP_TILE_URL?.trim();
const customAttribution = process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION?.trim();

/**
 * Tile keys are always public in the browser; quota safety comes from
 * restricting the key to our domains at the tile provider, not from hiding it.
 * Leaflet renders attribution as HTML, so the env value is escaped.
 */
const TILE_URL =
  customTileUrl && /^https:\/\//i.test(customTileUrl)
    ? customTileUrl
    : OSM_TILE_URL;
const TILE_ATTRIBUTION =
  TILE_URL === OSM_TILE_URL
    ? OSM_ATTRIBUTION
    : escapeHtml(customAttribution || 'Harita verileri');

const FIT_PADDING: PointExpression = [32, 32];
const MAX_FIT_ZOOM = 13;
const MAX_POPUP_STOPS = 5;

const IDLE_LINE: PathOptions = {
  color: '#737373',
  weight: 3,
  opacity: 0.5,
  dashArray: '6 6',
};
const HOVER_LINE: PathOptions = { color: '#404040', weight: 4, opacity: 0.8 };
const SELECTED_LINE: PathOptions = {
  color: '#0a0a0a',
  weight: 5,
  opacity: 0.9,
};
const STOP_DOT: PathOptions = {
  color: '#ffffff',
  weight: 2,
  fillColor: '#0a0a0a',
  fillOpacity: 1,
};

function createPinIcon(state: 'default' | 'active'): DivIcon {
  const size = state === 'active' ? 34 : 26;
  return L.divIcon({
    className: 'route-map-pin',
    html: `<span class="route-map-pin__dot route-map-pin__dot--${state}" aria-hidden="true"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
    tooltipAnchor: [0, -size],
  });
}

function MapViewport({
  items,
  selectedItem,
  source,
  onPopupChange,
}: {
  items: RouteListItem[];
  selectedItem: RouteListItem | null;
  source: RouteSelectionSource | null;
  onPopupChange: (id: string | null) => void;
}) {
  const map = useMap();
  const itemsKey = useMemo(
    () => items.map((item) => item.id).join('|'),
    [items],
  );
  const allPoints = useMemo(() => collectPathPoints(items), [items]);
  const fittedKey = useRef<string | null>(null);

  useEffect(
    () =>
      whenMapSized(map, () => {
        if (fittedKey.current === itemsKey) return;
        fittedKey.current = itemsKey;
        if (allPoints.length === 0) {
          map.setView(TURKEY_CENTER, TURKEY_ZOOM);
          return;
        }
        map.fitBounds(L.latLngBounds(allPoints), {
          padding: FIT_PADDING,
          maxZoom: MAX_FIT_ZOOM,
        });
      }),
    [map, itemsKey, allPoints],
  );

  useEffect(() => {
    onPopupChange(null);
    if (!selectedItem || selectedItem.path.length === 0) return;
    const path = selectedItem.path;
    const targetId = selectedItem.id;

    return whenMapSized(map, () => {
      const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      let settled = false;
      // The popup opens only after the camera settles; otherwise the fly
      // animation pushes it outside the clipped map frame.
      const settle = () => {
        if (settled) return;
        settled = true;
        if (source === 'map') onPopupChange(targetId);
      };
      map.once('moveend', settle);
      const fallback = window.setTimeout(settle, reduceMotion ? 50 : 1200);
      map.flyToBounds(L.latLngBounds(path), {
        padding: FIT_PADDING,
        maxZoom: MAX_FIT_ZOOM,
        animate: !reduceMotion,
        duration: 0.8,
      });
      return () => {
        settled = true;
        map.off('moveend', settle);
        window.clearTimeout(fallback);
      };
    });
  }, [map, selectedItem, source, onPopupChange]);

  return null;
}

/**
 * Runs camera moves only once the map has a real size: a container hidden with
 * `display:none` (mobile list tab) reports 0×0 and would compute a wrong view.
 */
function whenMapSized(
  map: LeafletMap,
  run: () => (() => void) | void,
): () => void {
  let cleanup: (() => void) | void;
  const hasSize = () => {
    const size = map.getSize();
    return size.x > 0 && size.y > 0;
  };
  if (hasSize()) {
    cleanup = run();
    return () => cleanup?.();
  }
  const onResize = () => {
    if (!hasSize()) return;
    map.off('resize', onResize);
    cleanup = run();
  };
  map.on('resize', onResize);
  return () => {
    map.off('resize', onResize);
    cleanup?.();
  };
}

/** Keeps tiles correct when the container is resized or shown from `display:none`. */
function MapResizeSync() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
  return null;
}

/** Wheel zoom only after the user engages with the map, so page scroll isn't hijacked. */
function MapInteractionGuard({
  onBackgroundClick,
}: {
  onBackgroundClick: () => void;
}) {
  const map = useMapEvents({
    click() {
      map.scrollWheelZoom.enable();
      onBackgroundClick();
    },
    mouseout() {
      map.scrollWheelZoom.disable();
    },
  });

  useEffect(() => {
    const container = map.getContainer();
    const enable = () => map.scrollWheelZoom.enable();
    const disable = () => map.scrollWheelZoom.disable();
    container.addEventListener('focus', enable);
    container.addEventListener('blur', disable);
    return () => {
      container.removeEventListener('focus', enable);
      container.removeEventListener('blur', disable);
    };
  }, [map]);

  return null;
}

function RoutePopupContent({
  item,
  onShowInList,
}: {
  item: RouteListItem;
  onShowInList?: (id: string) => void;
}) {
  const visibleStops = item.stops.slice(0, MAX_POPUP_STOPS);
  const hiddenStops = item.stops.length - visibleStops.length;

  return (
    <div className="w-full min-w-0 space-y-2.5 font-sans">
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
          {item.categoryLabel}
        </p>
        <p className="line-clamp-2 break-words text-sm font-semibold leading-snug text-neutral-950">
          {item.name}
        </p>
        {item.location ? (
          <p className="truncate text-xs text-neutral-500">{item.location}</p>
        ) : null}
      </div>

      <RouteMetaBadges item={item} size="xs" />

      {visibleStops.length > 0 ? (
        <ol className="space-y-1 border-l border-neutral-200 pl-3 text-xs text-neutral-700">
          {visibleStops.map((stop, index) => (
            <li key={`${stop.name}-${index}`} className="truncate">
              <span className="mr-1 font-semibold text-neutral-950">
                {index + 1}.
              </span>
              {stop.name}
            </li>
          ))}
          {hiddenStops > 0 ? (
            <li className="text-neutral-500">+{hiddenStops} durak daha</li>
          ) : null}
        </ol>
      ) : null}

      <div className="flex items-center gap-2 pt-0.5">
        <Link
          href={item.href}
          className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-neutral-950 px-3 text-xs font-semibold !text-white transition hover:bg-neutral-800"
        >
          Rotayı incele
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        {onShowInList ? (
          <button
            type="button"
            onClick={() => onShowInList(item.id)}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-neutral-200 px-2.5 text-xs font-semibold text-neutral-800 transition hover:border-neutral-950 lg:hidden"
          >
            <List className="h-3.5 w-3.5" aria-hidden />
            Listede gör
          </button>
        ) : null}
      </div>
    </div>
  );
}

type RouteMapProps = {
  items: RouteListItem[];
  onShowInList?: (id: string) => void;
};

function RouteMapBase({ items, onShowInList }: RouteMapProps) {
  const { selectedId, hoveredId, source, select, hover } = useRouteSelection();
  const icons = useMemo(
    () => ({
      default: createPinIcon('default'),
      active: createPinIcon('active'),
    }),
    [],
  );
  const mappable = useMemo(
    () => items.filter((item) => item.path.length > 0),
    [items],
  );
  const selectedItem = useMemo(
    () => mappable.find((item) => item.id === selectedId) ?? null,
    [mappable, selectedId],
  );
  const hoveredItem = useMemo(
    () =>
      hoveredId && hoveredId !== selectedId
        ? (mappable.find((item) => item.id === hoveredId) ?? null)
        : null,
    [mappable, hoveredId, selectedId],
  );
  const highlightedItems = useMemo(
    () =>
      [
        hoveredItem ? { item: hoveredItem, tone: 'hover' as const } : null,
        selectedItem ? { item: selectedItem, tone: 'selected' as const } : null,
      ].filter((entry) => entry !== null),
    [hoveredItem, selectedItem],
  );
  const isHighlighted = (id: string) => id === selectedId || id === hoveredId;

  const [popupId, setPopupId] = useState<string | null>(null);
  const popupItem =
    popupId && selectedItem?.id === popupId ? selectedItem : null;

  const markerHandlers = useMemo(() => {
    const handlers = new Map<string, LeafletEventHandlerFnMap>();
    for (const item of mappable) {
      handlers.set(item.id, {
        click: () => {
          if (item.id === selectedId && source === 'map') setPopupId(item.id);
          else select(item.id, 'map');
        },
        mouseover: () => hover(item.id),
        mouseout: () => hover(null),
      });
    }
    return handlers;
  }, [mappable, selectedId, source, select, hover]);

  const popupHandlers = useMemo<LeafletEventHandlerFnMap>(
    () => ({ remove: () => setPopupId(null) }),
    [],
  );

  const clearSelection = useCallback(() => select(null, 'map'), [select]);

  return (
    <div className="relative isolate h-full w-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
      <MapContainer
        center={TURKEY_CENTER}
        zoom={TURKEY_ZOOM}
        scrollWheelZoom={false}
        className="route-map h-full w-full"
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <MapViewport
          items={mappable}
          selectedItem={selectedItem}
          source={source}
          onPopupChange={setPopupId}
        />
        <MapResizeSync />
        <MapInteractionGuard onBackgroundClick={clearSelection} />

        {mappable.map((item) =>
          isHighlighted(item.id) ? null : (
            <Polyline
              key={`line-${item.id}`}
              positions={item.path}
              pathOptions={IDLE_LINE}
              bubblingMouseEvents={false}
              eventHandlers={markerHandlers.get(item.id)}
            />
          ),
        )}

        {highlightedItems.map(({ item, tone }) => (
          <Fragment key={`active-${item.id}`}>
            <Polyline
              positions={item.path}
              pathOptions={tone === 'selected' ? SELECTED_LINE : HOVER_LINE}
              bubblingMouseEvents={false}
              eventHandlers={markerHandlers.get(item.id)}
            />
            {item.stops.map((stop, index) => (
              <CircleMarker
                key={`stop-${item.id}-${index}`}
                center={[stop.latitude, stop.longitude]}
                radius={tone === 'selected' ? 6 : 5}
                pathOptions={STOP_DOT}
                bubblingMouseEvents={false}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -6]}
                  className="route-map-tooltip"
                >
                  {`${index + 1}. ${stop.name}`}
                </Tooltip>
              </CircleMarker>
            ))}
          </Fragment>
        ))}

        {mappable.map((item) => {
          const isActive = isHighlighted(item.id);
          return (
            <Marker
              key={`pin-${item.id}`}
              position={item.path[0]}
              icon={isActive ? icons.active : icons.default}
              zIndexOffset={isActive ? 1000 : 0}
              title={item.name}
              alt={`${item.name} rotası`}
              eventHandlers={markerHandlers.get(item.id)}
            />
          );
        })}

        {popupItem ? (
          <Popup
            key={`popup-${popupItem.id}`}
            position={popupItem.path[0]}
            offset={[0, -30]}
            className="route-map-popup"
            minWidth={220}
            maxWidth={260}
            autoPanPadding={[16, 16]}
            eventHandlers={popupHandlers}
          >
            <RoutePopupContent item={popupItem} onShowInList={onShowInList} />
          </Popup>
        ) : null}
      </MapContainer>

      {mappable.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 z-[500] flex items-center justify-center p-6">
          <p className="rounded-lg bg-white/95 px-4 py-2 text-sm font-medium text-neutral-700 shadow">
            Bu rotalar için harita verisi bulunmuyor.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export const RouteMap = memo(RouteMapBase);
export default RouteMap;
