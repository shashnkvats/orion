import { useState, useEffect, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import ShareModal from './components/ShareModal'
import FeedbackModal from './components/FeedbackModal'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

// Get or create a persistent user ID
const getUserId = () => {
  let userId = localStorage.getItem('userId')
  if (!userId) {
    userId = crypto.randomUUID()
    localStorage.setItem('userId', userId)
  }
  return userId
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  
  const [threads, setThreads] = useState(() => {
    const saved = localStorage.getItem('threads')
    if (saved) return JSON.parse(saved)
    return [{
      id: uuidv4(),
      title: 'Welcome',
      messages: [{
        id: uuidv4(),
        role: 'assistant',
        content: 'Hello! I\'m here to help. What would you like to know?',
        timestamp: new Date().toISOString(),
        rating: null
      }],
      createdAt: new Date().toISOString()
    }]
  })
  
  const [activeThreadId, setActiveThreadId] = useState(() => threads[0]?.id || null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isTyping, setIsTyping] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [feedbackModal, setFeedbackModal] = useState({ open: false, messageId: null })

  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  useEffect(() => {
    localStorage.setItem('threads', JSON.stringify(threads))
  }, [threads])

  const activeThread = threads.find(t => t.id === activeThreadId)

  const createNewThread = useCallback(() => {
    const newThread = {
      id: uuidv4(),
      title: 'New Conversation',
      messages: [],
      createdAt: new Date().toISOString()
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
  }, [activeThreadId])

  const renameThread = useCallback((threadId, newTitle) => {
    setThreads(prev => prev.map(t => 
      t.id === threadId ? { ...t, title: newTitle } : t
    ))
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: getUserId(),
          threadId: activeThreadId,
          message: content.trim()
        })
      })

      if (!response.ok) {
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
                  ? { ...m, content: m.content || 'Sorry, I encountered an error. Please try again.' }
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
                content: 'Sorry, I encountered an error. Please try again.',
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
      />

      <ChatArea 
        thread={activeThread}
        onSendMessage={sendMessage}
        onRateMessage={rateMessage}
        isTyping={isTyping}
        isDarkMode={isDarkMode}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
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
    </div>
  )
}

export default App
