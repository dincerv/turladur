import type { CompanyEmailKey } from '@/lib/company';
import { getCompanyEmail, getCompanyMailto } from '@/lib/company';

type MailtoLinkProps = {
  emailKey?: CompanyEmailKey;
  subject?: string;
  className?: string;
  children?: React.ReactNode;
};

/**
 * Central mailto — never hardcode addresses in pages.
 * Visible text uses a zero-width joiner near @ to blunt naive scrapers;
 * href remains a real mailto for accessibility.
 */
export function MailtoLink({
  emailKey = 'info',
  subject,
  className,
  children,
}: MailtoLinkProps) {
  const email = getCompanyEmail(emailKey);
  const display = children ?? email.replace('@', `\u200B@\u200B`);

  return (
    <a href={getCompanyMailto(emailKey, subject)} className={className}>
      {display}
    </a>
  );
}
