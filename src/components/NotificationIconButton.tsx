'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="stroke-current">
      <path
        d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function NotificationIconButton() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Avoid SSR / hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Only show on Home (/)
  if (!mounted || pathname !== '/') return null;

  return (
    <div className="fixed top-4 left-4 z-50">
      <Link
        href="/notifications"
        aria-label="Open notifications"
        className="
          inline-flex items-center justify-center
          w-10 h-10 rounded-full
          bg-white/50 dark:bg-black/40
          text-gray-800 dark:text-gray-100
          backdrop-blur-md
          border border-white/40 dark:border-white/10
          shadow-sm
          hover:bg-white/70 dark:hover:bg-black/55
          transition
        "
      >
        <BellIcon />
      </Link>
    </div>
  );
}