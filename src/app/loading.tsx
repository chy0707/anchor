export default function Loading() {
  return (
    <main className="min-h-screen bg-[#FFF7F2] dark:bg-black px-4 pt-24 pb-24">
      <div className="max-w-md mx-auto w-full">
        {/* Top bar skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-10 w-44 rounded-2xl bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-10 w-10 rounded-full bg-black/10 dark:bg-white/10 animate-pulse" />
        </div>

        <div className="mt-8 space-y-4">
          {/* Hero text skeleton */}
          <div className="space-y-3">
            <div className="h-9 w-64 rounded-2xl bg-black/10 dark:bg-white/10 animate-pulse" />
            <div className="h-5 w-48 rounded-2xl bg-black/10 dark:bg-white/10 animate-pulse" />
          </div>

          {/* Cards skeleton */}
          <div className="rounded-3xl bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 p-4">
            <div className="h-5 w-40 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
            <div className="mt-3 h-20 w-full rounded-2xl bg-black/10 dark:bg-white/10 animate-pulse" />
          </div>

          <div className="rounded-3xl bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 p-4">
            <div className="h-5 w-52 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
            <div className="mt-3 space-y-2">
              <div className="h-12 w-full rounded-2xl bg-black/10 dark:bg-white/10 animate-pulse" />
              <div className="h-12 w-full rounded-2xl bg-black/10 dark:bg-white/10 animate-pulse" />
              <div className="h-12 w-full rounded-2xl bg-black/10 dark:bg-white/10 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Subtle footer hint */}
        <div className="mt-8 text-center text-xs text-black/40 dark:text-white/40">
          Loading…
        </div>
      </div>
    </main>
  );
}