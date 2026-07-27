import { SkeletonBlock, SkeletonCardGrid, SkeletonHeader } from "../skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="space-y-8">
      <SkeletonHeader />
      <SkeletonCardGrid count={3} />
      <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-6 shadow-xl">
        <SkeletonBlock className="h-4 w-32 mb-6" />
        <div className="flex items-end gap-2 h-40">
          {/* Varied heights so it visually reads as a bar chart while loading */}
          {[45, 70, 55, 90, 60, 80, 50, 65, 95, 40, 75, 85, 55, 70].map(
            (h, i) => (
              <SkeletonBlock
                key={i}
                className="flex-1"
                style={{ height: `${h}%` }}
              />
            ),
          )}
        </div>
      </div>
    </div>
  );
}
