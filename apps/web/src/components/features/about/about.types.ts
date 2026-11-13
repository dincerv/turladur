import type { LucideIcon } from 'lucide-react';

export type AboutValue = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export type AboutOfficeImage = {
  src: string;
  alt: string;
  /** Tailwind grid / aspect classes for the bento cell. */
  cellClassName: string;
  /** LCP: only the first visible office/hero image. */
  priority?: boolean;
};

export type AboutStoryBlock = {
  eyebrow: string;
  title: string;
  paragraphs: readonly string[];
  image: AboutOfficeImage;
  /** Desktop: image on the right when true. */
  imageRight: boolean;
};
