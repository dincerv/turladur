'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { searchGeoPlaces, type GeoPlaceSuggestion } from '@/services/catalog';

type PlaceSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (place: GeoPlaceSuggestion) => void;
  placeholder?: string;
  inputTestId?: string;
  disabled?: boolean;
};

export function PlaceSearchInput({
  value,
  onChange,
  onSelect,
  placeholder = 'Yer adı ara…',
  inputTestId,
  disabled,
}: PlaceSearchInputProps) {
  const listId = useId();
  const [suggestions, setSuggestions] = useState<GeoPlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const timer = window.setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      void searchGeoPlaces(query, controller.signal)
        .then((rows) => {
          if (controller.signal.aborted) return;
          setSuggestions(rows);
          setOpen(rows.length > 0);
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setSuggestions([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 320);

    return () => {
      window.clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [value]);

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        disabled={disabled}
        data-testid={inputTestId}
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={open}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 150);
        }}
        className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        placeholder={placeholder}
        autoComplete="off"
      />
      {loading ? (
        <p className="mt-1 text-xs text-neutral-500">Aranıyor…</p>
      ) : null}
      {open && suggestions.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-neutral-200 bg-white py-1 shadow-lg"
        >
          {suggestions.map((place) => (
            <li key={place.id} role="option">
              <button
                type="button"
                className="block w-full truncate px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-100"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(place);
                  setOpen(false);
                  setSuggestions([]);
                }}
              >
                {place.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
