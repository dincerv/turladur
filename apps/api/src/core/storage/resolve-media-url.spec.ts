import { resolveMediaUrl, resolveMediaUrlList } from './resolve-media-url';

describe('resolveMediaUrl', () => {
  const cdn = 'https://api.example.com/api/v1/storage/media';
  const mediaTr = 'https://media.turta.com.tr';

  it('returns null for empty', () => {
    expect(resolveMediaUrl(cdn, null)).toBeNull();
    expect(resolveMediaUrl(cdn, '  ')).toBeNull();
  });

  it('prefixes relative storage keys', () => {
    expect(resolveMediaUrl(cdn, 'tours/a/cover.webp')).toBe(
      `${cdn}/tours/a/cover.webp`,
    );
  });

  it('keeps external stock URLs', () => {
    const u = 'https://images.unsplash.com/photo-1';
    expect(resolveMediaUrl(cdn, u)).toBe(u);
  });

  it('rewrites localhost MinIO path-style URLs', () => {
    expect(
      resolveMediaUrl(cdn, 'http://localhost:9000/tourtech-media/tours/x.webp'),
    ).toBe(`${cdn}/tours/x.webp`);
  });

  it('rewrites soft-launch media proxy URLs onto new CDN', () => {
    expect(
      resolveMediaUrl(
        mediaTr,
        'https://api.up.railway.app/api/v1/storage/media/tours/y.webp',
      ),
    ).toBe(`${mediaTr}/tours/y.webp`);
  });

  it('rewrites media.turta.com onto media.turta.com.tr', () => {
    expect(
      resolveMediaUrl(mediaTr, 'https://media.turta.com/tours/z.webp'),
    ).toBe(`${mediaTr}/tours/z.webp`);
  });

  it('resolveMediaUrlList filters nulls', () => {
    expect(
      resolveMediaUrlList(cdn, ['tours/a.webp', '', 'tours/b.webp']),
    ).toEqual([`${cdn}/tours/a.webp`, `${cdn}/tours/b.webp`]);
  });
});
