import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import ShareModal from './components/ShareModal'
import FeedbackModal from './components/FeedbackModal'
import AuthModal from './components/AuthModal'

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||'https://orion-699590545294.asia-south1.run.app'

// Get stored auth token
const getToken = () => localStorage.getItem('token')

// Get stored user info
const getStoredUser = () => {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

// Check if user is authenticated
const isAuthenticated = () => !!getToken() && !!getStoredUser()

// API functions with auth headers
const api = {
  getHeaders() {
    const token = getToken()
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  },

  async fetchConversations(offset = 0, limit = 50) {
    const res = await fetch(
      `${API_BASE_URL}/conversations?offset=${offset}&limit=${limit}`,
      { headers: this.getHeaders() }
    )
    if (res.status === 401) throw new Error('AUTH_EXPIRED')
    if (!res.ok) throw new Error('Failed to fetch conversations')
    return res.json()
  },

  async fetchMessages(threadId, offset = 0, limit = 100) {
    const res = await fetch(
      `${API_BASE_URL}/conversations/${threadId}/messages?offset=${offset}&limit=${limit}`,
      { headers: this.getHeaders() }
    )
    if (res.status === 401) throw new Error('AUTH_EXPIRED')
    if (!res.ok) throw new Error('Failed to fetch messages')
    return res.json()
  }
}

// Default welcome thread for new users
const createWelcomeThread = () => ({
  id: uuidv4(),
  title: 'Welcome',
  messages: [{
    id: uuidv4(),
    role: 'assistant',
    content: 'Hello! I\'m here to help. What would you like to know?',
    timestamp: new Date().toISOString(),
    rating: null
  }],
  createdAt: new Date().toISOString(),
  isLoaded: true // Messages already loaded
})

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // Auth state
  const [user, setUser] = useState(getStoredUser)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [isLoadingThreads, setIsLoadingThreads] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  
  const [threads, setThreads] = useState(() => {
    // For unauthenticated users, load from localStorage
    if (!isAuthenticated()) {
      const saved = localStorage.getItem('threads')
      if (saved) return JSON.parse(saved)
      return [createWelcomeThread()]
    }
    // For authenticated users, start empty and load from API
    return []
  })
  
  const [activeThreadId, setActiveThreadId] = useState(() => {
    if (!isAuthenticated()) {
      const saved = localStorage.getItem('threads')
      if (saved) {
        const threads = JSON.parse(saved)
        return threads[0]?.id || null
      }
    }
    return null
  })
  
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [feedbackModal, setFeedbackModal] = useState({ open: false, messageId: null })
  const [rateLimitInfo, setRateLimitInfo] = useState(null) // { remaining: number, limit: number } for anonymous users

  // Handle auth expiry
  const handleAuthExpired = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setAuthModalOpen(true)
  }, [])

  // Load conversations from API for authenticated users
  useEffect(() => {
    if (!user) return

    const loadConversations = async () => {
      setIsLoadingThreads(true)
      try {
        const data = await api.fetchConversations()
        const loadedThreads = data.threads.map(t => ({
          id: t.thread_id,
          title: t.title || 'Untitled',
          messages: [], // Messages loaded on demand
          createdAt: t.created_at,
          updatedAt: t.updated_at,
          isLoaded: false // Flag to track if messages are loaded
        }))
        
        if (loadedThreads.length > 0) {
          setThreads(loadedThreads)
          setActiveThreadId(loadedThreads[0].id)
        } else {
          // No threads yet, create a welcome one
          const welcome = createWelcomeThread()
          setThreads([welcome])
          setActiveThreadId(welcome.id)
        }
      } catch (error) {
        if (error.message === 'AUTH_EXPIRED') {
          handleAuthExpired()
          return
        }
        console.error('Failed to load conversations:', error)
        // Fallback to welcome thread
        const welcome = createWelcomeThread()
        setThreads([welcome])
        setActiveThreadId(welcome.id)
      } finally {
        setIsLoadingThreads(false)
      }
    }

    loadConversations()
  }, [user, handleAuthExpired])

  // Load messages when selecting a thread (for authenticated users)
  useEffect(() => {
    if (!user || !activeThreadId) return

    const thread = threads.find(t => t.id === activeThreadId)
    if (!thread || thread.isLoaded) return

    const loadMessages = async () => {
      setIsLoadingMessages(true)
      try {
        const data = await api.fetchMessages(activeThreadId)
        setThreads(prev => prev.map(t => {
          if (t.id === activeThreadId) {
            return {
              ...t,
              messages: data.messages.map(m => ({
                id: m.message_id,
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.content,
                timestamp: m.created_at,
                rating: null
              })),
              isLoaded: true
            }
          }
          return t
        }))
      } catch (error) {
        if (error.message === 'AUTH_EXPIRED') {
          handleAuthExpired()
          return
        }
        console.error('Failed to load messages:', error)
        // Mark as loaded to prevent infinite retries
        setThreads(prev => prev.map(t => 
          t.id === activeThreadId ? { ...t, isLoaded: true } : t
        ))
      } finally {
        setIsLoadingMessages(false)
      }
    }

    loadMessages()
  }, [user, activeThreadId, threads, handleAuthExpired])

  // Save to localStorage for unregistered users
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  useEffect(() => {
    // Only save to localStorage for unauthenticated users
    if (!user) {
      localStorage.setItem('threads', JSON.stringify(threads))
    }
  }, [threads, user])

  const activeThread = threads.find(t => t.id === activeThreadId)

  const createNewThread = useCallback(() => {
    const newThread = {
      id: uuidv4(),
      title: 'New Conversation',
      messages: [],
      createdAt: new Date().toISOString(),
      isLoaded: true // New thread, no messages to load
    }
    setThreads(prev => [newThread, ...prev])
    setActiveThreadId(newThread.id)
  }, [])

  const deleteThread = useCallback((threadId) => {
    setThreads(prev => {
      const filtered = prev.filter(t => t.id !== threadId)
      if (activeThreadId === threadId) {
        setActiveThreadId(filtered[0]?.id || null)
      }
      return filtered
    })
    // TODO: For registered users, also call API to soft-delete
  }, [activeThreadId])

  const renameThread = useCallback((threadId, newTitle) => {
    setThreads(prev => prev.map(t => 
      t.id === threadId ? { ...t, title: newTitle } : t
    ))
    // TODO: For registered users, also call API to update title
  }, [])

  const sendMessage = useCallback(async (content) => {
    if (!content.trim() || !activeThreadId) return

    const userMessage = {
      id: uuidv4(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
      rating: null
    }

    // Add user message and update title if first message
    setThreads(prev => prev.map(t => {
      if (t.id === activeThreadId) {
        const isFirstMessage = t.messages.length === 0 || 
          (t.messages.length === 1 && t.messages[0].role === 'assistant')
        return {
          ...t,
          title: isFirstMessage ? content.trim().slice(0, 30) + (content.length > 30 ? '...' : '') : t.title,
          messages: [...t.messages, userMessage]
        }
      }
      return t
    }))

    // Create placeholder for streaming AI message
    const aiMessageId = uuidv4()
    
    // Show typing indicator initially
    setIsTyping(true)

    try {
      const response = await fetch(`${API_BASE_URL}/chat/stream`, {
        method: 'POST',
        headers: api.getHeaders(),
        body: JSON.stringify({
          threadId: activeThreadId,
          message: content.trim()
        })
      })

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limit exceeded for anonymous users
          const errorData = await response.json()
          setRateLimitInfo({ remaining: 0, limit: errorData.detail?.limit || 5 })
          throw new Error('RATE_LIMIT_EXCEEDED')
        }
        throw new Error(`API error: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        
        // Keep the last incomplete line in buffer
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim()
            if (!dataStr || dataStr === '[DONE]') continue

            try {
              const data = JSON.parse(dataStr)
              
              // Handle error from backend
              if (data.error) {
                throw new Error(data.error)
              }

              // Handle different backend formats
              let token = ''
              let isFullMessage = false
              
              if (data.type === 'token' && data.content) {
                // Token streaming format: {"type": "token", "content": "..."}
                token = data.content
              } else if (data.orchestrator?.messages) {
                // Full message format: {"orchestrator": {"messages": [{"role": "ai", "content": "..."}]}}
                for (const msg of data.orchestrator.messages) {
                  if (msg.role === 'ai' && msg.content) {
                    token = msg.content
                    isFullMessage = true // This is the complete message, replace don't append
                  }
                }
              } else {
                // Fallback for other formats
                token = data.token || data.content || data.text || ''
              }
              
              // Track remaining questions for anonymous users
              if (data.remaining_questions !== undefined && !user) {
                setRateLimitInfo({ remaining: data.remaining_questions, limit: 5 })
              }
              
              if (token) {
                // Hide typing indicator once we start receiving content
                setIsTyping(false)
                
                setThreads(prev => {
                  const thread = prev.find(t => t.id === activeThreadId)
                  const messageExists = thread?.messages.some(m => m.id === aiMessageId)
                  
                  return prev.map(t => {
                    if (t.id === activeThreadId) {
                      if (!messageExists) {
                        // Add the AI message if it doesn't exist yet
                        return {
                          ...t,
                          messages: [...t.messages, {
                            id: aiMessageId,
                            role: 'assistant',
                            content: token,
                            timestamp: new Date().toISOString(),
                            rating: null
                          }]
                        }
                      } else {
                        // Update existing message - APPEND for tokens, REPLACE for full messages
                        return {
                          ...t,
                          messages: t.messages.map(m => 
                            m.id === aiMessageId 
                              ? { ...m, content: isFullMessage ? token : m.content + token }
                              : m
                          )
                        }
                      }
                    }
                    return t
                  })
                })
              }
            } catch (parseError) {
              // Skip invalid JSON lines
              console.warn('Failed to parse SSE data:', dataStr)
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to get response:', error)
      
      // Determine error message
      let errorMessage = 'Sorry, I encountered an error. Please try again.'
      if (error.message === 'RATE_LIMIT_EXCEEDED') {
        errorMessage = "You've reached your daily limit of 5 questions. Sign in for unlimited access!"
      }
      
      // Add error message
      setThreads(prev => prev.map(t => {
        if (t.id === activeThreadId) {
          const messageExists = t.messages.some(m => m.id === aiMessageId)
          if (messageExists) {
            // Update existing message with error
            return {
              ...t,
              messages: t.messages.map(m => 
                m.id === aiMessageId 
                  ? { ...m, content: m.content || errorMessage }
                  : m
              )
            }
          } else {
            // Add new error message
            return {
              ...t,
              messages: [...t.messages, {
                id: aiMessageId,
                role: 'assistant',
                content: errorMessage,
                timestamp: new Date().toISOString(),
                rating: null
              }]
            }
          }
        }
        return t
      }))
    } finally {
      setIsTyping(false)
    }
  }, [activeThreadId])

  const rateMessage = useCallback((messageId, rating) => {
    if (rating === 'down') {
      setFeedbackModal({ open: true, messageId })
    } else {
      setThreads(prev => prev.map(t => ({
        ...t,
        messages: t.messages.map(m => 
          m.id === messageId ? { ...m, rating } : m
        )
      })))
    }
  }, [])

  const submitFeedback = useCallback((messageId, feedback) => {
    setThreads(prev => prev.map(t => ({
      ...t,
      messages: t.messages.map(m => 
        m.id === messageId ? { ...m, rating: 'down', feedback } : m
      )
    })))
    setFeedbackModal({ open: false, messageId: null })
  }, [])

  const getShareableLink = useCallback(() => {
    if (!activeThread) return ''
    try {
      const shareData = {
        title: activeThread.title,
        messages: activeThread.messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      }
      // Use encodeURIComponent to handle Unicode characters
      const encoded = btoa(encodeURIComponent(JSON.stringify(shareData)))
      return `${window.location.origin}/share/${encoded}`
    } catch (error) {
      console.error('Failed to create share link:', error)
      return ''
    }
  }, [activeThread])

  // Auth handlers
  const handleAuthSuccess = useCallback((userData, token) => {
    setUser(userData)
    // Clear localStorage threads - they'll be loaded from API
    localStorage.removeItem('threads')
    // Reset threads to trigger API load
    setThreads([])
    setActiveThreadId(null)
    // Clear rate limit info - authenticated users have unlimited access
    setRateLimitInfo(null)
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    // Reset to welcome thread
    const welcome = createWelcomeThread()
    setThreads([welcome])
    setActiveThreadId(welcome.id)
  }, [])

  const openAuthModal = useCallback(() => {
    setAuthModalOpen(true)
  }, [])

  return (
    <div className={`h-full flex ${isDarkMode ? 'bg-apple-darkBg' : 'bg-apple-bg'}`}>
      <Sidebar 
        threads={threads}
        activeThreadId={activeThreadId}
        onSelectThread={setActiveThreadId}
        onNewThread={createNewThread}
        onDeleteThread={deleteThread}
        onRenameThread={renameThread}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        onShare={() => setShareModalOpen(true)}
        isLoading={isLoadingThreads}
        user={user}
        onLogin={openAuthModal}
        onLogout={handleLogout}
      />

      <ChatArea 
        thread={activeThread}
        onSendMessage={sendMessage}
        onRateMessage={rateMessage}
        isTyping={isTyping}
        isDarkMode={isDarkMode}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isLoadingMessages={isLoadingMessages}
        user={user}
        onLogin={openAuthModal}
        rateLimitInfo={rateLimitInfo}
      />

      <ShareModal 
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        shareLink={getShareableLink()}
        isDarkMode={isDarkMode}
      />

      <FeedbackModal 
        isOpen={feedbackModal.open}
        onClose={() => setFeedbackModal({ open: false, messageId: null })}
        onSubmit={(feedback) => submitFeedback(feedbackModal.messageId, feedback)}
        isDarkMode={isDarkMode}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        isDarkMode={isDarkMode}
      />
    </div>
  )
}

export default App
