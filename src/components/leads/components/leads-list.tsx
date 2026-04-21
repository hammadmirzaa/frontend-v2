"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { SearchInput } from "@/components/layout/search-input";
import {
  Pagination,
  Table,
  COLORS,
  ImageWrapper,
  zIndex,
} from "@/components/ui";
import { useLeads, type LeadRow } from "@/contexts/leads-context";
import { STATUS_PILL, PRIORITY_PILL } from "../constants";
import { LeadsFilterDropdown } from "./leads-filter-dropdown";
import { LeadsFilterPanel, DEFAULT_LEADS_FILTERS, type LeadsFilters } from "./leads-filter-panel";

const STATUS_OPTIONS = [
  { value: "all" as const, label: "All Status" },
  { value: "new" as const, label: "New" },
  { value: "contacted" as const, label: "Contacted" },
  { value: "qualified" as const, label: "Qualified" },
  { value: "won" as const, label: "Won" },
  { value: "lost" as const, label: "Lost" },
];

const PRIORITY_OPTIONS = [
  { value: "all" as const, label: "All Priority" },
  { value: "low" as const, label: "Low" },
  { value: "medium" as const, label: "Medium" },
  { value: "high" as const, label: "High" },
];

const PAGE_SIZE = 6;

export function LeadsList() {
  const { leads, removeLead } = useLeads();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<LeadsFilters>(DEFAULT_LEADS_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersButtonRef = useRef<HTMLButtonElement>(null);

  const filteredLeads = leads.filter((l) => {
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }
    if (filters.status !== "all" && l.status !== filters.status) return false;
    if (filters.priority !== "all" && l.priority !== filters.priority) return false;
    if (filters.source !== "all" && l.source !== filters.source) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE));
  const start = (currentPage - 1) * PAGE_SIZE;
  const paginatedData = filteredLeads.slice(start, start + PAGE_SIZE);

  useEffect(() => {
    if (currentPage > totalPages && totalPages >= 1) {
      setCurrentPage(1);
    }
  }, [searchQuery, filters, currentPage, totalPages]);

  const tableColumns = [
    {
      id: "name",
      label: "Name",
      sortable: true,
      render: (row: LeadRow) => (
        <Link
          href={`/leads/${row.id}`}
          className="font-medium text-title cursor-pointer hover:underline"
          style={{ color: COLORS.TEXT_TITLE }}
        >
          {row.name}
        </Link>
      ),
    },
    {
      id: "email",
      label: "Email",
      sortable: true,
      accessor: "email" as const,
      cellClassName: "text-muted",
    },
    {
      id: "company",
      label: "Company",
      sortable: true,
      accessor: "company" as const,
      cellClassName: "text-body",
    },
    {
      id: "status",
      label: "Status",
      sortable: true,
      render: (row: LeadRow) => {
        const { bg, text } = STATUS_PILL[row.status];
        return (
          <span
            className="inline-flex min-w-[5.5rem] justify-center rounded-full px-2.5 py-1 text-xs font-medium capitalize"
            style={{ backgroundColor: bg, color: text }}
          >
            {row.status}
          </span>
        );
      },
    },
    {
      id: "priority",
      label: "Priority",
      sortable: true,
      render: (row: LeadRow) => {
        const { bg, text } = PRIORITY_PILL[row.priority];
        return (
          <span
            className="inline-flex min-w-[5.5rem] justify-center rounded-full px-2.5 py-1 text-xs font-medium capitalize"
            style={{ backgroundColor: bg, color: text }}
          >
            {row.priority}
          </span>
        );
      },
    },
    {
      id: "lastActivity",
      label: "Last Activity",
      sortable: true,
      accessor: "lastActivity" as const,
      cellClassName: "text-muted",
    },
    // {
    //   id: "actions",
    //   label: "Actions",
    //   render: (row: LeadRow) => (
    //     <div className="flex items-center gap-1">
    //       <button
    //         type="button"
    //         className="rounded-lg p-2 text-muted hover:bg-gray-100 hover:text-subtitle"
    //         aria-label="Edit"
    //       >
    //         <ImageWrapper src="/svgs/edit.svg" alt="Edit" width={20} height={20} />
    //       </button>
    //       <button
    //         type="button"
    //         onClick={() => removeLead(row.id)}
    //         className="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-600"
    //         aria-label="Delete"
    //       >
    //         <ImageWrapper src="/svgs/delete.svg" alt="Delete" width={20} height={20} />
    //       </button>
    //     </div>
    //   ),
    // },
  ];

  return (
    <>
      {/* All Leads section header */}
      <div className="px-6 py-3" style={{ borderColor: COLORS.CARD_BORDER }}>
        <h3 className="text-lg font-bold" style={{ color: COLORS.TEXT_TITLE }}>
          All Leads
        </h3>
        <p className="mt-1 text-sm" style={{ color: COLORS.TEXT_MUTED }}>
          All leads captured from your chatbots and connected sources.
        </p>
      </div>

      {/* Search + filter dropdowns row */}
      <div className="flex flex-col gap-4 px-6 py-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: COLORS.CARD_BORDER }}>
        <SearchInput
          placeholder="Search leads by name, company, email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:max-w-md"
          inputClassName="rounded-xl border-0 bg-search-bg h-11 placeholder:text-muted focus:bg-white focus:ring-2 focus:ring-gray-200"
        />
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <LeadsFilterDropdown
            options={STATUS_OPTIONS}
            value={filters.status}
            onChange={(value) => setFilters((f) => ({ ...f, status: value }))}
            label="All Status"
          />
          <LeadsFilterDropdown
            options={PRIORITY_OPTIONS}
            value={filters.priority}
            onChange={(value) => setFilters((f) => ({ ...f, priority: value }))}
            label="All Priority"
          />
          <div className="relative" style={{ zIndex: zIndex.dropdown }}>
            <button
              ref={filtersButtonRef}
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50"
              style={{ borderColor: COLORS.CARD_BORDER, color: COLORS.TEXT_TITLE }}
            >
              <ImageWrapper src="/svgs/filter.svg" alt="" width={18} height={18} />
              <span>Filters</span>
              <ImageWrapper src="/svgs/chevron-down.svg" alt="" width={18} height={18} />
            </button>
            <LeadsFilterPanel
              open={filtersOpen}
              onClose={() => setFiltersOpen(false)}
              anchorRef={filtersButtonRef}
              filters={filters}
              onFiltersChange={setFilters}
              onClear={() => setFilters(DEFAULT_LEADS_FILTERS)}
              onApply={() => {}}
            />
          </div>
        </div>
      </div>

      {/* Table with light grey header, rounded top */}
      <div className="overflow-x-auto">
        <Table<LeadRow>
          columns={tableColumns}
          data={paginatedData}
          keyExtractor={(row) => row.id}
          headerBackground={COLORS.TABLE_HEADER_BG}
          className="rounded-t-none"
        />
      </div>

      <div className="border-t px-6 py-4" style={{ borderColor: COLORS.CARD_BORDER }}>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </>
  );
}
