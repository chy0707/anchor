'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const KEY = 'disclaimer_ack_v1';

export default function DisclaimerGate() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      const ack = localStorage.getItem(KEY) === 'true';
      setOpen(!ack);
    } catch {
      setOpen(true);
    }
  }, [mounted]);

  // 在 settings 页面就不强制弹（避免你编辑设置时一直挡住）
  useEffect(() => {
    if (!mounted) return;
    if (pathname === '/settings') setOpen(false);
  }, [mounted, pathname]);

  const accept = () => {
    try {
      localStorage.setItem(KEY, 'true');
    } catch {}
    setOpen(false);
  };

  if (!mounted || !open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* sheet */}
      <div className="relative w-full sm:max-w-md mx-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-black border border-black/10 dark:border-white/10 p-5 sm:p-6 shadow-2xl">
        <div className="text-lg font-extrabold text-black dark:text-white">
          Disclaimer
        </div>

        <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          <p>
            MoodBuddy is for self-reflection and mood tracking only. It is <b>not</b> a medical device
            and does not provide diagnosis, treatment, or professional mental health services.
          </p>
          <p>
            If you are experiencing a crisis or feel you may be in danger, please seek immediate help
            from local emergency services or a qualified professional.
          </p>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            className="flex-1 rounded-2xl py-3 bg-black text-white dark:bg-white dark:text-black font-semibold"
            onClick={accept}
          >
            I understand
          </button>

          <button
            className="rounded-2xl px-4 py-3 bg-black/5 text-black dark:bg-white/10 dark:text-white font-medium"
            onClick={() => router.push('/settings')}
            title="Open Settings"
          >
            Settings
          </button>
        </div>

        <div className="mt-3 text-[11px] text-gray-500 dark:text-gray-400">
          You can review this anytime in Settings.
        </div>
      </div>
    </div>
  );
}