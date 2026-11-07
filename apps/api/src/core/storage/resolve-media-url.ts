/**
 * Resolve stored media paths / legacy local URLs to the active CDN base.
 * External URLs (Unsplash, etc.) are left unchanged.
 */

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

const LOCAL_MEDIA_HOST_RE =
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/[^/]+\/(.+)$/i;

/** Known bucket segment in path-style MinIO URLs */
const BUCKET_IN_PATH_RE =
  /^https?:\/\/[^/]+\/(?:tourtech-media|turta-media)\/(.+)$/i;

export function resolveMediaUrl(
  cdnBase: string,
  pathOrUrl: string | null | undefined,
): string | null {
  if (!pathOrUrl?.trim()) return null;
  const value = pathOrUrl.trim();
  const base = stripTrailingSlash(cdnBase);

  if (value.startsWith('blob:') || value.startsWith('data:')) {
    return value;
  }

  // Relative storage key: tours/{id}/file.webp
  // Also accept already-proxied paths: /api/v1/storage/media/operators/...
  if (!/^https?:\/\//i.test(value)) {
    const marker = 'storage/media/';
    const markerIndex = value.indexOf(marker);
    const key =
      markerIndex >= 0
        ? value.slice(markerIndex + marker.length).replace(/^\/+/, '')
        : value.replace(/^\/+/, '');
    return key ? `${base}/${key}` : null;
  }

  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();

    // External CDNs / stock photos — keep as-is
    if (
      host.includes('unsplash.com') ||
      host.includes('pexels.com') ||
      host.includes('picsum.photos') ||
      host.includes('placehold.co') ||
      host.includes('ui-avatars.com') ||
      host.includes('randomuser.me')
    ) {
      return value;
    }

    // Already on active CDN host
    const cdnHost = new URL(
      base.startsWith('http') ? base : `https://${base}`,
    ).hostname.toLowerCase();
    if (host === cdnHost) {
      return value;
    }

    // localhost MinIO → rewrite to current CDN
    const localMatch = value.match(LOCAL_MEDIA_HOST_RE);
    if (localMatch?.[3]) {
      return `${base}/${localMatch[3]}`;
    }

    // Nest media proxy (local / soft-launch Railway|Fly) → rebase onto CDN_URL
    if (parsed.pathname.includes('/storage/media/')) {
      const marker = '/storage/media/';
      const idx = parsed.pathname.indexOf(marker);
      const key = parsed.pathname
        .slice(idx + marker.length)
        .replace(/^\/+/, '');
      if (key) return `${base}/${key}`;
    }

    const bucketMatch = value.match(BUCKET_IN_PATH_RE);
    if (bucketMatch?.[1]) {
      return `${base}/${bucketMatch[1]}`;
    }

    // Same path under media.* / r2.dev — re-base to CDN_URL
    if (
      host === 'media.turta.com' ||
      host === 'media.turta.com.tr' ||
      host.endsWith('.r2.dev') ||
      host.includes('r2.cloudflarestorage.com') ||
      host.includes('amazonaws.com')
    ) {
      const key = parsed.pathname.replace(/^\/+/, '');
      // path-style: /bucket/key → drop first segment if it looks like bucket
      const parts = key.split('/');
      if (
        parts.length >= 2 &&
        (parts[0] === 'tourtech-media' || parts[0] === 'turta-media')
      ) {
        return `${base}/${parts.slice(1).join('/')}`;
      }
      return `${base}/${key}`;
    }

    return value;
  } catch {
    return `${base}/${value.replace(/^\/+/, '')}`;
  }
}

export function resolveMediaUrlList(
  cdnBase: string,
  urls: string[] | null | undefined,
): string[] {
  if (!urls?.length) return [];
  return urls
    .map((u) => resolveMediaUrl(cdnBase, u))
    .filter((u): u is string => Boolean(u));
}
