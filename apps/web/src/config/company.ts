/** Public company identity — production domain after Cyberpark company setup. */
export const COMPANY_DOMAIN = 'turta.com.tr';

export const COMPANY_SITE_URL = `https://www.${COMPANY_DOMAIN}`;

export const COMPANY_EMAILS = {
  info: `info@${COMPANY_DOMAIN}`,
  support: `destek@${COMPANY_DOMAIN}`,
  partners: `partners@${COMPANY_DOMAIN}`,
  privacy: `privacy@${COMPANY_DOMAIN}`,
} as const;
