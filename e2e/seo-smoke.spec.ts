import { test, expect } from '@playwright/test';

/**
 * Soft-live SEO smoke — robots.txt + sitemap.xml reachable.
 * Skips when web is down.
 */

test.describe('SEO — robots & sitemap', () => {
  test('serves robots.txt with sitemap pointer', async ({
    request,
    baseURL,
  }) => {
    test.skip(!baseURL, 'No baseURL');
    const res = await request.get('/robots.txt');
    test.skip(res.status() >= 500, 'Web down');
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toMatch(/sitemap:/i);
    expect(body).toMatch(/Disallow:\s*\/acente\//i);
  });

  test('serves sitemap.xml with core URLs', async ({ request, baseURL }) => {
    test.skip(!baseURL, 'No baseURL');
    const res = await request.get('/sitemap.xml');
    test.skip(res.status() >= 500, 'Web down');
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain('<urlset');
    expect(body).toMatch(/\/tours</);
  });
});
