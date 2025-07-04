"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MdCurrencyRupee } from "react-icons/md";
import { IoLocationOutline } from "react-icons/io5";
import { FaChevronRight } from "react-icons/fa";
import Image from "next/image";
import GlobalStickyTable from "@/components/GlobalStickyTable";
import { TableColumn } from "./table-customization";
// import TableCustomization from "./table-customization";

interface Job {
  job_id: string;
  job_title: string;
  company_name: string;
  min_salary: number;
  max_salary: number;
  job_location: string;
  application_deadline?: string;
  status?: string;
}

const JobListComponent = ({ jobsFromStore }: { jobsFromStore: Job[] }) => {
  const router = useRouter();

  // Table customization state
  const [tableColumns, setTableColumns] = useState<TableColumn[]>([
    { key: "job_title", label: "Job", visible: true },
    { key: "company_name", label: "Company", visible: true },
    { key: "salary", label: "Salary", visible: true },
    { key: "location", label: "Location", visible: true },
    { key: "deadline", label: "Deadline", visible: true },
    { key: "status", label: "Status", visible: true },
    { key: "actions", label: "Actions", visible: true },
  ]);

  // Load column preferences from localStorage on mount
  useEffect(() => {
    const savedColumns = localStorage.getItem("jobs-table-columns");
    if (savedColumns) {
      try {
        const parsedColumns = JSON.parse(savedColumns);
        setTableColumns(parsedColumns);
      } catch (error) {
        console.error("Failed to parse saved column preferences:", error);
      }
    }
  }, []);

  // Save column preferences to localStorage when changed
  // const handleColumnToggle = useCallback((columnKey: string) => {
  //   const updatedColumns = tableColumns.map(col =>
  //     col.key === columnKey ? { ...col, visible: !col.visible } : col
  //   );
  //   setTableColumns(updatedColumns);
  //   localStorage.setItem('jobs-table-columns', JSON.stringify(updatedColumns));
  // }, [tableColumns]);

  // const handleColumnsUpdate = useCallback((updatedColumns: TableColumn[]) => {
  //   setTableColumns(updatedColumns);
  //   localStorage.setItem('candidates-table-columns', JSON.stringify(updatedColumns));
  // }, []);

  // const handleResetColumns = useCallback(() => {
  //   const defaultColumns: TableColumn[] = [
  //     { key: "checkbox", label: "Select", visible: true },
  //     { key: "job_title", label: "Job", visible: true },
  //     { key: "company_name", label: "Company", visible: true },
  //     { key: "salary", label: "Salary", visible: true },
  //     { key: "location", label: "Location", visible: true },
  //     { key: "deadline", label: "Deadline", visible: true },
  //     { key: "status", label: "Status", visible: true },
  //     { key: "actions", label: "Actions", visible: true },
  //   ];
  //   setTableColumns(defaultColumns);
  //   localStorage.setItem('jobs-table-columns', JSON.stringify(defaultColumns));
  // }, []);

  const formatSalary = useCallback((min: number | null, max: number | null) => {
    if ((min === 0 || min === null) && (max === 0 || max === null))
      return "Salary not specified";
    if (min === max) return `${(min || 0).toLocaleString()}`;
    return `${(min || 0).toLocaleString()} - ${(max || 0).toLocaleString()}`;
  }, []);

  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  const getStatusBadge = useCallback((status?: string) => {
    if (!status) return <span className="text-neutral-500">—</span>;

    const statusStyles = {
      active: "bg-green-100 text-green-800 border-green-200",
      paused: "bg-yellow-100 text-yellow-800 border-yellow-200",
      closed: "bg-red-100 text-red-800 border-red-200",
    };

    const style =
      statusStyles[status.toLowerCase() as keyof typeof statusStyles] ||
      "bg-neutral-100 text-neutral-800 border-neutral-200";

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium border ${style}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }, []);

  // Table columns configuration
  const columns = useMemo(() => {
    const allColumns = [
      {
        key: "checkbox",
        header: (
          <input type="checkbox" className="rounded border-neutral-300" />
        ),
        width: "48px",
        render: (job: Job) => (
          <input
            type="checkbox"
            className="rounded border-neutral-300"
            aria-label={`Select ${job.job_title}`}
          />
        ),
      },
      {
        key: "job_title",
        header: "Job",
        render: (job: Job) => (
          <span className="font-medium text-neutral-900">{job.job_title}</span>
        ),
      },
      {
        key: "company_name",
        header: "Company",
        render: (job: Job) => (
          <span className="text-neutral-900">{job.company_name || "N/A"}</span>
        ),
      },
      {
        key: "salary",
        header: "Salary",
        render: (job: Job) => (
          <span className="text-neutral-900">
            {formatSalary(job.min_salary, job.max_salary)}
          </span>
        ),
      },
      {
        key: "location",
        header: "Location",
        render: (job: Job) => (
          <span className="text-neutral-900">{job.job_location || "N/A"}</span>
        ),
      },
      {
        key: "deadline",
        header: "Deadline",
        render: (job: Job) => (
          <span className="text-neutral-900">
            {formatDate(job.application_deadline)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (job: Job) => getStatusBadge(job.status),
      },
      {
        key: "actions",
        header: "Actions",
        width: "120px",
        render: (job: Job) => (
          <button
            onClick={() => {
              const params = new URLSearchParams({ jobId: job.job_id });
              router.push(`jobs/job-details?${params.toString()}`);
            }}
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-md transition-colors"
          >
            View
          </button>
        ),
      },
    ];

    // Filter columns based on visibility settings
    return allColumns.filter((column) => {
      const columnConfig = tableColumns.find((col) => col.key === column.key);
      return columnConfig?.visible !== false;
    });
  }, [tableColumns, formatSalary, formatDate, getStatusBadge, router]);

  return (
    <div className="space-y-4">
      {/* Table Customization Controls */}

      {/* Uncomment this section if you want to enable column customization */}
      {/* <div className="flex justify-end">
        <TableCustomization
          columns={tableColumns}
          onColumnToggle={handleColumnToggle}
          onColumnsUpdate={handleColumnsUpdate}
        />
      </div> */}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <GlobalStickyTable
          columns={columns}
          data={jobsFromStore}
          stickyFirst
          stickyLastTwo
        />
      </div>
    </div>
  );
};

type JobCardProps = {
  id: string;
  title: string;
  company_name: string;
  location: string;
  min_salary: number;
  max_salary: number;
  company_logo_url?: string;
};

const JobCard = ({ job }: { job: JobCardProps }) => {
  const router = useRouter();
  const formatSalary = (min: number, max: number) => {
    if (min === 0 && max === 0) return "Salary not specified";
    if (min === max) return `${min.toLocaleString()}`;
    return `${min.toLocaleString()} - ${max.toLocaleString()}`;
  };

  const handleCardClick = () => {
    const params = new URLSearchParams({ jobId: job.id });
    router.push(`jobs/job-details?${params.toString()}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-2xl shadow-sm p-3 hover:shadow-md transition-all duration-200 cursor-pointer group h-full flex flex-col min-w-64"
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <Image
            src={job.company_logo_url || "/demo.png"}
            alt={`${job.company_name} logo`}
            width={48}
            height={48}
            className="w-12 h-12 rounded-xl object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/demo.png";
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-neutral-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {job.title}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">{job.company_name}</p>
        </div>
      </div>

      <div className="space-y-2 mt-auto">
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg w-fit">
            <MdCurrencyRupee className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-neutral-600">
              {formatSalary(job.min_salary, job.max_salary)}
            </p>
          </div>
          <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg w-fit">
            <IoLocationOutline className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-neutral-600 truncate">{job.location}</p>
          </div>
        </div>

        <div className="flex items-center justify-end mt-4">
          <span className="text-neutral-800 font-medium group-hover:text-blue-600 transition-colors flex items-center gap-1">
            View Details <FaChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
};

export { JobListComponent, JobCard };
export type { JobCardProps };
