import { Footer } from '@/components/layout/footer';
import { SiteHeader } from '@/components/layout/site-header';

export const dynamic = 'force-dynamic';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-neutral-50 pt-16">{children}</main>
      <Footer />
    </>
  );
}
