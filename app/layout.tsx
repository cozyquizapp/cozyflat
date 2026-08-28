import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import AccessGate from './AccessGate';
import { accessProtectionEnabled, browserHasAccess } from './access';
import './globals.css';
import './collapsed.css';
import './avatars.css';
import './weekly.css';
import './reminders.css';
import './chores.css';
import './personal.css';
import './gamify.css';
import './mobile.css';
import './garden-game.css';
import './cozy-system.css';
import './wow.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://cozyflat.cozyquiz.app'),
  title: 'CozyFlat – Gemeinsam zuhause anpacken',
  description: 'Eure gemeinsame App für Pflanzen, Haushalt und kleine Erfolgsmomente.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon-32.png'],
  },
  appleWebApp: { capable: true, title: 'CozyFlat', statusBarStyle: 'default' },
  openGraph: {
    title: 'CozyFlat',
    description: 'Pflanzen, Haushalt und gemeinsame Level für Sonja und Johannes.',
    images: [{ url: '/og.png', width: 1672, height: 936, alt: 'CozyFlat – gemeinsam zuhause anpacken' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CozyFlat',
    description: 'Pflanzen, Haushalt und gemeinsame Level für Sonja und Johannes.',
    images: ['/og.png'],
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export const viewport: Viewport = {
  themeColor: '#173c2d',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locked = accessProtectionEnabled() && !(await browserHasAccess());

  return (
    <html lang="de">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {locked ? <AccessGate /> : children}
      </body>
    </html>
  );
}
