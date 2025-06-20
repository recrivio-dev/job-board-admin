"use client";
import { useEffect, useState, useCallback, memo, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import Link from "next/link";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  selectIsAuthenticated,
  loginUser,
  selectUserError,
  clearError,
} from "@/store/features/userSlice";
import { useRouter } from "next/navigation";
import {
  IoAlertCircleOutline,
  IoCheckmarkCircleOutline,
} from "react-icons/io5";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Define the form schema using zod
const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters long"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginForm = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const error = useAppSelector(selectUserError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const formMethods = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    setError,
  } = formMethods;

  // Memoize error message
  const errorMessage = useMemo(() => {
    if (errors.email?.message) return errors.email.message;
    if (errors.password?.message) return errors.password.message;
    if (errors.root?.message) return errors.root.message;
    if (error) return error;
    return null;
  }, [errors, error]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const onSubmit = useCallback(
    async (data: LoginFormData) => {
      try {
        await dispatch(
          loginUser({
            email: data.email.trim().toLowerCase(),
            password: data.password,
          })
        ).unwrap();
      } catch (err) {
        console.log("Login failed:", err);
        if (error) {
          setError("root", { message: error });
        }
        // Reset the form state after a failed login attempt
        formMethods.reset();
      }
    },
    [dispatch, error, setError, formMethods]
  );

  const handleFormSubmit = useMemo(
    () => handleSubmit(onSubmit),
    [handleSubmit, onSubmit]
  );

  // Memoize input props
  const emailInputProps = useMemo(
    () => ({
      id: "email",
      type: "email",
      ...register("email"),
      disabled: isSubmitting,
      placeholder: "Enter your email",
      autoComplete: "email",
      className: `w-full p-4 border text-sm rounded-lg outline-hidden hover:border-neutral-400 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
        errors.email?.message
          ? "border-red-300 focus:border-red-500"
          : "border-neutral-300"
      }`,
    }),
    [register, errors.email?.message, isSubmitting]
  );

  const passwordInputProps = useMemo(
    () => ({
      inputProps: {
        id: "password",
        type: showPassword ? "text" : "password",
        ...register("password"),
        disabled: isSubmitting,
        placeholder: "Enter your password",
        autoComplete: "current-password",
        className: `w-full p-4 border text-sm rounded-lg pr-12 outline-hidden hover:border-neutral-400 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
          errors.password?.message
            ? "border-red-300 focus:border-red-500"
            : "border-neutral-300"
        }`,
      },
      showPassword,
      onTogglePassword: togglePasswordVisibility,
    }),
    [
      register,
      errors.password?.message,
      isSubmitting,
      showPassword,
      togglePasswordVisibility,
    ]
  );

  // Handle URL parameters for messages
  useEffect(() => {
    const emailConfirmed = searchParams.get("email_confirmed");
    const message = searchParams.get("message");
    const registered = searchParams.get("registered");

    if (emailConfirmed) {
      setSuccessMessage(
        "Your email has been confirmed! Please log in to continue."
      );
    } else if (message) {
      setSuccessMessage(decodeURIComponent(message));
    } else if (registered) {
      setSuccessMessage(
        "Registration successful! Please check your email for confirmation link."
      );
    }

    // Clear message after 8 seconds
    if (emailConfirmed || message || registered) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  // Auto-clear Redux errors
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  // Clear success message when form is modified
  useEffect(() => {
    if (successMessage && (errors.email || errors.password)) {
      setSuccessMessage(null);
    }
  }, [errors, successMessage]);

  return (
    <div className="container mx-auto px-4">
      <div className="flex flex-col justify-center items-center bg-white rounded-xl shadow-sm max-w-md mx-auto p-6 sm:py-10 sm:px-12 my-12">
        <form
          className="w-full flex flex-col gap-2"
          onSubmit={handleFormSubmit}
        >
          <h1 className="text-center text-neutral-800 font-semibold text-2xl mb-4">
            Admin Login
          </h1>

          <div>
            <label
              className="text-sm font-medium mt-4 mb-2 block"
              htmlFor={emailInputProps.id}
            >
              Email
            </label>
            <input {...emailInputProps} />
          </div>

          <div>
            <label
              className="text-sm font-medium mt-4 mb-2 block"
              htmlFor={passwordInputProps.inputProps.id}
            >
              Password
            </label>
            <div className="relative flex items-center mb-2">
              <input {...passwordInputProps.inputProps} />
              <button
                type="button"
                onClick={passwordInputProps.onTogglePassword}
                className="absolute right-4 text-neutral-500 hover:text-neutral-700"
                tabIndex={-1}
              >
                {passwordInputProps.showPassword ? (
                  <IoMdEye size={20} />
                ) : (
                  <IoMdEyeOff size={20} />
                )}
              </button>
            </div>
            <Link
              href="/forgot-password"
              className="text-blue-500 hover:text-blue-600 hover:underline text-sm font-medium block text-center mt-6 mb-2"
            >
              Forgot Password?
            </Link>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 text-red-500 text-sm mt-1">
              <IoAlertCircleOutline size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 text-green-500 text-sm mt-1">
              <IoCheckmarkCircleOutline size={16} />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="flex flex-col items-center gap-8 mt-6">
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className={`w-full py-3 text-lg font-semibold text-white rounded-lg transition-colors cursor-pointer ${
                isValid && !isSubmitting
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-blue-400 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>

            <Link
              href="/register"
              className="text-neutral-900 hover:underline text-sm font-medium"
            >
              Register here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminLogin = memo(LoginForm, () => {
  // Custom comparison function to prevent unnecessary re-renders
  return true; // Since we have no props, always return true to prevent re-renders
});

AdminLogin.displayName = "AdminLogin";

export default AdminLogin;
