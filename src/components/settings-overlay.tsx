"use client";
import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { IoMdClose } from "react-icons/io";
import { FaExclamationCircle } from "react-icons/fa";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface OverlayProps {
  setShowOverlay: (show: boolean) => void;
  member: TeamMember | null;
  onSave: (member: TeamMember) => void;
}

interface FormErrors {
  name?: string;
  email?: string;
  role?: string;
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

// Memoize the form section component
const FormSection = memo(
  ({
    formData,
    errors,
    isSubmitting,
    isEditing,
    handleInputChange,
    validateField,
  }: {
    formData: TeamMember;
    errors: FormErrors;
    isSubmitting: boolean;
    isEditing: boolean;
    handleInputChange: (field: keyof TeamMember, value: string) => void;
    validateField: (field: keyof TeamMember) => void;
  }) => (
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
        {// add assigned jobs field
        // <div>
        //   <label
        //     htmlFor="member-assigned-jobs"
        //     className="block text-sm font-medium text-neutral-800 mb-2"
        //   >
        //     Assigned Jobs
        //   </label>
        //   <textarea
        //     id="member-assigned-jobs"
        //     value={formData.assigned_jobs}
        //     onChange={(e) => handleInputChange("assigned_jobs", e.target.value)}
        //     onBlur={() => validateField("assigned_jobs")}
        //     className={`w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 transition-all duration-200 ${
        //       errors.assigned_jobs
        //         ? "border-red-400 focus:ring-red-500 bg-red-50"
        //         : "border-neutral-300 focus:ring-blue-500 hover:border-neutral-400"
        //     } bg-white`}
        //     aria-describedby={errors.assigned_jobs ? "assigned-jobs-error" : undefined}
        //     aria-invalid={errors.assigned_jobs ? "true" : "false"}
        //     disabled={isSubmitting}
        //   />
        //   {errors.assigned_jobs && (
        //     <div
        //       id="assigned-jobs-error"
        //       className="flex items-center gap-1 text-red-600 text-sm mt-1"
        //       role="alert"
        //     >
        //       <FaExclamationCircle className="w-3 h-3 flex-shrink-0" />
        //       <span>{errors.assigned_jobs}</span>
        //     </div>
        //   )}
        // </div>
        }
      </div>
    </div>
  )
);

FormSection.displayName = "FormSection";

export const Overlay = ({ setShowOverlay, member, onSave }: OverlayProps) => {
  // Form state
  const [formData, setFormData] = useState<TeamMember>({
    id: member?.id || "",
    name: member?.name || "",
    email: member?.email || "",
    role: member?.role || "",
  });

  // Form validation and UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  // Refs for focus management
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLInputElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);

  // Track if form has been modified
  const isEditing = Boolean(member?.id);
  const initialData = useRef({
    name: member?.name || "",
    email: member?.email || "",
    role: member?.role || "",
  });

  // Check for unsaved changes
  useEffect(() => {
    const hasChanges =
      formData.name !== initialData.current.name ||
      formData.email !== initialData.current.email ||
      formData.role !== initialData.current.role;

    setHasUnsavedChanges(hasChanges);
  }, [formData]);

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

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

  // Handle input changes with real-time feedback - made stable with useCallback
  const handleInputChange = useCallback(
    (field: keyof TeamMember, value: string) => {
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

  // Handle form submission with better error handling
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
      const memberData = {
        ...formData,
        id: member?.id || Date.now().toString(),
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
      };

      onSave(memberData);
      // onSave should handle closing the overlay on success
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
          className="bg-white relative rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300"
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
                isEditing={isEditing}
                handleInputChange={handleInputChange}
                validateField={validateField}
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
