import { SkeletonCardGrid, SkeletonHeader } from "./skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <SkeletonHeader />
      <SkeletonCardGrid count={4} />
    </div>
  );
}
