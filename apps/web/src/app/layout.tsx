import type { Metadata } from 'next';
import { Montserrat, Poppins } from 'next/font/google';

import { AuthProvider } from '@/providers/auth-provider';
import { PostHogProvider } from '@/providers/posthog-provider';
import { QueryProvider } from '@/providers/query-provider';

import './globals.css';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      'https://turladur-zjyf.vercel.app',
  ),
  title: {
    default: 'turta',
    template: '%s | turta',
  },
  description:
    'Turizm ekosistem platformu — turlar, rezervasyon, güvenli ödeme',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${montserrat.variable} ${poppins.variable} font-[family-name:var(--font-poppins)] antialiased`}
      >
        <QueryProvider>
          <PostHogProvider>
            <AuthProvider>{children}</AuthProvider>
          </PostHogProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
