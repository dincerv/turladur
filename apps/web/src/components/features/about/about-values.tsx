import { ABOUT_VALUES } from './about-data';
import { AboutReveal } from './about-reveal';

export function AboutValues() {
  return (
    <section
      aria-labelledby="about-values-heading"
      className="border-y border-neutral-200/80 bg-neutral-50 py-16 md:py-24"
    >
      <div className="container mx-auto px-5 sm:px-6 lg:px-8">
        <AboutReveal className="mx-auto mb-12 max-w-3xl text-center md:mb-14">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-sky-600">
            İlkeler
          </p>
          <h2
            id="about-values-heading"
            className="mb-4 text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl"
          >
            Bizi yönlendiren değerler
          </h2>
          <p className="mx-auto max-w-prose text-base leading-relaxed text-neutral-600">
            Ürünü ve ortaklıklarımızı bu ilkelerle büyütüyoruz — kısa, net ve
            uygulanabilir.
          </p>
        </AboutReveal>

        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {ABOUT_VALUES.map((value, index) => (
            <AboutReveal
              key={value.title}
              delay={Math.min(index * 0.05, 0.25)}
              as="li"
            >
              <article className="h-full rounded-xl border border-neutral-200/80 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100">
                    <value.icon className="h-5 w-5 text-sky-600" aria-hidden />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {value.title}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-neutral-600">
                  {value.description}
                </p>
              </article>
            </AboutReveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
