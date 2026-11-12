import type {
  ActivityDate,
  Experience,
  ExperienceDetail,
} from '@turta/shared-types';

import { apiRequest, apiRequestWithMeta } from './api-client';

export type ExperienceSearchParams = {
  q?: string;
  category?: string;
  location?: string;
  page?: number;
  limit?: number;
};

export async function searchExperiences(params: ExperienceSearchParams = {}) {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.category) query.set('category', params.category);
  if (params.location) query.set('location', params.location);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));

  const qs = query.toString();
  return apiRequestWithMeta<Experience[]>(
    `/catalog/experiences${qs ? `?${qs}` : ''}`,
    { next: { revalidate: 60 } },
  );
}

export async function getExperienceById(id: string) {
  return apiRequest<ExperienceDetail>(
    `/catalog/experiences/${encodeURIComponent(id)}`,
    { next: { revalidate: 60 } },
  );
}

export async function getExperienceDates(experienceId: string) {
  return apiRequest<ActivityDate[]>(
    `/catalog/experiences/${encodeURIComponent(experienceId)}/dates`,
    { next: { revalidate: 30 } },
  );
}
