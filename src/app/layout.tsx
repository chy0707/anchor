// src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';

import AppSplash from '../components/AppSplash';
import BottomTab from '../components/BottomTab';
import NotificationIconButton from '../components/NotificationIconButton';
import SettingsIconButton from '../components/SettingsIconButton';
import { PreferencesProvider } from '../components/PreferencesProvider';

export const metadata: Metadata = {
  // Production base URL for generating absolute OG/Twitter image URLs
  metadataBase: new URL('https://anchor-mood.vercel.app'),

  title: 'ANCHOR',
  description:
    'A lightweight mood-tracking product for emotional awareness—simple check-ins, gentle reflection, and data-informed insights.',

  // Social previews (LinkedIn / Facebook / Slack / iMessage)
  openGraph: {
    title: 'ANCHOR',
    description: 'A lightweight mood-tracking product for emotional awareness.',
    url: '/',
    siteName: 'ANCHOR',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'ANCHOR – mood tracking for emotional awareness',
      },
    ],
    type: 'website',
  },

  // Twitter/X preview
  twitter: {
    card: 'summary_large_image',
    title: 'ANCHOR',
    description: 'A lightweight mood-tracking product for emotional awareness.',
    images: ['/og.png'],
  },

  // PWA / icons
  icons: {
    icon: [{ url: '/favicon.ico' }],
    apple: [{ url: '/apple-touch-icon.png' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-black pb-16">
        <PreferencesProvider>
          {/* App splash screen (shown once per day on first open) */}
          <AppSplash />

          {/* Top-left: notification (homepage only internally) */}
          <NotificationIconButton />

          {/* Top-right: settings */}
          <SettingsIconButton />

          {/* Main page content */}
          {children}

          {/* Bottom navigation (mobile) */}
          <BottomTab />
        </PreferencesProvider>
      </body>
    </html>
  );
}