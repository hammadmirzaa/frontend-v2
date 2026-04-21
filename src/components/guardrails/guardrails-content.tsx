"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { AppLayout } from "@/components/layout";
import { SearchInput } from "@/components/layout/search-input";
import {
  Button,
  EmptyState,
  Pagination,
  StatusBadge,
  Table,
  COLORS,
  ImageWrapper,
} from "@/components/ui";
import { CreateGuardrailModal, EditGuardrailModal, type GuardrailRow } from "./create-guardrail-modal";
import {
  GuardrailsFilterPanel,
  DEFAULT_GUARDRAILS_FILTERS,
  type GuardrailsFilters,
} from "./guardrails-filter-panel";

const PAGE_SIZE = 6;

function lastUpdatedToYyyyMmDd(lastUpdated: string): string {
  const [d, m, y] = lastUpdated.split("-");
  if (!d || !m || !y) return "";
  return `${y}-${m}-${d}`;
}

function applyFilters(
  list: GuardrailRow[],
  search: string,
  filters: GuardrailsFilters
): GuardrailRow[] {
  let out = list;
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    out = out.filter((g) => g.name.toLowerCase().includes(q));
  }
  if (filters.status !== "all") {
    out = out.filter((g) => g.status === filters.status);
  }
  if (filters.dateStart && filters.dateEnd) {
    out = out.filter((g) => {
      const rowDate = lastUpdatedToYyyyMmDd(g.lastUpdated);
      return rowDate >= filters.dateStart && rowDate <= filters.dateEnd;
    });
  }
  return out;
}

function GuardrailEmptyIcon() {
  return (
    <ImageWrapper src="/svgs/info.svg" alt="Guardrail" width={64} height={64} />
  );
}

export function GuardrailsContent() {
  const [guardrails, setGuardrails] = useState<GuardrailRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<GuardrailsFilters>(DEFAULT_GUARDRAILS_FILTERS);
  const [editGuardrail, setEditGuardrail] = useState<GuardrailRow | null>(null);
  const filtersButtonRef = useRef<HTMLButtonElement>(null);

  const filteredList = applyFilters(guardrails, searchQuery, filters);
  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const start = (currentPage - 1) * PAGE_SIZE;
  const paginatedData = filteredList.slice(start, start + PAGE_SIZE);
  const showTable = guardrails.length > 0;

  useEffect(() => {
    if (currentPage > totalPages && totalPages >= 1) {
      setCurrentPage(1);
    }
  }, [searchQuery, filteredList.length, totalPages, currentPage]);

  const handleCreate = useCallback((payload: Omit<GuardrailRow, "id">) => {
    setGuardrails((prev) => [
      ...prev,
      { ...payload, id: crypto.randomUUID?.() ?? String(Date.now()) },
    ]);
  }, []);

  const removeGuardrail = useCallback((id: string) => {
    setGuardrails((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const updateGuardrail = useCallback((updated: GuardrailRow) => {
    setGuardrails((prev) =>
      prev.map((g) => (g.id === updated.id ? updated : g))
    );
  }, []);

  const tableColumns = [
    {
      id: "name",
      label: "Name",
      sortable: true,
      accessor: "name" as const,
      cellClassName: "font-medium text-gray-900",
    },
    {
      id: "linkedChatbot",
      label: "Linked Chatbot",
      accessor: "linkedChatbot" as const,
      cellClassName: "text-gray-600",
    },
    {
      id: "status",
      label: "Status",
      render: (row: GuardrailRow) => <StatusBadge status={row.status} />,
    },
    {
      id: "lastUpdated",
      label: "Last Updated",
      sortable: true,
      accessor: "lastUpdated" as const,
      cellClassName: "text-gray-600",
    },
    {
      id: "actions",
      label: "Actions",
      render: (row: GuardrailRow) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setEditGuardrail(row)}
            className="rounded-lg p-2 text-red-500 hover:bg-red-50 hover:text-red-600"
            aria-label="Edit guardrail"
          >
            <ImageWrapper src="/svgs/edit.svg" alt="Edit guardrail" width={20} height={20} />
          </button>
          <button
            type="button"
            onClick={() => removeGuardrail(row.id)}
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
    <AppLayout title="Guardrail">
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row items-center sm:justify-between border-b border-gray-200 pb-4 ">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Guardrails &amp; Rules
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Define what your bot can and cannot share
            </p>
          </div>
          <CreateGuardrailModal onCreate={handleCreate}>
            <Button
              type="button"
              className="shrink-0 rounded-lg px-4 py-2.5 font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: COLORS.BRAND }}
            >
              Add new guardrail
            </Button>
          </CreateGuardrailModal>
        </div>

        <div className={`rounded-xl ${showTable ? "bg-white" : ""}`}>
          {!showTable ? (
            <div className="flex min-h-[76vh] w-full">
              <EmptyState
                icon={<GuardrailEmptyIcon />}
                title="No custom guardrails configured"
                description="Add custom restrictions to control tone, topics, or behavior."
                className="flex-1"
              />
            </div>
          ) : (
            <>
            <div className="flex justify-between items-center" >
              <div className=" px-6 pt-4">
                <h3 className="text-lg font-bold text-gray-900">Guardrails</h3>
                <p className="mt-0.5 text-sm text-gray-500">
                  Manage rules that control what your chatbots can and can&apos;t do.
                </p>
              </div>
              <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <SearchInput
                  placeholder="Search here..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64"
                  inputClassName=" placeholder:text-gray-500"
                  style={{
                    backgroundColor: COLORS.INPUT_BG,
                  }}
                />
                <div className="relative shrink-0">
                  <Button
                    ref={filtersButtonRef}
                    type="button"
                    variant="outline"
                    className="flex items-center gap-2 rounded-lg border-gray-300 text-gray-700 cursor-pointer"
                    onClick={() => setFiltersOpen((o) => !o)}
                  >
                    <ImageWrapper src="/svgs/filter.svg" alt="Filter" width={20} height={20} />
                    <span className="text-sm font-semibold text-gray-600">Filters</span>
                    <ImageWrapper src="/svgs/chevron-down.svg" alt="Chevron Down" width={20} height={20} />
                  </Button>
                  <GuardrailsFilterPanel
                    open={filtersOpen}
                    onClose={() => setFiltersOpen(false)}
                    anchorRef={filtersButtonRef}
                    filters={filters}
                    onFiltersChange={setFilters}
                    onClear={() => setFilters(DEFAULT_GUARDRAILS_FILTERS)}
                    onApply={() => {}}
                  />
                </div>
              </div>
              </div>
              <EditGuardrailModal
                open={!!editGuardrail}
                onClose={() => setEditGuardrail(null)}
                guardrail={editGuardrail}
                onSave={(updated) => {
                  updateGuardrail(updated);
                  setEditGuardrail(null);
                }}
              />
              <Table<GuardrailRow>
                columns={tableColumns}
                data={paginatedData}
                keyExtractor={(row) => row.id}
                headerBackground={COLORS.TABLE_HEADER_BG_ALT}
              />
              <div className="border-t border-gray-200 px-12 py-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
