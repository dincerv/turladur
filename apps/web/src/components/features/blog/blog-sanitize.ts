import sanitizeHtml from 'sanitize-html';

/**
 * XSS-safe HTML allowlist for CMS blog bodies.
 * DOMPurify-equivalent for Node/Next SSR (isomorphic-dompurify pulls broken undici).
 */
export function sanitizeBlogHtml(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: [
      'p',
      'br',
      'hr',
      'strong',
      'b',
      'em',
      'i',
      'u',
      's',
      'a',
      'ul',
      'ol',
      'li',
      'blockquote',
      'pre',
      'code',
      'h2',
      'h3',
      'h4',
      'img',
      'figure',
      'figcaption',
      'span',
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel', 'title'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'decoding'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        rel: 'noopener noreferrer',
        target: '_blank',
      }),
      img: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          loading: attribs.loading || 'lazy',
          decoding: attribs.decoding || 'async',
          width: attribs.width || '1200',
          height: attribs.height || '675',
        },
      }),
    },
  });
}
