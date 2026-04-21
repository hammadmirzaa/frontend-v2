"use client";

import { useState, useMemo, useRef } from "react";
import {
  ListSidebar,
  SidebarListItem,
  SearchBarWithSlot,
  Pagination,
  COLORS,
  ImageWrapper,
} from "@/components/ui";
import {
  ConversationsSortDropdown,
  type ConversationsSortValue,
} from "./conversations-sort-dropdown";
import {
  ConversationsFilters,
  ConversationsFiltersButton,
  DEFAULT_CONVERSATIONS_FILTERS,
  type ConversationsFilterValues,
} from "./conversations-filters";
import { ConversationRow } from "./conversation-row";
import { ConversationsEmpty } from "./conversations-empty";
import { MOCK_CHATBOTS, MOCK_CONVERSATIONS } from "../constants";

const PAGE_SIZE = 6;

function formatCreatedDate(createdAt: string): string {
  return createdAt.includes("-") ? `Created on: ${createdAt}` : createdAt;
}

export function ConversationsList() {
  const [selectedChatbotId, setSelectedChatbotId] = useState<string | null>(
    MOCK_CHATBOTS[0]?.id ?? null,
  );
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [conversationsSearch, setConversationsSearch] = useState("");
  const [sortValue, setSortValue] =
    useState<ConversationsSortValue>("most-recent");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersButtonRef = useRef<HTMLButtonElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [conversationFilters, setConversationFilters] =
    useState<ConversationsFilterValues>(DEFAULT_CONVERSATIONS_FILTERS);

  const selectedChatbot = useMemo(
    () => MOCK_CHATBOTS.find((c) => c.id === selectedChatbotId),
    [selectedChatbotId],
  );

  const filteredChatbots = useMemo(() => {
    let list = [...MOCK_CHATBOTS];
    const q = sidebarSearch.trim().toLowerCase();
    if (q) list = list.filter((c) => c.name.toLowerCase().includes(q));
    if (sortValue === "oldest") list = [...list].reverse();
    if (sortValue === "name-asc")
      list.sort((a, b) => a.name.localeCompare(b.name));
    if (sortValue === "name-desc")
      list.sort((a, b) => b.name.localeCompare(a.name));
    return list;
  }, [sidebarSearch, sortValue]);

  const conversations = useMemo(() => {
    const list = selectedChatbotId
      ? (MOCK_CONVERSATIONS[selectedChatbotId] ?? [])
      : [];
    const q = conversationsSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.chatbotName.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q),
    );
  }, [selectedChatbotId, conversationsSearch]);

  const totalPages = Math.max(1, Math.ceil(conversations.length / PAGE_SIZE));
  const paginatedConversations = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return conversations.slice(start, start + PAGE_SIZE);
  }, [conversations, currentPage]);

  const rightTitle = selectedChatbot
    ? `${selectedChatbot.name} Conversations`
    : "Conversations";

  return (
    <div className="flex min-h-[max(24rem,calc(100vh-6rem))] flex-col gap-4 lg:flex-row lg:h-[calc(100vh-7rem)] md:gap-6">
      <ListSidebar
        title="Chatbots"
        searchPlaceholder="Search chatbots..."
        searchValue={sidebarSearch}
        onSearchChange={(e) => setSidebarSearch(e.target.value)}
        headerBottomSlot={
          <ConversationsSortDropdown
            value={sortValue}
            onChange={setSortValue}
          />
        }
      >
        {filteredChatbots.length === 0 ? (
          <p
            className="py-6 text-center text-sm"
            style={{ color: COLORS.TEXT_MUTED }}
          >
            No chatbots found
          </p>
        ) : (
          filteredChatbots.map((bot) => (
            <SidebarListItem
              key={bot.id}
              title={bot.name}
              subtitle={formatCreatedDate(bot.createdAt)}
              selected={selectedChatbotId === bot.id}
              onClick={() => {
                setSelectedChatbotId(bot.id);
                setCurrentPage(1);
              }}
            />
          ))
        )}
      </ListSidebar>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
        <div className="mb-4 shrink-0">
          <h2
            className="text-lg font-bold"
            style={{ color: COLORS.TEXT_TITLE }}
          >
            {rightTitle}
          </h2>
        </div>
        <SearchBarWithSlot
          placeholder="Search conversations..."
          searchValue={conversationsSearch}
          onSearchChange={(e) => setConversationsSearch(e.target.value)}
          rightSlot={
            <div className="relative">
              <ConversationsFiltersButton
                open={filtersOpen}
                onClick={() => setFiltersOpen((o) => !o)}
                buttonRef={filtersButtonRef}
              />
              <ConversationsFilters
                open={filtersOpen}
                onClose={() => setFiltersOpen(false)}
                anchorRef={filtersButtonRef}
                filters={conversationFilters}
                onFiltersChange={setConversationFilters}
                onClear={() => setConversationFilters(DEFAULT_CONVERSATIONS_FILTERS)}
                onApply={() => {}}
              />
            </div>
          }
          inputClassName="h-12 rounded-xl border-0 bg-search-bg placeholder:text-muted focus:bg-white focus:ring-2 focus:ring-gray-200"
        />

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto py-4">
          {paginatedConversations.length === 0 ? (
            <ConversationsEmpty />
          ) : (
            paginatedConversations.map((conv) => (
              <ConversationRow
                key={conv.id}
                href={`/conversations/${conv.id}`}
                title={conv.title}
                subtitle={
                  <>
                    {conv.chatbotName} <span className="mx-1 text-lg text-gray-500">•</span>
                    <ImageWrapper src="/svgs/conversations/chatting.svg" alt="" width={20} height={20} />
                    {conv.messageCount} <span className="mx-1 text-lg text-gray-500">•</span> {conv.username}
                  </>
                }
                timestamp={conv.timestamp}
              />
            ))
          )}
        </div>

        {conversations.length > 0 && (
          <div className="shrink-0 border-t border-gray-100 pt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </section>
    </div>
  );
}
