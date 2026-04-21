"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { SearchInput } from "@/components/layout/search-input";
import {
  Button,
  Pagination,
  Table,
  COLORS,
  ImageWrapper,
  zIndex,
} from "@/components/ui";
import { useChatbots } from "@/contexts/chatbots-context";
import { useKnowledgeBase } from "@/contexts/knowledge-base-context";
import type { KnowledgeBaseItem } from "../types";
import {
  KnowledgeBaseFilterPanel,
  DEFAULT_KNOWLEDGE_BASE_FILTERS,
  type KnowledgeBaseFilters,
} from "../knowledge-base-filter-panel";

const PAGE_SIZE = 6;

function lastUpdatedToYyyyMmDd(lastUpdated: string): string {
  const parts = lastUpdated.split(/[-\s/]/);
  if (parts.length < 3) return "";
  const d = parts[0];
  const m = parts[1];
  const y = parts[2];
  if (!d || !m || !y) return "";
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function applyFilters(
  list: KnowledgeBaseItem[],
  search: string,
  filters: KnowledgeBaseFilters
): KnowledgeBaseItem[] {
  let out = list;
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    out = out.filter((item) =>
      item.title.toLowerCase().includes(q)
    );
  }
  if (filters.linkedChatbotId !== "all") {
    out = out.filter((item) =>
      item.linkedChatbotIds.includes(filters.linkedChatbotId)
    );
  }
  if (filters.type !== "all") {
    out = out.filter((item) => item.sourceType === filters.type);
  }
  if (filters.dateStart && filters.dateEnd) {
    out = out.filter((item) => {
      const rowDate = lastUpdatedToYyyyMmDd(item.lastUpdated);
      return rowDate >= filters.dateStart && rowDate <= filters.dateEnd;
    });
  }
  return out;
}

export function KnowledgeBaseList() {
  const { items, removeItem } = useKnowledgeBase();
  const { chatbots } = useChatbots();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<KnowledgeBaseFilters>(
    DEFAULT_KNOWLEDGE_BASE_FILTERS
  );
  const filtersButtonRef = useRef<HTMLButtonElement>(null);

  const filteredItems = applyFilters(items, searchQuery, filters);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const start = (currentPage - 1) * PAGE_SIZE;
  const paginatedData = filteredItems.slice(start, start + PAGE_SIZE);

  useEffect(() => {
    if (currentPage > totalPages && totalPages >= 1) {
      setCurrentPage(1);
    }
  }, [searchQuery, filters, currentPage, totalPages]);

  const tableColumns = [
    {
      id: "title",
      label: "Name",
      sortable: true,
      accessor: "title" as const,
      cellClassName: "font-medium text-title",
      render: (row: KnowledgeBaseItem) => (
        <Link
          href={`/knowledge-base/${row.id}`}
          className="text-title hover:underline"
        >
          {row.title || "Untitled"}
        </Link>
      ),
    },
    {
      id: "sourceType",
      label: "Type",
      accessor: "sourceType" as const,
      cellClassName: "text-muted capitalize",
      render: (row: KnowledgeBaseItem) => (
        <span className="capitalize">
          {row.sourceType === "upload" ? "Documents" : "Manual"}
        </span>
      ),
    },
    {
      id: "linkedChatbots",
      label: "Linked Chatbots",
      render: (row: KnowledgeBaseItem) => (
        <span className="text-muted">
          {row.linkedChatbotIds.length > 0
            ? `${row.linkedChatbotIds.length} chatbot(s)`
            : "—"}
        </span>
      ),
    },
    {
      id: "lastUpdated",
      label: "Last Updated",
      sortable: true,
      accessor: "lastUpdated" as const,
      cellClassName: "text-muted",
    },
    {
      id: "actions",
      label: "Actions",
      render: (row: KnowledgeBaseItem) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => removeItem(row.id)}
            className="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-600"
            aria-label="Delete"
          >
            <ImageWrapper src="/svgs/delete.svg" alt="Delete" width={20} height={20} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-4 px-6 pt-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-title">
           All Documents
          </h3>
          <p className="mt-0.5 text-sm text-muted">
           Manage uploaded files, written pages across chatbots.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SearchInput
            placeholder="Search here..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64"
            inputClassName=" placeholder:text-muted"
          />
          <div className="relative shrink-0" style={{ zIndex: zIndex.dropdown }}>
            <Button
              ref={filtersButtonRef}
              type="button"
              variant="outline"
              className="flex items-center gap-2 rounded-lg border-gray-300 text-body"
              onClick={() => setFiltersOpen((o) => !o)}
            >
              <ImageWrapper src="/svgs/filter.svg" alt="Filter" width={20} height={20} />
              <span className="text-sm font-semibold text-muted">Filters</span>
              <ImageWrapper src="/svgs/chevron-down.svg" alt="" width={20} height={20} />
            </Button>
            <KnowledgeBaseFilterPanel
              open={filtersOpen}
              onClose={() => setFiltersOpen(false)}
              anchorRef={filtersButtonRef}
              filters={filters}
              onFiltersChange={setFilters}
              onClear={() => setFilters(DEFAULT_KNOWLEDGE_BASE_FILTERS)}
              onApply={() => {}}
              chatbotOptions={chatbots}
            />
          </div>
        </div>
      </div>

      <Table<KnowledgeBaseItem>
        columns={tableColumns}
        data={paginatedData}
        keyExtractor={(row) => row.id}
        headerBackground={COLORS.TABLE_HEADER_BG}
      />

      <div className="border-t border-gray-200 px-12 py-4">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </>
  );
}
