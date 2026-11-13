'use client';

import { type ElementType, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

type AboutRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: 'div' | 'article' | 'li';
};

/** Soft fade/slide-up on scroll; disabled when the user prefers reduced motion. */
export function AboutReveal({
  children,
  className,
  delay = 0,
  as = 'div',
}: AboutRevealProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    const Tag = as as ElementType;
    return <Tag className={className}>{children}</Tag>;
  }

  const MotionTag = motion[as];

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-48px' }}
      transition={{ duration: 0.45, ease: 'easeOut', delay }}
    >
      {children}
    </MotionTag>
  );
}
