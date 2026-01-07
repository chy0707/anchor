export default function Loading() {
  return (
    <main className="min-h-screen bg-[#FFF7F2] dark:bg-black px-4 pt-24 pb-24">
      <div className="max-w-md mx-auto w-full space-y-6">
        <div className="h-10 w-44 rounded-2xl bg-black/10 dark:bg-white/10 animate-pulse" />

        {/* calendar header */}
        <div className="flex items-center justify-between">
          <div className="h-9 w-9 rounded-full bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-5 w-40 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="h-9 w-9 rounded-full bg-black/10 dark:bg-white/10 animate-pulse" />
        </div>

        {/* calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 animate-pulse" />
          ))}
        </div>

        {/* trend card */}
        <div className="rounded-3xl bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-28 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
            <div className="h-8 w-28 rounded-full bg-black/10 dark:bg-white/10 animate-pulse" />
          </div>
          <div className="mt-4 h-[150px] w-full rounded-2xl bg-black/10 dark:bg-white/10 animate-pulse" />
        </div>

        {/* summary */}
        <div className="rounded-3xl bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 p-4">
          <div className="h-5 w-24 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="mt-4 grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-black/10 dark:bg-white/10 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}