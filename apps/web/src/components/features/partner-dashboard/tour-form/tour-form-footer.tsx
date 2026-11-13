'use client';

import { useTourFormUi } from './tour-form-context';

/** Split from tour-form.tsx (Faz 7) — form footer actions; UI unchanged. */
export function TourFormFooter() {
  const {
    step,
    setStep,
    isSubmitting,
    isUploadingImages,
    isUpdateMode,
    validateForm,
  } = useTourFormUi();

  return (
    <div className="flex justify-between pt-4" data-testid="tour-form-footer">
      <button
        type="button"
        data-testid="tour-form-cancel-btn"
        onClick={() => window.history.back()}
        disabled={isSubmitting || isUploadingImages}
        className="px-5 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
      >
        İptal
      </button>

      <div className="flex gap-4">
        {step === 'basic' ? (
          <button
            type="button"
            data-testid="step-1-next-btn"
            onClick={async () => {
              const isValid = await validateForm();
              if (isValid) {
                window.scrollTo(0, 0);
                setStep('details');
              }
            }}
            disabled={isSubmitting || isUploadingImages}
            className="px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            Devam Et
          </button>
        ) : (
          <>
            <button
              type="button"
              data-testid="step-2-back-btn"
              onClick={() => {
                window.scrollTo(0, 0);
                setStep('basic');
              }}
              disabled={isSubmitting || isUploadingImages}
              className="px-5 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Geri Dön
            </button>
            <button
              type="submit"
              data-testid="submit-tour-btn"
              disabled={isSubmitting || isUploadingImages}
              aria-busy={isSubmitting || isUploadingImages}
              className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Kaydediliyor...
                </>
              ) : isUpdateMode ? (
                'Değişiklikleri Kaydet'
              ) : (
                'Turu Oluştur'
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
