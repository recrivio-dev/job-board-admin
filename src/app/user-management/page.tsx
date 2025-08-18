"use client";
import Link from "next/link";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { FaPlus, FaCaretDown } from "react-icons/fa";
import { Overlay } from "@/components/settings-overlay";
import GlobalStickyTable from "@/components/GlobalStickyTable";
import {
  fetchOrgMembers,
  addMemberRole,
  updateMemberRole,
  removeMemberRole,
  selectMembers,
  selectOrganisationLoading,
  selectOrganisationError,
  clearError,
  assignJobAccesswithJob_title,
  assignJobAccessWithCompany,
  JobAccess,
  transferJobsTA
} from "@/store/features/organisationSlice";
import { revokeJobAccess } from "@/store/features/organisationSlice";
import { initializeAuth } from "@/store/features/userSlice";
import { RootState } from "@/store/store";
import { RoleProfile } from "@/components/roleProfile";
import Breadcrumb from "@/components/Breadcrumb";

// Types for better type safety
interface TeamMember {
  id: string;
  name: string;
  email: string;
  assignedJobs?: JobAccess[]; // Optional, can be used to show assigned jobs
  role: string;
}

// New interface for tracking role changes
interface RoleChange {
  memberId: string;
  memberEmail: string;
  oldRole: string;
  newRole: string;
}

const steps = ["Manage Users", "Approvals"];

export default function UserManagement() {
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector((state) => state.ui.sidebar.collapsed);

  // Redux selectors
  const members = useAppSelector((state: RootState) =>
    selectMembers(state as RootState)
  );
  const loading = useAppSelector((state: RootState) =>
    selectOrganisationLoading(state as RootState)
  );
  // Error handling
  const error = useAppSelector((state: RootState) =>
    selectOrganisationError(state as RootState)
  );

  // Get current user and organization from your auth/user state
  const currentUser = useAppSelector((state: RootState) => state.user.user);
  const currentOrgId = useAppSelector(
    (state: RootState) => state.user?.organization?.id
  );

  const currentUserRole = useAppSelector(
    (state: RootState) => state.user?.roles[0]?.role?.name || ""
  );

  const isLoading = useAppSelector((state: RootState) => state.user.loading);
  const userError = useAppSelector((state: RootState) => state.user.error);

  // Ref to track if auth initialization has been attempted
  const authInitialized = useRef(false);
  const mountedRef = useRef(true);

  // Local state
  const [step, setStep] = useState(0);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);

  // New state for tracking pending role changes
  const [pendingRoleChanges, setPendingRoleChanges] = useState<RoleChange[]>(
    []
  );
  const [localTeamMembers, setLocalTeamMembers] = useState<TeamMember[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Initialize auth only once and only if user is truly not authenticated
  useEffect(() => {
    if (
      authInitialized.current ||
      isLoading ||
      currentUser ||
      userError ||
      !mountedRef.current
    ) {
      return;
    }

    console.log("Initializing auth for the first time...");
    authInitialized.current = true;
    dispatch(initializeAuth());
  }, [dispatch, currentUser, isLoading, userError]); // Fixed: Added missing dependencies

  // Reset auth initialization flag when user logs out
  useEffect(() => {
    if (userError && authInitialized.current) {
      console.log("User error detected, resetting auth initialization flag");
      authInitialized.current = false;
    }
  }, [userError]);

  // Fetch organization members when we have a valid org ID
  useEffect(() => {
    if (currentOrgId && currentUser) {
      dispatch(fetchOrgMembers({ orgId: currentOrgId, member_email: undefined }));
    }
  }, [dispatch, currentOrgId, currentUser]);

  // Update local team members when Redux members change
  useEffect(() => {
    const teamMembers: TeamMember[] = members.map((member) => ({
      id: member.user_id,
      name: member.full_name,
      email: member.email,
      role: member.role_name,
      assignedJobs: member.job_access || [], // Optional, can be used to show assigned jobs
    }));
    setLocalTeamMembers(teamMembers);
    // Clear pending changes when fresh data is loaded
    setPendingRoleChanges([]);
  }, [members]);

  // Clear error after timeout
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          dispatch(clearError());
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  // Handle opening overlay for new member
  const handleAddMember = useCallback(() => {
    setEditingMember(null);
    setShowOverlay(true);
  }, []);

  const handleSaveMember = useCallback(
    async (memberData: TeamMember) => {
      if (!currentOrgId || !currentUser?.id) {
        console.error("Missing organization ID or user ID");
        return;
      }
      //only allow admin or hr to add members
      if (currentUserRole !== "admin" && currentUserRole !== "hr") {
        alert("You do not have permission to add members.");
        return;
      }

      try {
        setSavingChanges(true);

        if (editingMember) {
          // Update existing member role - use email for the thunk
          // user can not update their own role
          if (editingMember.email === currentUser.email) {
            alert("You cannot update your own role and job assignments.");
            return;
          }

          await dispatch(
            updateMemberRole({
              memberEmailId: editingMember.email,
              newRole: memberData.role,
              updated_by: currentUser.id,
              organization_id: currentOrgId,
            })
          ).unwrap();
        } else {
          // Add new member - use email from memberData
          await dispatch(
            addMemberRole({
              memberEmailId: memberData.email,
              role: memberData.role,
              organization_id: currentOrgId,
              assigned_by: currentUser.id,
            })
          ).unwrap();
        }

        setShowOverlay(false);

        // Show success message
        alert(
          editingMember
            ? "Member role updated successfully!"
            : "Member added successfully!"
        );
      } catch (error) {
        console.log("Error saving member:", error);
      } finally {
        setSavingChanges(false);
      }
    },
    [editingMember, currentOrgId, currentUser, dispatch, currentUserRole]
  );

  const handleRevokeAccess = useCallback(
    async (member: TeamMember, job_id: string) => {
      if (!currentOrgId || !currentUser?.id) {
        alert("Missing organization ID or user ID");
        return;
      }
      // user must be admin or hr
      if (currentUserRole !== "admin" && currentUserRole !== "hr") {
        alert("You do not have permission to revoke job access.");
        return;
      }
      // cannot revoke access for self
      if (member.email === currentUser.email) {
        alert("You cannot revoke your own job access.");
        return;
      }

      if (!window.confirm(`Are you sure you want to remove this job access for ${member.name}?`)) {
        return; // User cancelled
      }
      // Logic to remove member from organization
      try {
        await dispatch(
          revokeJobAccess({
            userId: member.id,
            jobId: job_id,
            revokedBy: currentUser.id,
          })
        ).unwrap();
        alert(`${job_id} access removed successfully for ${member.name}!`);
      } catch (error) {
        console.error("Error removing Job Access:", error);
        alert(`Error removing Job Access: ${error}`);
      }
    },
    [currentOrgId, currentUser?.id, dispatch, currentUserRole, currentUser?.email]
  );

  const closeOverlay = useCallback(() => {
    setEditingMember(null);
  }, []);

  // Handle role change in table (now only updates local state)
  const handleRoleChange = useCallback(
    (member: TeamMember, newRole: string) => {
      if (member.role === newRole) {
        return; // No change needed
      }
      // only allow admin or hr to change roles
      if (currentUserRole !== "admin" && currentUserRole !== "hr") {
        alert("You do not have permission to change roles.");
        return;
      }

      // user can not change their own role
      if (member.email === currentUser?.email) {
        alert("You cannot change your own role.");
        return;
      }

      // Update local team members immediately for UI feedback
      setLocalTeamMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, role: newRole } : m))
      );

      // Track the change for batch update
      setPendingRoleChanges((prev) => {
        // Remove any existing change for this member
        const filtered = prev.filter((change) => change.memberId !== member.id);

        // Add the new change
        return [
          ...filtered,
          {
            memberId: member.id,
            memberEmail: member.email,
            oldRole: member.role,
            newRole: newRole,
          },
        ];
      });
    },
    [currentUser?.email, currentUserRole]
  );

  //handle assigning jobs
  const handleAssignJobsWithJobTitle = useCallback(
    (member: TeamMember, jobTitles: string[]) => {
      // Logic to assign jobs to the member
      if (!currentOrgId || !currentUser?.id) {
        console.error("Missing organization ID or user ID");
        return;
      }
      // user must be admin or hr
      if (currentUserRole !== "admin" && currentUserRole !== "hr") {
        alert("You do not have permission to assign job access.");
        return;
      }
      if (member.email === currentUser.email) {
        return;
      }

      console.log(`Assigning jobs ${jobTitles.join(", ")} to ${member.name}`);
      dispatch(
        assignJobAccesswithJob_title({
          jobTitles: jobTitles,
          memberUuid: member.id,
          grantedBy: currentUser?.id || "",
          organization_id: currentOrgId || "",
          member_email: member.email,
        })
      ).unwrap();      
    },
    [currentUser?.id, dispatch, currentOrgId, currentUserRole, currentUser?.email]
  );

  const handleSaveChanges = useCallback(async () => {
    if (!currentOrgId || !currentUser?.id) {
      console.error("Missing organization ID or user ID");
      return;
    }
    // user must be admin or hr
    if (currentUserRole !== "admin" && currentUserRole !== "hr") {
      alert("You do not have permission to save changes.");
      return;
    }

    // cannot update own role 
    if (pendingRoleChanges.some((change) => change.memberEmail === currentUser.email)) {
      alert("You cannot update your own role.");
      return;
    }

    try {
      setSavingChanges(true);

      if (step === 0) {
        // Save role changes
        if (pendingRoleChanges.length > 0) {
          console.log("Applying role changes:", pendingRoleChanges);

          // Process each role change
          for (const change of pendingRoleChanges) {
            try {
              await dispatch(
                updateMemberRole({
                  memberEmailId: change.memberEmail,
                  newRole: change.newRole,
                  updated_by: currentUser.id,
                  organization_id: currentOrgId,
                })
              ).unwrap();

              console.log(
                `Role updated for member ${change.memberEmail}: ${change.oldRole} -> ${change.newRole}`
              );
            } catch (error) {
              console.error(
                `Error updating role for ${change.memberEmail}:`,
                error
              );
              // Revert the local change for this member
              setLocalTeamMembers((prev) =>
                prev.map((m) =>
                  m.email === change.memberEmail
                    ? { ...m, role: change.oldRole }
                    : m
                )
              );
              throw error; // Re-throw to stop processing other changes
            }
          }

          // Clear pending changes after successful update
          setPendingRoleChanges([]);
          alert("Team member roles updated successfully!");
        } else {
          alert("No changes to save.");
        }
      }
    } catch (error) {
      console.log("Error saving settings:", error);
      alert("Error saving settings. Please try again.");
    } finally {
      setSavingChanges(false);
    }
  }, [step, pendingRoleChanges, currentOrgId, currentUser, dispatch, currentUserRole]);

  const removeMember = useCallback(
    (member: TeamMember) => {
      if (!currentOrgId || !currentUser?.id) {
        console.error("Missing organization ID or user ID");
        return;
      }
      if (currentUserRole !== "admin" && currentUserRole !== "hr") {
        alert("You do not have permission to revoke job access.");
        return;
      }
      // cannot remove self
      if (member.email === currentUser.email) {
        alert("You cannot remove yourself from the organization.");
        return;
      }

      if (!window.confirm(`Are you sure you want to remove this job access for ${member.name}?`)) {
        return; // User cancelled
      }
      // Logic to remove member from organization
      console.log(`Removing member ${member.name} (${member.email})`);
      dispatch(removeMemberRole({
        memberUUID: member.id,
        organization_id: currentOrgId,
        removed_by: currentUser.id
      }))
      .unwrap()
      .then(() => {
          alert("Member removed successfully");
      })
      // Optionally, you can also close the overlay if it's open
      setEditingMember(null);
    },
    [currentOrgId, currentUser?.id, dispatch, currentUserRole, currentUser?.email]
  );

  //handle assigning company
  const handleAssignCompany = useCallback(
    (member: TeamMember, companies: string[]) => {
      // Logic to assign company to the member
      if (!currentOrgId || !currentUser?.id) {
        console.error("Missing organization ID or user ID");
        return;
      }
      // user must be admin or hr
      if (currentUserRole !== "admin" && currentUserRole !== "hr") {
        alert("You do not have permission to assign company access.");
        return;
      }
      // cannot assign company to self
      if (member.email === currentUser.email) {
        return;
      }

      dispatch(
        assignJobAccessWithCompany({
          companies: companies,
          memberUuid: member.id,
          grantedBy: currentUser.id,
          organization_id: currentOrgId,
          member_email: member.email,
        })
      ).unwrap();
    },
    [currentUser?.id, dispatch, currentOrgId, currentUserRole, currentUser?.email]
  );

  const handleTransferJobsTA = useCallback(
    (transferredTo: TeamMember, transferredFrom: TeamMember) => {
      if (!currentOrgId || !currentUser?.id) {
        console.error("Missing organization ID or user ID");
        return;
      }
      //add a contraint that transfermto member should be TA;
      if (transferredTo.role !== "ta") {
        alert("You can only transfer jobs to a Talent Acquisition (TA).");
        return;
      }

      //add a contraint that transferredFrom member should be TA;
      if (transferredFrom.role !== "ta") {
        alert("You can only transfer jobs from a Talent Acquisition (TA).");
        return;
      }
      // user must be admin or hr
      if (currentUserRole !== "admin" && currentUserRole !== "hr") {
        alert("You do not have permission to transfer job access.");
        return;
      }

      if (transferredTo.email === currentUser.email) {
        alert("You cannot transfer job access from yourself.");
        return;
      }

      dispatch(
        transferJobsTA({
          from_user_id: transferredFrom.id,
          to_user_id: transferredTo.id,
          transferredBy: currentUser.id,
          transferredBy_role: currentUserRole,
          organization_id: currentOrgId,
          to_user_email: transferredTo.email,
        })
      )
      .unwrap()
      .then(() => {
        alert(`Jobs successfully transferred from ${transferredFrom.name} to ${transferredTo.name}!`);
      })
      .catch((error) => {
        console.error("Error transferring jobs:", error);
      });
    },
    [currentUser?.id, dispatch, currentOrgId, currentUserRole, currentUser?.email]
  );

  // Check if there are unsaved changes
  const hasUnsavedChanges = pendingRoleChanges.length > 0;

  // Handle authentication error or unauthorized access
  if (userError) {
    return (
      <div
        className={`transition-all duration-300 h-full px-3 md:px-0 ${
          collapsed ? "md:ml-20" : "md:ml-64"
        } pt-18`}
      >
        <div className="max-w-8xl mx-auto px-2 py-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-red-800 font-medium">Authentication Error</h3>
            <p className="text-red-700 mt-2">{userError}</p>
            <div className="mt-4">
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading only during initial auth check
  if (isLoading && !authInitialized.current) {
    return (
      <div
        className={`transition-all duration-300 h-full px-3 md:px-0 ${
          collapsed ? "md:ml-20" : "md:ml-64"
        } pt-18`}
      >
        <div className="max-w-8xl mx-auto px-2 py-4 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-neutral-600">Loading...</span>
        </div>
      </div>
    );
  }

  // If no user after auth initialization, redirect to login
  if (!currentUser && authInitialized.current && !isLoading) {
    return (
      <div
        className={`transition-all duration-300 h-full px-3 md:px-0 ${
          collapsed ? "md:ml-20" : "md:ml-64"
        } pt-18`}
      >
        <div className="max-w-8xl mx-auto px-2 py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h3 className="text-yellow-800 font-medium">
              Authentication Required
            </h3>
            <p className="text-yellow-700 mt-2">
              Please log in to access settings.
            </p>
            <div className="mt-4">
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`transition-all duration-300 min-h-full md:pb-0 px-3 md:px-6 ${
        collapsed ? "md:ml-20" : "md:ml-60"
      } pt-18`}
    >
      <div className="mt-4 px-2 py-4">
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

         <Breadcrumb
          segments={[
            { label: "User Management", href: "/user-management" },
          ]}
          className="mb-4"
        />

        {/* Error display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <div className="-mx-2 -my-1.5 flex">
                    <button
                      type="button"
                      className="bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                      onClick={() => dispatch(clearError())}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs navigation for different settings sections */}
        <div className="showOverlayflex gap-4 mb-6">
          <div className="flex gap-4 border-b border-neutral-200 w-fit">
            {steps.map((stepName, index) => (
              <button
                key={stepName}
                className={`px-10 py-3 text-center font-medium transition-colors whitespace-nowrap cursor-pointer focus:outline-none ${
                  index === step
                    ? "border-b-4 border-blue-600 text-neutral-800"
                    : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50"
                }`}
                onClick={() => setStep(index)}
                type="button"
                aria-selected={index === step}
                role="tab"
              >
                {stepName}
                {index === 0 && hasUnsavedChanges && (
                  <span className="ml-2 w-2 h-2 bg-yellow-500 rounded-full inline-block"></span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Unsaved changes notification */}
        {hasUnsavedChanges && step === 0 && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Unsaved Changes
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    You have {pendingRoleChanges.length} pending role change
                    {pendingRoleChanges.length > 1 ? "s" : ""}. Click &quot;Save
                    Changes&quot; to apply them.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content section */}
        <div className="flex justify-start items-center w-full">
          <div className="max-w-7xl w-full pb-20">
            {step === 0 &&
              (editingMember ? (
                <RoleProfile
                  editingMember={editingMember}
                  handleSaveMember={handleSaveMember}
                  removeMember={removeMember}
                  handleAssignJobsWithJobTitle={handleAssignJobsWithJobTitle}
                  handleAssignCompany={handleAssignCompany}
                  handleRevokeAccess={handleRevokeAccess}
                  handleTransferJobsTA={handleTransferJobsTA}
                  onCloseOverlay={closeOverlay}
                />
              ) : (
                <>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center mb-6">
                      <h2 className="font-semibold text-xl mb-4 text-neutral-900">
                        Your Recruitment Team
                      </h2>
                      <p className="text-neutral-500 text-sm mx-auto">
                        To streamline your hiring process, you can collaborate
                        with your team on{" "}
                        <span className="text-neutral-800 font-medium">
                          Recrivio
                        </span>
                        . Simply add team members below and click &quot;Save
                        Changes&quot;. We&apos;ll send an invitation email to
                        any new users you add.
                      </p>
                    </div>

                    <div className="flex justify-end items-center mb-6">
                      <button
                        className="flex items-center border border-blue-600 justify-center gap-2 px-4 py-2 text-blue-600 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleAddMember}
                        type="button"
                        disabled={
                          loading ||
                          savingChanges ||
                          currentUserRole === "admin"
                            ? false
                            : true
                        }
                      >
                        <FaPlus className="w-4 h-4" />
                        <span>Add Member</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-neutral-200">
                      <GlobalStickyTable
                        columns={[
                          {
                            key: "checkbox",
                            header: (
                              <input
                                type="checkbox"
                                className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                                aria-label="Select all team members"
                              />
                            ),
                            width: "48px",
                            render: (member) => (
                              <input
                                type="checkbox"
                                className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                                aria-label={`Select ${member.name}`}
                              />
                            ),
                          },
                          {
                            key: "name",
                            header: "Name",
                            render: (member) => (
                              <span className="text-sm text-[#272833]">
                                {member.name}
                              </span>
                            ),
                          },
                          {
                            key: "email",
                            header: "Email",
                            render: (member) => (
                              <span className="text-[#272833] text-sm">
                                {member.email}
                              </span>
                            ),
                          },
                          {
                            key: "role",
                            header: "Role",
                            width: "200px",
                            render: (member) => {
                              const hasChange = pendingRoleChanges.some(
                                (change) => change.memberId === member.id
                              );
                              return (
                                <div className="relative inline-block w-full">
                                  <select
                                    value={member.role}
                                    disabled={
                                      loading ||
                                      savingChanges ||
                                      currentUserRole === "admin"
                                        ? false
                                        : true
                                    }
                                    onChange={(e) => {
                                      handleRoleChange(member, e.target.value);
                                    }}
                                    className={`w-full border px-3 pr-8 rounded-full py-2 text-sm bg-white appearance-none focus:outline-none focus:ring-2 truncate focus:ring-blue-500 focus:border-blue-500 cursor-pointer hover:border-neutral-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                      hasChange
                                        ? "border-yellow-400 bg-yellow-50 text-yellow-800"
                                        : "border-neutral-500 text-neutral-700"
                                    }`}
                                  >
                                    <option value="admin">Admin</option>
                                    <option value="ta">
                                      TCL (Talent Acquisition) Lead
                                    </option>
                                    <option value="hr">HR Manager</option>
                                  </select>
                                  <FaCaretDown
                                    className={`absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none ${
                                      hasChange
                                        ? "text-yellow-600"
                                        : "text-neutral-400"
                                    }`}
                                    size={12}
                                  />
                                  {hasChange && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full"></div>
                                  )}
                                </div>
                              );
                            },
                          },
                          {
                            key: "actions",
                            header: "",
                            width: "150px",
                            render: (member) => (
                              <button
                                type="button"
                                onClick={() => setEditingMember(member)}
                                disabled={loading || savingChanges}
                                className="p-2 text-white bg-[#1E5CDC] hover:bg-blue-500 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md cursor-pointer transition-colors"
                                aria-label={`Edit ${member.name}`}
                              >
                                View
                              </button>
                            ),
                            className: "text-right",
                          },
                        ]}
                        data={localTeamMembers}
                        stickyFirst
                        stickyLastTwo
                      />
                    </div>
                    {pendingRoleChanges.length > 0 && (
                      <div className="flex justify-end mt-6">
                        <button
                          onClick={handleSaveChanges}
                          disabled={loading || savingChanges}
                          className={`text-white text-sm px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                            hasUnsavedChanges
                              ? "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400"
                              : "bg-blue-400 cursor-not-allowed"
                          } disabled:cursor-not-allowed`}
                        >
                          {savingChanges ? "Saving..." : "Save Changes"}
                          {hasUnsavedChanges && !savingChanges && (
                            <span className="ml-2 px-2 py-1 bg-blue-800 text-xs rounded-full">
                              {pendingRoleChanges.length}
                            </span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ))}
            {step === 1 && (
              <>Approvals page content goes here. This is a placeholder</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
