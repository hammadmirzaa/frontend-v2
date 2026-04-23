import { useState, useEffect, useRef } from 'react'
import { X, MessageCircle, User, Bot, Clock, Calendar, Hash, Tag } from 'lucide-react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import config from '../config'

const API_URL = config.API_URL

export default function ConversationDetailModal({ isOpen, onClose, sessionId, chatbotName }) {
    const [conversation, setConversation] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const messagesEndRef = useRef(null)

    useEffect(() => {
        if (isOpen && sessionId) {
            fetchConversation()
        }
    }, [isOpen, sessionId])

    useEffect(() => {
        if (conversation?.messages?.length) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
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
            minute: '2-digit'
        })
    }

    const formatMessageTime = (timestamp) => {
        if (!timestamp) return ''
        const date = new Date(timestamp)
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col animate-slide-in mx-4">
                {/* Header */}
                <div className="p-5 border-b flex items-center justify-between bg-gradient-to-r from-purple-600 to-indigo-600 rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                            <MessageCircle size={22} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">{chatbotName || 'Conversation'}</h2>
                            <p className="text-sm text-white/80">
                                {conversation?.message_count || 0} messages
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-white" />
                    </button>
                </div>

                {/* Conversation Info */}
                {conversation && (
                    <div className="px-5 py-3 bg-gray-50 border-b flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            <span>Started: {formatDate(conversation.created_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={14} />
                            <span>Last activity: {formatDate(conversation.updated_at || conversation.last_accessed_at)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Hash size={14} />
                            <span className="font-mono text-xs">{sessionId?.slice(0, 12)}...</span>
                        </div>
                    </div>
                )}

                {/* Semantic Tags Section */}
                {conversation?.semantic_tags && conversation.semantic_tags.length > 0 && (
                    <div className="px-5 py-3 border-b bg-gradient-to-r from-purple-50/50 to-indigo-50/50">
                        <div className="flex items-center gap-2 mb-2">
                            <Tag size={14} className="text-purple-600" />
                            <span className="text-sm font-medium text-gray-700">Conversation Tags</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {conversation.semantic_tags.map((tag, index) => {
                                // Determine tag color based on category keywords
                                let colorClass = 'bg-purple-100 text-purple-700 border-purple-200';
                                if (tag.includes('intent') || tag.includes('interest') || tag.includes('request')) {
                                    colorClass = 'bg-blue-100 text-blue-700 border-blue-200';
                                } else if (tag.includes('sentiment') || tag.includes('frustrated') || tag.includes('positive') || tag.includes('negative')) {
                                    colorClass = 'bg-amber-100 text-amber-700 border-amber-200';
                                } else if (tag.includes('lead') || tag.includes('b2b') || tag.includes('enterprise')) {
                                    colorClass = 'bg-emerald-100 text-emerald-700 border-emerald-200';
                                } else if (tag.includes('phase') || tag.includes('stage') || tag.includes('contact')) {
                                    colorClass = 'bg-indigo-100 text-indigo-700 border-indigo-200';
                                }

                                return (
                                    <span
                                        key={index}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${colorClass}`}
                                    >
                                        {tag.replace(/_/g, ' ')}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                                <X size={28} className="text-red-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load conversation</h3>
                            <p className="text-sm text-gray-500">{error}</p>
                            <button
                                onClick={fetchConversation}
                                className="mt-4 px-4 py-2 gradient-bg text-white rounded-lg text-sm font-medium hover:opacity-90"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : conversation?.messages?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                <MessageCircle size={28} className="text-gray-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages</h3>
                            <p className="text-sm text-gray-500">This conversation has no messages yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {conversation?.messages?.map((message, index) => (
                                <div
                                    key={index}
                                    className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    {/* Avatar */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user'
                                        ? 'bg-purple-100'
                                        : 'bg-gray-100'
                                        }`}>
                                        {message.role === 'user' ? (
                                            <User size={16} className="text-purple-600" />
                                        ) : (
                                            <Bot size={16} className="text-gray-600" />
                                        )}
                                    </div>

                                    {/* Message Content */}
                                    <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                                        <div
                                            className={`inline-block rounded-2xl px-4 py-3 ${message.role === 'user'
                                                ? 'gradient-bg text-white rounded-tr-sm'
                                                : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                                                }`}
                                        >
                                            {message.role === 'user' ? (
                                                <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                                            ) : (
                                                <div className="prose prose-sm max-w-none text-left">
                                                    <ReactMarkdown
                                                        components={{
                                                            p: ({ node, ...props }) => <p className="mb-2 last:mb-0 text-sm" {...props} />,
                                                            ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 text-sm" {...props} />,
                                                            ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2 text-sm" {...props} />,
                                                            li: ({ node, ...props }) => <li className="mb-1 text-sm" {...props} />,
                                                            code: ({ node, inline, ...props }) =>
                                                                inline ? (
                                                                    <code className="bg-gray-200 px-1 py-0.5 rounded text-xs" {...props} />
                                                                ) : (
                                                                    <code className="block bg-gray-200 p-2 rounded text-xs overflow-x-auto" {...props} />
                                                                ),
                                                            pre: ({ node, ...props }) => <pre className="bg-gray-200 p-2 rounded text-xs overflow-x-auto mb-2" {...props} />,
                                                            strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                                                        }}
                                                    >
                                                        {message.content}
                                                    </ReactMarkdown>
                                                </div>
                                            )}
                                        </div>
                                        {message.timestamp && (
                                            <p className={`text-xs text-gray-400 mt-1 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                                                {formatMessageTime(message.timestamp)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 rounded-b-xl">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                            Conversation ID: <span className="font-mono">{sessionId}</span>
                        </p>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
