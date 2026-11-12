'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FILTER_DEBOUNCE_MS } from './activities-page.constants';

const identity = (v: string) => v;

interface DebouncedInputOptions {
  delay?: number;
  /** Maps a draft to the value the parent will store, so echoes don't clobber typing. */
  normalize?: (value: string) => string;
}

/**
 * Local draft for a text-like input that commits after `delay` ms of idle.
 * External changes (reset, back/forward) overwrite the draft; pending edits are
 * flushed on unmount so closing the filter sheet never loses input.
 */
export function useDebouncedInput(
  externalValue: string,
  onCommit: (value: string) => void,
  {
    delay = FILTER_DEBOUNCE_MS,
    normalize = identity,
  }: DebouncedInputOptions = {},
) {
  const [draft, setDraftState] = useState(externalValue);
  const draftRef = useRef(externalValue);
  const committedRef = useRef(externalValue);
  const commitRef = useRef(onCommit);
  const normalizeRef = useRef(normalize);
  commitRef.current = onCommit;
  normalizeRef.current = normalize;

  useEffect(() => {
    if (externalValue === normalizeRef.current(committedRef.current)) return;
    committedRef.current = externalValue;
    draftRef.current = externalValue;
    setDraftState(externalValue);
  }, [externalValue]);

  const flush = useCallback(() => {
    const norm = normalizeRef.current;
    if (norm(draftRef.current) === norm(committedRef.current)) return;
    committedRef.current = draftRef.current;
    commitRef.current(draftRef.current);
  }, []);

  useEffect(() => {
    if (draft === committedRef.current) return;
    const timer = window.setTimeout(flush, delay);
    return () => window.clearTimeout(timer);
  }, [draft, delay, flush]);

  useEffect(() => flush, [flush]);

  const setDraft = useCallback((value: string) => {
    draftRef.current = value;
    setDraftState(value);
  }, []);

  return { draft, setDraft, flush } as const;
}
