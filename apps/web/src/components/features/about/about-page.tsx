import { AboutHero } from './about-hero';
import { AboutOffice } from './about-office';
import { AboutStory } from './about-story';
import { AboutValues } from './about-values';

/**
 * Static marketing about page — no CMS / dangerouslySetInnerHTML.
 * Copy is plain React text (XSS surface closed at the source).
 */
export default function AboutPageContent() {
  return (
    <main className="bg-neutral-50 text-neutral-800">
      <AboutHero />
      <AboutStory />
      <AboutValues />
      <AboutOffice />
    </main>
  );
}
