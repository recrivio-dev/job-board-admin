"use client";
import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { IoMdClose } from "react-icons/io";
import { FaExclamationCircle } from "react-icons/fa";
import {
  fetchFilterOptions,
  FilterOption,
  UserContext,
} from "@/store/features/candidatesSlice";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { RootState } from "@/store/store";
import { FaChevronDown, FaSearch } from "react-icons/fa";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  assigned_company?: string[];
  assigned_jobs?: string[];
  role: string;
}

interface OverlayProps {
  setShowOverlay: (show: boolean) => void;
  member: TeamMember | null;
  onSave: (member: TeamMember) => void;
  jobs?: FilterOption[];
  company?: FilterOption[];
  handleAssignJobsWithJobTitle: (
    member: TeamMember,
    jobTitles: string[]
  ) => void;
  handleAssignCompany: (member: TeamMember, companyNames: string[]) => void;
}

interface FormErrors {
  name?: string;
  email?: string;
  role?: string;
  assigned_company?: string;
  assigned_jobs?: string;
  submit?: string;
}

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "ta", label: "TCL (Talent Acquisition) Lead" },
  { value: "hr", label: "HR Manager" },
] as const;

// Memoize the InputField component
const InputField = memo(
  ({
    id,
    label,
    type = "text",
    value,
    field,
    placeholder,
    disabled = false,
    required = true,
    onChange,
    onBlur,
    errors,
    isSubmitting,
    inputRef,
  }: {
    id: string;
    label: string;
    type?: string;
    value: string;
    field: keyof TeamMember;
    placeholder: string;
    disabled?: boolean;
    required?: boolean;
    onChange: (field: keyof TeamMember, value: string) => void;
    onBlur: (field: keyof TeamMember) => void;
    errors: FormErrors;
    isSubmitting: boolean;
    inputRef?: React.RefObject<HTMLInputElement | null>;
  }) => (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-neutral-800 mb-2"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      <input
        ref={inputRef}
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        onBlur={() => onBlur(field)}
        className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 ${
          errors[field as keyof FormErrors]
            ? "border-red-400 focus:ring-red-500 bg-red-50"
            : "border-neutral-300 focus:ring-blue-500 hover:border-neutral-400"
        } ${
          disabled
            ? "bg-neutral-100 cursor-not-allowed text-neutral-500"
            : "bg-white"
        }`}
        placeholder={placeholder}
        aria-describedby={
          errors[field as keyof FormErrors] ? `${id}-error` : undefined
        }
        aria-invalid={errors[field as keyof FormErrors] ? "true" : "false"}
        disabled={disabled || isSubmitting}
        maxLength={field === "name" ? 50 : field === "email" ? 100 : undefined}
      />
      {errors[field as keyof FormErrors] && (
        <div
          id={`${id}-error`}
          className="flex items-center gap-1 text-red-600 text-sm mt-1"
          role="alert"
        >
          <FaExclamationCircle className="w-3 h-3 flex-shrink-0" />
          <span>{errors[field as keyof FormErrors]}</span>
        </div>
      )}
    </div>
  )
);

InputField.displayName = "InputField";

// Improved MultiSelectDropdown with better performance and UX
const MultiSelectDropdown = memo(
  ({
    id,
    label,
    options,
    selectedValues,
    onChange,
    onBlur,
    error,
    isSubmitting,
    placeholder,
    required = false,
  }: {
    id: string;
    label: string;
    options: FilterOption[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
    onBlur: () => void;
    error?: string;
    isSubmitting: boolean;
    placeholder: string;
    required?: boolean;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Memoize filtered options for better performance
    const filteredOptions = React.useMemo(
      () =>
        options.filter((option) =>
          option.label.toLowerCase().includes(searchTerm.toLowerCase())
        ),
      [options, searchTerm]
    );

    const handleToggleOption = useCallback(
      (value: string) => {
        const newValues = selectedValues.includes(value)
          ? selectedValues.filter((v) => v !== value)
          : [...selectedValues, value];
        onChange(newValues);
      },
      [selectedValues, onChange]
    );

    const handleSelectAll = useCallback(() => {
      const allFilteredValues = filteredOptions.map((option) => option.value);
      const allSelected = allFilteredValues.every((value) =>
        selectedValues.includes(value)
      );

      if (allSelected) {
        // Deselect all filtered options
        const newValues = selectedValues.filter(
          (value) => !allFilteredValues.includes(value)
        );
        onChange(newValues);
      } else {
        // Select all filtered options
        const newValues = [
          ...new Set([...selectedValues, ...allFilteredValues]),
        ];
        onChange(newValues);
      }
    }, [filteredOptions, selectedValues, onChange]);

    const handleClearAll = useCallback(() => {
      onChange([]);
    }, [onChange]);

    const handleClickOutside = useCallback(
      (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          setSearchTerm(""); // Clear search when closing
          onBlur();
        }
      },
      [onBlur]
    );

    useEffect(() => {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [handleClickOutside]);

    // Get selected option labels for display
    const selectedLabels = React.useMemo(() => {
      return selectedValues.map((value) => {
        const option = options.find((opt) => opt.value === value);
        return option ? option.label : value;
      });
    }, [selectedValues, options]);

    const displayText =
      selectedValues.length > 0
        ? selectedValues.length === 1
          ? selectedLabels[0]
          : `${selectedValues.length} selected`
        : placeholder;

    const allFilteredSelected =
      filteredOptions.length > 0 &&
      filteredOptions.every((option) => selectedValues.includes(option.value));

    return (
      <div className="relative" ref={dropdownRef}>
        <label
          htmlFor={id}
          className="block text-sm font-medium text-neutral-800 mb-2"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>

        <button
          type="button"
          id={id}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 text-left flex items-center justify-between ${
            error
              ? "border-red-400 focus:ring-red-500 bg-red-50"
              : "border-neutral-300 focus:ring-blue-500 hover:border-neutral-400"
          } bg-white`}
          aria-describedby={error ? `${id}-error` : undefined}
          disabled={isSubmitting}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <span
            className={`truncate ${
              selectedValues.length === 0
                ? "text-neutral-500"
                : "text-neutral-900"
            }`}
          >
            {displayText}
          </span>
          <FaChevronDown
            className={`w-4 h-4 text-neutral-400 transition-transform duration-200 flex-shrink-0 ml-2 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Selected items display */}
        {selectedValues.length > 1 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {selectedLabels.slice(0, 3).map((label, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
              >
                {label}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const valueToRemove = selectedValues[index];
                    handleToggleOption(valueToRemove);
                  }}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
            {selectedValues.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-md">
                +{selectedValues.length - 3} more
              </span>
            )}
          </div>
        )}

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
            {/* Search and actions */}
            <div className="p-3 border-b border-neutral-100 space-y-2">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search options..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                  disabled={filteredOptions.length === 0}
                >
                  {allFilteredSelected ? "Deselect All" : "Select All"}
                </button>
                {selectedValues.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-xs px-2 py-1 bg-neutral-50 text-neutral-600 rounded hover:bg-neutral-100 transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Options list */}
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-neutral-500 text-center">
                  {searchTerm
                    ? "No options match your search"
                    : "No options available"}
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <label
                    key={index}
                    className="flex items-center px-4 py-3 hover:bg-neutral-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedValues.includes(option.value)}
                      onChange={() => handleToggleOption(option.value)}
                      className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm text-neutral-700 flex-1">
                      {option.label}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}

        {error && (
          <div
            id={`${id}-error`}
            className="flex items-center gap-1 text-red-600 text-sm mt-1"
            role="alert"
          >
            <FaExclamationCircle className="w-3 h-3 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);

MultiSelectDropdown.displayName = "MultiSelectDropdown";

const FormSection = memo(
  ({
    formData,
    errors,
    isSubmitting,
    company,
    jobs,
    isEditing,
    handleInputChange,
    validateField,
    assignedCompanies,
    assignedJobs,
    handleAssignedCompaniesChange,
    handleAssignedJobsChange,
  }: {
    formData: TeamMember;
    errors: FormErrors;
    isSubmitting: boolean;
    company: FilterOption[];
    jobs: FilterOption[];
    isEditing: boolean;
    handleInputChange: (
      field: keyof TeamMember,
      value: string | string[]
    ) => void;
    validateField: (field: keyof TeamMember) => void;
    assignedCompanies: string[];
    assignedJobs: string[];
    handleAssignedCompaniesChange: (values: string[]) => void;
    handleAssignedJobsChange: (values: string[]) => void;
  }) => {
    return (
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            id="member-email"
            label="Email Address"
            type="email"
            value={formData.email}
            field="email"
            placeholder="Enter member's email"
            disabled={isEditing}
            onChange={handleInputChange}
            onBlur={validateField}
            errors={errors}
            isSubmitting={isSubmitting}
          />
          <div>
            <label
              htmlFor="member-role"
              className="block text-sm font-medium text-neutral-800 mb-2"
            >
              Role{" "}
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            </label>
            <select
              id="member-role"
              value={formData.role}
              onChange={(e) => handleInputChange("role", e.target.value)}
              onBlur={() => validateField("role")}
              className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 appearance-none transition-all duration-200 ${
                errors.role
                  ? "border-red-400 focus:ring-red-500 bg-red-50"
                  : "border-neutral-300 focus:ring-blue-500 hover:border-neutral-400"
              } bg-white`}
              aria-describedby={errors.role ? "role-error" : undefined}
              aria-invalid={errors.role ? "true" : "false"}
              disabled={isSubmitting}
            >
              <option value="" disabled>
                Select a role for this team member
              </option>
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.role && (
              <div
                id="role-error"
                className="flex items-center gap-1 text-red-600 text-sm mt-1"
                role="alert"
              >
                <FaExclamationCircle className="w-3 h-3 flex-shrink-0" />
                <span>{errors.role}</span>
              </div>
            )}
          </div>
        </div>

        {/* Assignment fields - only show when editing */}
        {isEditing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-neutral-100">
            <MultiSelectDropdown
              id="member-assigned-company"
              label="Assigned Companies"
              options={company}
              selectedValues={assignedCompanies}
              onChange={handleAssignedCompaniesChange}
              onBlur={() => validateField("assigned_company")}
              error={errors.assigned_company}
              isSubmitting={isSubmitting}
              placeholder="Select companies..."
            />
            <MultiSelectDropdown
              id="member-assigned-jobs"
              label="Assigned Job Titles"
              options={jobs}
              selectedValues={assignedJobs}
              onChange={handleAssignedJobsChange}
              onBlur={() => validateField("assigned_jobs")}
              error={errors.assigned_jobs}
              isSubmitting={isSubmitting}
              placeholder="Select job titles..."
            />
          </div>
        )}
      </div>
    );
  }
);

FormSection.displayName = "FormSection";

export const Overlay = ({
  setShowOverlay,
  member,
  onSave,
  handleAssignJobsWithJobTitle,
  handleAssignCompany,
}: OverlayProps) => {
  // Form state
  const [formData, setFormData] = useState<TeamMember>({
    id: member?.id || "",
    name: member?.name || "",
    email: member?.email || "",
    role: member?.role || "",
    assigned_company: member?.assigned_company || [],
    assigned_jobs: member?.assigned_jobs || [],
  });

  // Separate state for assignments to handle them properly
  const [assignedCompanies, setAssignedCompanies] = useState<string[]>(
    member?.assigned_company || []
  );
  const [assignedJobs, setAssignedJobs] = useState<string[]>(
    member?.assigned_jobs || []
  );

  const dispatch = useAppDispatch();

  // Form validation and UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  // Refs for focus management
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLInputElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);

  const jobs = useAppSelector(
    (state: RootState) => state.candidates.filterOptions.jobTitles
  );
  const company = useAppSelector(
    (state: RootState) => state.candidates.filterOptions.companies
  );
  const organizationId =
    useAppSelector((state: RootState) => state.user.organization?.id) || "";
  const roles = useAppSelector(
    (state: RootState) => state.user.roles[0]?.role?.name || "Guest"
  );

  // Track if form has been modified
  const isEditing = Boolean(member?.id);
  const initialData = useRef({
    name: member?.name || "",
    email: member?.email || "",
    role: member?.role || "",
    assigned_company: member?.assigned_company || [],
    assigned_jobs: member?.assigned_jobs || [],
  });

  // useEffect to fetch jobs and company data if initially they are not present in state
  useEffect(() => {
    if (jobs.length === 0 || company.length === 0) {
      const userContext: UserContext = {
        userId: member?.id || "",
        organizationId: organizationId,
        roles: roles,
      };
      dispatch(fetchFilterOptions({ userContext }));
    }
  }, [jobs, company, dispatch, member?.id, organizationId, roles]);

  // Check for unsaved changes - improved to include assignments
  useEffect(() => {
    const hasBasicChanges =
      formData.name !== initialData.current.name ||
      formData.email !== initialData.current.email ||
      formData.role !== initialData.current.role;

    const hasAssignmentChanges =
      isEditing &&
      (JSON.stringify(assignedCompanies.sort()) !==
        JSON.stringify(initialData.current.assigned_company.sort()) ||
        JSON.stringify(assignedJobs.sort()) !==
          JSON.stringify(initialData.current.assigned_jobs.sort()));

    setHasUnsavedChanges(hasBasicChanges || hasAssignmentChanges);
  }, [formData, assignedCompanies, assignedJobs, isEditing]);

  // Enhanced form validation
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      } else if (formData.email.length > 100) {
        newErrors.email = "Email must be less than 100 characters";
      }
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = "Please select a role";
    } else if (!ROLE_OPTIONS.some((option) => option.value === formData.role)) {
      newErrors.role = "Please select a valid role";
    }

    // Assignment validation for editing mode
    if (isEditing) {
      // Validate that selected companies exist in options
      const invalidCompanies = assignedCompanies.filter(
        (companyId) => !company.some((comp) => comp.value === companyId)
      );
      if (invalidCompanies.length > 0) {
        newErrors.assigned_company =
          "Some selected companies are no longer available";
      }

      // Validate that selected jobs exist in options
      const invalidJobs = assignedJobs.filter(
        (jobId) => !jobs.some((job) => job.value === jobId)
      );
      if (invalidJobs.length > 0) {
        newErrors.assigned_jobs =
          "Some selected job titles are no longer available";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, assignedCompanies, assignedJobs, company, jobs, isEditing]);

  // Real-time validation on blur
  const validateField = useCallback(
    (field: keyof TeamMember) => {
      const newErrors = { ...errors };

      switch (field) {
        case "email":
          if (!formData.email.trim()) {
            newErrors.email = "Email is required";
          } else {
            const emailRegex =
              /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
            if (!emailRegex.test(formData.email)) {
              newErrors.email = "Please enter a valid email address";
            } else if (formData.email.length > 100) {
              newErrors.email = "Email must be less than 100 characters";
            } else {
              delete newErrors.email;
            }
          }
          break;
        case "role":
          if (!formData.role) {
            newErrors.role = "Please select a role";
          } else {
            delete newErrors.role;
          }
          break;
        case "assigned_company":
          // Clear company assignment errors when field is touched
          delete newErrors.assigned_company;
          break;
        case "assigned_jobs":
          // Clear job assignment errors when field is touched
          delete newErrors.assigned_jobs;
          break;
      }

      setErrors(newErrors);
    },
    [formData, errors]
  );

  // Handle close with unsaved changes check
  const handleClose = useCallback(() => {
    if (hasUnsavedChanges && !showExitConfirmation) {
      setShowExitConfirmation(true);
    } else {
      setShowOverlay(false);
    }
  }, [hasUnsavedChanges, showExitConfirmation, setShowOverlay]);

  // Force close without confirmation
  const forceClose = useCallback(() => {
    setShowOverlay(false);
  }, [setShowOverlay]);

  // Handle escape key press
  const handleEscapeKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showExitConfirmation) {
          setShowExitConfirmation(false);
        } else {
          handleClose();
        }
      }
    },
    [handleClose, showExitConfirmation]
  );

  // Handle click outside overlay
  const handleOverlayClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget && !showExitConfirmation) {
        handleClose();
      }
    },
    [handleClose, showExitConfirmation]
  );

  // Enhanced focus management
  useEffect(() => {
    document.addEventListener("keydown", handleEscapeKey);
    document.body.style.overflow = "hidden";

    // Focus first input after a brief delay to ensure proper rendering
    const focusTimer = setTimeout(() => {
      if (firstFocusableRef.current && !showExitConfirmation) {
        firstFocusableRef.current.focus();
      }
    }, 100);

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "unset";
      clearTimeout(focusTimer);
    };
  }, [handleEscapeKey, showExitConfirmation]);

  // Handle input changes with real-time feedback
  const handleInputChange = useCallback(
    (field: keyof TeamMember, value: string | string[]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear field error when user starts typing
      if (field !== "id" && field in errors) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }

      // Clear submit error if exists
      if (errors.submit) {
        setErrors((prev) => ({ ...prev, submit: undefined }));
      }
    },
    [errors]
  );

  // Handle assignment changes
  const handleAssignedCompaniesChange = useCallback((values: string[]) => {
    setAssignedCompanies(values);
    // Clear any related errors
    setErrors((prev) => ({ ...prev, assigned_company: undefined }));
  }, []);

  const handleAssignedJobsChange = useCallback((values: string[]) => {
    setAssignedJobs(values);
    // Clear any related errors
    setErrors((prev) => ({ ...prev, assigned_jobs: undefined }));
  }, []);

  // Handle form submission with improved assignment logic
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      // Focus first field with error
      const firstErrorField = Object.keys(errors)[0] as keyof FormErrors;
      const element = document.getElementById(`member-${firstErrorField}`);
      element?.focus();
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Prepare member data with assignments
      const memberData: TeamMember = {
        ...formData,
        id: member?.id || Date.now().toString(),
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        assigned_company: assignedCompanies,
        assigned_jobs: assignedJobs,
      };

      // Handle job and company assignments separately if functions are provided
      if (
        isEditing &&
        handleAssignJobsWithJobTitle &&
        assignedJobs.length > 0
      ) {
        try {
          handleAssignJobsWithJobTitle(memberData, assignedJobs);
        } catch (error) {
          console.warn("Failed to assign job titles:", error);
          // Don't fail the entire operation, just warn
        }
      }

      if (isEditing && handleAssignCompany && assignedCompanies.length > 0) {
        try {
          handleAssignCompany(memberData, assignedCompanies);
        } catch (error) {
          console.warn("Failed to assign companies:", error);
          // Don't fail the entire operation, just warn
        }
      }
      onSave(memberData);

      // Success - close the overlay
      setShowOverlay(false);
    } catch (error) {
      console.error("Error saving team member:", error);
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  // Enhanced focus trapping
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Tab" && !showExitConfirmation) {
      const focusableElements = overlayRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements && focusableElements.length > 0) {
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement;

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        onClick={handleOverlayClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby="overlay-title"
        aria-describedby="overlay-description"
      >
        <div
          ref={overlayRef}
          className="bg-white relative rounded-xl shadow-2xl max-w-2xl w-full max-h-[613px] transition-all duration-300 animate-in slide-in-from-bottom-4"
          onKeyDown={handleKeyDown}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <div>
              <h2
                id="overlay-title"
                className="text-xl font-semibold text-neutral-900"
              >
                {isEditing ? "Edit Team Member" : "Add New Team Member"}
              </h2>
              <p
                id="overlay-description"
                className="text-sm text-neutral-600 mt-1"
              >
                {isEditing
                  ? "Update the team member's information below."
                  : "Fill in the details to add a new team member to your organization."}
              </p>
            </div>
            <button
              className="text-neutral-400 hover:text-neutral-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full p-2"
              onClick={handleClose}
              aria-label="Close dialog"
              disabled={isSubmitting}
            >
              <IoMdClose className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="p-6">
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <FaExclamationCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">Error</span>
                </div>
                <p className="text-red-700 text-sm mt-1">{errors.submit}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <FormSection
                formData={formData}
                errors={errors}
                isSubmitting={isSubmitting}
                company={company || []}
                jobs={jobs || []}
                isEditing={isEditing}
                handleInputChange={handleInputChange}
                validateField={validateField}
                assignedCompanies={assignedCompanies}
                assignedJobs={assignedJobs}
                handleAssignedCompaniesChange={handleAssignedCompaniesChange}
                handleAssignedJobsChange={handleAssignedJobsChange}
              />

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
                <button
                  type="button"
                  className="px-4 py-2 text-neutral-600 border border-neutral-300 hover:border-neutral-400 hover:text-neutral-800 hover:bg-neutral-50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  ref={lastFocusableRef}
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : isEditing ? (
                    "Update Member"
                  ) : (
                    "Add Member"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      {showExitConfirmation && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <FaExclamationCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">
                  Unsaved Changes
                </h3>
                <p className="text-sm text-neutral-600">
                  You have unsaved changes. Are you sure you want to close?
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 text-neutral-600 border border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500"
                onClick={() => setShowExitConfirmation(false)}
                autoFocus
              >
                Keep Editing
              </button>
              <button
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                onClick={forceClose}
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
