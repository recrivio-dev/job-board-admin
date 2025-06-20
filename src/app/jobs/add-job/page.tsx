"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HiOutlineArrowCircleLeft } from "react-icons/hi";
import Image from "next/image";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import type { RootState } from "@/store/store";
import { FiUpload } from "react-icons/fi";
import { FaArrowRight } from "react-icons/fa6";
import Link from "next/link";
import LexicalEditor from "@/components/LexicalEditor";
import { getSignedURL } from "@/app/jobs/actions";
import { createJob } from "@/store/features/jobSlice";
import { initializeAuth } from "@/store/features/userSlice";
import type { RawJob } from "@/store/features/jobSlice";
import type { FormErrors, JobFormData } from "@/types/custom";
import { computeChecksum, renderError } from "./utils";

const steps = ["Company", "Job Details", "Job Description"];

export default function AddJob() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const collapsed = useAppSelector(
    (state: RootState) => state.ui.sidebar.collapsed
  );
  const loading = useAppSelector((state: RootState) => state.jobs.loading);

  // Get user info from user slice
  const user = useAppSelector((state: RootState) => state.user.user);
  const organization = useAppSelector(
    (state: RootState) => state.user.organization
  );
  const roles = useAppSelector((state: RootState) => state.user.roles);

  // Initialize authentication if not already done
  useEffect(() => {
    if (!user && !loading) {
      dispatch(initializeAuth());
    }
  }, [user, dispatch, roles, organization, loading]);

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<JobFormData>({
    companyLogo: null,
    companyName: "",
    jobTitle: "",
    jobType: "",
    jobLocationType: "",
    jobLocation: "",
    workingType: "",
    minExperience: "",
    maxExperience: "",
    minSalary: "",
    maxSalary: "",
    jobDescription: "",
    applicationDeadline: "",
    status: "active",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear errors when form data changes
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setErrors({});
    }
  }, [formData, errors]);

  const validateStep = (currentStep: number): boolean => {
    const newErrors: FormErrors = {};

    switch (currentStep) {
      case 0: // Company step
        if (!formData.companyLogo) {
          newErrors.companyLogo = "Company logo is required";
        }
        if (!formData.companyName.trim()) {
          newErrors.companyName = "Company name is required";
        }
        break;

      case 1: // Job Details step
        if (!formData.jobTitle.trim()) {
          newErrors.jobTitle = "Job title is required";
        }
        if (!formData.jobType) {
          newErrors.jobType = "Job type is required";
        }
        if (!formData.jobLocationType) {
          newErrors.jobLocationType = "Job location type is required";
        }
        if (!formData.jobLocation) {
          newErrors.jobLocation = "Job location is required";
        }
        if (!formData.workingType) {
          newErrors.workingType = "Working type is required";
        }
        if (!formData.minExperience || !formData.maxExperience) {
          newErrors.experience =
            "Both minimum and maximum experience are required";
        } else if (
          Number(formData.minExperience) > Number(formData.maxExperience)
        ) {
          newErrors.experience =
            "Minimum experience cannot be greater than maximum";
        }
        if (!formData.minSalary || !formData.maxSalary) {
          newErrors.salary = "Both minimum and maximum salary are required";
        } else if (Number(formData.minSalary) > Number(formData.maxSalary)) {
          newErrors.salary = "Minimum salary cannot be greater than maximum";
        }
        break;

      case 2: // Job Description step
        if (!formData.jobDescription.trim()) {
          newErrors.jobDescription = "Job description is required";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  // Handlers
  const handleInputChange = (field: keyof JobFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        setErrors((prev) => ({
          ...prev,
          companyLogo: "Please select a valid image file (JPG, JPEG, or PNG)",
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 2 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          companyLogo: "File size must be less than 2MB",
        }));
        return;
      }

      setFormData((prev) => ({
        ...prev,
        companyLogo: file,
      }));
    }
  };

  const handleUploadLogo = async (
    file: File
  ): Promise<{ key: string; userId: string }> => {
    try {
      const checksum = await computeChecksum(file);
      const signedURL = await getSignedURL(
        file.type,
        file.size,
        checksum,
        formData.companyName
      );

      if (signedURL.error) {
        throw new Error(signedURL.error);
      }

      const url = signedURL.success?.url;
      const key = signedURL.success?.key;
      const userId = signedURL.success?.userId;

      if (!url || !key || !userId) {
        throw new Error("Failed to get signed URL");
      }

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      return { key, userId };
    } catch (error) {
      throw new Error(
        `Failed to upload company logo: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleNext = async () => {
    // Validate current step
    if (!validateStep(step)) {
      return;
    }

    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!user?.id || !organization?.id) {
      setErrors({
        general: "User authentication required. Please log in again.",
      });
      return;
    }
    // //check role
    // if (roles[0].role.name !== "admin" && roles[0].role.name !== "hr") {
    //   setErrors({ general: "You do not have permission to create a job." });
    //   return;
    // }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Upload company logo
      const uploadResult = await handleUploadLogo(formData.companyLogo!);
      const logoUrl = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_BUCKET_REGION}.amazonaws.com/${uploadResult.key}`;

      // Prepare job data matching the database schema
      const jobData: Omit<RawJob, "id" | "created_at" | "updated_at"> = {
        organization_id: organization?.id || null,
        title: formData.jobTitle.trim(),
        description: formData.jobDescription.trim(),
        company_name: formData.companyName.trim(),
        company_logo_url: logoUrl,
        location: formData.jobLocation,
        job_location_type: formData.jobLocationType,
        job_type: formData.jobType,
        working_type: formData.workingType,
        salary_min: Number(formData.minSalary),
        salary_max: Number(formData.maxSalary),
        min_experience_needed: Number(formData.minExperience),
        max_experience_needed: Number(formData.maxExperience),
        status: formData.status,
        application_deadline: formData.applicationDeadline || null,
        created_by: user.id,
      };

      // Create job using Redux action
      const resultAction = await dispatch(createJob(jobData));

      if (createJob.fulfilled.match(resultAction)) {
        // Success - redirect to jobs page
        router.push("/jobs");
      } else {
        // Handle error from Redux action
        const errorMessage =
          (resultAction.payload as string) || "Failed to create job";
        setErrors({ general: errorMessage });
      }
    } catch (error) {
      console.log("Error creating job:", error);
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      router.push("/jobs");
    }
  };

  return (
    <div
      className={`transition-all duration-300 min-h-full md:pb-0 px-3 md:px-6 ${
        collapsed ? "md:ml-20" : "md:ml-60"
      } pt-18`}
    >
      <div className="w-full mx-auto mt-4 px-2">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 mb-2">
          <Link
            href="/dashboard"
            className="flex items-center text-neutral-500 hover:text-neutral-700 font-medium text-sm"
          >
            <HiOutlineArrowCircleLeft className="w-5 h-5 mr-1" />
            <span>Back to Dashboard</span>
          </Link>
          <span className="text-sm text-neutral-500 font-light">/</span>
          <Link
            href="/jobs"
            className="text-neutral-500 hover:text-neutral-700 font-medium text-sm"
          >
            Jobs
          </Link>
          <span className="text-sm text-neutral-500 font-light">/</span>
          <span className="text-sm font-medium text-neutral-900">
            Add a New Job
          </span>
        </div>

        {/* Header */}
        <h1 className="text-xl font-semibold mb-1">Add a New Job</h1>
        <p className="text-neutral-500 text-sm mb-10">
          Create and publish a new job listing to attract the right candidates.
        </p>

        {/* Global Error */}
        {errors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            {renderError(errors.general)}
          </div>
        )}

        {/* Step Navigation */}
        <div className="w-full overflow-x-auto">
          <div className="flex gap-4 mb-6 min-w-fit">
            <div className="flex gap-4 border-b border-neutral-300">
              {steps.map((s, i) => (
                <button
                  key={s}
                  className={`px-3 sm:px-4 py-2 text-sm sm:text-base text-center font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    i === step
                      ? "border-b-4 border-blue-600"
                      : i < step
                      ? "text-green-600"
                      : "text-neutral-500"
                  }`}
                  onClick={() => setStep(i)}
                  type="button"
                  disabled={i > step}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex justify-center items-center w-full">
          <div className="w-full pb-20">
            <form
              className="bg-white rounded-2xl shadow-xs p-8"
              onSubmit={(e) => e.preventDefault()}
            >
              {/* Step 0: Company */}
              {step === 0 && (
                <div>
                  <label className="block font-medium mb-2">
                    Company Logo
                  </label>
                  <label
                    className={`flex flex-col items-center justify-center rounded-lg p-6 my-8 cursor-pointer transition max-w-sm mx-auto ${
                      errors.companyLogo
                        ? "bg-red-50 border-2 border-red-200 hover:bg-red-100"
                        : "bg-neutral-100 hover:bg-neutral-200/80"
                    }`}
                    htmlFor="company-logo-upload"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        document.getElementById("company-logo-upload")?.click();
                      }
                    }}
                  >
                    {formData.companyLogo ? (
                      <Image
                        src={URL.createObjectURL(formData.companyLogo)}
                        alt="Company Logo Preview"
                        width={80}
                        height={80}
                        className="rounded-xl object-cover mb-2"
                      />
                    ) : (
                      <>
                        <FiUpload className="text-blue-600 text-3xl" />
                        <span className="font-medium text-neutral-700">
                          Upload Media
                        </span>
                        <span className="text-xs text-neutral-400 mt-1">
                          Accepted file types: jpg, jpeg, png | Max size: 5MB
                        </span>
                      </>
                    )}
                    <input
                      id="company-logo-upload"
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      className="hidden"
                      onChange={handleLogoChange}
                      tabIndex={-1}
                    />
                  </label>
                  {errors.companyLogo && renderError(errors.companyLogo)}

                  <label className="block font-semibold mb-2">
                    Name of the hiring company
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full border rounded-lg px-3 py-2 mb-2 ${
                      errors.companyName
                        ? "border-red-300"
                        : "border-neutral-300"
                    }`}
                    placeholder="e.g. Google"
                    value={formData.companyName}
                    onChange={(e) =>
                      handleInputChange("companyName", e.target.value)
                    }
                  />
                  {errors.companyName && renderError(errors.companyName)}
                </div>
              )}

              {/* Step 1: Job Details */}
              {step === 1 && (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        Job Title<span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className={`w-full border text-sm rounded-lg px-3 py-4 mb-2 ${
                          errors.jobTitle
                            ? "border-red-300"
                            : "border-neutral-300"
                        }`}
                        placeholder="e.g. UI/UX Designer"
                        value={formData.jobTitle}
                        onChange={(e) =>
                          handleInputChange("jobTitle", e.target.value)
                        }
                      />
                      {errors.jobTitle && renderError(errors.jobTitle)}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Job Type<span className="text-red-500">*</span>
                      </label>
                      <select
                        className={`w-full border text-sm rounded-lg px-3 py-4 mb-2 ${
                          errors.jobType
                            ? "border-red-300"
                            : "border-neutral-300"
                        }`}
                        value={formData.jobType}
                        onChange={(e) =>
                          handleInputChange("jobType", e.target.value)
                        }
                      >
                        <option value="">Select</option>
                        <option value="full-time">Full-Time</option>
                        <option value="part-time">Part-Time</option>
                        <option value="internship">Internship</option>
                        <option value="contract">Contract</option>
                      </select>
                      {errors.jobType && renderError(errors.jobType)}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Job Location Type<span className="text-red-500">*</span>
                      </label>
                      <select
                        className={`w-full border text-sm rounded-lg px-3 py-4 mb-2 ${
                          errors.jobLocationType
                            ? "border-red-300"
                            : "border-neutral-300"
                        }`}
                        value={formData.jobLocationType}
                        onChange={(e) =>
                          handleInputChange("jobLocationType", e.target.value)
                        }
                      >
                        <option value="">Select</option>
                        <option value="on-site">On-site</option>
                        <option value="remote">Remote</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                      {errors.jobLocationType &&
                        renderError(errors.jobLocationType)}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Job Location<span className="text-red-500">*</span>
                      </label>
                      <select
                        className={`w-full border text-sm rounded-lg px-3 py-4 mb-2 ${
                          errors.jobLocation
                            ? "border-red-300"
                            : "border-neutral-300"
                        }`}
                        value={formData.jobLocation}
                        onChange={(e) =>
                          handleInputChange("jobLocation", e.target.value)
                        }
                      >
                        <option value="">Select</option>
                        <option value="Remote">Remote</option>
                        <option value="New York">New York</option>
                        <option value="San Francisco">San Francisco</option>
                        <option value="Bangalore">Bangalore</option>
                        <option value="London">London</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors.jobLocation && renderError(errors.jobLocation)}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Working Type<span className="text-red-500">*</span>
                      </label>
                      <select
                        className={`w-full border text-sm rounded-lg px-3 py-4 mb-2 ${
                          errors.workingType
                            ? "border-red-300"
                            : "border-neutral-300"
                        }`}
                        value={formData.workingType}
                        onChange={(e) =>
                          handleInputChange("workingType", e.target.value)
                        }
                      >
                        <option value="">Select</option>
                        <option value="Day">Day</option>
                        <option value="Night">Night</option>
                        <option value="Flexible">Flexible</option>
                      </select>
                      {errors.workingType && renderError(errors.workingType)}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Status<span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full border text-sm border-neutral-300 rounded-lg px-3 py-4 mb-2"
                        value={formData.status}
                        onChange={(e) =>
                          handleInputChange("status", e.target.value)
                        }
                      >
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">
                      Experience<span className="text-red-500">*</span>{" "}
                      <span className="text-neutral-400">(Years)</span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        className={`w-full border text-sm rounded-lg px-3 py-4 ${
                          errors.experience
                            ? "border-red-300"
                            : "border-neutral-300"
                        }`}
                        value={formData.minExperience}
                        onChange={(e) =>
                          handleInputChange("minExperience", e.target.value)
                        }
                      >
                        <option value="">Min.</option>
                        {[...Array(11).keys()].map((y) => (
                          <option key={y} value={y}>
                            {y === 10 ? "10+" : y}
                          </option>
                        ))}
                      </select>
                      <select
                        className={`w-full border text-sm rounded-lg px-3 py-4 ${
                          errors.experience
                            ? "border-red-300"
                            : "border-neutral-300"
                        }`}
                        value={formData.maxExperience}
                        onChange={(e) =>
                          handleInputChange("maxExperience", e.target.value)
                        }
                      >
                        <option value="">Max</option>
                        {[...Array(11).keys()].map((y) => (
                          <option key={y} value={y}>
                            {y === 10 ? "10+" : y}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.experience && renderError(errors.experience)}
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">
                      Salary<span className="text-red-500">*</span>{" "}
                      <span className="text-neutral-400">
                        (Lakhs per annum)
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <select
                        className={`w-full border text-sm rounded-lg px-3 py-4 ${
                          errors.salary
                            ? "border-red-300"
                            : "border-neutral-300"
                        }`}
                        value={formData.minSalary}
                        onChange={(e) =>
                          handleInputChange("minSalary", e.target.value)
                        }
                      >
                        <option value="">Min.</option>
                        {[...Array(51).keys()].map((s) => (
                          <option key={s + 1} value={s + 1}>
                            {s + 1}
                          </option>
                        ))}
                      </select>
                      <select
                        className={`w-full border text-sm rounded-lg px-3 py-4 ${
                          errors.salary
                            ? "border-red-300"
                            : "border-neutral-300"
                        }`}
                        value={formData.maxSalary}
                        onChange={(e) =>
                          handleInputChange("maxSalary", e.target.value)
                        }
                      >
                        <option value="">Max</option>
                        {[...Array(51).keys()].map((s) => (
                          <option key={s + 1} value={s + 1}>
                            {s + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.salary && renderError(errors.salary)}
                  </div>
                </div>
              )}

              {/* Step 2: Job Description */}
              {step === 2 && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Job Description<span className="text-red-500">*</span>
                  </label>
                  <div
                    className={
                      errors.jobDescription
                        ? "border border-red-300 rounded-lg"
                        : ""
                    }
                  >
                    <LexicalEditor
                      value={formData.jobDescription}
                      onChange={(value) =>
                        handleInputChange("jobDescription", value)
                      }
                    />
                  </div>
                  {errors.jobDescription && renderError(errors.jobDescription)}
                </div>
              )}
            </form>

            {/* Action Buttons */}
            <div className="flex justify-end mt-6 gap-2">
              <button
                type="button"
                className="border border-neutral-500 text-neutral-600 rounded-lg px-4 py-2 font-medium hover:bg-neutral-100 cursor-pointer disabled:opacity-50"
                onClick={handleBack}
                disabled={isSubmitting || loading}
              >
                {step === 0 ? "Cancel" : "Back"}
              </button>
              <button
                type="button"
                className="bg-blue-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-blue-700 flex items-center cursor-pointer disabled:opacity-50"
                onClick={handleNext}
                disabled={isSubmitting || loading}
              >
                {isSubmitting || loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {step === steps.length - 1
                      ? "Creating..."
                      : "Processing..."}
                  </>
                ) : (
                  <>
                    {step === steps.length - 1 ? "Create Job" : "Next"}
                    <span className="ml-2">
                      <FaArrowRight />
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
