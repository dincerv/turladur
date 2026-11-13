import { formatCampaignPrice } from './campaigns.helpers';
import type { CampaignPricing } from './campaigns.types';

type CampaignPriceProps = {
  pricing: CampaignPricing;
  className?: string;
};

/** Transparent price stack — hides fake compare-at / 0% badges. */
export function CampaignPrice({ pricing, className }: CampaignPriceProps) {
  if (pricing.kind === 'none') {
    return (
      <p className={className ?? 'text-sm text-neutral-500'}>
        Koşullar rezervasyonda
      </p>
    );
  }

  if (pricing.kind === 'flat') {
    return (
      <p
        className={
          className ??
          'truncate text-lg font-bold tabular-nums text-neutral-900'
        }
      >
        {formatCampaignPrice(pricing.salePrice)}
        <span className="ml-1 text-xs font-medium text-neutral-500">
          / kişiden
        </span>
      </p>
    );
  }

  return (
    <div className={className ?? 'min-w-0'}>
      <p className="truncate text-xs tabular-nums text-neutral-400 line-through">
        {formatCampaignPrice(pricing.originalPrice)}
      </p>
      <p className="truncate text-lg font-bold tabular-nums text-neutral-900">
        {formatCampaignPrice(pricing.salePrice)}
        <span className="ml-1 text-xs font-medium text-neutral-500">
          / kişiden
        </span>
      </p>
    </div>
  );
}

export function CampaignDiscountBadge({
  pricing,
}: {
  pricing: CampaignPricing;
}) {
  if (pricing.kind !== 'discount') return null;
  return (
    <span className="rounded-md border border-neutral-200 bg-white/95 px-2.5 py-1 text-xs font-semibold tabular-nums text-neutral-800 shadow-sm backdrop-blur-sm">
      %{pricing.percent} indirim
    </span>
  );
}
