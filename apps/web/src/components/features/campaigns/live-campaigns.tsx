import { CampaignsList } from './campaigns-list';
import type { CampaignListItem } from './campaigns.types';

type LiveCampaignsProps = {
  items: CampaignListItem[];
  nowMs: number;
};

/** Short-window campaigns (≤48h) — same card system, no fake urgency chrome. */
export function LiveCampaigns({ items, nowMs }: LiveCampaignsProps) {
  if (items.length === 0) return null;

  return (
    <CampaignsList
      items={items}
      nowMs={nowMs}
      emptyTitle="Yakın bitişli kampanya yok"
      emptyHint="Aktif kampanyalar aşağıdaki listede."
    />
  );
}
