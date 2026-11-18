'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import {
  PHONE_COUNTRIES,
  clampLocalPhoneDigits,
  formatLocalPhoneDisplay,
  getPhoneCountry,
  type PhoneCountry,
} from '@/lib/phone-rules';

export type CountryOption = PhoneCountry;
export const COUNTRY_OPTIONS: CountryOption[] = PHONE_COUNTRIES;

interface PhoneInputProps {
  countryCode: string;
  onCountryCodeChange: (dial: string) => void;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  label?: string;
  className?: string;
  /** Compact height for denser auth forms */
  size?: 'default' | 'compact';
  /** sky = müşteri kayıt; neutral = acente siyah-beyaz */
  tone?: 'sky' | 'neutral';
}

export function formatFullPhone(
  countryCode: string,
  localNumber: string,
): string {
  const digits = localNumber.replace(/\D/g, '');
  if (!digits) return '';
  return `${countryCode}${digits}`;
}

export function parsePhoneValue(
  fullPhone: string,
  defaultDial = '+90',
): { countryCode: string; localNumber: string } {
  const trimmed = fullPhone.trim();
  if (!trimmed) {
    return { countryCode: defaultDial, localNumber: '' };
  }

  const matched = COUNTRY_OPTIONS.find((c) => trimmed.startsWith(c.dial));
  if (matched) {
    const local = clampLocalPhoneDigits(
      matched.dial,
      trimmed.slice(matched.dial.length),
    );
    return { countryCode: matched.dial, localNumber: local };
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('90') && digits.length > 10) {
    return {
      countryCode: '+90',
      localNumber: clampLocalPhoneDigits('+90', digits.slice(2)),
    };
  }

  return {
    countryCode: defaultDial,
    localNumber: clampLocalPhoneDigits(defaultDial, digits),
  };
}

export function PhoneInput({
  countryCode,
  onCountryCodeChange,
  value,
  onChange,
  error,
  required,
  label = 'Telefon',
  className,
  size = 'default',
  tone = 'sky',
}: PhoneInputProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isCompact = size === 'compact';
  const isNeutral = tone === 'neutral';

  const selectedCountry = getPhoneCountry(countryCode);
  const digits = value.replace(/\D/g, '');
  const displayValue = formatLocalPhoneDisplay(countryCode, digits);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocalChange = (raw: string) => {
    onChange(clampLocalPhoneDigits(countryCode, raw));
  };

  const handleCountrySelect = (dial: string) => {
    onCountryCodeChange(dial);
    const clamped = clampLocalPhoneDigits(dial, value);
    if (clamped !== digits) {
      onChange(clamped);
    }
    setDropdownOpen(false);
  };

  return (
    <div className={className}>
      <label
        className={`block font-medium text-neutral-700 ${
          isCompact ? 'mb-1 text-xs' : 'mb-1.5 text-sm'
        }`}
      >
        {label}
        {required ? (
          <span className="ml-0.5 text-red-500" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      <div
        ref={containerRef}
        className={`flex rounded-lg border ${
          error ? 'border-red-300' : 'border-neutral-300'
        } ${
          isNeutral
            ? 'focus-within:border-neutral-950 focus-within:ring-1 focus-within:ring-neutral-300'
            : 'focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500'
        }`}
      >
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setDropdownOpen((open) => !open)}
            className={`flex h-full items-center gap-1.5 rounded-l-lg border-r border-neutral-300 bg-neutral-50 text-sm transition-colors hover:bg-neutral-100 ${
              isCompact ? 'px-2.5 py-2' : 'px-3 py-2.5'
            }`}
            aria-label="Ülke kodu seç"
            aria-expanded={dropdownOpen}
          >
            <span className="text-base leading-none" aria-hidden="true">
              {selectedCountry.flag}
            </span>
            <span className="font-medium text-neutral-700">
              {selectedCountry.dial}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 text-neutral-400 transition-transform ${
                dropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {dropdownOpen ? (
            <div className="absolute left-0 top-full z-50 mt-1 max-h-60 w-56 overflow-y-auto rounded-lg border border-neutral-200 bg-white shadow-lg">
              {COUNTRY_OPTIONS.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleCountrySelect(country.dial)}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                    isNeutral ? 'hover:bg-neutral-100' : 'hover:bg-sky-50'
                  } ${
                    country.dial === countryCode
                      ? isNeutral
                        ? 'bg-neutral-100 text-neutral-950'
                        : 'bg-sky-50/60 text-sky-800'
                      : 'text-neutral-700'
                  }`}
                >
                  <span className="text-base leading-none" aria-hidden="true">
                    {country.flag}
                  </span>
                  <span className="flex-1 truncate">{country.name}</span>
                  <span className="text-xs text-neutral-500">
                    {country.dial}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <input
          type="tel"
          data-testid="phone-local-input"
          value={displayValue}
          onChange={(e) => handleLocalChange(e.target.value)}
          className={`flex-1 rounded-r-lg border-0 text-sm text-neutral-900 placeholder-neutral-400 focus:ring-0 ${
            isCompact ? 'px-3 py-2' : 'px-4 py-2.5'
          }`}
          placeholder={selectedCountry.placeholder}
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={
            selectedCountry.maxDigits + selectedCountry.formatGroups.length - 1
          }
        />
      </div>
      {error ? (
        <p className={`mt-1 text-red-600 ${isCompact ? 'text-xs' : 'text-sm'}`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
