import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import './collapsed.css';
import './avatars.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Gießrunde – Gemeinsam Pflanzen pflegen',
  description: 'Euer gemeinsamer, einfacher Gießplan für alle Pflanzen zuhause.',
  appleWebApp: { capable: true, title: 'Gießrunde', statusBarStyle: 'default' },
  openGraph: {
    title: 'Gießrunde',
    description: 'Gemeinsam gepflegt. Mit Liebe gegossen.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Gießrunde – gemeinsamer Gießplan' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gießrunde',
    description: 'Gemeinsam gepflegt. Mit Liebe gegossen.',
    images: ['/og.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#173c2d',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
