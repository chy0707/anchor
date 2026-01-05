'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

function GearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="stroke-current">
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M19.4 15a8.6 8.6 0 0 0 .1-2l2-1.5-2-3.5-2.4.8a7.9 7.9 0 0 0-1.7-1L15 5h-6l-.4 2.8a7.9 7.9 0 0 0-1.7 1L4.5 8 2.5 11.5l2 1.5a8.6 8.6 0 0 0 .1 2l-2 1.5 2 3.5 2.4-.8a7.9 7.9 0 0 0 1.7 1L9 19h6l.4-2.8a7.9 7.9 0 0 0 1.7-1l2.4.8 2-3.5-2-1.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SettingsIconButton() {
  const [mounted, setMounted] = useState(false);

  // Avoid SSR/CSR mismatch by rendering only after client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <Link
        href="/settings"
        aria-label="Open settings"
        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/50 dark:bg-black/40 text-gray-800 dark:text-gray-100 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-sm hover:bg-white/70 dark:hover:bg-black/55 transition"
      >
        <GearIcon />
      </Link>
    </div>
  );
}