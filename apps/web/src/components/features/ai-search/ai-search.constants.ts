export const AI_SEARCH_QUICK_PROMPTS = [
  {
    id: 'karadeniz-3n',
    label: '3 gece Karadeniz',
    prompt: "Ankara'dan 3 gece Karadeniz turu, Uzungöl ve Ayder olsun",
  },
  {
    id: 'kapadokya',
    label: 'Kapadokya kaçış',
    prompt: 'İstanbul çıkışlı Kapadokya konaklamalı tur',
  },
  {
    id: 'day-trip',
    label: 'Günübirlik',
    prompt: 'İstanbul çıkışlı günübirlik tur öner',
  },
  {
    id: 'featured',
    label: 'Öne çıkanlar',
    prompt: 'Öne çıkan popüler turları göster',
  },
  {
    id: 'party',
    label: 'Parti / eğlence',
    prompt: 'Parti ve eğlence seviyorum, gece dansı olan tur öner',
  },
  {
    id: 'calm',
    label: 'Sakin dinlenme',
    prompt: 'Sakinlik istiyorum, yüksek sesli dans istemem',
  },
] as const;

export type AiSearchQuickPrompt = (typeof AI_SEARCH_QUICK_PROMPTS)[number];
