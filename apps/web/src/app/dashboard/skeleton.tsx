// Shared skeleton primitives used by each route's loading.tsx.
// Kept dependency-free (plain divs + Tailwind's built-in animate-pulse)
// so it costs nothing extra to ship.

export function SkeletonBlock({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-zinc-800/60 ${className}`}
      style={style}
    />
  );
}

export function SkeletonHeader() {
  return (
    <div className="space-y-2">
      <SkeletonBlock className="h-8 w-64" />
      <SkeletonBlock className="h-4 w-96 max-w-full" />
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-6 shadow-xl space-y-4 ${className}`}
    >
      <SkeletonBlock className="h-4 w-24" />
      <SkeletonBlock className="h-8 w-32" />
      <SkeletonBlock className="h-3 w-full" />
      <SkeletonBlock className="h-3 w-2/3" />
    </div>
  );
}

export function SkeletonCardGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 flex items-center gap-4">
      <SkeletonBlock className="h-8 w-8 shrink-0 !rounded-xl" />
      <div className="flex-1 space-y-2">
        <SkeletonBlock className="h-4 w-1/3" />
        <SkeletonBlock className="h-3 w-2/3" />
      </div>
    </div>
  );
}
