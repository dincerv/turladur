/** Display-ready campaign — prices are optional for non-monetary promos. */
export type Campaign = {
  id: string;
  slug: string;
  title: string;
  description: string;
  terms: string | null;
  image: string;
  category: string;
  location: string;
  /** Current payable / listed price (TRY). */
  salePrice: number | null;
  /** Compare-at price — only shown when strictly greater than salePrice. */
  originalPrice: number | null;
  /** ISO end timestamp; null = open-ended. */
  endsAt: string | null;
  /** Soft corporate label (e.g. Popüler) — never “ŞOK”. */
  label: string | null;
  href: string;
};

export type CampaignPricing =
  | { kind: 'none' }
  | { kind: 'flat'; salePrice: number }
  | {
      kind: 'discount';
      salePrice: number;
      originalPrice: number;
      percent: number;
    };

export type CampaignListItem = Campaign & {
  pricing: CampaignPricing;
  active: boolean;
};
