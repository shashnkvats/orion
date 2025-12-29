import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Message from './Message'

const ChatArea = ({ 
  thread, 
  onSendMessage, 
  onRateMessage, 
  isTyping, 
  isDarkMode,
  sidebarOpen,
  onToggleSidebar
}) => {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread?.messages, isTyping])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim()) {
      onSendMessage(input)
      setInput('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleTextareaChange = (e) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
  }

  const hasMessages = thread && thread.messages.length > 0

  // No thread selected
  if (!thread) {
    return (
      <div className={`flex-1 flex items-center justify-center ${isDarkMode ? 'bg-apple-darkBg' : 'bg-apple-bg'}`}>
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 shadow-apple">
            <svg className="w-11 h-11 text-white" viewBox="0 0 100 100" fill="currentColor">
              <path d="M50 15 L54 32 L68 22 L56 36 L75 40 L56 44 L68 58 L53 46 L50 70 L47 46 L32 58 L44 44 L25 40 L44 36 L32 22 L46 32 Z"/>
            </svg>
          </div>
          <h2 className={`text-2xl font-semibold mb-2 tracking-tight ${isDarkMode ? 'text-apple-darkLabel' : 'text-apple-label'}`}>
            Orion
          </h2>
          <p className={`${isDarkMode ? 'text-apple-darkLabelSecondary' : 'text-apple-labelSecondary'}`}>
            Select a conversation to continue
          </p>
        </div>
      </div>
    )
  }

  // Empty state - centered layout
  if (!hasMessages) {
    return (
      <div className={`flex-1 flex flex-col h-full relative ${isDarkMode ? 'bg-apple-darkBg' : 'bg-apple-bg'}`}>
        {/* Minimal Header - only show toggle when sidebar closed */}
        {!sidebarOpen && (
          <header className="absolute top-4 left-4 z-10">
            <button
              onClick={onToggleSidebar}
              className={`p-2.5 rounded-xl shadow-sm press-effect ${isDarkMode ? 'hover:bg-apple-darkBgTertiary bg-apple-darkBgSecondary' : 'hover:bg-apple-bgTertiary bg-apple-bgSecondary'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </header>
        )}

        {/* Centered content */}
        <div className="flex-1 flex flex-col items-center justify-center px-5">
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className={`w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600`}>
              <svg className="w-9 h-9 text-white" viewBox="0 0 100 100" fill="currentColor">
                <path d="M50 15 L54 32 L68 22 L56 36 L75 40 L56 44 L68 58 L53 46 L50 70 L47 46 L32 58 L44 44 L25 40 L44 36 L32 22 L46 32 Z"/>
              </svg>
            </div>
            <h3 className={`text-xl font-semibold mb-2 tracking-tight ${isDarkMode ? 'text-apple-darkLabel' : 'text-apple-label'}`}>
              How can I help you?
            </h3>
            <p className={`${isDarkMode ? 'text-apple-darkLabelSecondary' : 'text-apple-labelSecondary'} max-w-sm mx-auto`}>
              Ask me anything. I'm here to assist with questions, ideas, and more.
            </p>
          </motion.div>

          {/* Centered Input */}
          <div className="w-full max-w-2xl mx-auto px-5">
            <form onSubmit={handleSubmit}>
              <div className={`
                relative flex items-end rounded-2xl
                ${isDarkMode 
                  ? 'bg-apple-darkBgTertiary' 
                  : 'bg-apple-bgSecondary'}
                transition-all duration-200
              `}>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Message"
                  rows={1}
                  className={`
                    flex-1 resize-none bg-transparent px-4 py-3 outline-none text-base
                    ${isDarkMode ? 'text-apple-darkLabel placeholder-apple-darkLabelTertiary' : 'text-apple-label placeholder-apple-labelTertiary'}
                    max-h-40
                  `}
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className={`
                    m-1.5 p-2.5 rounded-full transition-all duration-200 press-effect
                    ${input.trim() 
                      ? 'bg-apple-blue text-white' 
                      : isDarkMode 
                        ? 'bg-apple-darkBgElevated text-apple-darkLabelTertiary' 
                        : 'bg-apple-bgTertiary text-apple-labelTertiary'}
                  `}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                  </svg>
                </button>
              </div>
              <p className={`text-xs text-center mt-3 ${isDarkMode ? 'text-apple-darkLabelTertiary' : 'text-apple-labelTertiary'}`}>
                Orion may produce inaccurate information.
              </p>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Has messages - normal layout
  return (
    <div className={`flex-1 flex flex-col h-full ${isDarkMode ? 'bg-apple-darkBg' : 'bg-apple-bg'}`}>
      {/* Header */}
      <header className={`
        flex items-center justify-between px-5 py-3 
        vibrancy ${isDarkMode ? 'vibrancy-dark border-b border-apple-darkSeparator' : 'vibrancy-light border-b border-apple-separator'}
      `}>
        <div className="flex items-center gap-3">
          {!sidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className={`p-2 rounded-full press-effect ${isDarkMode ? 'hover:bg-apple-darkBgTertiary' : 'hover:bg-apple-bgTertiary'}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          )}
          <div>
            <h1 className={`text-base font-semibold ${isDarkMode ? 'text-apple-darkLabel' : 'text-apple-label'}`}>
              {thread.title}
            </h1>
            <p className={`text-xs ${isDarkMode ? 'text-apple-darkLabelSecondary' : 'text-apple-labelSecondary'}`}>
              {thread.messages.length} {thread.messages.length === 1 ? 'message' : 'messages'}
            </p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-6 px-5">
          <AnimatePresence initial={false}>
            {thread.messages.map((message) => (
              <Message 
                key={message.id}
                message={message}
                isDarkMode={isDarkMode}
                onRate={onRateMessage}
              />
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex gap-3 mb-5"
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 100 100" fill="currentColor">
                    <path d="M50 15 L54 32 L68 22 L56 36 L75 40 L56 44 L68 58 L53 46 L50 70 L47 46 L32 58 L44 44 L25 40 L44 36 L32 22 L46 32 Z"/>
                  </svg>
                </div>
                <div className={`flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-md ${
                  isDarkMode ? 'bg-apple-darkBgTertiary' : 'bg-apple-bgSecondary'
                }`}>
                  <span className={`typing-dot w-2 h-2 rounded-full ${isDarkMode ? 'bg-apple-darkLabelSecondary' : 'bg-apple-labelSecondary'}`} />
                  <span className={`typing-dot w-2 h-2 rounded-full ${isDarkMode ? 'bg-apple-darkLabelSecondary' : 'bg-apple-labelSecondary'}`} />
                  <span className={`typing-dot w-2 h-2 rounded-full ${isDarkMode ? 'bg-apple-darkLabelSecondary' : 'bg-apple-labelSecondary'}`} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area - Bottom */}
      <div className={`
        px-5 py-4
        vibrancy ${isDarkMode ? 'vibrancy-dark border-t border-apple-darkSeparator' : 'vibrancy-light border-t border-apple-separator'}
      `}>
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
          <div className={`
            relative flex items-end rounded-2xl
            ${isDarkMode 
              ? 'bg-apple-darkBgTertiary' 
              : 'bg-apple-bgSecondary'}
            transition-all duration-200
          `}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Message"
              rows={1}
              className={`
                flex-1 resize-none bg-transparent px-4 py-3 outline-none text-base
                ${isDarkMode ? 'text-apple-darkLabel placeholder-apple-darkLabelTertiary' : 'text-apple-label placeholder-apple-labelTertiary'}
                max-h-40
              `}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className={`
                m-1.5 p-2.5 rounded-full transition-all duration-200 press-effect
                ${input.trim() 
                  ? 'bg-apple-blue text-white' 
                  : isDarkMode 
                    ? 'bg-apple-darkBgElevated text-apple-darkLabelTertiary' 
                    : 'bg-apple-bgTertiary text-apple-labelTertiary'}
              `}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
              </svg>
            </button>
          </div>
          <p className={`text-xs text-center mt-3 ${isDarkMode ? 'text-apple-darkLabelTertiary' : 'text-apple-labelTertiary'}`}>
            Orion may produce inaccurate information.
          </p>
        </form>
      </div>
    </div>
  )
}

export default ChatArea
