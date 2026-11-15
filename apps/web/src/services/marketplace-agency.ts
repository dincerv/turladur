import { apiRequest, apiRequestWithMeta } from './api-client';

export type MarketplaceAgencyProfile = {
  id: string;
  companyName: string;
  logo: string | null;
  city: string | null;
  country: string | null;
  website: string | null;
  membershipTier: 'BRONZE' | 'SILVER' | 'GOLD' | string;
  averageRating: string;
  reviewCount: number;
  status: string;
  publishedTourCount: number;
  description: string | null;
  createdAt: string;
};

export async function searchMarketplaceAgencies(input?: {
  q?: string;
  page?: number;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (input?.q?.trim()) params.set('q', input.q.trim().slice(0, 80));
  if (input?.page && input.page > 1) params.set('page', String(input.page));
  if (input?.limit) params.set('limit', String(input.limit));
  const qs = params.toString();
  return apiRequestWithMeta<MarketplaceAgencyProfile[]>(
    `/identity/agencies${qs ? `?${qs}` : ''}`,
    { next: { revalidate: 60 } },
  );
}

export async function getMarketplaceAgencyProfile(agencyId: string) {
  return apiRequest<MarketplaceAgencyProfile>(
    `/identity/agencies/${encodeURIComponent(agencyId)}`,
    { next: { revalidate: 60 } },
  );
}
