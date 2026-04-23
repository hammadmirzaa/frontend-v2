import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Send, Mic, MicOff, Phone, PhoneOff } from 'lucide-react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import config from '../config'
import { useVoice } from '../hooks/useVoice'
import { useToast } from '../hooks/useToast'

const API_URL = config.API_URL

// Generate a unique session ID
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export default function EmbedPage() {
  const { token } = useParams()
  const [sessionId, setSessionId] = useState(() => generateSessionId())
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! How can I help you today?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const { showToast, ToastContainer } = useToast()
  const {
    isListening,
    isVoiceMode,
    transcript,
    isSupported,
    startListening,
    stopListening,
    toggleVoiceMode,
    speak,
    stopSpeaking,
    setTranscript,
  } = useVoice({ useDefault: true }) // EmbedPage uses default voice (no override)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Update input when transcript changes in voice mode
  useEffect(() => {
    if (isVoiceMode && transcript) {
      setInput(transcript)
    }
  }, [transcript, isVoiceMode])

  // Speak AI responses when voice mode is enabled
  const lastMessageRef = useRef(null)
  useEffect(() => {
    if (isVoiceMode && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      // Only speak if this is a new assistant message
      if (
        lastMessage.role === 'assistant' &&
        lastMessage.content &&
        lastMessageRef.current !== lastMessage.content
      ) {
        lastMessageRef.current = lastMessage.content
        // Extract text from markdown for speech
        const textToSpeak = lastMessage.content.replace(/[#*`_~\[\]()]/g, '').trim()
        if (textToSpeak) {
          try {
            speak(textToSpeak)
          } catch (error) {
            console.error('Error speaking:', error)
            showToast('Failed to speak message. Please check your voice settings.', 'error')
          }
        }
      }
    }
  }, [messages, isVoiceMode, speak, showToast])
  

  // Reset session when component unmounts (user leaves the page)
  useEffect(() => {
    return () => {
      // Reset session when leaving the page
      if (sessionId) {
        axios.post(`${API_URL}/api/chat/session/reset`, {
          session_id: sessionId
        }).catch(err => console.error('Error resetting session:', err))
      }
    }
  }, [sessionId])

  const handleSend = async (textToSend = null) => {
    const messageText = textToSend || input
    if (!messageText.trim() || loading) return

    const userMessage = { role: 'user', content: messageText }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setTranscript('')
    setLoading(true)

    // Stop any ongoing speech when sending
    if (isVoiceMode) {
      stopSpeaking()
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/chat/public/query?public_token=${token}`,
        { query: messageText, session_id: sessionId }
      )
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.response
      }])
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleVoiceToggle = () => {
    toggleVoiceMode()
    if (isListening) {
      stopListening()
    }
    if (isVoiceMode) {
      stopSpeaking()
    }
  }

  const handleMicrophoneClick = () => {
    if (isListening) {
      stopListening()
    } else {
      setInput('')
      setTranscript('')
      startListening()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <ToastContainer />
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg flex flex-col" style={{ height: '80vh' }}>
        <div className="p-6 border-b gradient-bg rounded-t-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Chat Assistant</h2>
            {isSupported && (
              <button
                onClick={handleVoiceToggle}
                className={`p-3 rounded-lg transition-colors ${
                  isVoiceMode
                    ? 'bg-white/20 text-white hover:bg-white/30'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                title={isVoiceMode ? 'Disable voice mode' : 'Enable voice mode'}
              >
                {isVoiceMode ? <PhoneOff size={20} /> : <Phone size={20} />}
              </button>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-lg px-4 py-3 ${
                  msg.role === 'user'
                    ? 'gradient-bg text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2" {...props} />,
                        li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                        code: ({ node, inline, ...props }) => 
                          inline ? (
                            <code className="bg-gray-200 px-1 py-0.5 rounded text-sm" {...props} />
                          ) : (
                            <code className="block bg-gray-200 p-2 rounded text-sm overflow-x-auto" {...props} />
                          ),
                        pre: ({ node, ...props }) => <pre className="bg-gray-200 p-2 rounded text-sm overflow-x-auto mb-2" {...props} />,
                        h1: ({ node, ...props }) => <h1 className="text-lg font-bold mb-2 mt-2 first:mt-0" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-base font-bold mb-2 mt-2 first:mt-0" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="text-sm font-bold mb-2 mt-2 first:mt-0" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
                        em: ({ node, ...props }) => <em className="italic" {...props} />,
                        blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-gray-300 pl-2 italic mb-2" {...props} />,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-3">
                <p className="text-gray-500 italic">Thinking...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-6 border-t">
          {isVoiceMode ? (
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleMicrophoneClick}
                  className={`p-4 rounded-full transition-all ${
                    isListening
                      ? 'bg-red-500 text-white animate-pulse hover:bg-red-600'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  disabled={loading}
                  title={isListening ? 'Stop recording' : 'Start recording'}
                >
                  {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                </button>
                <div className="flex-1">
                  <input
                    type="text"
                    value={transcript || input}
                    onChange={(e) => {
                      setInput(e.target.value)
                      setTranscript(e.target.value)
                    }}
                    placeholder={isListening ? 'Listening...' : 'Click microphone to speak or type here...'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={loading}
                  />
                </div>
                <button
                  onClick={() => handleSend(transcript || input)}
                  disabled={loading || !(transcript || input).trim()}
                  className="px-6 py-3 gradient-bg text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Send size={20} />
                  <span>Send</span>
                </button>
              </div>
              {isListening && (
                <p className="text-sm text-gray-500 text-center animate-pulse">
                  🎤 Listening... Speak now
                </p>
              )}
            </div>
          ) : (
            <div className="flex space-x-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-6 py-3 gradient-bg text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Send size={20} />
                <span>Send</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

