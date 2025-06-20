import { FaCaretDown } from "react-icons/fa";
import { useState, useRef, useEffect, memo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/store/features/userSlice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store/store";

const UserButton = memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  const handleSignOut = useCallback(async () => {
    try {
      console.log("Logging out user...");
      await dispatch(logoutUser());
      router.push("/login");
    } catch (error) {
      console.log("Failed to log out:", error);
    }
    setIsOpen(false);
  }, [dispatch, router]);

  const toggleDropdown = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <div className="fixed w-full py-8 bg-neutral-50 border-b border-neutral-200 transition-all duration-300 z-40">
      <div className="fixed top-2.5 right-12 z-50" ref={dropdownRef}>
        <button
          role="button"
          onClick={toggleDropdown}
          className="flex items-center bg-neutral-200 rounded-3xl px-2 py-2 cursor-pointer whitespace-nowrap"
        >
          <div className="flex items-center justify-center bg-gradient-to-b from-blue-600 to-blue-700 shadow-lg rounded-full p-2 flex-shrink-0">
            <Image
              src="/logomark-white.svg"
              alt="logo"
              width={10}
              height={10}
              className="h-3 w-3"
            />
          </div>
          <FaCaretDown className="w-5 h-5 text-neutral-500 flex-shrink-0" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-b-xl shadow-2xl z-50 py-4 px-4 flex flex-col gap-3">
            <Link
              href="/profile"
              className="w-full text-left text-neutral-800 font-medium hover:font-semibold rounded transition px-0 cursor-pointer"
              onClick={() => setIsOpen(false)}
            >
              Edit Profile
            </Link>
            <Link
              href="/settings"
              className="w-full text-left text-neutral-800 font-medium hover:font-semibold rounded transition px-0 cursor-pointer"
              onClick={() => setIsOpen(false)}
            >
              Settings
            </Link>
            <Link
              href="/help"
              className="w-full text-left text-neutral-800 font-medium hover:font-semibold rounded transition px-0 cursor-pointer"
              onClick={() => setIsOpen(false)}
            >
              Help Center
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full text-left text-red-600 rounded transition px-0 font-medium hover:font-semibold cursor-pointer"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

UserButton.displayName = "UserButton";

export default UserButton;
