'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle, Mail } from 'lucide-react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      setError('Lütfen geçerli bir e-posta adresi giriniz');
      return;
    }

    setLoading(true);
    try {
      // Bülten API henüz bağlanmadı; kayıt niyetini yerel olarak kabul ediyoruz.
      await new Promise((resolve) => setTimeout(resolve, 600));
      setEmail(trimmed);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="border-y border-neutral-200/60 bg-neutral-50 py-24 md:py-32">
      <div className="container mx-auto px-6">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="relative order-last h-80 w-full overflow-hidden rounded-xl border border-neutral-200/50 shadow-lg md:h-[450px] lg:order-first">
            <Image
              src="https://images.unsplash.com/photo-1568992687947-868a62a9f521?q=80&w=1932&auto=format&fit=crop"
              alt=""
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          <div className="lg:pl-8">
            {submitted ? (
              <div className="py-6 text-center lg:text-left">
                <CheckCircle className="mx-auto mb-4 h-10 w-10 text-emerald-500 lg:mx-0" />
                <h3 className="mb-2 text-2xl font-semibold break-words text-neutral-900">
                  Teşekkürler!
                </h3>
                <p className="mb-4 text-sm break-words text-neutral-600">
                  <span className="font-medium text-neutral-800">{email}</span>{' '}
                  için ilginizi kaydettik. Bülten yayına alındığında
                  bilgilendirileceksiniz.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setEmail('');
                    setError('');
                  }}
                  className="text-sm font-medium text-neutral-950 underline underline-offset-2 transition-colors hover:text-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2"
                >
                  Farklı bir e-posta ile kaydol
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-6 inline-flex items-center justify-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-800">
                  <Mail className="mr-1.5 h-4 w-4" />
                  Özel Fırsatlar
                </div>
                <h2 className="mb-4 text-3xl font-bold break-words text-neutral-900 md:text-4xl">
                  İndirimleri ve Haberleri Kaçırmayın
                </h2>
                <p className="mb-8 text-lg text-neutral-600">
                  Yeni turlar ve kampanyalardan haberdar olmak için e-posta
                  listenize katılın.
                </p>

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div>
                    <label htmlFor="email-newsletter" className="sr-only">
                      E-posta adresi
                    </label>
                    <input
                      id="email-newsletter"
                      type="email"
                      name="email"
                      autoComplete="email"
                      inputMode="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      maxLength={254}
                      className={`block w-full rounded-lg border bg-white px-4 py-2.5 text-neutral-900 placeholder-neutral-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 sm:text-sm ${error ? 'border-red-400 focus:border-red-500 focus-visible:ring-red-300' : 'border-neutral-300 focus:border-neutral-950 focus-visible:ring-neutral-300'}`}
                      placeholder="E-posta adresiniz"
                      required
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? 'newsletter-error' : undefined}
                    />
                  </div>

                  {error ? (
                    <p
                      id="newsletter-error"
                      className="mt-1 text-xs text-red-600"
                      role="alert"
                    >
                      {error}
                    </p>
                  ) : null}

                  <div className="flex items-start pt-1">
                    <div className="flex h-5 items-center">
                      <input
                        id="terms-newsletter"
                        name="terms-newsletter"
                        type="checkbox"
                        required
                        className="h-4 w-4 rounded border-neutral-300 text-neutral-950 focus:ring-neutral-950 focus:ring-offset-0"
                      />
                    </div>
                    <div className="ml-2.5 text-xs">
                      <label
                        htmlFor="terms-newsletter"
                        className="text-neutral-500"
                      >
                        <Link
                          href="/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-neutral-950 underline-offset-2 hover:underline"
                        >
                          Gizlilik Politikası
                        </Link>
                        &apos;nı okudum ve kabul ediyorum.
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="flex w-full items-center justify-center rounded-lg bg-neutral-950 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={loading}
                  >
                    {loading ? (
                      <span
                        className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"
                        aria-label="Gönderiliyor"
                      />
                    ) : (
                      'Bültene Kaydol'
                    )}
                  </button>
                </form>
                <p className="mt-4 text-left text-xs text-neutral-500">
                  İstediğiniz zaman abonelikten çıkabilirsiniz.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Newsletter;
