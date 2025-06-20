"use client";
import { useState, useEffect } from "react";
import { HiOutlineArrowCircleLeft } from "react-icons/hi";
import Link from "next/link";
import Image from "next/image";
import PhoneInput from "react-phone-number-input";
import { parsePhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import type { RootState } from "@/store/store";
import { FiEdit3 } from "react-icons/fi";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import { refreshUserData, updateProfile } from "@/store/features/userSlice";
import { updateUserProfileAction } from "@/app/login/actions";
import { updatePasswordAction } from "./actions"; // Add this import
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Define the form schema using zod
const profileSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters"),
  phone: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true; // Optional field
      try {
        const parsed = parsePhoneNumber(val);
        return parsed?.isValid() || false;
      } catch {
        return false;
      }
    }, "Please enter a valid phone number"),
  currentPassword: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true; // Optional field
      return val.length >= 6;
    }, "Current password must be at least 6 characters long"),
  newPassword: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true; // Optional field
      return val.length >= 6;
    }, "New password must be at least 6 characters long")
}).refine((data) => {
  // If one password is provided, both must be provided
  if (data.currentPassword && !data.newPassword) return false;
  if (!data.currentPassword && data.newPassword) return false;
  return true;
}, {
  message: "Both current and new passwords are required to change password",
  path: ["newPassword"] // This will show the error on the new password field
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector((state: RootState) => state.ui.sidebar.collapsed);
  const { profile, user, loading: userLoading } = useAppSelector((state) => state.user);
  
  const [email, setEmail] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: "onBlur"
  });

  // Helper function to normalize phone number to E.164 format
  const normalizePhoneNumber = (phoneNumber: string | null | undefined): string | undefined => {
    if (!phoneNumber) return undefined;
    
    try {
      // Remove all spaces and non-digit characters except + 
      const cleaned = phoneNumber.replace(/\s+/g, '');
      
      // Try to parse the phone number
      const parsed = parsePhoneNumber(cleaned);
      if (parsed && parsed.isValid()) {
        return parsed.number; // Returns E.164 format
      }
      
      // If parsing fails, return the cleaned version
      return cleaned;
    } catch (error) {
      console.warn('Phone number parsing error:', error);
      return phoneNumber.replace(/\s+/g, '');
    }
  };

  // Handle profile picture edit click
  const handleProfilePictureEdit = () => {
    alert("Profile picture update feature is coming soon!");
  };

  // Initialize form with user data
  useEffect(() => {
    if (profile) {
      setValue("name", profile.full_name || "");
      setValue("phone", normalizePhoneNumber(profile.phone) || "");
      setEmail(profile.email || "");
    } else if (user) {
      // Fallback to user email if no profile
      setEmail(user.email || "");
    }
  }, [profile, user, setValue]);

  // Load user data on component mount if not already loaded
  useEffect(() => {
    if (!profile && !userLoading) {
      dispatch(refreshUserData());
    }
  }, [dispatch, profile, userLoading]);

  // Clear messages after timeout
  useEffect(() => {
    if (updateError || updateSuccess) {
      const timer = setTimeout(() => {
        setUpdateError(null);
        setUpdateSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [updateError, updateSuccess]);

  // Clear password fields when form is submitted successfully
  useEffect(() => {
    if (updateSuccess) {
      reset({
        name: watch("name"),
        phone: watch("phone"),
        currentPassword: "",
        newPassword: ""
      });
    }
  }, [updateSuccess, reset, watch]);

  const onSubmit = async (data: ProfileFormData) => {
    setUpdateError(null);
    setUpdateSuccess(null);

    try {
      // Update profile data
      if (profile) {
        const profileUpdateData = {
          full_name: data.name.trim(),
          phone: data.phone || null, // This will be in E.164 format from react-phone-number-input
        };

        const profileResult = await updateUserProfileAction(profileUpdateData);

        if (!profileResult.success) {
          setUpdateError(profileResult.error || "Failed to update profile");
          return;
        }

        // Update Redux state with new profile data
        dispatch(updateProfile(profileUpdateData));
      }

      // Update password if provided
      if (data.currentPassword && data.newPassword && email) {
        try {
          const passwordResult = await updatePasswordAction(
            email,
            data.currentPassword,
            data.newPassword
          );

          if (!passwordResult.success) {
            setUpdateError("Password update failed. Please check your current password.");
            return;
          }
        } catch (passwordError: any) {
          console.error("Password update error:", passwordError);
          setUpdateError(passwordError.message || "Failed to update password. Please check your current password.");
          return;
        }
      }

      setUpdateSuccess("Profile updated successfully!");

    } catch (error) {
      console.error("Profile update error:", error);
      setUpdateError("An unexpected error occurred. Please try again.");
    }
  };

  // Show loading state while fetching user data
  if (userLoading && !profile) {
    return (
      <div
        className={`transition-all duration-300 min-h-full md:pb-0 px-4 ${
          collapsed ? "md:ml-20" : "md:ml-60"
        } pt-18`}
      >
        <div className="mt-4 px-2 py-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-neutral-600">Loading profile...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`transition-all duration-300 min-h-full md:pb-0 px-4 ${
        collapsed ? "md:ml-20" : "md:ml-60"
      } pt-18`}
    >
      <div className="mt-4 px-2 py-4 ">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 mb-4">
          <Link
            href="/dashboard"
            className="flex items-center text-neutral-500 hover:text-neutral-700 font-medium text-base"
          >
            <HiOutlineArrowCircleLeft className="w-6 h-6 mr-1" />
            <span>Back to Dashboard</span>
          </Link>
          <span className="text-base text-neutral-500 font-light">/</span>
          <span className="text-base font-medium text-neutral-900">
            Edit Profile
          </span>
        </div>
        
        {/* Title & Description */}
        <div className="mb-4">
          <h1 className="text-3xl font-semibold text-neutral-900 mb-2">
            Edit Profile
          </h1>
          <p className="text-neutral-600 text-base max-w-2xl">
            Update your personal information, contact details, and password to
            keep your profile up to date.
          </p>
        </div>

        {/* Success/Error Messages */}
        {updateSuccess && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">{updateSuccess}</p>
          </div>
        )}
        
        {updateError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">{updateError}</p>
          </div>
        )}
        
        {/* Profile Form */}
        <form
          className="max-w-6xl p-4 flex flex-col gap-8"
          onSubmit={handleSubmit(onSubmit)}
        >
          {/* Profile Picture */}
          <div className="flex justify-center md:justify-start">
            <div className="relative w-36 h-36 flex-shrink-0">
              <div className="rounded-full overflow-hidden w-36 h-36 flex items-center justify-center">
                  <Image
                    src={"/recrivio-profile.svg"}
                    alt="Profile Avatar"
                    fill
                    className="object-cover rounded-full"
                    sizes="9rem"
                    draggable={false}
                  /> 
              </div>
              <button
                type="button"
                onClick={handleProfilePictureEdit}
                className="absolute bottom-2 right-2 bg-neutral-200 rounded-full p-2 shadow hover:bg-neutral-300 transition cursor-pointer"
                title="Edit Avatar"
                tabIndex={-1}
              >
                <FiEdit3 className="w-5 h-5 text-neutral-700" />
              </button>
            </div>
          </div>
          
          {/* Name & Email Row */}
          <div className="flex flex-col md:flex-row gap-6 w-full">
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-neutral-700 font-medium">Name</label>
              <input
                type="text"
                {...register("name")}
                className={`rounded-lg border px-4 py-3 text-base focus:outline-none focus:ring-1 ${
                  errors.name
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50'
                    : 'border-neutral-200 focus:border-neutral-300 focus:ring-neutral-300 bg-neutral-50'
                }`}
                disabled={isSubmitting}
              />
              {errors.name && (
                <span className="text-red-500 text-sm">{errors.name.message}</span>
              )}
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <label className="text-neutral-700 font-medium">Email</label>
              <input
                type="email"
                value={email}
                className="rounded-lg border border-neutral-200 bg-neutral-100 px-4 py-3 text-base focus:outline-none cursor-not-allowed"
                readOnly
                title="Email cannot be changed"
              />
            </div>
          </div>
          
          {/* Phone Row */}
          <div className="flex flex-col md:flex-row gap-6 w-full">
            <div className="md:w-1/2 flex flex-col gap-2 pr-3">
              <label className="text-neutral-700 font-medium">Phone</label>
              <div className={`rounded-lg border ${
                errors.phone
                  ? 'border-red-300 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 bg-red-50'
                  : 'border-neutral-200 focus-within:border-neutral-300 focus-within:ring-1 focus-within:ring-neutral-300 bg-neutral-50'
              }`}>
                <PhoneInput
                  international
                  defaultCountry="IN"
                  value={watch("phone")}
                  onChange={(value) => setValue("phone", value || "")}
                  className="w-full px-4 py-3 text-base focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter phone number"
                  disabled={isSubmitting}
                />
              </div>
              {errors.phone && (
                <span className="text-red-500 text-sm">{errors.phone.message}</span>
              )}
            </div>
          </div>
          
          {/* Password Section */}
          <div className="flex flex-col gap-4">            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Password */}
              <div className="flex flex-col gap-2">
                <label className="text-neutral-700 font-medium">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    {...register("currentPassword")}
                    className={`w-full rounded-lg border px-4 py-3 text-base focus:outline-none focus:ring-1 ${
                      errors.currentPassword
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50'
                        : 'border-neutral-200 focus:border-neutral-300 focus:ring-neutral-300 bg-neutral-50'
                    }`}
                    placeholder="Enter current password"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                    tabIndex={-1}
                  >
                    {showCurrentPassword ? <IoMdEyeOff size={20} /> : <IoMdEye size={20} />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <span className="text-red-500 text-sm">{errors.currentPassword.message}</span>
                )}
              </div>

              {/* New Password */}
              <div className="flex flex-col gap-2">
                <label className="text-neutral-700 font-medium">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    {...register("newPassword")}
                    className={`w-full rounded-lg border px-4 py-3 text-base focus:outline-none focus:ring-1 ${
                      errors.newPassword
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500 bg-red-50'
                        : 'border-neutral-200 focus:border-neutral-300 focus:ring-neutral-300 bg-neutral-50'
                    }`}
                    placeholder="Enter new password"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <IoMdEyeOff size={20} /> : <IoMdEye size={20} />}
                  </button>
                </div>
                {errors.newPassword && (
                  <span className="text-red-500 text-sm">{errors.newPassword.message}</span>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-start">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-3 text-base font-medium text-white rounded-lg transition-colors ${
                !isSubmitting
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-blue-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}