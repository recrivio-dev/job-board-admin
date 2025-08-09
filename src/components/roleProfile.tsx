import type { JobAccess } from "@/store/features/organisationSlice";
import { FaPlus } from "react-icons/fa";
import { IoCloseSharp } from "react-icons/io5";
import React, { useCallback } from "react";
import { selectMembers } from "@/store/features/organisationSlice";
import { useAppSelector } from "@/store/hooks";
import { Overlay } from "./settings-overlay";
import { RootState } from "@/store/store";
import Image from "next/image";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  assignedJobs?: JobAccess[]; // Optional, can be used to show assigned jobs
  role: string;
}
export const RoleProfile = ({
  editingMember,
  removeMember,
  handleSaveMember,
  handleRevokeAccess,
  handleAssignJobsWithJobTitle,
  handleAssignCompany,
  onCloseOverlay
}: {
  editingMember: TeamMember;
  removeMember: (member: TeamMember) => void;
  onCloseOverlay: () => void;
   handleAssignJobsWithJobTitle: (
    member: TeamMember,
    jobTitles: string[]
  ) => void;
  handleAssignCompany: (member: TeamMember, companyNames: string[]) => void;
  handleRevokeAccess: (member: TeamMember, job_id: string) => void;
  handleSaveMember: (member: TeamMember) => void;
}) => {
  const [showOverlay, setShowOverlay] = React.useState(false);
  const [assignedJobs, setAssignedJobs] = React.useState<JobAccess[]>(editingMember.assignedJobs || []);
  const members = useAppSelector((state: RootState) => selectMembers(state as RootState));

  const generateShortId = useCallback((job_id: string) => {
    // Generate a shorter, more readable ID from the application ID
    const hash = job_id.split("-").pop() || job_id;
    return hash.substring(0, 8);
  }, []);

  React.useEffect(() => {
    const currentMember = members.find((m) => m.user_id === editingMember.id);
    if (currentMember?.job_access) {
      setAssignedJobs(currentMember.job_access);
    }
  }, [members, editingMember.id]);

  return (
    <>
    {/* Overlay for modal */}
    {showOverlay && (
      <Overlay
        setShowOverlay={setShowOverlay}
        member={editingMember}
        onSave={handleSaveMember}
        handleAssignJobsWithJobTitle={handleAssignJobsWithJobTitle}
        handleAssignCompany={handleAssignCompany}
      />
    )}
    <div className="bg-white rounded-lg shadow p-6 max-w-6xl">
      {/* Close Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => onCloseOverlay()}
          className="text-gray-500 w-8 h-8 hover:text-gray-700 transition-colors cursor-pointer"
        >
          <IoCloseSharp />
        </button>
      </div>

      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
            <Image src="/recrivio-profile.svg" alt={`${editingMember.name}'s avatar`} width={64} height={64} className="w-full h-full rounded-full" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {editingMember.name}
            </h2>
            <p className="text-gray-600">{editingMember.email}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => alert("Transfer Job functionality is not implemented yet.")}
            className="px-4 py-2 bg-gray-200 font-medium text-gray-800 cursor-pointer rounded-md hover:bg-gray-300 transition-colors"
          >
            Transfer Job
          </button>
          <button
            onClick={() => removeMember(editingMember)}
            className="px-4 py-2 bg-red-600 text-white font-medium cursor-pointer rounded-md hover:bg-red-700 transition-colors"
          >
            Remove Member
          </button>
        </div>
      </div>

      {/* Assign Job Button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowOverlay(true)}
          className="flex items-center space-x-2 font-medium border border-blue-600 cursor-pointer px-4 py-2 text-blue-600 bg-white rounded-md hover:bg-blue-50 transition-colors"
        >
          <FaPlus className="w-4 h-4" />
          <span>Assign a Job</span>
        </button>
      </div>

      {/* Jobs Table */}
      <div className="bg-gray-50 border border-neutral-200 rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="bg-neutral-100 border-b border-gray-200 px-6 py-4">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-1">
              <input
                type="checkbox"
                // onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2">
              <span className="text-sm font-medium text-gray-700">ID</span>
            </div>
            <div className="col-span-3">
              <span className="text-sm font-medium text-gray-700">
                Assigned Jobs
              </span>
            </div>
            <div className="col-span-3">
              <span className="text-sm font-medium text-gray-700">Company</span>
            </div>
            <div className="col-span-2">
              <span className="text-sm font-medium text-gray-700">
                Role in Job
              </span>
            </div>
            <div className="col-span-1"></div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {assignedJobs.map((job, index) => (
            <div
              key={index}
              className="bg-white px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-1">
                  <input
                    type="checkbox"
                    // onChange={() => handleJobSelection(index.toString())}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-gray-900 font-mono">
                    {generateShortId(job.job_id)}
                  </span>
                </div>
                <div className="col-span-3">
                  <span className="text-sm text-gray-900 font-medium">
                    {job.title}
                  </span>
                </div>
                <div className="col-span-3">
                  <span className="text-sm text-gray-900">
                    {job.company_name}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-gray-600">
                    {editingMember.role.charAt(0).toUpperCase() +
                      editingMember.role.slice(1)}
                  </span>
                </div>
                <div className="col-span-1">
                  <button
                    onClick={() => handleRevokeAccess(editingMember, job.job_id)}
                    className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50 transition-colors"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {editingMember.assignedJobs?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No jobs assigned to this member</p>
        </div>
      )}
    </div>
    </>
  );
};
