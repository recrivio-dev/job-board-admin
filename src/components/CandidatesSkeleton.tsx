import React from "react";

const CandidatesSkeleton: React.FC = () => (
  <div className="w-full mx-auto px-0 md:px-4 py-4 md:py-2 animate-pulse">
    {/* Header Skeleton */}
    <div className="h-8 bg-neutral-200 rounded w-48 mb-8" />
    {/* Search Bar Skeleton */}
    <div className="h-10 bg-neutral-200 rounded-lg w-full md:w-125 mb-8" />
    {/* List Skeleton */}
    <div className="space-y-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="h-10 w-10 bg-neutral-200 rounded-full" />
          <div className="flex-1">
            <div className="h-4 bg-neutral-200 rounded w-1/2 mb-2" />
            <div className="h-3 bg-neutral-200 rounded w-1/3" />
          </div>
          <div className="h-8 w-24 bg-neutral-200 rounded-lg ml-auto" />
        </div>
      ))}
    </div>
  </div>
);

export default CandidatesSkeleton;
