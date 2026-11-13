import { Footer } from '@/components/layout/footer';
import { SiteHeader } from '@/components/layout/site-header';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
