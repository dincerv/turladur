import { apiRequest, apiRequestWithMeta } from './api-client';
import type {
  Review,
  TourPersonaMatchResponse,
  TourReviewCriteria,
  TourReviewSummary,
  TravelerContext,
  TravelerPersona,
} from '@turta/shared-types';
import type { CreateReviewInput } from '@turta/shared-validators';

export type ListTourReviewsParams = {
  minRating?: number;
  page?: number;
  limit?: number;
  hasPhotos?: boolean;
  travelerContext?: TravelerContext;
};

export async function listTourReviews(
  tourId: string,
  params?: ListTourReviewsParams,
) {
  const qs = new URLSearchParams();
  if (params?.minRating) qs.set('minRating', String(params.minRating));
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.hasPhotos) qs.set('hasPhotos', 'true');
  if (params?.travelerContext)
    qs.set('travelerContext', params.travelerContext);
  const q = qs.toString();
  return apiRequestWithMeta<Review[]>(
    `/review/tours/${tourId}${q ? `?${q}` : ''}`,
  );
}

export async function getTourReviewSummary(tourId: string) {
  return apiRequest<TourReviewSummary>(`/review/tours/${tourId}/summary`);
}

export async function matchTourPersona(
  tourId: string,
  body: { persona: TravelerPersona; intent?: string },
) {
  return apiRequest<TourPersonaMatchResponse>(
    `/review/tours/${tourId}/persona-match`,
    {
      method: 'POST',
      body,
    },
  );
}

export type ReviewEligibility = {
  reservationId: string | null;
  alreadyReviewed: boolean;
  criteria: TourReviewCriteria;
};

export async function getReviewEligibility(tourId: string, token: string) {
  return apiRequest<ReviewEligibility>(`/review/eligible/${tourId}`, { token });
}

export async function createReview(body: CreateReviewInput, token: string) {
  return apiRequest<Review>('/review', { method: 'POST', body, token });
}

export async function listMyReviews(token: string) {
  return apiRequest<Review[]>('/review/me', { token });
}
