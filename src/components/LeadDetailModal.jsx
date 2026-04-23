import { useState, useEffect, useRef } from 'react'
import { X, Mail, Phone, Building, Calendar, TrendingUp, MessageSquare, User, Bot, Edit2, Save } from 'lucide-react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import config from '../config'
import Spinner from './Spinner'
import { useToast } from '../hooks/useToast'

const API_URL = config.API_URL

export default function LeadDetailModal({ isOpen, onClose, leadId, onUpdate }) {
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const messagesEndRef = useRef(null)
  const { showToast, ToastContainer } = useToast()

  useEffect(() => {
    if (isOpen && leadId) {
      fetchLeadDetails()
    }
  }, [isOpen, leadId])

  useEffect(() => {
    scrollToBottom()
  }, [lead?.messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchLeadDetails = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/api/leads/${leadId}`)
      setLead(response.data)
      setSelectedStatus(response.data.status)
      setNotesValue(response.data.notes || '')
      setEditingNotes(false)
    } catch (error) {
      console.error('Failed to fetch lead details:', error)
      showToast('Failed to load lead details', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (newStatus) => {
    if (newStatus === lead.status) return

    setUpdating(true)
    try {
      const response = await axios.put(`${API_URL}/api/leads/${leadId}`, {
        status: newStatus,
      })
      setLead(response.data)
      setSelectedStatus(newStatus)
      showToast(`Lead status updated to ${newStatus}`, 'success')
      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      console.error('Failed to update lead status:', error)
      showToast('Failed to update lead status', 'error')
    } finally {
      setUpdating(false)
    }
  }

  const handleNotesUpdate = async () => {
    setUpdating(true)
    try {
      const response = await axios.put(`${API_URL}/api/leads/${leadId}`, {
        notes: notesValue,
      })
      setLead(response.data)
      setEditingNotes(false)
      showToast('Notes updated successfully', 'success')
      if (onUpdate) {
        onUpdate()
      }
    } catch (error) {
      console.error('Failed to update notes:', error)
      showToast('Failed to update notes', 'error')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-blue-100 text-blue-700',
      contacted: 'bg-yellow-100 text-yellow-700',
      qualified: 'bg-green-100 text-green-700',
      converted: 'bg-purple-100 text-purple-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!isOpen) return null

  return (
    <>
      <ToastContainer />
      <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal - Larger for conversation history */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center space-x-2">
                <Spinner size="sm" />
                <h3 className="text-xl font-semibold text-gray-900">Loading lead details...</h3>
              </div>
            ) : lead ? (
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-semibold text-gray-900">{lead.name}</h3>
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedStatus}
                    onChange={(e) => handleStatusUpdate(e.target.value)}
                    disabled={updating}
                    className={`text-xs px-3 py-1.5 rounded font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 ${getStatusColor(selectedStatus)}`}
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="converted">Converted</option>
                  </select>
                  {updating && <Spinner size="sm" />}
                </div>
              </div>
            ) : (
              <h3 className="text-xl font-semibold text-gray-900">Lead Details</h3>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors ml-4"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <Spinner size="lg" />
              <p className="text-gray-500 mt-4">Loading lead details...</p>
            </div>
          ) : lead ? (
            <div className="space-y-6">
              {/* Lead Information */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Lead Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Mail size={18} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900">{lead.email}</p>
                    </div>
                  </div>
                  {lead.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone size={18} className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-sm font-medium text-gray-900">{lead.phone}</p>
                      </div>
                    </div>
                  )}
                  {lead.company && (
                    <div className="flex items-center space-x-3">
                      <Building size={18} className="text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Company</p>
                        <p className="text-sm font-medium text-gray-900">{lead.company}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <TrendingUp size={18} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Qualification Score</p>
                      <p className="text-sm font-medium text-gray-900">{lead.qualification_score}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar size={18} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">Created</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(lead.created_at)}</p>
                    </div>
                  </div>
                  {lead.source && (
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="text-xs text-gray-500">Source</p>
                        <p className="text-sm font-medium text-gray-900">{lead.source}</p>
                      </div>
                    </div>
                  )}
                </div>
                {lead.first_query && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 mb-1">First Query:</p>
                    <p className="text-sm text-gray-700 italic">"{lead.first_query}"</p>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-500">Notes:</p>
                    {!editingNotes && (
                      <button
                        onClick={() => setEditingNotes(true)}
                        className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
                      >
                        <Edit2 size={12} />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                  {editingNotes ? (
                    <div className="space-y-2">
                      <textarea
                        value={notesValue}
                        onChange={(e) => setNotesValue(e.target.value)}
                        disabled={updating}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-700 resize-none disabled:opacity-50"
                        rows={3}
                        placeholder="Add notes about this lead..."
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => {
                            setEditingNotes(false)
                            setNotesValue(lead.notes || '')
                          }}
                          disabled={updating}
                          className="text-xs px-3 py-1.5 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleNotesUpdate}
                          disabled={updating}
                          className="text-xs px-3 py-1.5 text-white gradient-bg rounded hover:opacity-90 transition-colors disabled:opacity-50 flex items-center space-x-1"
                        >
                          {updating ? (
                            <>
                              <Spinner size="sm" className="text-white" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Save size={12} />
                              <span>Save</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {lead.notes || <span className="text-gray-400 italic">No notes yet. Click Edit to add notes.</span>}
                    </p>
                  )}
                </div>
              </div>

              {/* Conversation History */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <MessageSquare size={20} className="text-gray-400" />
                  <h4 className="text-lg font-semibold text-gray-900">Conversation History</h4>
                  {lead.messages && (
                    <span className="text-sm text-gray-500">({lead.messages.length} messages)</span>
                  )}
                </div>
                
                {!lead.messages || lead.messages.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <MessageSquare size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">No conversation history available</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto bg-gray-50 rounded-lg p-4">
                    {lead.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-3xl rounded-lg px-4 py-3 ${
                            message.role === 'user'
                              ? 'gradient-bg text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            {message.role === 'user' ? (
                              <User size={16} className="text-white opacity-75" />
                            ) : (
                              <Bot size={16} className="text-gray-500" />
                            )}
                            <span className="text-xs opacity-75">
                              {message.role === 'user' ? 'User' : 'Assistant'}
                            </span>
                            <span className="text-xs opacity-50">
                              {formatDate(message.timestamp)}
                            </span>
                          </div>
                          {message.role === 'user' ? (
                            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                          ) : (
                            <div className="prose prose-sm max-w-none text-sm">
                              <ReactMarkdown
                                components={{
                                  p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                  ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2" {...props} />,
                                  ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2" {...props} />,
                                  li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                  code: ({ node, inline, ...props }) => 
                                    inline ? (
                                      <code className="bg-gray-200 px-1 py-0.5 rounded text-xs" {...props} />
                                    ) : (
                                      <code className="block bg-gray-200 p-2 rounded text-xs overflow-x-auto" {...props} />
                                    ),
                                  pre: ({ node, ...props }) => <pre className="bg-gray-200 p-2 rounded text-xs overflow-x-auto mb-2" {...props} />,
                                  h1: ({ node, ...props }) => <h1 className="text-base font-bold mb-2 mt-2 first:mt-0" {...props} />,
                                  h2: ({ node, ...props }) => <h2 className="text-sm font-bold mb-2 mt-2 first:mt-0" {...props} />,
                                  h3: ({ node, ...props }) => <h3 className="text-xs font-bold mb-2 mt-2 first:mt-0" {...props} />,
                                  strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                                  em: ({ node, ...props }) => <em className="italic" {...props} />,
                                  blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-gray-300 pl-2 italic mb-2" {...props} />,
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Failed to load lead details</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  )
}

