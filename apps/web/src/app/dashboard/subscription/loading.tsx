import { SkeletonBlock, SkeletonCardGrid, SkeletonHeader } from "../skeleton";

export default function SubscriptionLoading() {
  return (
    <div className="space-y-8">
      <SkeletonHeader />
      <SkeletonCardGrid count={3} />
      <SkeletonBlock className="h-10 w-40" />
    </div>
  );
}
