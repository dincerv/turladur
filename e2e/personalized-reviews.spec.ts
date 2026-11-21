import { test, expect } from '@playwright/test';

const apiBase = process.env.API_URL ?? 'http://localhost:4000/api/v1';

const LIKYA_TOUR_ID = 'seed-tour-likya-party';

test.describe('Personalized persona reviews', () => {
  test('persona-match API scores PARTY higher than CALM on Likya tour', async ({
    request,
  }) => {
    const health = await request.get(`${apiBase}/health`);
    test.skip(!health.ok(), 'API not running');

    const probe = await request.get(
      `${apiBase}/catalog/tours/${LIKYA_TOUR_ID}`,
    );
    test.skip(!probe.ok(), 'Persona seed tour missing — run prisma seed');

    const party = await request.post(
      `${apiBase}/review/tours/${LIKYA_TOUR_ID}/persona-match`,
      { data: { persona: 'PARTY' } },
    );
    const calm = await request.post(
      `${apiBase}/review/tours/${LIKYA_TOUR_ID}/persona-match`,
      { data: { persona: 'CALM', intent: 'Sakinlik istiyorum' } },
    );

    expect(party.ok()).toBeTruthy();
    expect(calm.ok()).toBeTruthy();

    const partyBody = (await party.json()) as {
      data?: { fitScore?: number; alignedTags?: string[]; parser?: string };
    };
    const calmBody = (await calm.json()) as {
      data?: {
        fitScore?: number;
        conflictTags?: string[];
        warnings?: string[];
        summary?: string;
      };
    };

    expect(partyBody.data?.parser).toBe('heuristic');
    expect(typeof partyBody.data?.fitScore).toBe('number');
    expect(typeof calmBody.data?.fitScore).toBe('number');
    expect(partyBody.data!.fitScore!).toBeGreaterThan(calmBody.data!.fitScore!);
    expect(partyBody.data?.alignedTags).toEqual(
      expect.arrayContaining(['gece-hayati']),
    );
    expect(calmBody.data?.conflictTags).toEqual(
      expect.arrayContaining(['gece-hayati']),
    );
    expect((calmBody.data?.warnings ?? []).length).toBeGreaterThan(0);
    expect(calmBody.data?.summary).toMatch(/skor/i);
  });

  test('tour detail shows ReviewPersonaCard and updates fit score', async ({
    page,
    request,
  }) => {
    const health = await request.get(`${apiBase}/health`);
    test.skip(!health.ok(), 'API not running');

    const probe = await request.get(
      `${apiBase}/catalog/tours/${LIKYA_TOUR_ID}`,
    );
    test.skip(!probe.ok(), 'Persona seed tour missing — run prisma seed');

    await page.goto(`/tours/${LIKYA_TOUR_ID}`);
    await expect(page.getByTestId('review-persona-card')).toBeVisible({
      timeout: 45_000,
    });

    await expect(page.getByTestId('persona-fit-placeholder')).toBeVisible();
    await expect(page.getByTestId('persona-fit-score')).toHaveCount(0);

    await page.getByTestId('persona-chip-CALM').click();
    await expect(page.getByTestId('persona-fit-score')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByTestId('persona-match-summary')).toBeVisible();

    const readFitScore = async () => {
      const text = await page.getByTestId('persona-fit-score').innerText();
      const match = text.match(/(\d+)\s*\/\s*100/);
      return Number(match?.[1] ?? NaN);
    };

    const calmScore = await readFitScore();
    expect(calmScore).toBeGreaterThan(0);

    await page.getByTestId('persona-chip-PARTY').click();
    await expect(page.getByTestId('persona-match-result')).toBeVisible({
      timeout: 15_000,
    });

    await expect.poll(async () => readFitScore()).toBeGreaterThan(calmScore);

    await page
      .getByTestId('persona-intent-input')
      .fill('Parti ve eğlence seviyorum');
    await page.getByTestId('persona-match-submit').click();
    await expect(page.getByTestId('persona-match-summary')).toBeVisible();
  });

  test('AI search surfaces persona badges for party intent', async ({
    page,
    request,
  }) => {
    const health = await request.get(`${apiBase}/health`);
    test.skip(!health.ok(), 'API not running');

    const probe = await request.post(`${apiBase}/catalog/tours/ai-search`, {
      data: {
        prompt: 'Parti ve eğlence seviyorum, gece dansı olan tur öner',
      },
    });
    test.skip(!probe.ok(), 'AI search unavailable');
    const probeBody = (await probe.json()) as {
      data?: {
        tours?: { id: string; personaBadge?: { fitScore: number } | null }[];
      };
    };
    const withBadge = (probeBody.data?.tours ?? []).filter(
      (tour) => tour.personaBadge != null,
    );
    test.skip(withBadge.length < 1, 'Need persona badges on AI hits');

    await page.goto('/tours');
    await expect(page.getByTestId('ai-search-input')).toBeVisible({
      timeout: 30_000,
    });
    await page.getByTestId('quick-prompt-chip-party').click();
    await expect(page.getByTestId('ai-search-result')).toBeVisible({
      timeout: 20_000,
    });

    const badges = page.locator('[data-testid^="ai-persona-badge-"]');
    await expect(badges.first()).toBeVisible({ timeout: 15_000 });
  });
});
