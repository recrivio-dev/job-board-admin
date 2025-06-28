import { IoCloseSharp, IoPersonCircleSharp } from "react-icons/io5";
import { FaAngleDown } from "react-icons/fa6";
import { FaRegTrashAlt } from "react-icons/fa";
import { FiDownload, FiMail } from "react-icons/fi";
import { memo, useCallback, useState } from "react";
import {
  CandidateWithApplication,
  Education,
  Experience,
} from "@/store/features/candidatesSlice";

// Memoized candidate header component
const CandidateHeader = memo(
  ({
    candidate,
    onClose,
    onDelete,
    onStatusUpdate,
  }: {
    candidate: CandidateWithApplication | null;
    onClose: () => void;
    onStatusUpdate: (applicationId: string, status: string) => void;
    onDelete?: (applicationId: string) => void;
  }) => {
    const [isUpdating, setIsUpdating] = useState(false);

    const handleStatusChange = async (newStatus: string) => {
      if (
        !candidate ||
        isUpdating ||
        newStatus === candidate.application_status
      )
        return;

      setIsUpdating(true);
      try {
        onStatusUpdate(candidate.application_id, newStatus);
      } finally {
        setIsUpdating(false);
      }
    };

    return (
      <div className="p-6 border-b border-neutral-200 bg-white">
        <div className="flex items-center gap-4 mb-4">
          <IoPersonCircleSharp className="w-16 h-16 text-neutral-500" />
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-neutral-900">
              {candidate?.name}
            </h2>
            <p className="text-neutral-500 mb-1">
              Job Application: {candidate?.job_title}
            </p>
          </div>
        </div>

        <div className="flex gap-4 flex-wrap items-center">
          <div className="pr-4">
            <span className="font-semibold text-sm text-neutral-600">
              Application ID
            </span>
            <div className="text-neutral-800 font-mono text-sm">
              {candidate?.application_id.slice(-8) || "N/A"}
            </div>
          </div>

          <div className="relative inline-block w-48">
            <select
              className="bg-neutral-100 w-full h-full rounded-md px-3 py-2 text-neutral-800 focus:outline-none appearance-none cursor-pointer disabled:opacity-50"
              value={candidate?.application_status || ""}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={isUpdating}
            >
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
            <FaAngleDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500 pointer-events-none" />
          </div>

          <button
            onClick={() =>
              window.open(`mailto:${candidate?.candidate_email}`, "_blank")
            }
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors cursor-pointer flex items-center gap-2"
          >
            <FiMail className="w-4 h-4" />
            Message
          </button>

          <button
            className="border border-red-700 hover:border-red-800 transition-colors px-4 py-2 rounded-md cursor-pointer flex items-center gap-2"
            onClick={() => {
              onDelete?.(candidate?.application_id || "");
              onClose();
            }}
          >
            <FaRegTrashAlt className="w-4 h-4 text-red-700" />
          </button>
        </div>
      </div>
    );
  }
);

CandidateHeader.displayName = "CandidateHeader";

// Memoized resume section component
const ResumeSection = memo(
  ({ candidate }: { candidate: CandidateWithApplication | null }) => (
    <div className="mb-6">
      <div className="font-semibold text-lg text-blue-700 mb-3 flex items-center gap-2">
        Resume
      </div>
      <div className="flex items-center gap-4">
        <div className="bg-neutral-100 flex items-center gap-2 rounded-lg cursor-pointer pr-4 transition-colors hover:bg-neutral-200">
          <div className="text-white bg-red-700 py-4 px-3 rounded-l-lg">
            PDF
          </div>
          <div className="text-neutral-800 font-semibold">
            {candidate?.name ? `${candidate.name}_Resume.pdf` : "Resume.pdf"}
            <div className="text-neutral-400 text-sm font-normal">
              Download Resume
            </div>
          </div>
          <FiDownload className="h-5 w-5 mx-2 text-neutral-800" />
        </div>
      </div>
    </div>
  )
);

ResumeSection.displayName = "ResumeSection";

// Memoized personal details component
const PersonalDetails = memo(
  ({ candidate }: { candidate: CandidateWithApplication | null }) => (
    <div className="mb-6">
      <div className="font-semibold text-lg text-blue-700 mb-3 flex items-center gap-2">
        Personal Details
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="flex items-start gap-3">
          <div>
            <div className="font-medium text-sm text-neutral-800 mb-1">
              Full Name
            </div>
            <div className="text-sm text-neutral-600">
              {candidate?.name || "N/A"}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div>
            <div className="font-medium text-sm text-neutral-800 mb-1">
              Email
            </div>
            <div className="text-sm text-neutral-600">
              {candidate?.candidate_email || "N/A"}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div>
            <div className="font-medium text-sm text-neutral-800 mb-1">
              Mobile Number
            </div>
            <div className="text-sm text-neutral-600">
              {candidate?.mobile_number || "N/A"}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div>
            <div className="font-medium text-sm text-neutral-800 mb-1">
              Date of Birth
            </div>
            <div className="text-sm text-neutral-600">
              {candidate?.dob
                ? new Date(candidate.applied_date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "N/A"}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div>
            <div className="font-medium text-sm text-neutral-800 mb-1">
              Address
            </div>
            <div className="text-sm text-neutral-600">
              {candidate?.address || "N/A"}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
);
PersonalDetails.displayName = "PersonalDetails";

//memoized experience details component
const ExperienceDetails = memo(
  ({ candidate }: { candidate: CandidateWithApplication | null }) => (
    <div className="mb-6">
      <div className="font-semibold text-lg text-blue-700 mb-3">
        Experience Details
      </div>
      {(!candidate?.experience || candidate.experience.length === 0) && (
        <p className="text-sm text-neutral-600">
          No experience information available.
        </p>
      )}
      {candidate?.experience?.map((exp: Experience, index: number) => (
        <div key={index} className="mb-4">
          <div className="flex items-center gap-4 mb-2">
            <div>
              <svg
                width="48"
                height="49"
                viewBox="0 0 48 49"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_1_13956)">
                  <rect
                    width="48"
                    height="48"
                    transform="translate(0 0.5)"
                    fill="#3A434E"
                  />
                  <rect x="25" y="8.5" width="18" height="40" fill="#A1B2C6" />
                  <rect x="6" y="21.5" width="22" height="27" fill="#7C8EA3" />
                </g>
                <defs>
                  <clipPath id="clip0_1_13956">
                    <rect
                      width="48"
                      height="48"
                      fill="white"
                      transform="translate(0 0.5)"
                    />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <div>
              <div className="text-neutral-800 font-medium">
                {exp.job_title || "Job Title"}
              </div>
              <div className="font-normal text-neutral-600">
                {exp.company_name || "Company Name"}
              </div>
              <div className="font-noraml text-neutral-400 text-sm">
                {exp.currently_working === true
                  ? "Currently working here"
                  : `${
                      exp.start_date
                        ? new Date(exp.start_date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "Start Date"
                    } - ${
                      exp.end_date
                        ? new Date(exp.end_date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "End Date"
                    }`}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
);

ExperienceDetails.displayName = "ExperienceDetails";

const EducationDetails = memo(
  ({ candidate }: { candidate: CandidateWithApplication | null }) => (
    <div className="mb-6">
      <div className="font-semibold text-lg text-blue-700 mb-3">
        Education Details
      </div>
      {(!candidate?.education || candidate.education.length === 0) && (
        <p className="text-sm text-neutral-600">
          No education information available.
        </p>
      )}
      {candidate?.education?.map((edu: Education, index: number) => (
        <div key={index} className="mb-4">
          <div className="flex items-center gap-4 mb-2">
            <div>
              <svg
                width="48"
                height="49"
                viewBox="0 0 48 49"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_1_13956)">
                  <rect
                    width="48"
                    height="48"
                    transform="translate(0 0.5)"
                    fill="#3A434E"
                  />
                  <rect x="25" y="8.5" width="18" height="40" fill="#A1B2C6" />
                  <rect x="6" y="21.5" width="22" height="27" fill="#7C8EA3" />
                </g>
                <defs>
                  <clipPath id="clip0_1_13956">
                    <rect
                      width="48"
                      height="48"
                      fill="white"
                      transform="translate(0 0.5)"
                    />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <div>
              <div className="text-neutral-800 font-medium">
                {edu.degree || "Degree"}
              </div>
              <div className="font-normal text-neutral-600">
                {edu.college_university || "Institution Name"}
              </div>

              <div className="font-noraml text-neutral-400 text-sm">
                {edu.is_current === true
                  ? "Currently Study here"
                  : `${
                      edu.start_date
                        ? new Date(edu.start_date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "Start Date"
                    } - ${
                      edu.end_date
                        ? new Date(edu.end_date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "End Date"
                    }`}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
);

EducationDetails.displayName = "EducationDetails";

// Memoized additional information component
const AdditionalInformation = memo(
  ({
    candidate,
    calculateExperience,
  }: {
    candidate: CandidateWithApplication | null;
    calculateExperience?: (candidate: CandidateWithApplication) => string;
  }) => (
    <div className="mb-6">
      <div className="font-semibold text-lg text-blue-700 mb-3">
        Additional Information
      </div>
      <div className="bg-neutral-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div>
              <div className="font-medium text-sm text-neutral-800 mb-1">
                Notice Period
              </div>
              <div className="text-sm text-neutral-600">
                {candidate?.notice_period || "N/A"}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div>
              <div className="font-medium text-sm text-neutral-800 mb-1">
                Current CTC
              </div>
              <div className="text-sm text-neutral-600">
                {candidate?.current_ctc ? `₹${candidate.current_ctc}` : "N/A"}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div>
              <div className="font-medium text-sm text-neutral-800 mb-1">
                Expected CTC
              </div>
              <div className="text-sm text-neutral-600">
                {candidate?.expected_ctc ? `₹${candidate.expected_ctc}` : "N/A"}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div>
              <div className="font-medium text-sm text-neutral-800 mb-1">
                LinkedIn Profile
              </div>
              <div className="text-sm text-neutral-600">
                {candidate?.linkedin_url ? (
                  <a
                    href={candidate.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    View Profile
                  </a>
                ) : (
                  "N/A"
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div>
              <div className="font-medium text-sm text-neutral-800 mb-1">
                Total Experience
              </div>
              <div className="text-sm text-neutral-600">
                {candidate?.experience &&
                candidate.experience.length > 0 &&
                calculateExperience
                  ? calculateExperience(candidate)
                  : "N/A"}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div>
              <div className="font-medium text-sm text-neutral-800 mb-1">
                Portfolio/Website
              </div>
              <div className="text-sm text-neutral-600">
                {candidate?.portfolio_url ? (
                  <a
                    href={candidate.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    View Portfolio
                  </a>
                ) : (
                  "N/A"
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
);

AdditionalInformation.displayName = "AdditionalInformation";

const CandidatesDetailsOverlay = memo(
  ({
    candidatesDetailsOverlay,
    setCandidatesDetailsOverlay,
    onStatusUpdate,
    onDelete,
    calculateExperience,
  }: {
    candidatesDetailsOverlay: {
      candidate: CandidateWithApplication | null;
      show: boolean;
    };
    setCandidatesDetailsOverlay: React.Dispatch<
      React.SetStateAction<{
        candidate: CandidateWithApplication | null;
        show: boolean;
      }>
    >;
    onStatusUpdate?: (applicationId: string, status: string) => void;
    onDelete?: (applicationId: string) => void;
    calculateExperience?: (candidate: CandidateWithApplication) => string;
  }) => {
    const handleClose = useCallback(() => {
      setCandidatesDetailsOverlay({ candidate: null, show: false });
    }, [setCandidatesDetailsOverlay]);

    const handleStatusUpdate = useCallback(
      async (applicationId: string, status: string) => {
        if (onStatusUpdate) {
          onStatusUpdate(applicationId, status);
        }
      },
      [onStatusUpdate]
    );

    if (!candidatesDetailsOverlay.show || !candidatesDetailsOverlay.candidate)
      return null;

    const candidate = candidatesDetailsOverlay.candidate;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative flex flex-col">
          <button
            className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-700 cursor-pointer z-10 bg-white rounded-full p-1 shadow-sm"
            onClick={handleClose}
          >
            <IoCloseSharp className="w-6 h-6 text-neutral-800" />
          </button>

          {/* Static Header */}
          <CandidateHeader
            candidate={candidate}
            onClose={handleClose}
            onDelete={onDelete}
            onStatusUpdate={handleStatusUpdate}
          />

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              <ResumeSection candidate={candidate} />
              <PersonalDetails candidate={candidate} />
              <ExperienceDetails candidate={candidate} />
              <EducationDetails candidate={candidate} />
              <AdditionalInformation
                candidate={candidate}
                calculateExperience={calculateExperience}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CandidatesDetailsOverlay.displayName = "CandidatesDetailsOverlay";

export default CandidatesDetailsOverlay;
