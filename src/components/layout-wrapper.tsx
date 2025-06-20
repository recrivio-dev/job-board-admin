"use client";

import { usePathname } from "next/navigation";
import LogoHeader from "@/components/logo-header";
import Sidebar from "@/components/sidebar";
import BottomNav from "@/components/bottom-nav";
import { Suspense } from "react";
import { useAppSelector } from "@/store/hooks";
import UserButton from "@/components/UserButton";

interface LayoutWrapperProps {
  children: React.ReactNode;
  hideBottomNav?: boolean;
}

export default function LayoutWrapper({
  children,
  hideBottomNav = false,
}: LayoutWrapperProps) {
  const pathname = usePathname();
  const collapsed = useAppSelector((state) => state.ui.sidebar.collapsed);
  const isAuthPage = [
    "/login",
    "/register",
    "/reset-password",
    `/forgot-password`,
  ].includes(pathname);

  if (isAuthPage) {
    return (
      <>
        <LogoHeader />
        {children}
      </>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen">
          <div className="w-64 h-screen bg-neutral-100 animate-pulse" />
          <div className="h-16 bg-neutral-100 animate-pulse" />
          <div className="min-h-screen bg-neutral-100 animate-pulse" />
          {!hideBottomNav && (
            <div className="h-16 bg-neutral-100 animate-pulse fixed bottom-0 w-full" />
          )}
        </div>
      }
    >
      <Sidebar />
      <div
        className={`md:ml-20 ${
          collapsed ? "md:ml-20" : "md:ml-60"
        } transition-all duration-300`}
      >
        <UserButton />
      </div>
      <main className="pb-32 md:pb-0">{children}</main>
      {!hideBottomNav && <BottomNav />}
    </Suspense>
  );
}
