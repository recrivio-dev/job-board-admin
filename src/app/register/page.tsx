"use client";
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useReducer,
} from "react";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import "react-phone-number-input/style.css";
import PhoneInput from "react-phone-number-input";
import Link from "next/link";
import { admin_email_signup } from "@/app/register/actions";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import { selectIsAuthenticated } from "@/store/features/userSlice";
import { FormState } from "@/types/custom";
import { useForm, UseFormRegister, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Define the form schema using zod
const registerSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .refine((val) => val.length >= 10, "Please enter a valid phone number"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters long"),
});

type RegisterFormData = z.infer<typeof registerSchema>;

// Define action types for the reducer
type FormAction =
  | { type: "SET_FORM_STATE"; payload: FormState | null }
  | { type: "CLEAR_FORM_STATE" }
  | {
      type: "SET_ERROR";
      payload: { field: keyof RegisterFormData; message: string };
    };

// Form reducer
const formReducer = (
  state: { formState: FormState | null },
  action: FormAction
) => {
  switch (action.type) {
    case "SET_FORM_STATE":
      return { ...state, formState: action.payload };
    case "CLEAR_FORM_STATE":
      return { ...state, formState: null };
    case "SET_ERROR":
      return {
        ...state,
        formState: { success: false, error: action.payload.message },
      };
    default:
      return state;
  }
};

// Separate form fields component to prevent unnecessary re-renders
const FormFields = React.memo(
  ({
    register,
    errors,
    isSubmitting,
    phone,
    handlePhoneChange,
    showPassword,
    handleShowPassword,
  }: {
    register: UseFormRegister<RegisterFormData>;
    errors: FieldErrors<RegisterFormData>;
    isSubmitting: boolean;
    phone: string;
    handlePhoneChange: (value: string | undefined) => void;
    showPassword: boolean;
    handleShowPassword: () => void;
  }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="text-sm font-medium mt-4 mb-2" htmlFor="name">
          Name
        </label>
        <input
          id="name"
          type="text"
          {...register("name")}
          placeholder="Enter your full name"
          className={`w-full p-4 text-sm border rounded-lg mb-2 outline-hidden hover:border-neutral-400 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
            errors.name
              ? "border-red-300 focus:border-red-500"
              : "border-neutral-300"
          }`}
          disabled={isSubmitting}
        />
        {errors.name && (
          <span className="text-red-500 text-sm">{errors.name.message}</span>
        )}
      </div>

      <div>
        <label className="text-sm font-medium mt-4 mb-2" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register("email")}
          placeholder="Enter your email"
          className={`w-full p-4 text-sm border rounded-lg mb-2 outline-hidden hover:border-neutral-400 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
            errors.email
              ? "border-red-300 focus:border-red-500"
              : "border-neutral-300"
          }`}
          disabled={isSubmitting}
        />
        {errors.email && (
          <span className="text-red-500 text-sm">{errors.email.message}</span>
        )}
      </div>

      <div>
        <label className="text-sm font-medium mt-4 mb-2" htmlFor="phone">
          Mobile Number
        </label>
        <div
          className={`focus-within:border-blue-500 focus-within:outline-hidden border rounded-lg mb-2 hover:border-neutral-400 ${
            errors.phone
              ? "border-red-300 focus-within:border-red-500"
              : "border-neutral-300"
          }`}
        >
          <PhoneInput
            id="phone"
            international
            countryCallingCodeEditable={false}
            defaultCountry="IN"
            value={phone}
            onChange={handlePhoneChange}
            className="w-full p-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="0000-000-000"
            disabled={isSubmitting}
          />
        </div>
        {errors.phone && (
          <span className="text-red-500 text-sm">{errors.phone.message}</span>
        )}
      </div>

      <div>
        <label className="text-sm font-medium mt-4 mb-2" htmlFor="password">
          Password
        </label>
        <div className="relative flex items-center mb-2">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            {...register("password")}
            placeholder="Enter your password"
            className={`w-full p-4 text-sm border rounded-lg pr-12 outline-hidden hover:border-neutral-400 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
              errors.password
                ? "border-red-300 focus:border-red-500"
                : "border-neutral-300"
            }`}
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={handleShowPassword}
            className="absolute right-4 text-neutral-500 hover:text-neutral-700"
            tabIndex={-1}
          >
            {showPassword ? <IoMdEyeOff size={20} /> : <IoMdEye size={20} />}
          </button>
        </div>
        {errors.password && (
          <span className="text-red-500 text-sm">
            {errors.password.message}
          </span>
        )}
      </div>
    </div>
  )
);
FormFields.displayName = "FormFields";

// Separate form messages component
const FormMessages = React.memo(
  ({
    searchParams,
    formState,
  }: {
    searchParams: URLSearchParams;
    formState: FormState | null;
  }) => (
    <>
      {searchParams.get("error") && !formState && (
        <div className="text-red-500 font-medium text-lg bg-red-50 p-3 rounded-lg border border-red-200">
          {searchParams.get("error")}
        </div>
      )}

      {formState && (
        <div
          className={`font-medium text-lg p-3 rounded-lg border ${
            formState.success
              ? "text-green-600 bg-green-50 border-green-200"
              : "text-red-500 bg-red-50 border-red-200"
          }`}
        >
          {formState.success ? formState.message : formState.error}
        </div>
      )}
    </>
  )
);
FormMessages.displayName = "FormMessages";

const AdminRegister = () => {
  const searchParams = useSearchParams();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [state, dispatch] = useReducer(formReducer, { formState: null });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    watch,
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
  });

  // Memoize watched values
  const phone = useMemo(() => watch("phone"), [watch]);

  // Memoize handlers
  const handleShowPassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const handlePhoneChange = useCallback(
    (value: string | undefined) => {
      setValue("phone", value || "");
    },
    [setValue]
  );

  const clearFormState = useCallback(() => {
    dispatch({ type: "CLEAR_FORM_STATE" });
  }, []);

  // Watch for form value changes to clear form state
  useEffect(() => {
    const subscription = watch(() => {
      if (state.formState) {
        clearFormState();
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, state.formState, clearFormState]);

  // Handle authentication redirect
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const onSubmit = useCallback(
    async (data: RegisterFormData) => {
      clearFormState();

      try {
        const formData = new FormData();
        formData.append("name", data.name);
        formData.append("email", data.email);
        formData.append("phone", data.phone);
        formData.append("password", data.password);

        const result = await admin_email_signup(formData);

        if (result.success) {
          dispatch({
            type: "SET_FORM_STATE",
            payload: { success: true, message: result.message },
          });
        } else {
          if (result.error?.includes("email")) {
            setError("email", { message: result.error });
          }
          dispatch({
            type: "SET_FORM_STATE",
            payload: {
              success: false,
              error: result.error || "Registration failed. Please try again.",
            },
          });
        }
      } catch (error) {
        console.log("Form submission error:", error);
        dispatch({
          type: "SET_FORM_STATE",
          payload: {
            success: false,
            error: "Something went wrong. Please try again.",
          },
        });
      }
    },
    [clearFormState, setError]
  );

  const formContent = useMemo(
    () => (
      <form
        className="w-full flex flex-col gap-2"
        onSubmit={handleSubmit(onSubmit)}
      >
        <h1 className="text-center text-neutral-800 font-semibold text-2xl mb-8">
          Register
        </h1>

        <FormFields
          register={register}
          errors={errors}
          isSubmitting={isSubmitting}
          phone={phone}
          handlePhoneChange={handlePhoneChange}
          showPassword={showPassword}
          handleShowPassword={handleShowPassword}
        />

        <FormMessages searchParams={searchParams} formState={state.formState} />

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full my-6 p-3 text-lg font-semibold text-white rounded-lg transition-colors cursor-pointer ${
            !isSubmitting
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-blue-400 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? "Registering..." : "Register"}
        </button>

        <div className="text-center mt-4">
          <Link
            href="/login"
            className="text-neutral-900 hover:underline text-sm font-medium"
          >
            Login here
          </Link>
        </div>
      </form>
    ),
    [
      handleSubmit,
      onSubmit,
      register,
      errors,
      isSubmitting,
      phone,
      handlePhoneChange,
      showPassword,
      handleShowPassword,
      searchParams,
      state.formState,
    ]
  );

  return (
    <div className="container mx-auto px-4">
      <div className="flex flex-col justify-center items-center bg-white rounded-xl shadow-sm max-w-5xl mx-auto p-6 sm:py-12 sm:px-12 my-10">
        {formContent}
      </div>
    </div>
  );
};

export default React.memo(AdminRegister);
