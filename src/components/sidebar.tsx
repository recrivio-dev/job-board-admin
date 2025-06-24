"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BiHomeAlt } from "react-icons/bi";
import { BsBriefcase } from "react-icons/bs";
import { GoPeople, GoGear, GoPerson } from "react-icons/go";
import { HiOutlineChatAlt2 } from "react-icons/hi";
import { FiSidebar } from "react-icons/fi";
import { MdMenu } from "react-icons/md";
import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleSidebar } from "@/store/features/uiSlice";

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default function Sidebar() {
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector((state) => state.ui.sidebar.collapsed);

  return (
    <aside
      className={`hidden md:flex fixed top-0 left-0 h-full z-50 transition-all duration-300 flex-col justify-between \
        ${collapsed ? "w-20" : "w-60"} \
        bg-linear-to-b from-[#1E3170] to-[#07123A] shadow-lg`}
    >
      <div>
        <div className="px-4 pt-6 pb-2 flex flex-col">
          <Image
            src={collapsed ? "/logomark-white.svg" : "/wordmark-white.svg"}
            alt="Recrivio Logo"
            height={40}
            width={collapsed ? 40 : 172}
            className="h-11 w-full object-contain"
            priority
            draggable={false}
          />
          <div
            className={`flex justify-end mt-10 -mb-2 ${
              collapsed ? "mr-0.5" : "-mr-0.5"
            }`}
          >
            <button
              onClick={() => dispatch(toggleSidebar())}
              className="cursor-pointer"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <MdMenu className="w-10 h-10 text-white p-2 rounded-lg hover:bg-blue-900" />
              ) : (
                <FiSidebar className="w-10 h-10 text-white p-2 rounded-lg hover:bg-blue-900" />
              )}
            </button>
          </div>
        </div>
        <nav className="mt-4 flex flex-col gap-2 px-2">
          <SidebarLink
            collapsed={collapsed}
            icon={<BiHomeAlt className="w-5 h-5" />}
            label="Dashboard"
            to="/dashboard"
          />
          <SidebarLink
            collapsed={collapsed}
            icon={<BsBriefcase className="w-5 h-5" />}
            label="Jobs"
            to="/jobs"
          />
          <SidebarLink
            collapsed={collapsed}
            icon={<GoPeople className="w-5 h-5" />}
            label="Candidates"
            to="/candidates"
          />
          <SidebarLink
            collapsed={collapsed}
            icon={<HiOutlineChatAlt2 className="w-5 h-5" />}
            label="Inbox"
            to="/inbox"
          />
        </nav>
      </div>
      <div className="mb-6 px-2">
        <SidebarLink
          collapsed={collapsed}
          icon={<GoPerson className="w-5 h-5" />}
          label="User Management"
          to="/user-management"
        />
        <SidebarLink
          collapsed={collapsed}
          icon={<GoGear className="w-5 h-5" />}
          label="Settings"
          to="/settings"
        />
      </div>
    </aside>
  );
}

interface SidebarLinkProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  collapsed: boolean;
}

function SidebarLink({ icon, label, to, collapsed }: SidebarLinkProps) {
  const pathname = usePathname();
  const isActive =
    pathname === to ||
    (to === "/jobs" && pathname.startsWith("/jobs")) ||
    (to === "/candidates" && pathname.startsWith("/candidates")) ||
    (to === "/inbox" && pathname.startsWith("/inbox")) ||
    (to === "/dashboard" && pathname.startsWith("/dashboard")) ||
    (to === "/user-management" && pathname.startsWith("/user-management")) ||
    (to === "/settings" && pathname.startsWith("/settings"));

  return (
    <Link
      href={to}
      className={`flex items-center gap-3 px-2 py-2 rounded-lg text-white transition-colors duration-200 \
        ${collapsed ? "justify-center" : ""} \
        ${isActive ? "bg-blue-900" : "hover:bg-blue-900"}`}
    >
      {icon}
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
    </Link>
  );
}
