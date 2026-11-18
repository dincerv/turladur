'use client';

export function SettingsToast({
  message,
  variant,
}: {
  message: string | null;
  variant: 'success' | 'error';
}) {
  if (!message) return null;
  return (
    <p
      role="status"
      data-testid="settings-toast"
      data-variant={variant}
      className={`mb-4 rounded-md px-3 py-2 text-sm ${
        variant === 'success'
          ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border border-red-200 bg-red-50 text-red-700'
      }`}
    >
      {message}
    </p>
  );
}
