import type {
  Campaign,
  CampaignListItem,
  CampaignPricing,
} from './campaigns.types';

export function formatCampaignPrice(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Ethical pricing: never show a “discount” when compare-at ≤ sale.
 * Percent is always derived — never trust a hand-written badge string.
 */
export function resolveCampaignPricing(
  salePrice: number | null | undefined,
  originalPrice: number | null | undefined,
): CampaignPricing {
  if (salePrice == null || !Number.isFinite(salePrice) || salePrice <= 0) {
    return { kind: 'none' };
  }

  const sale = Math.round(salePrice);
  const original =
    originalPrice != null && Number.isFinite(originalPrice)
      ? Math.round(originalPrice)
      : null;

  if (original != null && original > sale) {
    const percent = Math.round(((original - sale) / original) * 100);
    if (percent > 0 && percent < 100) {
      return {
        kind: 'discount',
        salePrice: sale,
        originalPrice: original,
        percent,
      };
    }
  }

  return { kind: 'flat', salePrice: sale };
}

/** Server-authoritative activity check (pass server `now`). */
export function isCampaignActive(
  endsAt: string | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!endsAt) return true;
  const end = Date.parse(endsAt);
  if (Number.isNaN(end)) return false;
  return end > nowMs;
}

export function remainingMs(
  endsAt: string | null | undefined,
  nowMs: number = Date.now(),
): number {
  if (!endsAt) return Number.POSITIVE_INFINITY;
  const end = Date.parse(endsAt);
  if (Number.isNaN(end)) return 0;
  return Math.max(0, end - nowMs);
}

/** Strip tags / controls before echoing CMS copy as text. */
export function toSafeCampaignText(
  raw: string | null | undefined,
  max = 280,
): string {
  if (!raw) return '';
  return raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export function looksLikeHtml(raw: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(raw);
}

export function toCampaignListItem(
  campaign: Campaign,
  nowMs: number = Date.now(),
): CampaignListItem {
  return {
    ...campaign,
    title: toSafeCampaignText(campaign.title, 120),
    description: toSafeCampaignText(campaign.description, 280),
    terms: campaign.terms ? toSafeCampaignText(campaign.terms, 400) : null,
    label: campaign.label ? toSafeCampaignText(campaign.label, 40) : null,
    pricing: resolveCampaignPricing(campaign.salePrice, campaign.originalPrice),
    active: isCampaignActive(campaign.endsAt, nowMs),
  };
}

export function partitionCampaigns(
  items: CampaignListItem[],
  urgentWithinMs = 48 * 60 * 60 * 1000,
  nowMs: number = Date.now(),
): { urgent: CampaignListItem[]; catalog: CampaignListItem[] } {
  const active = items.filter((item) => item.active);
  const urgent: CampaignListItem[] = [];
  const catalog: CampaignListItem[] = [];

  for (const item of active) {
    const left = remainingMs(item.endsAt, nowMs);
    if (
      item.endsAt &&
      Number.isFinite(left) &&
      left > 0 &&
      left <= urgentWithinMs
    ) {
      urgent.push(item);
    } else {
      catalog.push(item);
    }
  }

  return { urgent, catalog };
}
