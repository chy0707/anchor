import type { Metadata } from 'next';
import './globals.css';

import BottomTab from '../components/BottomTab';
import SettingsIconButton from '../components/SettingsIconButton';
import NotificationIconButton from '../components/NotificationIconButton';
import DisclaimerGate from '../components/DisclaimerGate';

import { PreferencesProvider } from '../components/PreferencesProvider';

export const metadata: Metadata = {
  title: 'MoodBuddy',
  description: 'A lightweight mood check-in app',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-black pb-16">
        <PreferencesProvider>
          {/* ===== First-run Disclaimer (global) ===== */}
          <DisclaimerGate />

          {/* ===== Top-left: notification (only renders on homepage internally) ===== */}
          <NotificationIconButton />

          {/* ===== Top-right: settings ===== */}
          <SettingsIconButton />

          {/* ===== Page content ===== */}
          {children}

          {/* ===== Bottom navigation (mobile) ===== */}
          <BottomTab />
        </PreferencesProvider>
      </body>
    </html>
  );
}