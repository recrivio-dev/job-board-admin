import Link from "next/link";
import { HiOutlineArrowCircleLeft } from "react-icons/hi";
import React from "react";

export interface BreadcrumbSegment {
  label: string;
  href?: string; // If present, render as a link; otherwise, plain text
}

interface BreadcrumbProps {
  segments: BreadcrumbSegment[];
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({
  segments,
  className = "",
}) => {
  return (
    <div className={`flex items-center gap-1 mb-2 ${className}`}>
      <Link
        href="/dashboard"
        className="flex items-center text-neutral-500 hover:text-neutral-700 font-medium text-sm transition-colors"
      >
        <HiOutlineArrowCircleLeft className="w-6 h-6 mr-1" />
        <span>Back to Dashboard</span>
      </Link>
      {segments.map((segment, idx) => (
        <React.Fragment key={idx}>
          <span className="text-sm text-neutral-500 font-light">/</span>
          {segment.href ? (
            <Link
              href={segment.href}
              className="text-neutral-500 hover:text-neutral-700 font-medium text-sm transition-colors"
            >
              {segment.label}
            </Link>
          ) : (
            <span className="text-sm font-medium text-neutral-900">
              {segment.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Breadcrumb;
