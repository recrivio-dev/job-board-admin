import type { JobAccess } from "@/store/features/organisationSlice";
import { FaPlus } from "react-icons/fa";
import { IoCloseSharp } from "react-icons/io5";
import React, { useCallback } from "react";
import { selectMembers, selectOrganisationLoading } from "@/store/features/organisationSlice";
import { useAppSelector } from "@/store/hooks";
import { Overlay } from "./settings-overlay";
import { RootState } from "@/store/store";
import Image from "next/image";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  assignedJobs?: JobAccess[];
  role: string;
}

// Separate Transfer Overlay Component
const TransferJobsOverlay = ({
  isOpen,
  onClose,
  editingMember,
  handleTransferJobsTA,
}: {
  isOpen: boolean;
  onClose: () => void;
  editingMember: TeamMember;
  handleTransferJobsTA: (transferredTo: TeamMember, transferredFrom: TeamMember) => void;
}) => {
  const [transferredFrom, setTransferredFrom] = React.useState<TeamMember | null>(null);
  const [isTransferring, setIsTransferring] = React.useState(false);
  
  const members = useAppSelector((state: RootState) => selectMembers(state as RootState));
  const loading = useAppSelector((state: RootState) => selectOrganisationLoading(state as RootState));

  // Filter out current editing member and map to TeamMember format
  const availableMembers = React.useMemo(() => {
    return members
      .filter(m => m.user_id !== editingMember.id)
      .filter(m => m.role_name !== 'admin' && m.role_name !== 'hr')
      .map(member => ({
        id: member.user_id,
        name: member.full_name,
        email: member.email,
        role: member.role_name || 'member',
        assignedJobs: member.job_access || []
      } as TeamMember));
  }, [members, editingMember.id]);

  const handleTransfer = async () => {
    if (!transferredFrom) return;

    setIsTransferring(true);
    try {
      await handleTransferJobsTA(editingMember, transferredFrom);
      onClose();
    } catch (error) {
      console.error('Transfer failed:', error);
      // Handle error appropriately - could show toast or error message
    } finally {
      setIsTransferring(false);
    }
  };

  const handleClose = () => {
    setTransferredFrom(null);
    setIsTransferring(false);
    onClose();
  };

  // Reset state when overlay closes
  React.useEffect(() => {
    if (!isOpen) {
      setTransferredFrom(null);
      setIsTransferring(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Transfer Job Access</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isTransferring}
            >
              <IoCloseSharp className="w-6 h-6" />
            </button>
          </div>
          
          <div className="space-y-4">
            {/* Current Member Info */}
            {
              transferredFrom && (
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-600">Transferring jobs from:</p>
                  <p className="font-medium text-gray-900">{transferredFrom?.name}</p>
                  <p className="text-sm text-gray-500">
                    {transferredFrom?.assignedJobs?.length || 0} job(s) assigned
                  </p>
                </div>
              )
            }
            {/* Member Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Member to Transfer From:
              </label>
              {loading ? (
                <div className="p-3 text-sm text-gray-500">Loading members...</div>
              ) : availableMembers.length === 0 ? (
                <div className="p-3 text-sm text-gray-500">No other members available</div>
              ) : (
                <select 
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={transferredFrom?.id || ""}
                  onChange={(e) => {
                    const member = availableMembers.find(m => m.id === e.target.value);
                    setTransferredFrom(member || null);
                  }}
                  disabled={isTransferring}
                >
                  <option value="">Select a member...</option>
                  {availableMembers.map(member => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.email}) - {member.role}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Confirmation Message */}
            {transferredFrom && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-blue-600 text-xs">!</span>
                  </div>
                  <div>
                    <p className="text-sm text-blue-800 font-medium">Confirm Transfer</p>
                    <p className="text-sm text-blue-700 mt-1">
                      All job access will be transferred from{" "}
                      <span className="font-semibold">{transferredFrom.name}</span> to{" "}
                      <span className="font-semibold">{editingMember.name}</span>.
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleClose}
                disabled={isTransferring}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                disabled={!transferredFrom || isTransferring || (editingMember.assignedJobs?.length || 0) === 0}
                className={`px-4 py-2 text-white rounded-md transition-colors flex items-center space-x-2 ${
                  transferredFrom && !isTransferring && (editingMember.assignedJobs?.length || 0) > 0
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-blue-300 cursor-not-allowed'
                }`}
              >
                {isTransferring && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                <span>{isTransferring ? 'Transferring...' : 'Confirm Transfer'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RoleProfile = ({
  editingMember,
  removeMember,
  handleSaveMember,
  handleRevokeAccess,
  handleAssignJobsWithJobTitle,
  handleAssignCompany,
  handleTransferJobsTA,
  onCloseOverlay
}: {
  editingMember: TeamMember;
  removeMember: (member: TeamMember) => void;
  onCloseOverlay: () => void;
  handleAssignJobsWithJobTitle: (member: TeamMember, jobTitles: string[]) => void;
  handleTransferJobsTA: (transferredTo: TeamMember, transferredFrom: TeamMember) => void;
  handleAssignCompany: (member: TeamMember, companyNames: string[]) => void;
  handleRevokeAccess: (member: TeamMember, job_id: string) => void;
  handleSaveMember: (member: TeamMember) => void;
}) => {
  const [showAssignOverlay, setShowAssignOverlay] = React.useState(false);
  const [showTransferOverlay, setShowTransferOverlay] = React.useState(false);
  const [assignedJobs, setAssignedJobs] = React.useState<JobAccess[]>(editingMember.assignedJobs || []);
  
  const members = useAppSelector((state: RootState) => selectMembers(state as RootState));

  const generateShortId = useCallback((job_id: string) => {
    const hash = job_id.split("-").pop() || job_id;
    return hash.substring(0, 8);
  }, []);

  React.useEffect(() => {
    const currentMember = members.find((m) => m.user_id === editingMember.id);
    if (currentMember?.job_access) {
      setAssignedJobs(currentMember.job_access);
    }
  }, [members, editingMember.id]);

  React.useEffect(() => {
    const currentMember = members.find((m) => m.user_id === editingMember.id);
    if (currentMember) {
      editingMember.role = currentMember.role_name || editingMember.role;
    }
  }, [members, editingMember]);

  return (
    <>
      {/* Assign Jobs Overlay */}
      {showAssignOverlay && (
        <Overlay
          setShowOverlay={setShowAssignOverlay}
          member={editingMember}
          onSave={handleSaveMember}
          handleAssignJobsWithJobTitle={handleAssignJobsWithJobTitle}
          handleAssignCompany={handleAssignCompany}
        />
      )}

      {/* Transfer Jobs Overlay */}
      <TransferJobsOverlay
        isOpen={showTransferOverlay}
        onClose={() => setShowTransferOverlay(false)}
        editingMember={editingMember}
        handleTransferJobsTA={handleTransferJobsTA}
      />

      <div className="bg-white rounded-lg shadow p-6 max-w-7xl">
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
              <Image 
                src="/recrivio-profile.svg" 
                alt={`${editingMember.name}'s avatar`} 
                width={64} 
                height={64} 
                className="w-full h-full rounded-full" 
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {editingMember.name}
              </h2>
              <p className="text-gray-600">{editingMember.email}</p>
              <p className="text-sm text-gray-500 capitalize">{editingMember.role}</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowTransferOverlay(true)}
              disabled={!assignedJobs.length}
              className={`px-4 py-2 font-medium cursor-pointer rounded-md transition-colors ${
                assignedJobs.length 
                  ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title={!assignedJobs.length ? "No jobs to transfer" : "Transfer all jobs to another member"}
            >
              Transfer Jobs
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
            onClick={() => setShowAssignOverlay(true)}
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
                key={`${job.job_id}-${index}`}
                className="bg-white px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-1">
                    <input
                      type="checkbox"
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
        {assignedJobs.length === 0 && (
          <div className="text-center py-12">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                <FaPlus className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-gray-500">No jobs assigned to this member</p>
              <button
                onClick={() => setShowAssignOverlay(true)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Assign your first job
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};