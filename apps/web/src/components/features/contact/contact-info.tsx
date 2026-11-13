import { Clock, Mail, MapPin, ExternalLink } from 'lucide-react';

import {
  COMPANY,
  getCompanyAddressLines,
  getCompanyMapsDirectionsUrl,
} from '@/lib/company';

export function ContactInfo() {
  const addressLines = getCompanyAddressLines();

  return (
    <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/80 p-6 sm:p-8">
      <h3 className="mb-5 border-b border-neutral-200 pb-4 text-xl font-semibold text-neutral-900">
        Ofisimiz
      </h3>

      <ul className="space-y-4 text-sm text-neutral-700">
        <li className="flex items-start gap-3">
          <MapPin
            className="mt-0.5 h-5 w-5 shrink-0 text-sky-600"
            aria-hidden
          />
          <address className="min-w-0 not-italic break-words">
            {addressLines.map((line) => (
              <p key={line} className="leading-relaxed">
                {line}
              </p>
            ))}
          </address>
        </li>
        <li className="flex items-center gap-3">
          <Mail className="h-5 w-5 shrink-0 text-sky-600" aria-hidden />
          <a
            href={`mailto:${COMPANY.emails.info}`}
            className="min-w-0 break-all font-medium text-neutral-900 hover:text-sky-700"
          >
            {COMPANY.emails.info}
          </a>
        </li>
        <li className="flex items-start gap-3">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" aria-hidden />
          <p className="min-w-0 break-words leading-relaxed">{COMPANY.hours}</p>
        </li>
      </ul>

      <a
        href={getCompanyMapsDirectionsUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-sky-600 transition hover:text-sky-700"
      >
        <ExternalLink className="h-4 w-4" aria-hidden />
        Yol tarifi al
      </a>
    </div>
  );
}
