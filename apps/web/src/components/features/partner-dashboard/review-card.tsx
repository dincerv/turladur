'use client';

import { Calendar, Flag, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import {
  CATEGORY_RATING_KEYS,
  CATEGORY_RATING_LABELS,
  CategoryRatingKey,
} from '@/lib/reviews/client';
import {
  PartnerReviewCategoryFeedbackByRatingKey,
  PartnerReviewCategoryRatings,
} from '@/lib/partner/reviews/client';

export interface ReviewCardProps {
  id: string;
  customerName: string;
  customerImage?: string;
  tourName: string;
  tourId: string;
  productType?: 'tour' | 'experience';
  rating: number;
  categoryRatings?: PartnerReviewCategoryRatings;
  categoryFeedback?: PartnerReviewCategoryFeedbackByRatingKey;
  reviewDate: string;
  reviewText: string;
  isResponded: boolean;
  responseText?: string;
  onReplySuccess?: (reviewId: string, responseText: string) => void;
  onReply?: (reviewId: string, responseText: string) => Promise<void>;
}

function CategoryRatingRow({
  label,
  value,
  feedback,
}: {
  label: string;
  value: number;
  feedback?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-gray-600 shrink-0">{label}</span>
        <div className="flex items-center gap-1.5">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-3.5 h-3.5 ${i < value ? 'text-yellow-400' : 'text-gray-200'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-xs font-medium text-gray-700 w-4 text-right">
            {value}
          </span>
        </div>
      </div>
      {value < 3 && feedback && (
        <p className="mt-1 ml-1 pl-2.5 text-xs text-gray-600 border-l-2 border-amber-200 leading-relaxed">
          {feedback}
        </p>
      )}
    </div>
  );
}

function resolveCategoryValue(
  ratings: PartnerReviewCategoryRatings | undefined,
  key: CategoryRatingKey,
  fallback: number,
): number {
  return ratings?.[key] ?? fallback;
}

export function ReviewCard({
  id,
  customerName,
  customerImage,
  tourName,
  tourId,
  productType = 'tour',
  rating,
  categoryRatings,
  categoryFeedback,
  reviewDate,
  reviewText,
  isResponded,
  responseText,
  onReplySuccess,
  onReply,
}: ReviewCardProps) {
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [response, setResponse] = useState(responseText || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localIsResponded, setLocalIsResponded] = useState(isResponded);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const initials = customerName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (onReply) {
        await onReply(id, response);
      }
      setLocalIsResponded(true);
      setShowResponseForm(false);
      onReplySuccess?.(id, response);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Yanıt gönderilemedi',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md"
      data-testid={`review-card-${id}`}
      data-rating={rating}
    >
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {customerImage ? (
                <div className="h-10 w-10 rounded-full overflow-hidden relative">
                  <Image
                    src={customerImage}
                    alt={customerName}
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                  {initials}
                </div>
              )}
            </div>
            <div className="ml-3">
              <h3
                className="text-base font-semibold text-gray-900"
                data-testid="review-customer-name"
              >
                {customerName}
              </h3>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 text-gray-400 mr-1.5" />
                <span>{reviewDate}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <span
              className={`mr-3 px-2 py-0.5 text-xs font-medium rounded-full ${
                localIsResponded
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {localIsResponded ? 'Yanıtlandı' : 'Yanıt bekliyor'}
            </span>
            <div className="flex mr-2">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
          </div>
        </div>

        <div className="mt-3">
          <a
            href={
              productType === 'experience'
                ? `/acente/experiences/${tourId}/edit`
                : `/acente/tours/${tourId}/edit`
            }
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            {tourName}
          </a>

          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Kategori Puanları
            </p>
            {CATEGORY_RATING_KEYS.map((key: CategoryRatingKey) => (
              <CategoryRatingRow
                key={key}
                label={CATEGORY_RATING_LABELS[key]}
                value={resolveCategoryValue(categoryRatings, key, rating)}
                feedback={categoryFeedback?.[key]}
              />
            ))}
          </div>

          {reviewText && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Genel Değerlendirme
              </p>
              <p className="text-sm text-gray-700">{reviewText}</p>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          {localIsResponded ? (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-500 mr-1.5" />
                <span className="text-sm font-medium text-gray-900">
                  Yanıtınız:
                </span>
              </div>
              <p className="text-sm text-gray-700">{response}</p>
            </div>
          ) : showResponseForm ? (
            <form onSubmit={handleSubmitResponse}>
              {submitError && (
                <p className="mb-2 text-sm text-red-600">{submitError}</p>
              )}
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                rows={3}
                placeholder="Değerlendirmeye yanıt verin..."
                required
              />
              <div className="mt-3 flex justify-end space-x-3">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => setShowResponseForm(false)}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {isSubmitting ? 'Gönderiliyor...' : 'Yanıtla'}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex justify-between">
              <button
                onClick={() => setShowResponseForm(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Yanıtla
              </button>
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none">
                <Flag className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReviewCard;
