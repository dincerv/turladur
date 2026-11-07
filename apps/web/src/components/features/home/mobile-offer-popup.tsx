'use client';

import { useEffect, useId, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X } from 'lucide-react';

const STORAGE_KEY = 'turta_mobile_offer_dismissed';

export function MobileOfferPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [animationClass, setAnimationClass] = useState('');
  const titleId = useId();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth >= 768) return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
      setAnimationClass('animate-in');
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePopup();
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isVisible]);

  const closePopup = () => {
    setAnimationClass('animate-out');
    setTimeout(() => {
      setIsVisible(false);
      try {
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
      } catch {
        /* private mode */
      }
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${animationClass}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={closePopup}
        aria-label="Kapat"
      />

      <div className="relative w-full max-w-xs overflow-hidden rounded-xl bg-white shadow-2xl">
        <button
          type="button"
          onClick={closePopup}
          className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-neutral-700 transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950"
          aria-label="Kapat"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative h-40 w-full">
          <Image
            src="https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?q=80&w=1925"
            alt=""
            fill
            sizes="320px"
            className="object-cover"
          />
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent p-4">
            <h3
              id={titleId}
              className="text-xl font-bold break-words text-white"
            >
              Turları keşfedin
            </h3>
            <p className="text-sm text-white/90">
              Onaylı acentelerin turlarını inceleyin.
            </p>
          </div>
        </div>

        <div className="space-y-2 p-4">
          <Link
            href="/tours"
            onClick={closePopup}
            className="block w-full rounded-lg bg-neutral-950 px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
          >
            Turları Görüntüle
          </Link>
          <Link
            href="/register"
            onClick={closePopup}
            className="block w-full rounded-lg border border-neutral-200 bg-white px-4 py-3 text-center text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
          >
            Ücretsiz Üye Ol
          </Link>
        </div>
      </div>
    </div>
  );
}

export default MobileOfferPopup;
