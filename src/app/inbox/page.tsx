"use client"
import Breadcrumb from "@/components/Breadcrumb";
import { useAppSelector } from "@/store/hooks";

export default function Inbox() {
  const collapsed = useAppSelector((state) => state.ui.sidebar.collapsed);
  return (
    <div>

      <div
        className={`transition-all duration-300 h-full px-3 md:px-6 ${
          collapsed ? "md:ml-20" : "md:ml-60"
        } pt-18`}
      >
        
        <div className="w-full mx-auto px-0 md:px-4 py-4 md:py-2">
          <Breadcrumb segments={[{ label: "Inbox" }]} />
          <div>
            Inbox feature is under development. Stay tuned for updates!
          </div>
        </div>
      </div>
    </div>
  );
}
