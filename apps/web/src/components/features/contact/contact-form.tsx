'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail as EnvelopeIcon } from 'lucide-react';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { getPublicApiBaseUrl } = await import('@/services/api-client');
      const res = await fetch(`${getPublicApiBaseUrl()}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ name, email, phone, subject, message }),
      });
      const result = await res.json().catch(() => ({}));
      if (res.ok && result.success !== false) {
        alert('Mesaj başarıyla gönderildi!');
        setName('');
        setEmail('');
        setPhone('');
        setSubject('');
        setMessage('');
      } else {
        alert('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
      }
    } catch {
      alert('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-neutral-700 mb-1.5"
          >
            Ad Soyad
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-neutral-900 placeholder:text-neutral-400 transition-colors text-sm"
            placeholder="Ad Soyad"
            required
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-neutral-700 mb-1.5"
          >
            E-posta Adresiniz
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-neutral-900 placeholder:text-neutral-400 transition-colors text-sm"
            placeholder="email@example.com"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-neutral-700 mb-1.5"
          >
            Telefon <span className="text-neutral-400">(Opsiyonel)</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-neutral-900 placeholder:text-neutral-400 transition-colors text-sm"
            placeholder="+90 5XX XXX XX XX"
          />
        </div>
        <div>
          <label
            htmlFor="subject"
            className="block text-sm font-medium text-neutral-700 mb-1.5"
          >
            Konu
          </label>
          <select
            id="subject"
            name="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-neutral-900 transition-colors text-sm"
            required
          >
            <option value="">Konu Seçiniz</option>
            <option value="reservation">Rezervasyon</option>
            <option value="cancellation">İptal & İade</option>
            <option value="support">Teknik Destek</option>
            <option value="partnership">İş Ortaklığı</option>
            <option value="other">Diğer</option>
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-neutral-700 mb-1.5"
        >
          Mesajınız
        </label>
        <textarea
          id="message"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-neutral-900 placeholder:text-neutral-400 transition-colors text-sm"
          placeholder="Mesajınızı detaylı bir şekilde yazınız..."
          required
        ></textarea>
      </div>

      <div className="flex items-start pt-1">
        <input
          id="privacy"
          name="privacy"
          type="checkbox"
          className="h-4 w-4 rounded border-neutral-300 text-sky-600 focus:ring-sky-500 focus:ring-offset-1 mt-0.5"
          required
        />
        <label htmlFor="privacy" className="ml-2.5 text-sm text-neutral-600">
          <span className="span-inherit">
            Kişisel verilerimin işlenmesine ilişkin{' '}
          </span>
          <Link
            href="/privacy"
            className="text-sky-600 hover:text-sky-700 hover:underline transition-colors"
          >
            aydınlatma metnini
          </Link>
          <span className="span-inherit"> okudum ve kabul ediyorum.</span>
        </label>
      </div>

      <button
        type="submit"
        className="w-full py-3 px-6 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm flex items-center justify-center active:scale-[0.98]"
      >
        <EnvelopeIcon className="w-5 h-5 mr-2" />
        Mesajı Gönder
      </button>
    </form>
  );
}
