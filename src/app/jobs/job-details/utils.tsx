import Link from "next/link";
import { JobStatus, JobMetadata } from "@/types/custom";
import { JOB_STATUSES, STEPS } from "@/types/custom";
import { FaCaretDown, FaRegTrashAlt } from "react-icons/fa";
import { FiShare2, FiEdit3 } from "react-icons/fi";
import { LiaRupeeSignSolid } from "react-icons/lia";
import { GrLocation } from "react-icons/gr";
import { MdOutlinePeopleAlt } from "react-icons/md";
import Image from "next/image";
import BreadcrumbComponent from "@/components/Breadcrumb";

export const JobDetailsSkeleton: React.FC = () => (
  <div className="max-w-5xl w-full pb-20" data-testid="job-details-skeleton">
    <div className="flex gap-8 mb-8 items-center animate-pulse">
      <div className="w-24 h-24 bg-neutral-300 rounded-2xl" />
      <div className="flex-1">
        <div className="h-8 bg-neutral-300 rounded mb-2 w-3/4" />
        <div className="h-6 bg-neutral-300 rounded w-1/2" />
      </div>
    </div>

    <div className="flex flex-col lg:flex-row mb-6 justify-between items-start lg:items-end gap-6 animate-pulse">
      <div className="flex-1">
        <div className="flex flex-wrap gap-2 mb-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-8 bg-neutral-300 rounded-lg w-20" />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-8 bg-neutral-300 rounded-lg w-32" />
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="w-24 h-10 bg-neutral-300 rounded-lg" />
        ))}
      </div>
    </div>

    <div className="my-6 animate-pulse">
      <div className="h-6 bg-neutral-300 rounded w-32 mb-4" />
      <div className="space-y-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-4 bg-neutral-300 rounded" />
        ))}
      </div>
    </div>
  </div>
);

export const ErrorState: React.FC<{
  error: string;
  onRetry: () => void;
  onGoBack: () => void;
}> = ({ error, onRetry, onGoBack }) => (
  <div
    className="flex flex-col items-center justify-center py-12 text-center"
    data-testid="error-state"
  >
    <div className="w-32 h-32 bg-red-100 rounded-full flex items-center justify-center mb-4">
      <svg
        className="w-16 h-16 text-red-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
    <h3 className="text-xl font-semibold text-neutral-900 mb-2">
      Error loading job details
    </h3>
    <p className="text-neutral-600 mb-6" data-testid="error-message">
      {error}
    </p>
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onRetry}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg py-2 px-4 transition-colors"
        data-testid="retry-button"
      >
        Try Again
      </button>
      <button
        type="button"
        onClick={onGoBack}
        className="bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-medium rounded-lg py-2 px-4 transition-colors"
        data-testid="go-back-button"
      >
        Go Back
      </button>
    </div>
  </div>
);

export const JobNotFound: React.FC<{ onGoBack: () => void }> = ({
  onGoBack,
}) => (
  <div
    className="flex flex-col items-center justify-center py-12 text-center"
    data-testid="job-not-found"
  >
    <div className="w-32 h-32 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
      <svg
        className="w-16 h-16 text-neutral-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 17H9v-2.5a6 6 0 016-6v2.5z"
        />
      </svg>
    </div>
    <h3 className="text-xl font-semibold text-neutral-900 mb-2">
      Job not found
    </h3>
    <p className="text-neutral-600 mb-6">
      The job you&apos;re looking for doesn&apos;t exist or has been removed.
    </p>
    <button
      type="button"
      onClick={onGoBack}
      className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg py-2 px-4 transition-colors"
      data-testid="back-to-jobs-button"
    >
      ← Back to Jobs
    </button>
  </div>
);

// Breadcrumb Component
export const Breadcrumb = ({ jobTitle }: { jobTitle: string }) => (
  <BreadcrumbComponent
    segments={[
      { label: "Jobs", href: "/jobs" },
      { label: jobTitle || "Job Details" },
    ]}
  />
);

// Tab Navigation Component
export const TabNavigation: React.FC<{
  activeStep: number;
  onStepChange: (step: number) => void;
}> = ({ activeStep, onStepChange }) => (
  <div className="flex gap-4 mb-6" data-testid="tab-navigation">
    <div className="flex gap-4 border-b border-neutral-300 w-fit">
      {STEPS.map((stepName, index) => (
        <button
          key={stepName}
          className={`px-4 py-2 text-center font-medium transition-colors whitespace-nowrap cursor-pointer ${
            index === activeStep
              ? "border-b-4 border-blue-600 text-blue-600"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
          onClick={() => onStepChange(index)}
          type="button"
          data-testid={`tab-${stepName.toLowerCase().replace(" ", "-")}`}
        >
          {stepName}
        </button>
      ))}
    </div>
  </div>
);

// Status Dropdown Component
export const StatusDropdown: React.FC<{
  status: JobStatus;
  onChange: (status: JobStatus) => void;
  disabled: boolean;
}> = ({ status, onChange, disabled }) => (
  <div className="relative w-full" data-testid="status-dropdown">
    <label className="block text-sm font-medium text-neutral-700 mb-2">
      Job Status
    </label>
    <select
      value={status}
      onChange={(e) => onChange(e.target.value as JobStatus)}
      disabled={disabled}
      className={`w-full appearance-none text-sm font-medium px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 pr-10 ${
        status === "active"
          ? "bg-green-50 text-green-700 border-green-200 focus:ring-green-500"
          : status === "closed"
          ? "bg-red-50 text-red-700 border-red-200 focus:ring-red-500"
          : "bg-yellow-50 text-yellow-700 border-yellow-200 focus:ring-yellow-500"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-md"}`}
    >
      {JOB_STATUSES.map((statusOption) => (
        <option key={statusOption} value={statusOption}>
          {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
        </option>
      ))}
    </select>
    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none mt-7">
      <FaCaretDown className="text-neutral-400" />
    </div>
  </div>
);

// Action Buttons Component
export const ActionButtons: React.FC<{
  jobId: string;
  loading: boolean;
  onShare: () => void;
  onDelete: () => void;
}> = ({ jobId, loading, onShare, onDelete }) => (
  <div className="flex flex-col gap-3" data-testid="action-buttons">
    <Link
      href={`/jobs/edit?jobId=${jobId}`}
      className="text-white text-sm font-medium bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center hover:shadow-md"
      data-testid="edit-job-button"
    >
      <FiEdit3 className="mr-2 h-4 w-4" />
      Edit Job
    </Link>

    <button
      onClick={onShare}
      className="text-neutral-700 text-sm font-medium bg-neutral-100 hover:bg-neutral-200 px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center hover:shadow-md"
      type="button"
      data-testid="share-button"
    >
      <FiShare2 className="mr-2 h-4 w-4" />
      Share
    </button>

    <button
      onClick={onDelete}
      disabled={loading}
      className="text-white text-sm font-medium bg-red-600 hover:bg-red-700 px-4 py-3 rounded-xl transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
      type="button"
      data-testid="delete-button"
    >
      <FaRegTrashAlt className="h-4 w-4 mr-2" />
      {loading ? "Deleting..." : "Delete"}
    </button>
  </div>
);

// Delete Confirmation Modal Component
export const DeleteConfirmationModal: React.FC<{
  isOpen: boolean;
  jobTitle: string;
  loading: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ isOpen, jobTitle, loading, error, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4"
      data-testid="delete-modal"
    >
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">
          Confirm Job Deletion
        </h3>
        <p className="text-neutral-600 mb-2">
          Are you sure you want to delete{" "}
          <span className="font-medium">&ldquo;{jobTitle}&rdquo;</span>?
        </p>
        <p className="text-neutral-600 mb-6">
          This action cannot be undone and will permanently remove the job
          posting and all associated data.
        </p>

        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
            data-testid="delete-error"
          >
            Error: {error}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-neutral-600 bg-neutral-200 hover:bg-neutral-300 rounded-lg transition-colors disabled:opacity-50"
            data-testid="cancel-delete-button"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center"
            data-testid="confirm-delete-button"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <FaRegTrashAlt className="mr-2 h-4 w-4" />
                Delete Job
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Job Header Component
export const JobHeader: React.FC<{
  jobMetadata: JobMetadata;
  jobId?: string;
}> = ({ jobMetadata, jobId }) => (
  <div className="flex gap-6 items-start" data-testid="job-header">
    <div className="flex-shrink-0">
      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-neutral-100 border-2 border-neutral-200 shadow-sm">
        <Image
          src={jobMetadata.company_logo_url || "/demo.png"}
          alt={`${jobMetadata.companyName} logo`}
          width={80}
          height={80}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "/demo.png";
          }}
          data-testid="company-logo"
        />
      </div>
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h1
            className="text-3xl font-bold text-neutral-900 mb-2 leading-tight"
            data-testid="job-title"
          >
            {jobMetadata.jobTitle}
          </h1>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div>
              <p
                className="text-lg font-semibold text-neutral-900"
                data-testid="company-name"
              >
                {jobMetadata.companyName}
              </p>
              <p className="text-sm text-neutral-600">Hiring Company</p>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 ml-4">
          <div className="text-right">
            <p className="text-sm text-neutral-600">Job ID</p>
            <p
              className="font-mono text-sm text-neutral-900 truncate max-w-[120px]"
              title={jobId}
            >
              {jobId ? `#${jobId.slice(-8).toUpperCase()}` : "#--------"}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Job Info Tags Component
export const JobInfoTags: React.FC<{
  jobMetadata: JobMetadata;
  numberOfCandidates: number;
  formatSalary: (min: string, max: string) => string;
}> = ({ jobMetadata, numberOfCandidates, formatSalary }) => (
  <div className="w-full" data-testid="job-info-tags">
    {/* Job Type Tags */}
    <div className="flex flex-wrap gap-3 mb-6">
      {jobMetadata.jobType && (
        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0V6a2 2 0 00-2 2v6"
            />
          </svg>
          {jobMetadata.jobType}
        </span>
      )}
      {jobMetadata.jobLocationType && (
        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {jobMetadata.jobLocationType}
        </span>
      )}
      {jobMetadata.workingType && (
        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {jobMetadata.workingType}
        </span>
      )}
    </div>

    {/* Job Info Grid */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {jobMetadata.jobLocation && (
        <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <GrLocation className="text-blue-600 text-lg" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Location</p>
              <p className="font-semibold text-neutral-900">
                {jobMetadata.jobLocation}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
            <LiaRupeeSignSolid className="text-green-600 text-xl" />
          </div>
          <div>
            <p className="text-sm text-neutral-600">Salary</p>
            <p className="font-semibold text-neutral-900">
              {formatSalary(jobMetadata.salary.min, jobMetadata.salary.max)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
            <MdOutlinePeopleAlt className="text-purple-600 text-lg" />
          </div>
          <div>
            <p className="text-sm text-neutral-600">Applications</p>
            <p className="font-semibold text-neutral-900">
              {numberOfCandidates} Applicant
              {numberOfCandidates !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);
