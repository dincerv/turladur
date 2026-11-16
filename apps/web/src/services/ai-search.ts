import type { AiSearchResponse } from '@turta/shared-types';
import {
  parseAiSearchPrompt,
  sanitizeAiSearchPrompt,
} from '@turta/shared-validators';

import { apiRequest } from './api-client';

export async function askTurtaAiSearch(
  prompt: string,
  signal?: AbortSignal,
): Promise<AiSearchResponse> {
  const body = parseAiSearchPrompt({
    prompt: sanitizeAiSearchPrompt(prompt),
  });
  return apiRequest<AiSearchResponse>('/catalog/tours/ai-search', {
    method: 'POST',
    body,
    signal,
    cache: 'no-store',
  });
}
