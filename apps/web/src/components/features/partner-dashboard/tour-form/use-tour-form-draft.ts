'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { TourFormData } from './tour-form.types';

const DRAFT_KEY = 'turta:acente:tour-create-draft:v1';
const SAVE_DEBOUNCE_MS = 800;

type DraftPayload = {
  updatedAt: string;
  step: 'basic' | 'details';
  /** Serializable subset — File blobs are dropped; uploaded URLs kept. */
  formData: Partial<TourFormData>;
};

function stripFiles(data: Partial<TourFormData>): Partial<TourFormData> {
  return {
    ...data,
    images: (data.images ?? [])
      .filter((img) => img?.url && !img.url.startsWith('blob:'))
      .map((img) => ({ url: img.url, file: null, preview: img.url })),
    mainImage:
      data.mainImage?.url && !data.mainImage.url.startsWith('blob:')
        ? {
            url: data.mainImage.url,
            file: null,
            preview: data.mainImage.url,
          }
        : null,
    galleryImages: (data.galleryImages ?? [])
      .filter((img) => img?.url && !img.url.startsWith('blob:'))
      .map((img) => ({
        url: img.url,
        file: null,
        preview: img.url,
        description: img.description,
      })),
    itinerary: (data.itinerary ?? []).map((day) => ({
      ...day,
      images: (day.images ?? [])
        .filter((img) => img?.url && !img.url.startsWith('blob:'))
        .map((img) => ({ url: img.url, file: null })),
    })),
  };
}

export function readTourCreateDraft(): DraftPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftPayload;
    if (!parsed?.formData || !parsed.updatedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearTourCreateDraft() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(DRAFT_KEY);
}

export function useTourFormDraft(opts: {
  enabled?: boolean;
  step: 'basic' | 'details';
  formData: Partial<TourFormData>;
}) {
  const { enabled = true, step, formData } = opts;
  const [restoredAt, setRestoredAt] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydrated = useRef(false);

  const persist = useCallback(() => {
    if (!enabled || typeof window === 'undefined') return;
    const payload: DraftPayload = {
      updatedAt: new Date().toISOString(),
      step,
      formData: stripFiles(formData),
    };
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
    } catch {
      // Quota / private mode — ignore.
    }
  }, [enabled, formData, step]);

  useEffect(() => {
    if (!enabled || hydrated.current) return;
    hydrated.current = true;
    const existing = readTourCreateDraft();
    if (existing?.updatedAt) setRestoredAt(existing.updatedAt);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(persist, SAVE_DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [enabled, persist]);

  return {
    restoredAt,
    persistNow: persist,
    clear: clearTourCreateDraft,
    read: readTourCreateDraft,
  };
}
