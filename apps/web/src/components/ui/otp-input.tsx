'use client';

import {
  useCallback,
  useEffect,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from 'react';

const DIGIT_COUNT = 6;

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  onComplete?: (value: string) => void;
  'aria-label'?: string;
};

function onlyDigits(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, DIGIT_COUNT);
}

export function OtpInput({
  value,
  onChange,
  disabled = false,
  autoFocus = false,
  onComplete,
  'aria-label': ariaLabel = 'Doğrulama kodu',
}: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: DIGIT_COUNT }, (_, i) => value[i] ?? '');

  useEffect(() => {
    if (!autoFocus || disabled) return;
    inputsRef.current[0]?.focus();
  }, [autoFocus, disabled]);

  const emit = useCallback(
    (next: string) => {
      const cleaned = onlyDigits(next);
      onChange(cleaned);
      if (cleaned.length === DIGIT_COUNT) {
        onComplete?.(cleaned);
      }
    },
    [onChange, onComplete],
  );

  function focusIndex(index: number) {
    const clamped = Math.max(0, Math.min(DIGIT_COUNT - 1, index));
    inputsRef.current[clamped]?.focus();
    inputsRef.current[clamped]?.select();
  }

  function handleChange(index: number, raw: string) {
    if (disabled) return;
    const cleaned = onlyDigits(raw);
    if (!cleaned) {
      const next = digits.map((d, i) => (i === index ? '' : d)).join('');
      emit(next);
      return;
    }

    if (cleaned.length > 1) {
      // Mobile autofill / multi-char
      const merged = onlyDigits(
        value.slice(0, index) + cleaned + value.slice(index + 1),
      );
      emit(merged);
      focusIndex(Math.min(merged.length, DIGIT_COUNT - 1));
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = cleaned;
    const next = nextDigits.join('');
    emit(next);
    if (index < DIGIT_COUNT - 1) focusIndex(index + 1);
  }

  function handleKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (disabled) return;
    if (event.key === 'Backspace') {
      if (digits[index]) {
        const nextDigits = [...digits];
        nextDigits[index] = '';
        emit(nextDigits.join(''));
        return;
      }
      if (index > 0) {
        event.preventDefault();
        const nextDigits = [...digits];
        nextDigits[index - 1] = '';
        emit(nextDigits.join(''));
        focusIndex(index - 1);
      }
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusIndex(index - 1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusIndex(index + 1);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    if (disabled) return;
    event.preventDefault();
    const pasted = onlyDigits(event.clipboardData.getData('text'));
    if (!pasted) return;
    emit(pasted);
    focusIndex(Math.min(pasted.length, DIGIT_COUNT) - 1);
  }

  return (
    <div
      className="flex items-center justify-center gap-2 sm:gap-2.5"
      role="group"
      aria-label={ariaLabel}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-label={`${index + 1}. hane`}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className="h-12 w-10 rounded-lg border border-neutral-300 bg-white text-center text-lg font-semibold tabular-nums text-neutral-900 shadow-sm transition focus:border-neutral-950 focus:outline-none focus:ring-1 focus:ring-neutral-300 disabled:opacity-60 sm:h-14 sm:w-12"
        />
      ))}
    </div>
  );
}
