import { SkeletonBlock, SkeletonRow } from "../../skeleton";

export default function CourseDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <SkeletonBlock className="h-4 w-40" />
      <div className="p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
        <SkeletonBlock className="h-8 w-2/3" />
        <SkeletonBlock className="h-4 w-full" />
        <SkeletonBlock className="h-4 w-1/2" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  );
}
