"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout";
import { SearchInput } from "@/components/layout/search-input";
import {
  EmptyState,
  Pagination,
  StatusBadge,
  Table,
  COLORS,
  ImageWrapper,
} from "@/components/ui";
import { useChatbots, type ChatbotRow } from "@/contexts/chatbots-context";

function ChatbotEmptyIcon() {
  return (
    <img
      src="/svgs/emptyChatbot.svg"
      alt=""
      width={64}
      height={64}
      className="h-16 w-16 object-contain"
    />
  );
}

const PAGE_SIZE = 6;

export function ChatbotsContent() {
  const { chatbots, removeChatbot } = useChatbots();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const showTable = chatbots.length > 0;
  const filteredList = searchQuery.trim()
    ? chatbots.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : chatbots;
  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const start = (currentPage - 1) * PAGE_SIZE;
  const paginatedData = filteredList.slice(start, start + PAGE_SIZE);

  useEffect(() => {
    if (currentPage > totalPages && totalPages >= 1) {
      setCurrentPage(1);
    }
  }, [searchQuery, filteredList.length, totalPages, currentPage]);


  const tableColumns = [
    {
      id: "name",
      label: "Chatbot name",
      sortable: true,
      accessor: "name" as const,
      cellClassName: "font-medium text-gray-900",
    },
    {
      id: "status",
      label: "Status",
      render: (row: ChatbotRow) => <StatusBadge status={row.status} />,
    },
    {
      id: "createdAt",
      label: "Created at",
      sortable: true,
      accessor: "createdAt" as const,
      cellClassName: "text-gray-600",
    },
    {
      id: "actions",
      label: "Actions",
      render: (row: ChatbotRow) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/chatbots/${row.id}/edit`}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            aria-label="Edit"
          >
            <ImageWrapper src="/svgs/edit.svg" alt="Edit" width={20} height={20} />
          </Link>
          <button
            type="button"
            onClick={() => removeChatbot(row.id)}
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
    <AppLayout title="Chatbots">
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between items-center border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Chatbot Management
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Generate embed code to integrate your chatbot into any website
            </p>
          </div>
          <Link
            href="/chatbots/new"
            className="shrink-0 rounded-lg px-4 py-3 text-sm text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: COLORS.BRAND }}
          >

            Create a new chatbot
          </Link>
        </div>

        <div className={` ${showTable ? "bg-white" : ""}`}>
          {!showTable ? (
            <div className="flex min-h-[76vh] w-full">
              <EmptyState
                icon={<ChatbotEmptyIcon />}
                title="Your chatbot list is empty."
                description="Once you add a chatbot, it will appear here."
                className="flex-1"
              />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4  px-6 pt-4 sm:flex-row sm:items-center sm:justify-between ">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Your Chatbots
                  </h3>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Manage and explore all your chatbots in one place.
                  </p>
                </div>
                <SearchInput
                  placeholder="Search here..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                  inputClassName=" placeholder:text-gray-500"
                  style={{
                    backgroundColor: COLORS.INPUT_BG,
                  }}
                />
              </div>
              <Table<ChatbotRow>
                columns={tableColumns}
                data={paginatedData}
                keyExtractor={(row) => row.id}
                headerBackground={COLORS.INPUT_BRAND_SELECTED}
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
