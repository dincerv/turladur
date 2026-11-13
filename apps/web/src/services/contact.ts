import type { ContactMessagePayload } from '@turta/shared-validators';

import { apiRequest } from './api-client';

export type ContactMessageInput = Omit<ContactMessagePayload, 'website'> & {
  website?: string;
};

export async function sendContactMessage(input: ContactMessageInput) {
  return apiRequest<{ ok: boolean }>('/contact', {
    method: 'POST',
    body: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      subject: input.subject,
      message: input.message,
      website: input.website ?? '',
    },
  });
}
