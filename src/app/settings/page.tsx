"use client";
import Link from "next/link";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { HiOutlineArrowCircleLeft } from "react-icons/hi";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { FaPlus, FaRegEdit, FaCaretDown, FaCheck } from "react-icons/fa";
import { Overlay } from "@/components/settings-overlay";
import GlobalStickyTable from "@/components/GlobalStickyTable";
import {
  fetchOrgMembers,
  addMemberRole,
  updateMemberRole,
  selectMembers,
  selectOrganisationLoading,
  selectOrganisationError,
  clearError,
  assignJobAccesswithJob_title,
  assignJobAccessWithCompany,
  JobAccess,
} from "@/store/features/organisationSlice";
import { initializeAuth } from "@/store/features/userSlice";
import { RootState } from "@/store/store";

// Types for better type safety
interface TeamMember {
  id: string;
  name: string;
  email: string;
  assignedJobs?: JobAccess[]; // Optional, can be used to show assigned jobs
  role: string;
}

interface NotificationPreferences {
  applications: boolean;
  weeklySummary: boolean;
  productUpdates: boolean;
  industryUpdates: boolean;
  communityEvents: boolean;
  otherNotifications: boolean;
}

// New interface for tracking role changes
interface RoleChange {
  memberId: string;
  memberEmail: string;
  oldRole: string;
  newRole: string;
}

const steps = ["Roles", "Notifications"];

export default function Settings() {
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector((state) => state.ui.sidebar.collapsed);

  // Redux selectors
  const members = useAppSelector((state: RootState) => selectMembers(state as RootState));
  const loading = useAppSelector((state: RootState) => selectOrganisationLoading(state as RootState));
  // Error handling
  const error = useAppSelector((state: RootState) => selectOrganisationError(state as RootState));

  // Get current user and organization from your auth/user state
  const currentUser = useAppSelector((state: RootState) => state.user.user);
  const currentOrgId = useAppSelector(
    (state: RootState) => state.user?.organization?.id
  );

  const currentUserRole = useAppSelector(
    (state: RootState) => state.user?.roles[0]?.role?.name || "Guest"
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

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    applications: true,
    weeklySummary: true,
    productUpdates: false,
    industryUpdates: true,
    communityEvents: false,
    otherNotifications: true,
  });

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
      dispatch(fetchOrgMembers(currentOrgId));
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

  // Handle opening overlay for editing existing member
  const handleEditMember = useCallback((member: TeamMember) => {
    setEditingMember(member);
    setShowOverlay(true);
  }, []);

  // Handle saving member (add or update)
  const handleSaveMember = useCallback(
    async (memberData: TeamMember) => {
      if (!currentOrgId || !currentUser?.id) {
        console.error("Missing organization ID or user ID");
        return;
      }

      try {
        setSavingChanges(true);

        if (editingMember) {
          // Update existing member role - use email for the thunk
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
        alert(
          `Error ${editingMember ? "updating" : "adding"} member: ${error}`
        );
      } finally {
        setSavingChanges(false);
      }
    },
    [editingMember, currentOrgId, currentUser, dispatch]
  );

  // Handle role change in table (now only updates local state)
  const handleRoleChange = useCallback(
    (member: TeamMember, newRole: string) => {
      if (member.role === newRole) {
        return; // No change needed
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
    []
  );

  // Handle checkbox change for notifications
  const handleCheckboxChange = useCallback(
    (key: keyof NotificationPreferences) => {
      setPreferences((prev) => ({
        ...prev,
        [key]: !prev[key],
      }));
    },
    []
  );

  // Handle saving changes
  const handleSaveChanges = useCallback(async () => {
    if (!currentOrgId || !currentUser?.id) {
      console.error("Missing organization ID or user ID");
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
      } else {
        // Save notification preferences
        console.log("Saving preferences:", preferences);
        // Here you would dispatch an action to save notification preferences
        // dispatch(updateNotificationPreferences(preferences));

        // Simulate API call for now
        await new Promise((resolve) => setTimeout(resolve, 1000));
        alert("Notification preferences saved successfully!");
      }
    } catch (error) {
      console.log("Error saving settings:", error);
      alert("Error saving settings. Please try again.");
    } finally {
      setSavingChanges(false);
    }
  }, [
    step,
    preferences,
    pendingRoleChanges,
    currentOrgId,
    currentUser,
    dispatch,
  ]);

  //handle assigning jobs
  const handleAssignJobsWithJobTitle = useCallback(
    (member: TeamMember, jobTitles: string[]) => {
      // Logic to assign jobs to the member
      console.log(`Assigning jobs ${jobTitles.join(", ")} to ${member.name}`);
      dispatch(
        assignJobAccesswithJob_title({
          jobTitles: jobTitles,
          memberUuid: member.id,
          grantedBy: currentUser?.id || "",
          organization_id: currentOrgId || "",  
        })
      ).unwrap();
    },
    [currentUser?.id, dispatch, currentOrgId]
  );

  //handle assigning company
  const handleAssignCompany = useCallback(
    (member: TeamMember, companies: string[]) => {
      // Logic to assign company to the member
      console.log(`Assigning company ${companies.join(", ")} to ${member.name}`);
      if (!currentOrgId || !currentUser?.id) {
        console.error("Missing organization ID or user ID");
        return;
      }
      dispatch(
        assignJobAccessWithCompany({
          companies: companies,
          memberUuid: member.id,
          grantedBy: currentUser.id,
          organization_id: currentOrgId,
        })
      ).unwrap();
    },
    [currentUser?.id, dispatch, currentOrgId]
  );

  // Check if there are unsaved changes
  const hasUnsavedChanges = pendingRoleChanges.length > 0;

  // Custom checkbox component
  const CheckboxItem = React.memo(
    ({
      checked,
      onChange,
      children,
    }: {
      checked: boolean;
      onChange: () => void;
      children: React.ReactNode;
    }) => (
      <div className="flex items-start gap-3 p-4 transition-colors">
        <button
          type="button"
          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer ${
            checked
              ? "bg-green-600 text-white hover:bg-green-700"
              : "border-neutral-300 hover:border-neutral-400 bg-white"
          }`}
          onClick={onChange}
          aria-checked={checked}
          role="checkbox"
        >
          {checked && <FaCheck size={12} />}
        </button>
        <label
          className="text-neutral-700 cursor-pointer select-none leading-relaxed flex-1"
          onClick={onChange}
        >
          {children}
        </label>
      </div>
    )
  );

  CheckboxItem.displayName = "CheckboxItem";

  // Handle authentication error or unauthorized access
  if (userError) {
    return (
      <div
        className={`transition-all duration-300 h-full px-3 md:px-0 ${
          collapsed ? "md:ml-20" : "md:ml-64"
        } pt-4`}
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
        } pt-4`}
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
        } pt-4`}
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

        {/* Header section with back link and title */}
        <div className="flex items-center gap-2 mb-4">
          <Link
            href="/dashboard"
            className="flex items-center text-neutral-500 hover:text-neutral-700 font-semibold text-lg transition-colors"
          >
            <HiOutlineArrowCircleLeft className="w-8 h-8 mr-2" />
            <span>Back to Dashboard</span>
          </Link>
          <span className="text-lg text-neutral-300">/</span>
          <span className="text-lg font-bold text-neutral-900">Settings</span>
        </div>

        {/* Main content area with title and description */}
        <div className="flex items-center justify-between mt-6 mb-3">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">
              Settings
            </h1>
            <p className="text-sm text-neutral-500 mt-2">
              Customize your account, notifications, roles and recruitment
              preferences to better suit your workflow.
            </p>
          </div>
        </div>

        {/* Tabs navigation for different settings sections */}
        <div className="flex gap-4 mb-6">
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
        <div className="flex justify-center items-center w-full">
          <div className="max-w-7xl w-full pb-20">
            {step === 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center mb-6">
                  <h2 className="font-semibold text-xl mb-4 text-neutral-900">
                    Your Recruitment Team
                  </h2>
                  <p className="text-neutral-500 text-sm mx-auto">
                    To streamline your hiring process, you can collaborate with
                    your team on{" "}
                    <span className="text-neutral-800 font-medium">
                      Recrivio
                    </span>
                    . Simply add team members below and click &quot;Save
                    Changes&quot;. We&apos;ll send an invitation email to any
                    new users you add.
                  </p>
                </div>

                <div className="flex justify-end items-center mb-6">
                  <button
                    className="flex items-center border border-blue-600 justify-center gap-2 px-4 py-2 text-blue-600 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleAddMember}
                    type="button"
                    disabled={loading || savingChanges || currentUserRole === "admin" ? false : true}
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
                        key: "assignedJobs",
                        header: "Assigned Jobs",
                        width: "200px",
                        render: (member) => {
                          return (
                            <span className="text-sm text-neutral-600">
                              {member.assignedJobs?.length
                                ? (() => {
                                    const jobs = member.assignedJobs;
                                    const displayJobs = jobs.slice(0, 2).map((job) => job.title).join(", ");
                                    const remainingCount = jobs.length - 2;
                                    
                                    if (jobs.length > 2) {
                                      return (
                                        <span className="relative">
                                          {displayJobs} & 
                                          <span 
                                            className="relative group cursor-help ml-1"
                                            title={jobs.map(job => job.title).join(', ')}
                                          >
                                            <span className="text-blue-600">
                                              {remainingCount} More
                                            </span>
                                          </span>
                                        </span>
                                      );
                                    }
                                    
                                    return displayJobs;
                                  })()
                                : "No jobs assigned"}
                            </span>
                          );
                        },
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
                                disabled={loading || savingChanges || currentUserRole === "admin" ? false : true}
                                onChange={(e) => {
                                  handleRoleChange(member, e.target.value)
                                }}
                                className={`w-full border px-3 pr-8 rounded-md py-2 text-sm bg-white appearance-none focus:outline-none focus:ring-2 truncate focus:ring-blue-500 focus:border-blue-500 cursor-pointer hover:border-neutral-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                  hasChange
                                    ? "border-yellow-400 bg-yellow-50 text-yellow-800"
                                    : "border-neutral-300 text-neutral-700"
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
                        width: "80px",
                        render: (member) => (
                          <button
                            type="button"
                            onClick={() => handleEditMember(member)}
                            disabled={loading || savingChanges || currentUserRole === "admin" ? false : true}
                            className="p-2 text-neutral-600 hover:text-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md cursor-pointer transition-colors"
                            aria-label={`Edit ${member.name}`}
                          >
                            <FaRegEdit className="h-4 w-4" />
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
              </div>
            )}

            {step === 1 && (
              <>
                <div className="bg-white rounded-lg shadow px-4 py-2">
                  <div className="mx-auto text-sm">
                    <CheckboxItem
                      checked={preferences.applications}
                      onChange={() => handleCheckboxChange("applications")}
                    >
                      I would like to receive applications via Recrivio.
                    </CheckboxItem>

                    <CheckboxItem
                      checked={preferences.weeklySummary}
                      onChange={() => handleCheckboxChange("weeklySummary")}
                    >
                      I would like to receive a weekly summary of the most
                      popular candidates on Recrivio.
                    </CheckboxItem>

                    <CheckboxItem
                      checked={preferences.productUpdates}
                      onChange={() => handleCheckboxChange("productUpdates")}
                    >
                      I would like to receive notifications about new product
                      updates on Recrivio.
                    </CheckboxItem>

                    <CheckboxItem
                      checked={preferences.industryUpdates}
                      onChange={() => handleCheckboxChange("industryUpdates")}
                    >
                      I would like to receive occasional newsletters featuring
                      industry updates and recruitment tips.
                    </CheckboxItem>

                    <CheckboxItem
                      checked={preferences.communityEvents}
                      onChange={() => handleCheckboxChange("communityEvents")}
                    >
                      I would like to receive notifications about recruitment
                      community events, such as webinars and meetups.
                    </CheckboxItem>

                    <CheckboxItem
                      checked={preferences.otherNotifications}
                      onChange={() =>
                        handleCheckboxChange("otherNotifications")
                      }
                    >
                      I would like to receive other relevant notifications from
                      Recrivio.
                    </CheckboxItem>
                  </div>
                </div>
                <div className="flex justify-center mt-6">
                  <button
                    onClick={handleSaveChanges}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-lg transition-colors cursor-pointer"
                  >
                    {savingChanges ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
