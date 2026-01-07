'use client';

import { useEffect, useState } from 'react';

const SPLASH_SEEN_KEY = 'moodbuddy.splash.seen.v1';

export default function AppSplash() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const seen = sessionStorage.getItem(SPLASH_SEEN_KEY);

      if (seen === '1') {
        setVisible(false);
        return;
      }

      sessionStorage.setItem(SPLASH_SEEN_KEY, '1');
      setVisible(true);

      
      const t = setTimeout(() => setVisible(false), 900);
      return () => clearTimeout(t);
    } catch {
    
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 900);
      return () => clearTimeout(t);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#FFF7F2]">
      <div className="flex flex-col items-center animate-fade-in">
        {/* App Icon */}
        <div className="h-20 w-20 rounded-[22px] bg-white shadow-sm flex items-center justify-center">
          <img
            src="/screenshots/icon/moodbuddy_icon_192.png"
            alt="MoodBuddy"
            className="h-14 w-14"
            draggable={false}
          />
        </div>

        {/* App Name */}
        <div className="mt-4 text-[18px] font-extrabold tracking-tight text-black">
          MoodBuddy
        </div>
      </div>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.35s ease-out both;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}