import { z } from 'zod';

export const EXPERIENCE_STATUS_FILTERS = [
  'DRAFT',
  'PENDING_REVIEW',
  'PUBLISHED',
  'ARCHIVED',
] as const;

export type ExperienceStatusFilter = (typeof EXPERIENCE_STATUS_FILTERS)[number];

export const experiencesSearchSchema = z.object({
  q: z
    .string()
    .trim()
    .max(80)
    .transform((v) => v.replace(/[\u0000-\u001F\u007F]/g, ''))
    .default(''),
  status: z.enum(EXPERIENCE_STATUS_FILTERS).optional(),
  category: z
    .string()
    .trim()
    .max(120)
    .transform((v) => v.replace(/[\u0000-\u001F\u007F]/g, ''))
    .optional(),
  page: z.coerce.number().int().min(1).max(500).default(1),
  view: z.enum(['grid', 'list']).default('grid'),
});

export type ExperiencesSearchParams = z.infer<typeof experiencesSearchSchema>;

export function parseExperiencesSearchParams(
  input: URLSearchParams | Record<string, string | string[] | undefined>,
): ExperiencesSearchParams {
  const raw =
    input instanceof URLSearchParams
      ? {
          q: input.get('q') ?? '',
          status: input.get('status') ?? undefined,
          category: input.get('category') ?? undefined,
          page: input.get('page') ?? '1',
          view: input.get('view') ?? 'grid',
        }
      : {
          q: Array.isArray(input.q) ? input.q[0] : (input.q ?? ''),
          status: Array.isArray(input.status) ? input.status[0] : input.status,
          category: Array.isArray(input.category)
            ? input.category[0]
            : input.category,
          page: Array.isArray(input.page) ? input.page[0] : (input.page ?? '1'),
          view: Array.isArray(input.view)
            ? input.view[0]
            : (input.view ?? 'grid'),
        };

  const parsed = experiencesSearchSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  return { q: '', page: 1, view: 'grid' };
}

export function experiencesSearchToQueryString(
  params: ExperiencesSearchParams,
): string {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.status) sp.set('status', params.status);
  if (params.category) sp.set('category', params.category);
  if (params.page > 1) sp.set('page', String(params.page));
  if (params.view === 'list') sp.set('view', 'list');
  return sp.toString();
}

export function sanitizeExperienceText(raw: string, max = 120): string {
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);
}

export function isExperienceLive(status: string): boolean {
  return status === 'PUBLISHED' || status === 'ACTIVE';
}

export function nextExperienceToggleStatus(
  status: string,
): 'PUBLISHED' | 'ARCHIVED' {
  return isExperienceLive(status) ? 'ARCHIVED' : 'PUBLISHED';
}
