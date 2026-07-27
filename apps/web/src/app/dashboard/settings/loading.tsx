import { SkeletonBlock, SkeletonHeader } from "../skeleton";

export default function SettingsLoading() {
  return (
    <div className="max-w-3xl space-y-8">
      <SkeletonHeader />
      <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-6 shadow-xl space-y-4">
        <SkeletonBlock className="h-4 w-48" />
        <SkeletonBlock className="h-24 w-24 !rounded-full" />
      </div>
      <div className="rounded-2xl border border-zinc-800/90 bg-zinc-900/50 p-6 shadow-xl space-y-4">
        <SkeletonBlock className="h-4 w-40" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SkeletonBlock className="h-10 w-full" />
          <SkeletonBlock className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
