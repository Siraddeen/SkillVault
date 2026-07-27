import { SkeletonBlock, SkeletonHeader } from "../skeleton";

export default function CoursesLoading() {
  return (
    <div className="space-y-8">
      <SkeletonHeader />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 overflow-hidden"
          >
            <SkeletonBlock className="h-32 w-full !rounded-none" />
            <div className="p-5 space-y-3">
              <SkeletonBlock className="h-4 w-20" />
              <SkeletonBlock className="h-5 w-3/4" />
              <SkeletonBlock className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
