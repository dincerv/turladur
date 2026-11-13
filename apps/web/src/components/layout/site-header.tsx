import Header from '@/components/layout/header';

/**
 * Server entry for marketing layouts — interactive island lives in Header (client).
 * Footer is a pure Server Component; header needs auth/menu client state.
 */
export function SiteHeader() {
  return <Header />;
}
