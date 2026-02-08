"use client";

export function SkeletonLine({
  width = "100%",
  height = "1rem",
}: {
  width?: string;
  height?: string;
}) {
  return <div className="skeleton" style={{ width, height }} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-6">
      <SkeletonLine width="40%" height="0.875rem" />
      <div className="mt-3">
        <SkeletonLine width="70%" height="2rem" />
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-6 space-y-4">
      <SkeletonLine width="30%" height="1rem" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="skeleton w-8 h-8 rounded-full" />
          <SkeletonLine width="20%" height="0.875rem" />
          <div className="flex-1" />
          <SkeletonLine width="15%" height="0.875rem" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-card-bg border border-card-border rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <SkeletonLine width="25%" height="1rem" />
        <SkeletonLine width="200px" height="2rem" />
      </div>
      <div className="skeleton w-full" style={{ height: "300px" }} />
    </div>
  );
}
