import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import './collapsed.css';
import './avatars.css';
import './weekly.css';
import './reminders.css';
import './chores.css';
import './personal.css';
import './gamify.css';
import './mobile.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CozyFlat – Gemeinsam zuhause anpacken',
  description: 'Eure gemeinsame App für Pflanzen, Haushalt und kleine Erfolgsmomente.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/app-icon.png', type: 'image/png' }],
    apple: [{ url: '/app-icon.png', type: 'image/png' }],
  },
  appleWebApp: { capable: true, title: 'CozyFlat', statusBarStyle: 'default' },
  openGraph: {
    title: 'CozyFlat',
    description: 'Pflanzen, Haushalt und gemeinsame Level für Sonja und Johannes.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'CozyFlat – gemeinsam zuhause anpacken' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CozyFlat',
    description: 'Pflanzen, Haushalt und gemeinsame Level für Sonja und Johannes.',
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
