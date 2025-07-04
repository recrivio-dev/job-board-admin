import React from "react";

const CandidatesSkeleton: React.FC = () => (
  <div className="w-full mx-auto px-0 md:px-4 py-4 md:py-2">
    {/* Breadcrumb Skeleton */}
    <div className="mb-6">
      <div className="h-4 bg-neutral-200 rounded w-24 animate-pulse" />
    </div>

    {/* Header Section Skeleton */}
    <div className="flex items-center flex-wrap justify-between mb-10">
      <div className="animate-pulse">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-7 bg-neutral-200 rounded w-40" />
        </div>
        <div className="h-4 bg-neutral-200 rounded w-80" />
      </div>
    </div>

    {/* Search Bar Skeleton */}
    <div className="w-full md:w-125 mb-8">
      <div className="relative animate-pulse">
        <div className="h-10 bg-neutral-200 rounded-lg w-full" />
      </div>
    </div>

    {/* Table Skeleton */}
    <div className="overflow-x-auto">
      <TableSkeleton />
    </div>
  </div>
);

export const TableSkeleton: React.FC = () => (
  <div className="animate-pulse overflow-hidden">
    <table className="min-w-full divide-y divide-neutral-200">
      {/* Table Header Skeleton */}
      <thead className="bg-neutral-50">
        <tr>
          {/* Checkbox column */}
          <th 
            className="sticky left-0 z-20 bg-neutral-50 shadow-[1px_0_0_0_#e5e7eb] px-6 py-3" 
            style={{ width: "48px", minWidth: "48px" }}
          >
            <div className="w-4 h-4 bg-neutral-300 rounded" />
          </th>
          {/* ID column */}
          <th className="px-6 py-3">
            <div className="h-3 bg-neutral-300 rounded w-8" />
          </th>
          {/* Applied Date column */}
          <th className="px-6 py-3">
            <div className="h-3 bg-neutral-300 rounded w-20" />
          </th>
          {/* Candidate Name column */}
          <th className="px-6 py-3">
            <div className="h-3 bg-neutral-300 rounded w-28" />
          </th>
          {/* Job column */}
          <th className="px-6 py-3">
            <div className="h-3 bg-neutral-300 rounded w-12" />
          </th>
          {/* Company column */}
          <th className="px-6 py-3">
            <div className="h-3 bg-neutral-300 rounded w-16" />
          </th>
          {/* Location column */}
          <th className="px-6 py-3">
            <div className="h-3 bg-neutral-300 rounded w-16" />
          </th>
          {/* Status column */}
          <th 
            className="sticky z-20 bg-neutral-50 shadow-[-1px_0_0_0_#e5e7eb] px-6 py-3 text-center" 
            style={{ width: "140px", minWidth: "140px", right: "120px" }}
          >
            <div className="h-3 bg-neutral-300 rounded w-12 mx-auto" />
          </th>
          {/* Actions column */}
          <th 
            className="sticky right-0 z-20 bg-neutral-50 shadow-[-1px_0_0_0_#e5e7eb] px-6 py-3" 
            style={{ width: "120px", minWidth: "120px" }}
          >
            <div className="h-3 bg-neutral-300 rounded w-12" />
          </th>
        </tr>
      </thead>
      
      {/* Table Body Skeleton */}
      <tbody className="bg-white divide-y divide-neutral-200">
        {Array.from({ length: 8 }).map((_, index) => (
          <tr key={index}>
            {/* Checkbox */}
            <td 
              className="sticky left-0 z-10 bg-white shadow-[1px_0_0_0_#e5e7eb] px-6 py-4" 
              style={{ width: "48px", minWidth: "48px" }}
            >
              <div className="w-4 h-4 bg-neutral-200 rounded" />
            </td>
            {/* ID */}
            <td className="px-6 py-4">
              <div className="h-4 bg-neutral-200 rounded w-12" />
            </td>
            {/* Applied Date */}
            <td className="px-6 py-4">
              <div className="h-4 bg-neutral-200 rounded w-20" />
            </td>
            {/* Candidate Name */}
            <td className="px-6 py-4">
              <div className="space-y-2">
                <div className="h-4 bg-neutral-200 rounded w-32" />
                <div className="h-3 bg-neutral-200 rounded w-28" />
              </div>
            </td>
            {/* Job */}
            <td className="px-6 py-4">
              <div className="h-4 bg-neutral-200 rounded w-24" />
            </td>
            {/* Company */}
            <td className="px-6 py-4">
              <div className="h-4 bg-neutral-200 rounded w-20" />
            </td>
            {/* Location */}
            <td className="px-6 py-4">
              <div className="h-4 bg-neutral-200 rounded w-24" />
            </td>
            {/* Status */}
            <td 
              className="sticky z-10 bg-white shadow-[-1px_0_0_0_#e5e7eb] px-6 py-4 text-center" 
              style={{ width: "140px", minWidth: "140px", right: "120px" }}
            >
              <div className="h-6 bg-neutral-200 rounded-full w-16 mx-auto" />
            </td>
            {/* Actions */}
            <td 
              className="sticky right-0 z-10 bg-white shadow-[-1px_0_0_0_#e5e7eb] px-6 py-4" 
              style={{ width: "120px", minWidth: "120px" }}
            >
              <div className="h-8 bg-neutral-200 rounded w-12" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default CandidatesSkeleton;