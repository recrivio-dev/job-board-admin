import React from "react";

const DashboardSkeleton: React.FC = () => (
  <div className="max-w-8xl mx-auto px-2 py-4 animate-pulse">
    {/* Title Skeleton */}
    <div className="h-8 bg-neutral-200 rounded w-40 mb-8" />
    {/* Stat Cards Skeleton */}
    <div className="flex flex-wrap gap-4 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-neutral-200 rounded-2xl h-44 flex-1 min-w-3xs"
        />
      ))}
    </div>
    {/* Chart Skeleton */}
    <div className="bg-neutral-200 rounded-2xl h-96" />
  </div>
);

export default DashboardSkeleton;
