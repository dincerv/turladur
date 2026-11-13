import { describe, expect, it } from 'vitest';

import {
  isCampaignActive,
  resolveCampaignPricing,
  toSafeCampaignText,
} from './campaigns.helpers';

describe('campaign pricing ethics', () => {
  it('hides fake discounts when original <= sale', () => {
    expect(resolveCampaignPricing(1000, 1000)).toEqual({
      kind: 'flat',
      salePrice: 1000,
    });
    expect(resolveCampaignPricing(1000, 800)).toEqual({
      kind: 'flat',
      salePrice: 1000,
    });
    expect(resolveCampaignPricing(1000, null)).toEqual({
      kind: 'flat',
      salePrice: 1000,
    });
  });

  it('computes percent from prices only', () => {
    expect(resolveCampaignPricing(7500, 10000)).toEqual({
      kind: 'discount',
      salePrice: 7500,
      originalPrice: 10000,
      percent: 25,
    });
  });

  it('treats missing sale as none', () => {
    expect(resolveCampaignPricing(null, 10000)).toEqual({ kind: 'none' });
  });
});

describe('campaign activity & copy', () => {
  it('expires by absolute timestamp', () => {
    const now = Date.parse('2026-06-01T12:00:00.000Z');
    expect(isCampaignActive('2026-06-01T11:00:00.000Z', now)).toBe(false);
    expect(isCampaignActive('2026-06-01T13:00:00.000Z', now)).toBe(true);
    expect(isCampaignActive(null, now)).toBe(true);
  });

  it('strips html from campaign copy', () => {
    expect(toSafeCampaignText('Merhaba <script>alert(1)</script> dünya')).toBe(
      'Merhaba alert(1) dünya',
    );
  });
});
