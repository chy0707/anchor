'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Tab = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

function BarsIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={clsx('h-6 w-6', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20V8" />
    </svg>
  );
}

function SparkIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={clsx('h-6 w-6', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2l1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2z" />
    </svg>
  );
}

export default function BottomTab() {
  const pathname = usePathname();

  const tabs: Tab[] = [
    { href: '/', label: 'Overview', icon: <SparkIcon /> },
    { href: '/checkin', label: 'Check-in', icon: '+' },
    { href: '/history', label: 'History', icon: <BarsIcon /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-md px-4 pb-4">
        <div
          className={clsx(
            'grid grid-cols-3 items-center rounded-3xl border shadow-sm',
            'bg-white/80 border-black/5',
            'dark:bg-black/60 dark:border-white/10',
            'backdrop-blur-xl'
          )}
        >
          {tabs.map((t) => {
            const active = pathname === t.href;
            const isCheckin = t.href === '/checkin';
            const baseBtn = 'flex flex-col items-center justify-center gap-1 py-3';

            if (isCheckin) {
              return (
                <Link key={t.href} href={t.href} className={clsx(baseBtn, 'relative')}>
                  <div
                    className={clsx(
                      'flex h-10 w-10 items-center justify-center rounded-2xl',
                      active
                        ? 'bg-black text-white dark:bg-white dark:text-black'
                        : 'bg-black/90 text-white dark:bg-white/90 dark:text-black'
                    )}
                  >
                    <span className="text-2xl leading-none">{t.icon}</span>
                  </div>

                  <span
                    className={clsx(
                      'text-xs font-medium',
                      active ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-300'
                    )}
                  >
                    {t.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link key={t.href} href={t.href} className={clsx(baseBtn)}>
                <div
                  className={clsx(
                    'flex h-10 w-10 items-center justify-center rounded-full transition',
                    'hover:bg-black/5 dark:hover:bg-white/10'
                  )}
                >
                  <span
                    className={clsx(
                      active ? 'text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'
                    )}
                  >
                    {t.icon}
                  </span>
                </div>

                <span
                  className={clsx(
                    'text-xs font-medium',
                    active ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-300'
                  )}
                >
                  {t.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}