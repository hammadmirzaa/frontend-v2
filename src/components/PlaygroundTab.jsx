import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Send,
  Mic,
  MicOff,
  Settings,
  ChevronDown,
  RefreshCw,
  Sparkles,
  Bot,
  User,
} from "lucide-react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import config from "../config";
import { useVoice } from "../hooks/useVoice";
import { useToast } from "../hooks/useToast";
import VoiceSettings from "./VoiceSettings";
import Spinner from "./Spinner";
import QueryLimitModal from "./QueryLimitModal";
import { SearchInput, Button, SelectChatbotModal } from "./ui";
import { cn } from "../utils/cn";
import { COLORS } from "../lib/designTokens";

const API_URL = config.API_URL;

function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateUiId() {
  return `u_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function formatMessageTime(ts) {
  if (ts == null || Number.isNaN(Number(ts))) return "";
  return new Date(Number(ts)).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatSessionTime(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 5) return "Just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  return new Date(ts).toLocaleDateString();
}

const SEED_UI_ID = "1";

export default function PlaygroundTab({ selectedChatbotId = null }) {
  const seedApiRef = useRef(generateSessionId());

  const [sessions, setSessions] = useState(() => [
    {
      uiId: SEED_UI_ID,
      apiSessionId: seedApiRef.current,
      title: "New conversation",
      updatedAt: Date.now(),
    },
  ]);
  const [activeUiId, setActiveUiId] = useState(SEED_UI_ID);
  const [messagesMap, setMessagesMap] = useState(() => ({
    [SEED_UI_ID]: [
      {
        role: "assistant",
        content: "Select a chatbot to start chatting!",
        createdAt: Date.now(),
      },
    ],
  }));
  const [chatSessionQuery, setChatSessionQuery] = useState("");

  const [chatbots, setChatbots] = useState([]);
  const [selectedChatbot, setSelectedChatbot] = useState(null);
  const [loadingChatbots, setLoadingChatbots] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceSettingsOpen, setVoiceSettingsOpen] = useState(false);
  const [chatbotPickerOpen, setChatbotPickerOpen] = useState(false);
  const [limitModal, setLimitModal] = useState({
    open: false,
    rolePopupType: "contact_admin",
  });
  const messagesEndRef = useRef(null);
  const lastReEngagementMessageRef = useRef(null);
  const eventSourceRef = useRef(null);
  const { showToast, ToastContainer } = useToast();
  const {
    isListening,
    isVoiceMode,
    transcript,
    isSupported,
    availableVoices,
    selectedVoice,
    setSelectedVoice,
    setDefaultVoice,
    getDefaultVoice,
    startListening,
    stopListening,
    toggleVoiceMode,
    speak,
    stopSpeaking,
    setTranscript,
  } = useVoice({ useDefault: false });

  const activeSession = sessions.find((s) => s.uiId === activeUiId);
  const sessionId = activeSession?.apiSessionId ?? "";

  const messages = messagesMap[activeUiId] ?? [];

  /** True once the streaming assistant message has received text — hides the separate “Thinking…” row. */
  const assistantStreamHasContent = useMemo(() => {
    const last = messages[messages.length - 1];
    return (
      last?.role === "assistant" &&
      String(last?.content ?? "").trim().length > 0
    );
  }, [messages]);

  const patchMessages = useCallback((uiId, updater) => {
    setMessagesMap((prev) => {
      const cur = prev[uiId] ?? [];
      const next = typeof updater === "function" ? updater(cur) : updater;
      return { ...prev, [uiId]: next };
    });
  }, []);

  useEffect(() => {
    fetchChatbots();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount
  }, []);

  const prevSelectedChatbotIdRef = useRef(null);

  const getWelcomeMessage = useCallback(async (chatbotId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/chatbots/${chatbotId}/welcome`,
      );
      return response.data.welcome_message;
    } catch (error) {
      console.error("Failed to fetch welcome message:", error);
      return "Hello! How can I help you today?";
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (selectedChatbotId && chatbots.length > 0) {
          const chatbot = chatbots.find((c) => c.id === selectedChatbotId);
          if (chatbot) {
            const chatbotChanged =
              prevSelectedChatbotIdRef.current !== selectedChatbotId;

            if (chatbotChanged) {
              if (prevSelectedChatbotIdRef.current !== null && sessionId) {
                axios
                  .post(`${API_URL}/api/chat/session/reset`, {
                    session_id: sessionId,
                  })
                  .catch((err) =>
                    console.error("Error resetting session:", err),
                  );
              }

              const newApi = generateSessionId();
              const welcomeMessage = await getWelcomeMessage(chatbot.id);
              setSessions([
                {
                  uiId: SEED_UI_ID,
                  apiSessionId: newApi,
                  title: "New conversation",
                  updatedAt: Date.now(),
                },
              ]);
              setActiveUiId(SEED_UI_ID);
              setMessagesMap({
                [SEED_UI_ID]: [
                  {
                    role: "assistant",
                    content: welcomeMessage,
                    createdAt: Date.now(),
                  },
                ],
              });

              prevSelectedChatbotIdRef.current = selectedChatbotId;
            }

            setSelectedChatbot(chatbot);
          }
        } else if (selectedChatbotId === null) {
          prevSelectedChatbotIdRef.current = null;
        }
      } catch (error) {
        console.error("Error in useEffect:", error);
      }
    })();
  }, [selectedChatbotId, chatbots, getWelcomeMessage]);

  const fetchChatbots = async () => {
    setLoadingChatbots(true);
    try {
      const response = await axios.get(`${API_URL}/api/chatbots/`);
      setChatbots(response.data);
      if (response.data.length > 0 && !selectedChatbot) {
        setSelectedChatbot(response.data[0]);
        const welcomeMessage = await getWelcomeMessage(response.data[0].id);
        setMessagesMap({
          [SEED_UI_ID]: [
            {
              role: "assistant",
              content: welcomeMessage,
              createdAt: Date.now(),
            },
          ],
        });
      }
    } catch (error) {
      console.error("Failed to fetch chatbots:", error);
      showToast("Failed to load chatbots", "error");
    } finally {
      setLoadingChatbots(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    lastReEngagementMessageRef.current = null;

    if (!selectedChatbot || !sessionId) return;

    const poll = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/chat/public/${sessionId}/re-engage/message`,
        );
        const reEngagementMessage = response?.data?.re_engagement_message;
        const shouldShow = response?.data?.should_show;

        if (
          shouldShow === true &&
          typeof reEngagementMessage === "string" &&
          reEngagementMessage.trim() &&
          lastReEngagementMessageRef.current !== reEngagementMessage
        ) {
          lastReEngagementMessageRef.current = reEngagementMessage;
          patchMessages(activeUiId, (prev) => [
            ...prev,
            {
              role: "assistant",
              content: reEngagementMessage,
              createdAt: Date.now(),
            },
          ]);
        }
      } catch (error) {
        return;
      }
    };

    const intervalId = setInterval(poll, 15 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [selectedChatbot, sessionId, activeUiId, patchMessages]);

  useEffect(() => {
    if (isVoiceMode && transcript) {
      setInput(transcript);
    }
  }, [transcript, isVoiceMode]);

  const lastMessageRef = useRef(null);
  useEffect(() => {
    if (isVoiceMode && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (
        lastMessage.role === "assistant" &&
        lastMessage.content &&
        lastMessageRef.current !== lastMessage.content
      ) {
        lastMessageRef.current = lastMessage.content;
        const textToSpeak = lastMessage.content
          .replace(/[#*`_~\[\]()]/g, "")
          .trim();
        if (textToSpeak) {
          try {
            speak(textToSpeak);
          } catch (error) {
            console.error("Error speaking:", error);
            showToast(
              "Failed to speak message. Please check your voice settings.",
              "error",
            );
          }
        }
      }
    }
  }, [messages, isVoiceMode, speak, showToast]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      const sid = activeSession?.apiSessionId;
      if (sid) {
        axios
          .post(`${API_URL}/api/chat/session/reset`, { session_id: sid })
          .catch((err) => console.error("Error resetting session:", err));
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount only
  }, []);

  const handleVoiceSelect = (voice) => {
    const success = setSelectedVoice(voice);
    if (!success) {
      showToast(
        `The selected voice "${voice.name}" is no longer available. Please choose another voice.`,
        "error",
      );
      return false;
    }
    showToast(`Voice "${voice.name}" selected`, "success");
    return true;
  };

  const handleSetDefaultVoice = (voice) => {
    if (!voice) return false;
    const success = setDefaultVoice(voice);
    if (!success) {
      showToast(
        `The selected voice "${voice.name}" is no longer available. Please choose another voice.`,
        "error",
      );
      return false;
    }
    showToast(`Default voice set to "${voice.name}"`, "success");
    return true;
  };

  const handleChatbotSelect = async (chatbot) => {
    if (sessionId && selectedChatbot && selectedChatbot.id !== chatbot.id) {
      try {
        await axios.post(`${API_URL}/api/chat/session/reset`, {
          session_id: sessionId,
        });
      } catch (err) {
        console.error("Error resetting session:", err);
      }
      const newApi = generateSessionId();
      setSessions((prev) =>
        prev.map((s) =>
          s.uiId === activeUiId
            ? {
                ...s,
                apiSessionId: newApi,
                title: "New conversation",
                updatedAt: Date.now(),
              }
            : s,
        ),
      );
    }
    setSelectedChatbot(chatbot);
    setInput("");
    lastMessageRef.current = null;
    const welcomeMessage = await getWelcomeMessage(chatbot.id);
    patchMessages(activeUiId, [
      { role: "assistant", content: welcomeMessage, createdAt: Date.now() },
    ]);
  };

  const refreshSession = async () => {
    if (!selectedChatbot) return;
    if (sessionId) {
      try {
        await axios.post(`${API_URL}/api/chat/session/reset`, {
          session_id: sessionId,
        });
      } catch (err) {
        console.error("Error resetting session:", err);
      }
    }
    const newApi = generateSessionId();
    setSessions((prev) =>
      prev.map((s) =>
        s.uiId === activeUiId
          ? { ...s, apiSessionId: newApi, updatedAt: Date.now() }
          : s,
      ),
    );
    const welcomeMessage = await getWelcomeMessage(selectedChatbot.id);
    patchMessages(activeUiId, [
      { role: "assistant", content: welcomeMessage, createdAt: Date.now() },
    ]);
    setInput("");
    lastMessageRef.current = null;
    showToast("Conversation refreshed", "success");
  };

  const handleNewChatSession = async () => {
    const uiId = generateUiId();
    const apiId = generateSessionId();
    const welcome = selectedChatbot
      ? await getWelcomeMessage(selectedChatbot.id)
      : "Select a chatbot to start chatting!";
    setSessions((prev) => [
      ...prev,
      {
        uiId,
        apiSessionId: apiId,
        title: "New conversation",
        updatedAt: Date.now(),
      },
    ]);
    setMessagesMap((prev) => ({
      ...prev,
      [uiId]: [{ role: "assistant", content: welcome, createdAt: Date.now() }],
    }));
    setActiveUiId(uiId);
    setInput("");
    setTranscript("");
  };

  const handleSend = async (textToSend = null) => {
    if (!selectedChatbot) {
      showToast("Please select a chatbot first", "error");
      return;
    }

    const messageText = textToSend || input;
    if (!messageText.trim() || loading) return;

    const uiId = activeUiId;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const prevLen = messagesMap[uiId]?.length ?? 0;
    const assistantMessageIndex = prevLen + 1;

    const sentAt = Date.now();
    const userMessage = {
      role: "user",
      content: messageText,
      createdAt: sentAt,
    };
    patchMessages(uiId, (prev) => [
      ...prev,
      userMessage,
      { role: "assistant", content: "", sources: [] },
    ]);
    setSessions((prev) =>
      prev.map((s) => {
        if (s.uiId !== uiId) return s;
        const nextTitle =
          s.title === "New conversation"
            ? messageText.slice(0, 28) + (messageText.length > 28 ? "…" : "")
            : s.title;
        return { ...s, title: nextTitle, updatedAt: Date.now() };
      }),
    );

    setInput("");
    setTranscript("");
    setLoading(true);

    if (isVoiceMode) {
      stopSpeaking();
    }

    try {
      const response = await fetch(`${API_URL}/api/chat/query/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          query: messageText,
          session_id: sessionId,
          chatbot_id: selectedChatbot.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulatedContent = "";
      let accumulatedSources = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6).trim());

              switch (data.type) {
                case "start":
                  break;

                case "token":
                  accumulatedContent += data.content;
                  patchMessages(uiId, (prev) => {
                    const updated = [...prev];
                    updated[assistantMessageIndex] = {
                      ...updated[assistantMessageIndex],
                      content: accumulatedContent,
                    };
                    return updated;
                  });
                  break;

                case "done":
                  if (data.sources && data.sources.length > 0) {
                    accumulatedSources = Array.from(
                      new Map(
                        data.sources.map((s) => [s.filename, s]),
                      ).values(),
                    );
                  }

                  patchMessages(uiId, (prev) => {
                    const updated = [...prev];
                    updated[assistantMessageIndex] = {
                      ...updated[assistantMessageIndex],
                      content: accumulatedContent,
                      sources: accumulatedSources,
                      createdAt: Date.now(),
                    };
                    return updated;
                  });

                  setLoading(false);
                  break;

                case "error":
                  if (data.error_code === "QUERY_LIMIT_REACHED") {
                    setLimitModal({
                      open: true,
                      rolePopupType: data.role_popup_type || "contact_admin",
                    });
                    patchMessages(uiId, (prev) => [
                      ...prev.slice(0, -1),
                      {
                        role: "assistant",
                        content:
                          "Usage limit reached. Please follow the instructions in the popup.",
                        sources: [],
                        createdAt: Date.now(),
                      },
                    ]);
                    setLoading(false);
                    return;
                  }
                  throw new Error(
                    data.message || "Error in streaming response",
                  );

                default:
                  break;
              }
            } catch (parseError) {
              console.error("Error parsing SSE data:", parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in streaming:", error);

      try {
        const response = await axios.post(`${API_URL}/api/chat/query`, {
          query: messageText,
          session_id: sessionId,
          chatbot_id: selectedChatbot.id,
        });

        const uniqueSources = response.data.sources
          ? Array.from(
              new Map(
                response.data.sources.map((s) => [s.filename, s]),
              ).values(),
            )
          : [];

        patchMessages(uiId, (prev) => [
          ...prev.slice(0, -1),
          {
            role: "assistant",
            content: response.data.response,
            sources: uniqueSources,
            createdAt: Date.now(),
          },
        ]);
      } catch (fallbackError) {
        const code = fallbackError?.response?.data?.error_code;
        const rolePopupType = fallbackError?.response?.data?.role_popup_type;
        if (code === "QUERY_LIMIT_REACHED") {
          setLimitModal({
            open: true,
            rolePopupType: rolePopupType || "contact_admin",
          });
          patchMessages(uiId, (prev) => [
            ...prev.slice(0, -1),
            {
              role: "assistant",
              content:
                "Usage limit reached. Please follow the instructions in the popup.",
              createdAt: Date.now(),
            },
          ]);
        } else {
          patchMessages(uiId, (prev) => [
            ...prev.slice(0, -1),
            {
              role: "assistant",
              content: "Sorry, I encountered an error. Please try again.",
              createdAt: Date.now(),
            },
          ]);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVoiceToggle = () => {
    toggleVoiceMode();
    if (isListening) {
      stopListening();
    }
    if (isVoiceMode) {
      stopSpeaking();
    }
  };

  const handleMicrophoneClick = () => {
    if (isListening) {
      stopListening();
    } else {
      setInput("");
      setTranscript("");
      startListening();
    }
  };

  const filteredSessions = useMemo(() => {
    const q = chatSessionQuery.trim().toLowerCase();
    const sorted = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
    if (!q) return sorted;
    return sorted.filter((s) => s.title.toLowerCase().includes(q));
  }, [sessions, chatSessionQuery]);

  const markdownComponents = useMemo(
    () => ({
      p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
      ul: ({ node, ...props }) => (
        <ul className="mb-2 list-inside list-disc" {...props} />
      ),
      ol: ({ node, ...props }) => (
        <ol className="mb-2 list-inside list-decimal" {...props} />
      ),
      li: ({ node, ...props }) => <li className="mb-1" {...props} />,
      code: ({ node, inline, ...props }) =>
        inline ? (
          <code
            className="rounded bg-gray-200 px-1 py-0.5 text-sm"
            {...props}
          />
        ) : (
          <code
            className="mb-2 block overflow-x-auto rounded bg-gray-200 p-2 text-sm"
            {...props}
          />
        ),
      pre: ({ node, ...props }) => (
        <pre
          className="mb-2 overflow-x-auto rounded bg-gray-200 p-2 text-sm"
          {...props}
        />
      ),
      h1: ({ node, ...props }) => (
        <h1 className="mt-2 mb-2 text-lg font-bold first:mt-0" {...props} />
      ),
      h2: ({ node, ...props }) => (
        <h2 className="mt-2 mb-2 text-base font-bold first:mt-0" {...props} />
      ),
      h3: ({ node, ...props }) => (
        <h3 className="mt-2 mb-2 text-sm font-bold first:mt-0" {...props} />
      ),
      strong: ({ node, ...props }) => (
        <strong className="font-semibold" {...props} />
      ),
      em: ({ node, ...props }) => <em className="italic" {...props} />,
      blockquote: ({ node, ...props }) => (
        <blockquote
          className="mb-2 border-l-4 border-gray-300 pl-2 italic"
          {...props}
        />
      ),
    }),
    [],
  );

  return (
    <div className="flex h-[calc(100vh-7rem)] max-h-[calc(100vh-7rem)] min-h-0 flex-col overflow-hidden bg-[#F5F6F8] p-2 sm:p-4">
      <ToastContainer />

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden lg:flex-row lg:gap-4">
        {/* Chat sessions */}
        <aside className="flex w-full min-h-0 shrink-0 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm lg:max-h-full lg:max-w-[300px]">
          <div className="border-b border-gray-100 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Chat Sessions
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  Recent conversations for this bot.
                </p>
              </div>
              <button
                type="button"
                onClick={handleNewChatSession}
                className="shrink-0 text-xs font-semibold text-brand-teal hover:underline"
              >
                New chat
              </button>
            </div>
          </div>
          <div className="my-3 px-4">
            <SearchInput
              placeholder="Search chats..."
              value={chatSessionQuery}
              onChange={(e) => setChatSessionQuery(e.target.value)}
              className="max-w-none"
            />
          </div>
          <ul className="max-h-[min(520px,50vh)] px-4 flex-1 divide-y divide-gray-100 overflow-y-auto lg:max-h-none">
            {filteredSessions.map((s) => {
              const active = s.uiId === activeUiId;
              return (
                <li key={s.uiId}>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveUiId(s.uiId);
                      setInput("");
                      setTranscript("");
                    }}
                    className={cn(
                      "w-full px-4 py-4 flex justify-between items-center rounded-lg text-left transition-colors",
                      !active && "hover:bg-gray-50",
                    )}
                    style={
                      active
                        ? {
                            backgroundColor:
                              COLORS.PLAYGROUND_CHAT_HIGHLIGHT_BG,
                          }
                        : undefined
                    }
                  >
                    <p
                      className={cn(
                        "truncate text-sm font-semibold",
                        active ? "text-gray-900" : "text-gray-800",
                      )}
                    >
                      {s.title}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {formatSessionTime(s.updatedAt)}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Chat panel: flex column with scrollable messages + composer pinned at bottom */}
        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-6">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-900">Title</h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Ask questions about your uploaded documents.
              </p>
            </div>
            <div className="relative flex shrink-0 items-center gap-2">
              {/* {isSupported && (
                <button
                  type="button"
                  onClick={() => setVoiceSettingsOpen(true)}
                  className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100"
                  title="Voice settings"
                  aria-label="Voice settings"
                >
                  <Settings size={20} strokeWidth={1.75} />
                </button>
              )} */}
              <button
                type="button"
                onClick={() => refreshSession()}
                disabled={!selectedChatbot || loadingChatbots}
                className="rounded-full p-2 text-brand-teal transition-colors hover:bg-gray-100 disabled:opacity-40"
                title="Refresh conversation"
                aria-label="Refresh conversation"
              >
                <RefreshCw size={18} strokeWidth={2} />
              </button>
              <Button
                type="button"
                variant="outline"
                className="gap-2 px-4 py-2 text-sm"
                onClick={() => setChatbotPickerOpen(true)}
                disabled={loadingChatbots}
              >
                {loadingChatbots ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" />
                    Loading…
                  </span>
                ) : selectedChatbot ? (
                  <>
                    <span className="max-w-[160px] truncate">
                      {selectedChatbot.name}
                    </span>
                    <ChevronDown size={16} className="shrink-0 opacity-70" />
                  </>
                ) : (
                  <>
                    <span>Select chatbot</span>
                    <ChevronDown size={16} className="shrink-0 opacity-70" />
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain px-4 py-4 sm:px-6">
            {!selectedChatbot && (
              <div className="flex h-full min-h-[200px] items-center justify-center text-center text-sm text-gray-500">
                Select a chatbot to start chatting.
              </div>
            )}
            {selectedChatbot &&
              messages.map((msg, idx) => {
                if (
                  msg.role === "assistant" &&
                  !String(msg.content ?? "").trim()
                ) {
                  return null;
                }
                return (
                <div
                  key={idx}
                  className={cn(
                    "mb-4 flex gap-3",
                    msg.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-teal text-white">
                      <Bot size={18} strokeWidth={2} aria-hidden />
                    </div>
                  )}
                  <div
                    className={cn(
                      "flex max-w-[85%] flex-col sm:max-w-[75%]",
                      msg.role === "user"
                        ? "order-first items-end"
                        : "items-start",
                    )}
                  >
                    <div
                      className={cn(
                        "w-full rounded-2xl px-4 py-3 text-sm",
                        msg.role === "user"
                          ? "bg-sky-100 text-gray-900"
                          : "bg-gray-100 text-gray-900",
                      )}
                    >
                      {msg.role === "user" ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="prose prose-sm max-w-none text-gray-900">
                          <ReactMarkdown components={markdownComponents}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                      {msg.createdAt != null && (
                        <time
                          dateTime={new Date(msg.createdAt).toISOString()}
                          className={cn(
                            "mt-2 text-[11px] tabular-nums text-gray-400",
                            msg.role === "user" ? "text-right" : "text-left",
                          )}
                        >
                          {formatMessageTime(msg.createdAt)}
                        </time>
                      )}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2 border-t border-gray-200 pt-2">
                          <p className="mb-1 text-xs font-semibold">Sources:</p>
                          {msg.sources.map((source, i) => (
                            <p key={i} className="text-xs opacity-75">
                              • {source.filename}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-teal text-white">
                      <User size={18} strokeWidth={2} aria-hidden />
                    </div>
                  )}
                </div>
                );
              })}
            {loading && !assistantStreamHasContent ? (
              <div className="flex justify-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-teal text-white">
                  <Bot size={18} strokeWidth={2} />
                </div>
                <div className="rounded-2xl bg-gray-100 px-4 py-3">
                  <p className="text-sm italic text-gray-500">Thinking…</p>
                </div>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 border-t border-gray-100 bg-white p-4 sm:p-6">
            {!selectedChatbot ? null : isVoiceMode ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleMicrophoneClick}
                      className={cn(
                        "rounded-full p-4 transition-all",
                        isListening
                          ? "animate-pulse bg-red-500 text-white hover:bg-red-600"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                      )}
                      disabled={loading}
                      title={isListening ? "Stop recording" : "Start recording"}
                    >
                      {isListening ? <MicOff size={22} /> : <Mic size={22} />}
                    </button>
                    <input
                      type="text"
                      value={transcript || input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        setTranscript(e.target.value);
                      }}
                      placeholder={
                        isListening
                          ? "Listening…"
                          : "Click microphone to speak or type here…"
                      }
                      className="min-w-0 flex-1 border-0 bg-transparent text-sm outline-none ring-0 focus:ring-0"
                      disabled={loading}
                    />
                    <Button
                      type="button"
                      variant="primary"
                      disabled={loading || !(transcript || input).trim()}
                      onClick={() => handleSend(transcript || input)}
                    >
                      <Send size={18} strokeWidth={2} />
                      Send
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleVoiceToggle}
                  >
                    Exit voice chat
                  </Button>
                </div>
                {isListening && (
                  <p className="animate-pulse text-center text-xs text-gray-500">
                    Listening… Speak now
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex gap-3">
                    <Sparkles
                      className="mt-1 h-5 w-5 shrink-0 text-brand-teal"
                      strokeWidth={2}
                      aria-hidden
                    />
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Type your message..."
                      rows={3}
                      className="min-h-[72px] w-full resize-none border-0 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                      disabled={loading}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-end gap-3 px-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleVoiceToggle}
                      disabled={!isSupported}
                    >
                      Start Voice Chat
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      disabled={loading || !input.trim()}
                      onClick={() => handleSend()}
                    >
                      <Send size={18} strokeWidth={2} />
                      Send
                    </Button>
                  </div>
                </div>
                <p className="mt-3 text-center text-xs text-gray-500">
                  MeiChat can make mistakes. Verify important information.
                </p>
              </>
            )}
          </div>
        </section>
      </div>

      <SelectChatbotModal
        isOpen={chatbotPickerOpen}
        onClose={() => setChatbotPickerOpen(false)}
        chatbots={chatbots}
        selectedChatbotId={selectedChatbot?.id ?? null}
        loading={loadingChatbots}
        onConfirm={(bot) => {
          handleChatbotSelect(bot);
        }}
      />

      <VoiceSettings
        isOpen={voiceSettingsOpen}
        onClose={() => setVoiceSettingsOpen(false)}
        availableVoices={availableVoices}
        selectedVoice={selectedVoice}
        defaultVoice={getDefaultVoice()}
        onVoiceSelect={handleVoiceSelect}
        onSetDefaultVoice={handleSetDefaultVoice}
        showDefaultOption={true}
      />

      <QueryLimitModal
        isOpen={limitModal.open}
        rolePopupType={limitModal.rolePopupType}
        onClose={() =>
          setLimitModal({ open: false, rolePopupType: "contact_admin" })
        }
      />
    </div>
  );
}
