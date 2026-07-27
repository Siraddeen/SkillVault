import { SkeletonHeader, SkeletonRow } from "../skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-8">
      <SkeletonHeader />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  );
}
