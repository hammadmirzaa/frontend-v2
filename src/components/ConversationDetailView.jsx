import { useState, useEffect, useRef, useMemo } from 'react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import { ChevronRight, Bot, User, Calendar, Clock, Hash, Tag } from 'lucide-react'
import config from '../config'
import { Button } from './ui/Button'
import { COLORS } from '../lib/designTokens'
import ImproveConversationDrawer from './ImproveConversationDrawer'

const API_URL = config.API_URL

const markdownComponents = {
  p: ({ node, ...props }) => <p className="mb-1.5 text-xs leading-relaxed last:mb-0" {...props} />,
  ul: ({ node, ...props }) => <ul className="mb-1.5 list-inside list-disc text-xs last:mb-0" {...props} />,
  ol: ({ node, ...props }) => <ol className="mb-1.5 list-inside list-decimal text-xs last:mb-0" {...props} />,
  li: ({ node, ...props }) => <li className="mb-0.5" {...props} />,
  code: ({ node, inline, ...props }) =>
    inline ? (
      <code className="rounded bg-gray-200/90 px-1 py-0.5 font-mono text-[11px]" {...props} />
    ) : (
      <code className="mb-1.5 block overflow-x-auto rounded bg-gray-200/90 p-2 font-mono text-[11px]" {...props} />
    ),
  pre: ({ node, ...props }) => <pre className="mb-1.5 overflow-x-auto rounded bg-gray-200/90 p-2 text-[11px]" {...props} />,
  strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
}

/**
 * Full-page conversation transcript (replaces modal) — bubbles aligned with Playground / leads chat patterns.
 *
 * @param {object} props
 * @param {string} props.sessionId
 * @param {string} props.chatbotName
 * @param {string} props.conversationTitle — row title from list / first semantic tag / fallback
 * @param {() => void} [props.onBack] — fallback when breadcrumb navigations omitted
 * @param {() => void} [props.onNavigateConversations] — e.g. close detail + show all bots’ conversations
 * @param {() => void} [props.onNavigateChatbot] — e.g. close detail + filter list to this chatbot
 */
export default function ConversationDetailView({
  sessionId,
  chatbotName,
  conversationTitle,
  onBack,
  onNavigateConversations,
  onNavigateChatbot,
}) {
  const goToConversations = onNavigateConversations ?? onBack
  const goToChatbot = onNavigateChatbot ?? onBack
  const [conversation, setConversation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [improveOpen, setImproveOpen] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (!sessionId) return undefined
    fetchConversation()
    return undefined
  }, [sessionId])

  useEffect(() => {
    conversation?.messages?.length && messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])

  const fetchConversation = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get(`${API_URL}/api/conversations/${sessionId}`)
      setConversation(response.data)
    } catch (err) {
      console.error('Failed to fetch conversation:', err)
      setError(err.response?.data?.detail || 'Failed to load conversation')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const displayUserLabel = useMemo(() => {
    const m = conversation?.metadata
    if (m && typeof m === 'object' && typeof m.username === 'string' && m.username.trim()) return m.username.trim()
    if (m && typeof m === 'object' && typeof m.user_name === 'string' && m.user_name.trim()) return m.user_name.trim()
    return 'User'
  }, [conversation])

  const title =
    conversationTitle ||
    (conversation?.semantic_tags?.length ? String(conversation.semantic_tags[0]).replace(/_/g, ' ') : 'Conversation')

  return (
    <>
      <ImproveConversationDrawer open={improveOpen} onClose={() => setImproveOpen(false)} />

      <div className="flex flex-col bg-[#F5F6F8] p-2 sm:p-4">
        <nav
          aria-label="Breadcrumb"
          className="mb-3 flex min-w-0 flex-wrap items-center gap-1.5 text-sm leading-snug sm:mb-4 sm:px-0.5"
        >
          <button
            type="button"
            onClick={() => goToConversations?.()}
            disabled={!goToConversations}
            className="font-medium text-gray-500 transition-colors hover:text-brand-teal hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/35 disabled:opacity-40"
          >
            Conversations
          </button>
          <span className="font-normal text-gray-400 select-none" aria-hidden>
            /
          </span>
          <button
            type="button"
            onClick={() => goToChatbot?.()}
            disabled={!goToChatbot}
            className="max-w-[min(100%,16rem)] truncate font-semibold text-gray-900 transition-colors hover:text-brand-teal hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/35 sm:max-w-none disabled:opacity-40"
          >
            {chatbotName || 'Chatbot'}
          </button>
        </nav>

        <div className="flex w-full flex-col rounded-xl border border-gray-100 bg-white shadow-sm ring-1 ring-gray-900/5">
          <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-gray-50 px-4 pb-4 pt-4">
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900">{title}</h1>
              <p className="mt-2 text-xs text-gray-500">
                {chatbotName || 'Chatbot'} • {displayUserLabel}
              </p>
            </div>
            <Button type="button" variant="primary" className="gap-1 px-4 py-2.5 text-sm font-semibold" onClick={() => setImproveOpen(true)}>
              Improve Conversation
              <ChevronRight className="h-4 w-4 shrink-0" strokeWidth={2} />
            </Button>
          </div>

          {/* {conversation && (
            <div className="flex shrink-0 flex-wrap gap-x-6 gap-y-1 border-b border-gray-100 px-4 py-2 text-[11px] text-gray-600">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                Started: {formatDate(conversation.created_at)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                Last activity: {formatDate(conversation.updated_at || conversation.last_accessed_at)}
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-gray-500">
                <Hash className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                {sessionId?.slice(0, 14)}…
              </span>
            </div>
          )} */}

          {/* {conversation?.semantic_tags?.length ? (
            <div className="shrink-0 border-b border-gray-100 px-4 py-2">
              <div className="flex flex-wrap items-center gap-2">
                <Tag className="h-3.5 w-3.5 shrink-0 text-brand-teal" />
                <span className="text-[11px] font-medium text-gray-700">Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {conversation.semantic_tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex rounded-full border border-brand-teal/20 bg-brand-teal/[0.06] px-2 py-0.5 text-[10px] font-medium text-brand-teal"
                    >
                      {tag.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : null} */}

          <div className="max-h-[min(560px,calc(100vh-14rem))] overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-brand-teal" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                <p className="text-sm font-semibold text-gray-900">Failed to load conversation</p>
                <p className="mt-2 text-xs text-gray-500">{error}</p>
                <Button type="button" variant="outline" className="mt-4 text-xs" onClick={() => fetchConversation()}>
                  Try again
                </Button>
              </div>
            ) : conversation?.messages?.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-500">No messages in this conversation.</div>
            ) : (
              <div className="mx-auto max-w-7xl space-y-4 pb-6">
                {conversation?.messages?.map((message, index) => {
                  const isUser = message.role === 'user'
                  return isUser ? (
                    <div key={index} className="flex justify-end gap-3">
                      <div className="flex min-w-0 max-w-[min(92%,560px)] flex-col items-end">
                        <div className="inline-block rounded-xl rounded-tr-sm border border-brand-teal/15 bg-brand-teal/[0.09] px-3 py-2.5 text-xs text-gray-900 shadow-sm">
                          <p className="whitespace-pre-wrap text-right">{message.content}</p>
                        </div>
                        {message.timestamp ? (
                          <p className="mt-1 text-[10px] text-gray-400">{formatMessageTime(message.timestamp)}</p>
                        ) : null}
                      </div>
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 bg-white shadow-sm"
                        style={{ borderColor: COLORS.BRAND }}
                      >
                        <User size={17} strokeWidth={2} style={{ color: COLORS.BRAND }} aria-hidden />
                      </div>
                    </div>
                  ) : (
                    <div key={index} className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-teal text-white shadow-sm">
                        <Bot size={17} strokeWidth={2} aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="inline-block max-w-full rounded-xl rounded-tl-sm bg-gray-100 px-3 py-2.5 text-gray-900 shadow-sm">
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown components={markdownComponents}>{message.content}</ReactMarkdown>
                          </div>
                        </div>
                        {message.timestamp ? (
                          <p className="mt-1 text-[10px] text-gray-400">{formatMessageTime(message.timestamp)}</p>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
