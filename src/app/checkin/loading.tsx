export default function Loading() {
  return (
    <main className="min-h-screen bg-[#FFF7F2] dark:bg-black px-4 pt-24 pb-24">
      <div className="max-w-md mx-auto w-full space-y-6">
        <div className="h-10 w-44 rounded-2xl bg-black/10 dark:bg-white/10 animate-pulse" />

        {/* mood buttons */}
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-2xl bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 animate-pulse" />
          ))}
        </div>

        {/* note box */}
        <div className="rounded-3xl bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 p-4">
          <div className="h-4 w-32 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
          <div className="mt-3 h-24 w-full rounded-2xl bg-black/10 dark:bg-white/10 animate-pulse" />
        </div>

        {/* submit */}
        <div className="h-12 w-full rounded-2xl bg-black/15 dark:bg-white/10 animate-pulse" />
      </div>
    </main>
  );
}