import { ABOUT_STORY_BLOCKS } from './about-data';
import { AboutMedia } from './about-media';
import { AboutReveal } from './about-reveal';

export function AboutStory() {
  return (
    <section
      id="profile"
      aria-labelledby="about-story-heading"
      className="scroll-mt-24 bg-white py-16 md:py-24"
    >
      <div className="container mx-auto space-y-20 px-5 sm:px-6 md:space-y-28 lg:px-8">
        <h2 id="about-story-heading" className="sr-only">
          Hikayemiz, misyon ve vizyon
        </h2>

        {ABOUT_STORY_BLOCKS.map((block) => {
          const titleCol = block.imageRight
            ? 'order-1 lg:col-start-1 lg:row-start-1'
            : 'order-1 lg:col-start-2 lg:row-start-1';
          const imageCol = block.imageRight
            ? 'order-2 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-center'
            : 'order-2 lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:self-center';
          const bodyCol = block.imageRight
            ? 'order-3 lg:col-start-1 lg:row-start-2'
            : 'order-3 lg:col-start-2 lg:row-start-2';

          return (
            <article
              key={block.title}
              className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-x-16 lg:gap-y-6 xl:gap-x-20"
            >
              {/* Mobile: title → image → body. Desktop zigzag via grid placement. */}
              <AboutReveal className={titleCol}>
                <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-sky-600">
                  {block.eyebrow}
                </p>
                <h3 className="text-3xl font-bold tracking-tight text-balance text-neutral-900 md:text-4xl">
                  {block.title}
                </h3>
              </AboutReveal>

              <AboutReveal delay={0.08} className={imageCol}>
                <AboutMedia
                  image={block.image}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </AboutReveal>

              <AboutReveal delay={0.04} className={`${bodyCol} space-y-4`}>
                {block.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 32)}
                    className="max-w-prose text-base leading-relaxed text-neutral-600 md:text-lg"
                  >
                    {paragraph}
                  </p>
                ))}
              </AboutReveal>
            </article>
          );
        })}
      </div>
    </section>
  );
}
