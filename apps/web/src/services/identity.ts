import type { User } from '@turta/shared-types';

import { apiRequest } from './api-client';

export type AuthTokens = {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
  user: User;
};

export type UpdateProfileInput = {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  identityNumber?: string | null;
  birthDate?: string | null;
  address?: string | null;
  billingLine1?: string | null;
  billingLine2?: string | null;
  billingCity?: string | null;
  billingState?: string | null;
  billingPostalCode?: string | null;
  billingCountry?: string | null;
};

export async function registerUser(input: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  identityNumber: string;
  address: string;
  otpCode: string;
}) {
  return apiRequest<AuthTokens>('/identity/register', {
    method: 'POST',
    body: input,
  });
}

export type OtpPurpose = 'CHECKOUT' | 'REGISTER' | 'PASSWORD_RESET';

export type SendOtpResult = {
  email: string;
  purpose: OtpPurpose;
  expiresInSeconds: number;
  resendCooldownSeconds: number;
  debugCode?: string;
};

export async function sendEmailOtp(input: {
  email: string;
  purpose: OtpPurpose;
  firstName?: string;
}) {
  return apiRequest<SendOtpResult>('/identity/otp/send', {
    method: 'POST',
    body: input,
  });
}

export async function verifyEmailOtp(input: {
  email: string;
  purpose: OtpPurpose;
  code: string;
}) {
  return apiRequest<{ verified: boolean; email: string; purpose: OtpPurpose }>(
    '/identity/otp/verify',
    {
      method: 'POST',
      body: input,
    },
  );
}

export async function resetPasswordWithOtp(input: {
  email: string;
  code: string;
  newPassword: string;
}) {
  return apiRequest<{ reset: boolean }>('/identity/password/reset', {
    method: 'POST',
    body: input,
  });
}

export async function loginUser(input: { email: string; password: string }) {
  return apiRequest<AuthTokens>('/identity/login', {
    method: 'POST',
    body: input,
  });
}

export type AgencyStaffLoginResult = {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
  staff: {
    id: string;
    agencyId: string;
    email: string;
    name: string;
    role: string;
    permissions?: unknown;
  };
};

export async function loginAgencyStaff(input: {
  email: string;
  password: string;
}) {
  return apiRequest<AgencyStaffLoginResult>('/identity/agency-staff/login', {
    method: 'POST',
    body: input,
  });
}

export type GuideLoginResult = {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
  guide: {
    id: string;
    email: string;
    firstName: string;
    lastName: string | null;
    status: string;
  };
};

export async function loginGuide(input: { email: string; password: string }) {
  return apiRequest<GuideLoginResult>('/identity/guides/login', {
    method: 'POST',
    body: input,
  });
}

export type GuideProfile = {
  id: string;
  identityNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  birthDate: string | null;
  status: string;
  languages: string[];
  oda: string | null;
  sicilNo: string | null;
  ruhsatNo: string | null;
  ruhsatExpiresAt: string | null;
  bio: string | null;
  photoUrl: string | null;
  city: string | null;
  verifiedAt: string | null;
  createdAt: string;
};

export type RegisterGuideInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  identityNumber: string;
  languages: string[];
  oda: string;
  sicilNo: string;
  ruhsatNo: string;
  ruhsatExpiresAt: string;
  birthDate?: string;
  phone?: string;
  city?: string;
};

export async function registerGuide(input: RegisterGuideInput) {
  return apiRequest<GuideLoginResult & { guide: GuideProfile }>(
    '/identity/guides/register',
    { method: 'POST', body: input },
  );
}

export type GuideDashboardSummary = {
  status: string;
  verifiedAt: string | null;
  canReceiveAssignments: boolean;
  pendingAssignments: number;
  acceptedUpcoming: number;
  availableDaysNext30: number;
  firstName: string;
  lastName: string;
  email: string;
};

export async function getGuideDashboard(token: string) {
  return apiRequest<GuideDashboardSummary>('/identity/guides/me/dashboard', {
    token,
  });
}

export async function getGuideProfile(token: string) {
  return apiRequest<GuideProfile>('/identity/guides/me', { token });
}

export async function updateGuideProfile(
  token: string,
  body: Partial<RegisterGuideInput> & { bio?: string | null },
) {
  return apiRequest<GuideProfile>('/identity/guides/me', {
    method: 'PATCH',
    body,
    token,
  });
}

export type BusCompanyLoginResult = {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
  busCompany: {
    id: string;
    companyName: string;
    contactEmail: string;
    status: string;
  };
};

export async function loginBusCompany(input: {
  email: string;
  password: string;
}) {
  return apiRequest<BusCompanyLoginResult>('/identity/bus-companies/login', {
    method: 'POST',
    body: input,
  });
}

export type BusDashboardSummary = {
  status: string;
  verifiedAt: string | null;
  companyName: string;
  contactEmail: string;
  vehicleCount: number;
  activeVehicleCount: number;
  pendingAssignments: number;
  acceptedUpcoming: number;
  fleetUtilizationPercent: number;
};

export async function getBusDashboard(token: string) {
  return apiRequest<BusDashboardSummary>(
    '/identity/bus-companies/me/dashboard',
    { token },
  );
}

export type SessionProbe =
  | { authenticated: false }
  | {
      authenticated: true;
      role: string;
      actorType: string;
      userId: string;
      partnerId?: string;
      agencyId?: string;
      agencyStaffId?: string;
      email?: string;
      name?: string;
      permissions?: unknown;
    };

/** Cookie-based session probe (no refresh rotate). */
export async function probeSession() {
  return apiRequest<SessionProbe>('/identity/session', {
    method: 'GET',
    skipAuthRefresh: true,
  });
}

export async function logoutSession() {
  return apiRequest<{ loggedOut: boolean }>('/identity/logout', {
    method: 'POST',
    skipAuthRefresh: true,
  });
}

export async function getProfile(token: string) {
  return apiRequest<User>('/identity/profile', { token });
}

export async function updateProfile(input: UpdateProfileInput, token: string) {
  return apiRequest<User>('/identity/profile', {
    method: 'PATCH',
    body: input,
    token,
  });
}

export async function changePassword(
  input: { currentPassword: string; newPassword: string },
  token: string,
) {
  return apiRequest<{ updated: boolean }>('/identity/profile/password', {
    method: 'POST',
    body: input,
    token,
  });
}

export type GuestBootstrapInput = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  billingLine1: string;
  billingCity: string;
  billingCountry?: string;
  identityNumber: string;
};

export async function guestBootstrap(input: GuestBootstrapInput) {
  return apiRequest<AuthTokens>('/identity/guest-bootstrap', {
    method: 'POST',
    body: input,
  });
}

export type RegisterPartnerInput = {
  companyName: string;
  contactEmail: string;
  contactPhone?: string;
  password: string;
  taxNumber?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
};

export type RegisterPartnerResult = {
  partner: {
    id: string;
    companyName: string;
    status: string;
    contactEmail: string;
  };
  user?: {
    id: string;
    email: string;
    role: string;
  };
  message?: string;
};

export async function registerPartner(input: RegisterPartnerInput) {
  return apiRequest<RegisterPartnerResult>('/identity/partners/register', {
    method: 'POST',
    body: input,
  });
}

export async function verifyPartner(token: string) {
  return apiRequest<{
    id: string;
    status: string;
    companyName?: string;
    contactEmail?: string;
  }>('/identity/partners/verify', {
    method: 'POST',
    body: { token },
  });
}
