import type {
  PersonaAlignment,
  PersonaMatchedReview,
  ReviewPersonaTag,
  TourPersonaMatchResponse,
  TravelerPersona,
} from '@turta/shared-types';

const TAG_PATTERNS: Record<ReviewPersonaTag, RegExp[]> = {
  'gece-hayati': [
    /parti/i,
    /dans/i,
    /yüksek\s*ses/i,
    /gece\s*eğlence/i,
    /gece\s*hayat/i,
    /müzik\s*yüksek/i,
    /eğlence\s*yoğun/i,
    /dj/i,
  ],
  'sakin-dinlenme': [
    /sakin/i,
    /dinlen/i,
    /huzur/i,
    /sessiz/i,
    /rahat\s*tempo/i,
    /yavaş/i,
    /keyifli\s*mol/i,
  ],
  'cocuklu-aile': [/çocuk/i, /aile/i, /bebek/i, /kids/i, /ailece/i],
  'butce-dostu': [
    /ucuz/i,
    /bütçe/i,
    /fiyat.?performans/i,
    /uygun\s*fiyat/i,
    /ekonomik/i,
  ],
  macera: [/macera/i, /trekking/i, /adrenal/i, /zorlu/i, /doğa\s*yürüyüş/i],
  kultur: [/kültür/i, /müze/i, /tarih/i, /rehber/i, /gastronomi/i],
};

const PERSONA_PREFERS: Record<TravelerPersona, ReviewPersonaTag[]> = {
  PARTY: ['gece-hayati', 'macera'],
  CALM: ['sakin-dinlenme', 'kultur'],
  FAMILY: ['cocuklu-aile', 'sakin-dinlenme'],
  BUDGET: ['butce-dostu'],
  ADVENTURE: ['macera', 'gece-hayati'],
  CULTURE: ['kultur', 'sakin-dinlenme'],
};

const PERSONA_AVOIDS: Record<TravelerPersona, ReviewPersonaTag[]> = {
  PARTY: ['sakin-dinlenme'],
  CALM: ['gece-hayati'],
  FAMILY: ['gece-hayati'],
  BUDGET: [],
  ADVENTURE: ['sakin-dinlenme'],
  CULTURE: ['gece-hayati'],
};

const PERSONA_LABELS: Record<TravelerPersona, string> = {
  PARTY: 'Parti / eğlence',
  CALM: 'Sakin dinlenme',
  FAMILY: 'Çocuklu aile',
  BUDGET: 'Bütçe dostu',
  ADVENTURE: 'Macera',
  CULTURE: 'Kültür',
};

export function tagReviewComment(
  comment: string | null | undefined,
): ReviewPersonaTag[] {
  if (!comment) return [];
  const tags: ReviewPersonaTag[] = [];
  for (const [tag, patterns] of Object.entries(TAG_PATTERNS) as [
    ReviewPersonaTag,
    RegExp[],
  ][]) {
    if (patterns.some((pattern) => pattern.test(comment))) {
      tags.push(tag);
    }
  }
  return tags;
}

export function inferPersonaFromIntent(
  intent: string | null | undefined,
): TravelerPersona | null {
  if (!intent) return null;
  const text = intent.toLocaleLowerCase('tr-TR');
  if (/parti|eğlence|dans|gece/.test(text)) return 'PARTY';
  if (/sakin|huzur|dinlen|sessiz/.test(text)) return 'CALM';
  if (/çocuk|aile|bebek/.test(text)) return 'FAMILY';
  if (/ucuz|bütçe|ekonomik/.test(text)) return 'BUDGET';
  if (/macera|trekking|adrenal/.test(text)) return 'ADVENTURE';
  if (/kültür|müze|tarih/.test(text)) return 'CULTURE';
  return null;
}

function alignmentFor(
  persona: TravelerPersona,
  tags: ReviewPersonaTag[],
  rating: number,
): PersonaAlignment {
  const prefers = PERSONA_PREFERS[persona];
  const avoids = PERSONA_AVOIDS[persona];
  const hitPrefer = tags.some((tag) => prefers.includes(tag));
  const hitAvoid = tags.some((tag) => avoids.includes(tag));

  if (hitPrefer && rating >= 4) return 'positive';
  if (hitPrefer && rating <= 2) return 'negative';
  if (hitAvoid && rating <= 2) return 'positive';
  if (hitAvoid && rating >= 4) return 'negative';
  if (hitPrefer) return 'positive';
  if (hitAvoid) return 'negative';
  return 'neutral';
}

type RawReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
};

export function buildTourPersonaMatch(input: {
  tourId: string;
  persona: TravelerPersona;
  intent?: string | null;
  reviews: RawReview[];
}): TourPersonaMatchResponse {
  const persona = inferPersonaFromIntent(input.intent) ?? input.persona;

  const highlights: PersonaMatchedReview[] = input.reviews.map((review) => {
    const tags = tagReviewComment(review.comment);
    return {
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      tags,
      alignment: alignmentFor(persona, tags, review.rating),
      createdAt: review.createdAt.toISOString(),
    };
  });

  const alignedTags = new Set<ReviewPersonaTag>();
  const conflictTags = new Set<ReviewPersonaTag>();
  let scoreSum = 0;
  let scored = 0;

  for (const item of highlights) {
    for (const tag of item.tags) {
      if (PERSONA_PREFERS[persona].includes(tag)) alignedTags.add(tag);
      if (PERSONA_AVOIDS[persona].includes(tag)) conflictTags.add(tag);
    }
    if (item.alignment === 'positive') {
      scoreSum += 85 + Math.min(15, item.rating * 2);
      scored += 1;
    } else if (item.alignment === 'negative') {
      scoreSum += Math.max(10, 40 - item.rating * 5);
      scored += 1;
    } else if (item.tags.length > 0) {
      scoreSum += 55;
      scored += 1;
    }
  }

  const avgRating =
    input.reviews.length > 0
      ? input.reviews.reduce((sum, row) => sum + row.rating, 0) /
        input.reviews.length
      : 0;

  const fitScore =
    scored > 0
      ? Math.round(Math.min(100, Math.max(0, scoreSum / scored)))
      : Math.round(avgRating * 18);

  const warnings: string[] = [];
  if (conflictTags.has('gece-hayati') && persona === 'CALM') {
    warnings.push(
      'Bazı yorumcular yüksek sesli gece eğlencesinden şikâyetçi — sakinlik tercihinizle çatışabilir.',
    );
  }
  if (conflictTags.has('gece-hayati') && persona === 'FAMILY') {
    warnings.push(
      'Gece eğlencesi / parti vurgusu çocuklu aileler için rahatsız edici olabilir.',
    );
  }
  if (alignedTags.has('gece-hayati') && persona === 'PARTY') {
    warnings.push(
      'Eğlence seven gezginler bu turdaki gece temposunu olumlu bulmuş.',
    );
  }

  const label = PERSONA_LABELS[persona];
  const summary =
    input.reviews.length === 0
      ? 'Bu tur için henüz yeterli yorum yok; uygunluk skoru genel katalog sinyallerine dayanıyor.'
      : fitScore >= 70
        ? `${label} tercihinize göre bu tur güçlü uyum gösteriyor (skor ${fitScore}/100).`
        : fitScore >= 45
          ? `${label} tercihinize göre karışık sinyaller var (skor ${fitScore}/100); öne çıkan yorumları inceleyin.`
          : `${label} tercihinize göre uyum düşük (skor ${fitScore}/100). Alternatif turları kıyaslamayı düşünün.`;

  const sorted = [...highlights].sort((a, b) => {
    const rank = (value: PersonaAlignment) =>
      value === 'positive' ? 0 : value === 'negative' ? 1 : 2;
    return rank(a.alignment) - rank(b.alignment) || b.rating - a.rating;
  });

  return {
    tourId: input.tourId,
    persona,
    fitScore,
    summary,
    alignedTags: [...alignedTags],
    conflictTags: [...conflictTags],
    warnings,
    highlights: sorted.slice(0, 6),
    reviewCount: input.reviews.length,
    parser: 'heuristic',
  };
}
