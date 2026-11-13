'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';

import 'leaflet/dist/leaflet.css';

import { COMPANY } from '@/lib/company';

const OFFICE: [number, number] = [COMPANY.lat, COMPANY.lng];
const DEFAULT_ZOOM = 16;

function createOfficePinIcon() {
  return L.divIcon({
    className: 'contact-map-pin',
    html: `<span class="contact-map-pin__dot" aria-hidden="true"></span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
}

function Recenter() {
  const map = useMap();
  useEffect(() => {
    map.setView(OFFICE, DEFAULT_ZOOM);
  }, [map]);
  return null;
}

/** Wheel zoom only after the user engages with the map. */
function MapInteractionGuard() {
  const map = useMap();

  useEffect(() => {
    map.scrollWheelZoom.disable();
    const container = map.getContainer();

    const enable = () => map.scrollWheelZoom.enable();
    const disable = () => map.scrollWheelZoom.disable();

    container.addEventListener('click', enable);
    container.addEventListener('focus', enable);
    container.addEventListener('mouseleave', disable);
    container.addEventListener('blur', disable);

    return () => {
      container.removeEventListener('click', enable);
      container.removeEventListener('focus', enable);
      container.removeEventListener('mouseleave', disable);
      container.removeEventListener('blur', disable);
    };
  }, [map]);

  return null;
}

function MapResizeSync() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    map.invalidateSize();
    return () => observer.disconnect();
  }, [map]);
  return null;
}

export default function ContactMap() {
  const icon = useMemo(() => createOfficePinIcon(), []);

  return (
    <div className="relative isolate h-full min-h-[280px] w-full overflow-hidden rounded-xl border border-neutral-200/80 bg-neutral-100 shadow-md">
      <MapContainer
        center={OFFICE}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={false}
        className="contact-map h-full w-full"
        style={{ height: '100%', width: '100%' }}
        aria-label="turta Ankara ofis konumu"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter />
        <MapResizeSync />
        <MapInteractionGuard />
        <Marker
          position={OFFICE}
          icon={icon}
          title={`${COMPANY.brand} — ${COMPANY.venue}`}
          alt={`${COMPANY.brand} ofis konumu`}
        />
      </MapContainer>
    </div>
  );
}
