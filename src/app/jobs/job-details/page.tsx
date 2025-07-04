"use client";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  fetchJobById,
  deleteJob,
  updateJob,
  selectJobs,
  selectJobsLoading,
  selectJobsError,
  clearError,
  selectSelectedJob,
  clearSelectedJob,
} from "@/store/features/jobSlice";
import CandidatesList from "@/components/candidates_list_component";
import JobDescriptionRenderer from "@/components/JobDescriptionRenderer";
import {
  UserContext,
  setUserContext,
  fetchJobApplicationsWithAccess,
  selectUserContext,
  selectCandidates,
} from "@/store/features/candidatesSlice";
import { initializeAuth } from "@/store/features/userSlice";
import { JobMetadata, JobStatus } from "@/types/custom";
// import { STEPS } from "@/types/custom";
import {
  JobDetailsSkeleton,
  ErrorState,
  JobNotFound,
  Breadcrumb,
  TabNavigation,
  StatusDropdown,
  ActionButtons,
  DeleteConfirmationModal,
  JobHeader,
  JobInfoTags,
} from "./utils";
import { RootState } from "@/store/store";
import { Suspense } from "react";

// Main Component - Optimized Version
export default function JobDetailsComponent() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // State management
  const [step, setStep] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Redux selectors - moved up for better organization
  const collapsed = useAppSelector(
    (state: RootState) => state.ui.sidebar.collapsed
  );
  const jobs = useAppSelector(selectJobs);
  const selectedJob = useAppSelector(selectSelectedJob);
  const loading = useAppSelector(selectJobsLoading);
  const error = useAppSelector(selectJobsError);
  const userContext = useAppSelector(selectUserContext);
  const user = useAppSelector((state) => state.user.user);
  const organization = useAppSelector((state) => state.user.organization);
  const roles = useAppSelector((state) => state.user.roles);
  const candidates = useAppSelector(selectCandidates);

  // URL params
  const params = useSearchParams();
  const jobId = params.get("jobID") || params.get("jobId");

  // Calculate number of candidates for this specific job
  const numberOfCandidates = useMemo(() => {
    if (!jobId || !candidates || !Array.isArray(candidates)) {
      return 0;
    }

    const filteredCandidates = candidates.filter(
      (candidate) => candidate.job_id === jobId
    );
    return filteredCandidates.length;
  }, [jobId, candidates]);

  // Helper function to safely get user role
  const getUserRole = useCallback(() => {
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return "";
    }

    const firstRole = roles[0];
    if (!firstRole) {
      return "";
    }

    // Handle different role structures
    if (typeof firstRole === "string") {
      return firstRole;
    }

    if (firstRole.role && firstRole.role.name) {
      return firstRole.role.name;
    }
    return "";
  }, [roles]);

  const isAuthReady = useMemo(() => {
    return !!(user?.id && organization?.id && roles && roles.length > 0);
  }, [user?.id, organization?.id, roles]);

  const currentJob = useMemo(() => {
    if (!jobId) return null;
    // First check if selectedJob matches current jobId
    if (selectedJob && selectedJob.id === jobId) {
      return selectedJob;
    }
    // Otherwise, find from jobs array
    return jobs.find((job) => job.id === jobId) || null;
  }, [jobId, jobs, selectedJob]);

  const memoizedUserContext = useMemo((): UserContext | null => {
    if (!isAuthReady) return null;

    const mappedRoles = roles
      .map((role) => {
        if (typeof role === "string") return role;
        if (role?.role?.name) return role.role.name;
        return role?.toString() || "";
      })
      .filter(Boolean);

    return {
      userId: user?.id ?? "",
      organizationId: organization?.id ?? "",
      roles: mappedRoles[0] || "", // Take the first role as a string
    };
  }, [isAuthReady, user?.id, organization?.id, roles]);

  const jobMetadata = useMemo((): JobMetadata => {
    if (!currentJob) {
      return {
        jobTitle: "",
        jobAdmin: "",
        jobType: "",
        jobLocationType: "",
        jobLocation: "",
        workingType: "",
        experience: { min: "", max: "" },
        salary: { min: "", max: "" },
        companyName: "",
        jobDescription: "",
        company_logo_url: "",
        status: "active",
      };
    }

    return {
      jobTitle: currentJob.title || "",
      jobAdmin: currentJob.created_by || "",
      jobType: currentJob.job_type || "",
      jobLocationType: currentJob.job_location_type || "",
      jobLocation: currentJob.location || "",
      workingType: currentJob.working_type || "",
      experience: {
        min: currentJob.min_experience_needed?.toString() || "",
        max: currentJob.max_experience_needed?.toString() || "",
      },
      salary: {
        min: currentJob.salary_min?.toString() || "",
        max: currentJob.salary_max?.toString() || "",
      },
      companyName: currentJob.company_name || "",
      jobDescription: currentJob.description || "",
      company_logo_url: currentJob.company_logo_url || "",
      status: (currentJob.status as JobStatus) || "active",
    };
  }, [currentJob]);

  const formattedSalary = useMemo(() => {
    const minNum = parseInt(jobMetadata.salary.min) || 0;
    const maxNum = parseInt(jobMetadata.salary.max) || 0;

    if (minNum === 0 && maxNum === 0) return "Not specified";
    if (minNum === maxNum) return `${minNum.toLocaleString()}`;
    return `${minNum.toLocaleString()} - ${maxNum.toLocaleString()}`;
  }, [jobMetadata.salary.min, jobMetadata.salary.max]);

  const handleStatusChange = useCallback(
    async (newStatus: JobStatus) => {
      if (!jobId) return;

      //CONFIRMATION BEFORE UPDATING STATUS
      const confirmMessage = `Are you sure you want to change the job status to "${newStatus}"?`;
      if (!window.confirm(confirmMessage)) {
        return;
      }

      try {
        const result = await dispatch(
          updateJob({
            jobId: jobId,
            updates: { status: newStatus },
          })
        );

        if (updateJob.fulfilled.match(result)) {
          console.log("Job status updated successfully");
        } else {
          console.log("Error updating job status:", result.payload);
          alert("Failed to update job status");
        }
      } catch (err) {
        console.error("Unexpected error updating status:", err);
        alert("An unexpected error occurred");
      }
    },
    [jobId, dispatch]
  );

  const confirmDelete = useCallback(async () => {
    if (!jobId) return;

    try {
      const result = await dispatch(deleteJob(jobId));

      if (deleteJob.fulfilled.match(result)) {
        console.log("Job deleted successfully");
        setShowDeleteModal(false);

        setTimeout(() => {
          alert("Job deleted successfully");
          router.push("/jobs");
        }, 100);
      } else {
        console.error("Error deleting job:", result.payload);
        alert(`Failed to delete job: ${result.payload}`);
      }
    } catch (err) {
      console.error("Unexpected error deleting job:", err);
      alert("An unexpected error occurred while deleting the job");
    }
  }, [jobId, dispatch, router]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: jobMetadata.jobTitle,
          text: `Check out this job opportunity: ${jobMetadata.jobTitle} at ${jobMetadata.companyName}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert("Job link copied to clipboard!");
      } catch (error) {
        console.error("Error copying to clipboard:", error);
        alert("Share functionality is not available in this browser.");
      }
    }
  }, [jobMetadata.jobTitle, jobMetadata.companyName]);

  const handleRetry = useCallback(() => {
    if (jobId) {
      dispatch(clearError());
      dispatch(fetchJobById({ jobId }));
    }
  }, [jobId, dispatch]);

  const handleGoBack = useCallback(() => {
    router.push("/jobs");
  }, [router]);

  // Initialize authentication if not ready
  useEffect(() => {
    if (!isAuthReady) {
      dispatch(initializeAuth());
    }
  }, [dispatch, isAuthReady]);

  // Set user context when it's available
  useEffect(() => {
    if (memoizedUserContext && !userContext) {
      dispatch(setUserContext(memoizedUserContext));
    }
  }, [memoizedUserContext, userContext, dispatch]);

  // Load candidates when user context is available
  const shouldLoadCandidates = useRef(false);

  useEffect(() => {
    if (memoizedUserContext && jobId && !shouldLoadCandidates.current) {
      shouldLoadCandidates.current = true;
      dispatch(
        fetchJobApplicationsWithAccess({
          filters: { jobId },
          userContext: memoizedUserContext,
        })
      );
    }
  }, [dispatch, memoizedUserContext, jobId]);

  // Initialize job data - Fixed the error here
  useEffect(() => {
    if (jobId && !currentJob && !loading && isAuthReady) {
      const userRole = getUserRole();
      dispatch(
        fetchJobById({
          jobId,
          userId: user?.id || "",
          userRole: userRole,
        })
      );
    }
  }, [
    jobId,
    currentJob,
    loading,
    isAuthReady,
    user?.id,
    dispatch,
    getUserRole,
  ]);

  // Clear error on unmount
  useEffect(() => {
    return () => {
      if (error) {
        dispatch(clearError());
      }
    };
  }, [error, dispatch]);

  // Clear selected job when jobId changes
  useEffect(() => {
    if (jobId && selectedJob && selectedJob.id !== jobId) {
      dispatch(clearSelectedJob());
    }
  }, [jobId, selectedJob, dispatch]);

  const containerClassName = useMemo(() => {
    return `transition-all duration-300 min-h-full md:pb-0 px-0 ${
      collapsed ? "md:ml-20" : "md:ml-64"
    } pt-18`;
  }, [collapsed]);

  // Early returns for different states
  if (loading) {
    return (
      <Suspense fallback={<JobDetailsSkeleton />}>
        <JobDetailsSkeleton />
      </Suspense>
    );
  }

  if (error) {
    return (
      <div className={containerClassName}>
        <div className="w-full mx-auto mt-4 px-2 py-4">
          <div className="flex justify-center items-center w-full min-h-[400px]">
            <ErrorState
              error={error}
              onRetry={handleRetry}
              onGoBack={handleGoBack}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!jobMetadata.jobTitle && !loading) {
    return (
      <div className={containerClassName}>
        <div className="w-full mx-auto mt-4 px-2 py-4">
          <div className="flex justify-center items-center w-full min-h-[400px]">
            <JobNotFound onGoBack={handleGoBack} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClassName} data-testid="job-details-component">
      {/* Background with subtle gradient */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 min-h-screen -mt-4 pt-4">
        <div className="w-full mx-auto px-4 md:px-6 py-6">
          <Breadcrumb jobTitle={jobMetadata.jobTitle} />
          <TabNavigation activeStep={step} onStepChange={setStep} />

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Main Content Area */}
            <div className="xl:col-span-3 space-y-6">
              {step === 0 && (
                <div data-testid="job-details-tab" className="space-y-6">
                  {/* Enhanced Job Header Card */}
                  <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8">
                    <JobHeader
                      jobMetadata={jobMetadata}
                      jobId={jobId || undefined}
                    />

                    <div className="mt-6 pt-6 border-t border-neutral-100">
                      <JobInfoTags
                        jobMetadata={jobMetadata}
                        numberOfCandidates={numberOfCandidates}
                        formatSalary={() => formattedSalary}
                      />
                    </div>
                  </div>

                  {/* Enhanced Job Description Card */}
                  <div
                    className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8"
                    data-testid="job-description"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-blue-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold text-neutral-900">
                        Job Description
                      </h2>
                    </div>

                    <div className="relative">
                      {/* Subtle background pattern */}
                      <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl"></div>
                      <div className="relative bg-gradient-to-br from-neutral-50/50 to-blue-50/30 rounded-xl p-6 border border-neutral-100/50">
                        <JobDescriptionRenderer
                          content={jobMetadata.jobDescription}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden">
                  <CandidatesList
                    jobId={jobId}
                    showHeader={false}
                    onCandidateClick={(candidate) => {
                      console.log("Candidate clicked:", candidate);
                    }}
                  />
                </div>
              )}

              {step === 2 && (
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-2">
                      Settings Coming Soon
                    </h3>
                    <p className="text-neutral-600">
                      Job settings and configuration features are currently
                      under development.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Sidebar */}
            <div className="xl:col-span-1 space-y-6">
              {/* Action Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <StatusDropdown
                    status={jobMetadata.status}
                    onChange={handleStatusChange}
                    disabled={loading}
                  />
                  <ActionButtons
                    jobId={jobId || ""}
                    loading={loading}
                    onShare={handleShare}
                    onDelete={() => setShowDeleteModal(true)}
                  />
                </div>
              </div>

              {/* Job Stats Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Job Statistics
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Total Applications</span>
                    <span className="font-semibold text-neutral-900">
                      {numberOfCandidates}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Status</span>
                    <span
                      className={`font-medium capitalize ${
                        jobMetadata.status === "active"
                          ? "text-green-600"
                          : jobMetadata.status === "closed"
                          ? "text-red-600"
                          : "text-yellow-600"
                      }`}
                    >
                      {jobMetadata.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Job Type</span>
                    <span className="font-medium text-neutral-900">
                      {jobMetadata.jobType || "Not specified"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Company Info Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Company Details
                </h3>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl overflow-hidden bg-neutral-100">
                    <Image
                      src={jobMetadata.company_logo_url || "/demo.png"}
                      alt={`${jobMetadata.companyName} logo`}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                      onError={(
                        e: React.SyntheticEvent<HTMLImageElement, Event>
                      ) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/demo.png";
                      }}
                    />
                  </div>
                  <h4 className="font-semibold text-neutral-900">
                    {jobMetadata.companyName}
                  </h4>
                  <p className="text-sm text-neutral-600 mt-1">
                    {jobMetadata.jobLocation}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DeleteConfirmationModal
            isOpen={showDeleteModal}
            jobTitle={jobMetadata.jobTitle}
            loading={loading}
            error={error}
            onConfirm={confirmDelete}
            onCancel={() => setShowDeleteModal(false)}
          />
        </div>
      </div>
    </div>
  );
}
