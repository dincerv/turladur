/**
 * Media / CDN helpers for apps/web.
 * API responses should already use CDN_URL; this helper also rewrites
 * broken r2.dev hosts to the local Nest media proxy during development.
 */

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

/** Fix CDN_URL pasted without scheme (breaks next/image optimizer). */
function ensureAbsoluteHttpUrl(url: string): string {
  const trimmed = url.trim();
  if (
    !trimmed ||
    /^https?:\/\//i.test(trimmed) ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }
  return `https://${trimmed.replace(/^\/+/, '')}`;
}

/** Prefer explicit env; without custom domain use Nest media proxy (API). */
export function getCdnBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_CDN_URL?.trim();
  if (fromEnv) return stripTrailingSlash(ensureAbsoluteHttpUrl(fromEnv));
  const api = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (api) {
    // https://api…/api/v1 → https://api…/api/v1/storage/media
    return `${stripTrailingSlash(ensureAbsoluteHttpUrl(api))}/storage/media`;
  }
  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:4000/api/v1/storage/media';
  }
  return 'https://media.turta.com.tr';
}

function extractStorageKey(pathname: string): string {
  const key = pathname.replace(/^\/+/, '');
  const parts = key.split('/');
  if (
    parts.length >= 2 &&
    (parts[0] === 'tourtech-media' || parts[0] === 'turta-media')
  ) {
    return parts.slice(1).join('/');
  }
  // Proxy path: /api/v1/storage/media/<key>
  const marker = 'storage/media/';
  const idx = key.indexOf(marker);
  if (idx >= 0) return key.slice(idx + marker.length);
  return key;
}

/**
 * Resolve a stored media path or absolute URL for <Image> / <img>.
 * Rewrites pub-*.r2.dev (and similar) onto the active CDN / media proxy.
 */
export function resolveMediaUrl(
  pathOrUrl: string | null | undefined,
): string | null {
  if (!pathOrUrl?.trim()) return null;
  const value = ensureAbsoluteHttpUrl(pathOrUrl.trim());
  if (value.startsWith('blob:') || value.startsWith('data:')) {
    return value;
  }

  const base = getCdnBaseUrl();

  if (!/^https?:\/\//i.test(value)) {
    const key = extractStorageKey(value);
    return key ? `${base}/${key}` : null;
  }

  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();

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

    if (
      host.endsWith('.r2.dev') ||
      host.includes('r2.cloudflarestorage.com') ||
      host === 'media.turta.com' ||
      host === 'media.turta.com.tr' ||
      parsed.pathname.includes('/storage/media/') ||
      ((host === 'localhost' || host === '127.0.0.1') &&
        (parsed.port === '9000' || parsed.pathname.includes('tourtech-media')))
    ) {
      const key = extractStorageKey(parsed.pathname);
      if (!key) return value;
      return `${base}/${key}`;
    }

    return value;
  } catch {
    return `${base}/${value.replace(/^\/+/, '')}`;
  }
}

/** Skip Next optimizer for blob / local / proxy URLs (avoids /_next/image 500). */
export function shouldUnoptimizeMedia(url: string | null | undefined): boolean {
  if (!url) return true;
  if (url.startsWith('blob:') || url.startsWith('data:')) return true;
  if (url.includes('/storage/media/')) return true;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.r2.dev') ||
      host.includes('r2.cloudflarestorage.com') ||
      host.endsWith('.railway.app') ||
      host.endsWith('.fly.dev')
    );
  } catch {
    return true;
  }
}
