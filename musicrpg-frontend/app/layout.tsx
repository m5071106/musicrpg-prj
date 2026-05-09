import type { Metadata, Viewport } from 'next';
import { DotGothic16, Noto_Sans_JP } from 'next/font/google';
import UpdateBanner from '@/components/UpdateBanner';
import './globals.css';

const dotGothic = DotGothic16({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-dot-gothic',
  display: 'swap',
});

const notoSansJP = Noto_Sans_JP({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Musician RPG Card',
  description: '演奏家のためのRPGカードアプリ',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Musician RPG',
  },
};

export const viewport: Viewport = {
  themeColor: '#b06ee0',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${dotGothic.variable} ${notoSansJP.variable}`}>
      <body className="overflow-x-hidden">
        {children}
        <UpdateBanner />
      </body>
    </html>
  );
}
