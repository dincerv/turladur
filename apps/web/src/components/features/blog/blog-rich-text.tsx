import Image from 'next/image';
import type { ReactNode } from 'react';

import { shouldUnoptimizeMedia } from '@/lib/media';

import { looksLikeHtml, toCoverImageUrl } from './blog.helpers';

const PROSE_CLASS =
  'prose prose-neutral prose-lg max-w-prose prose-headings:scroll-mt-24 prose-headings:font-[family-name:var(--font-montserrat)] prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-neutral-900 prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-2xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-xl prose-p:my-5 prose-p:leading-relaxed prose-p:text-neutral-800 prose-a:font-medium prose-a:text-neutral-950 prose-a:underline-offset-2 hover:prose-a:text-neutral-700 prose-blockquote:border-neutral-300 prose-blockquote:text-neutral-600 prose-blockquote:leading-relaxed prose-li:my-1.5 prose-li:text-neutral-800 prose-li:leading-relaxed prose-strong:text-neutral-900 prose-img:my-8 prose-img:rounded-xl prose-img:aspect-video prose-img:w-full prose-img:object-cover prose-hr:border-neutral-200';

type BlogRichTextProps = {
  content: string;
};

type MarkdownBlock =
  | { kind: 'h2'; text: string }
  | { kind: 'h3'; text: string }
  | { kind: 'quote'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'image'; alt: string; src: string }
  | { kind: 'paragraph'; text: string };

const IMAGE_RE = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/;

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const chunks = content
    .replace(/\r\n/g, '\n')
    .split(/\n\n+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const blocks: MarkdownBlock[] = [];

  for (const chunk of chunks) {
    if (chunk.startsWith('### ')) {
      blocks.push({ kind: 'h3', text: chunk.replace(/^###\s+/, '') });
      continue;
    }
    if (chunk.startsWith('## ')) {
      blocks.push({ kind: 'h2', text: chunk.replace(/^##\s+/, '') });
      continue;
    }

    const imageMatch = chunk.match(IMAGE_RE);
    if (imageMatch) {
      const src = toCoverImageUrl(imageMatch[2]);
      if (src) {
        blocks.push({
          kind: 'image',
          alt: imageMatch[1] || imageMatch[3] || '',
          src,
        });
      }
      continue;
    }

    const lines = chunk.split('\n');
    if (lines.every((line) => /^>\s?/.test(line))) {
      blocks.push({
        kind: 'quote',
        text: lines.map((line) => line.replace(/^>\s?/, '')).join('\n'),
      });
      continue;
    }

    if (lines.every((line) => /^[-*]\s+/.test(line))) {
      blocks.push({
        kind: 'list',
        ordered: false,
        items: lines.map((line) => line.replace(/^[-*]\s+/, '')),
      });
      continue;
    }

    if (lines.every((line) => /^\d+\.\s+/.test(line))) {
      blocks.push({
        kind: 'list',
        ordered: true,
        items: lines.map((line) => line.replace(/^\d+\.\s+/, '')),
      });
      continue;
    }

    blocks.push({ kind: 'paragraph', text: chunk });
  }

  return blocks;
}

function renderMarkdownBlocks(blocks: MarkdownBlock[]): ReactNode[] {
  return blocks.map((block, index) => {
    switch (block.kind) {
      case 'h2':
        return <h2 key={index}>{block.text}</h2>;
      case 'h3':
        return <h3 key={index}>{block.text}</h3>;
      case 'quote':
        return (
          <blockquote key={index}>
            <p className="whitespace-pre-line">{block.text}</p>
          </blockquote>
        );
      case 'list':
        return block.ordered ? (
          <ol key={index}>
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>{item}</li>
            ))}
          </ol>
        ) : (
          <ul key={index}>
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>{item}</li>
            ))}
          </ul>
        );
      case 'image':
        return (
          <figure key={index} className="not-prose my-8">
            <div className="relative aspect-video overflow-hidden rounded-xl bg-neutral-100">
              <Image
                src={block.src}
                alt={block.alt}
                fill
                sizes="(max-width: 768px) 100vw, 65ch"
                loading="lazy"
                unoptimized={shouldUnoptimizeMedia(block.src)}
                className="object-cover"
              />
            </div>
            {block.alt ? (
              <figcaption className="mt-2 text-center text-sm text-neutral-500">
                {block.alt}
              </figcaption>
            ) : null}
          </figure>
        );
      default:
        return (
          <p key={index} className="whitespace-pre-line">
            {block.text}
          </p>
        );
    }
  });
}

/**
 * Isolated content renderer — never trusts raw CMS HTML.
 * Markdown-lite → React text nodes; HTML → sanitize-html then prose.
 */
export async function BlogRichText({ content }: BlogRichTextProps) {
  const trimmed = content.trim();
  if (!trimmed) return null;

  if (looksLikeHtml(trimmed)) {
    const { sanitizeBlogHtml } = await import('./blog-sanitize');
    const safe = sanitizeBlogHtml(trimmed);
    if (!safe) return null;
    return (
      <div className={PROSE_CLASS} dangerouslySetInnerHTML={{ __html: safe }} />
    );
  }

  return (
    <div className={PROSE_CLASS}>
      {renderMarkdownBlocks(parseMarkdownBlocks(trimmed))}
    </div>
  );
}

/** @deprecated Prefer BlogRichText — kept for any residual imports. */
export function renderBlogContent(content: string) {
  return <BlogRichText content={content} />;
}
