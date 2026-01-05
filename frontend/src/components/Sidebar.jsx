import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const Sidebar = ({ 
  threads, 
  activeThreadId, 
  onSelectThread, 
  onNewThread, 
  onDeleteThread,
  onRenameThread,
  isOpen, 
  onToggle,
  isDarkMode,
  onToggleTheme,
  onShare,
  user,
  onLogin,
  onLogout
}) => {
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [hoveredId, setHoveredId] = useState(null)

  const handleStartEdit = (thread) => {
    setEditingId(thread.id)
    setEditTitle(thread.title)
  }

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      onRenameThread(editingId, editTitle.trim())
    }
    setEditingId(null)
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const groupedThreads = threads.reduce((acc, thread) => {
    // Use updatedAt for grouping (when thread was last active), fallback to createdAt
    const dateKey = formatDate(thread.updatedAt || thread.createdAt)
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(thread)
    return acc
  }, {})

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 md:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 260 : 0 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className={`
          fixed md:relative h-full z-30 overflow-hidden
          ${isDarkMode ? 'bg-apple-darkBgSecondary' : 'bg-apple-bgSecondary'}
        `}
      >
        <div className="w-[260px] h-full flex flex-col">
          {/* Header */}
          <div className="p-3 flex items-center justify-between">
            <button
              onClick={onNewThread}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium text-[13px]
                press-effect apple-focus bg-apple-blue text-white
                transition-all duration-200
              `}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Chat
            </button>
            
            <button
              onClick={onToggle}
              className={`
                p-1.5 rounded-lg press-effect apple-focus
                ${isDarkMode ? 'hover:bg-apple-darkBgTertiary' : 'hover:bg-apple-bgTertiary'}
              `}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>

          {/* Thread List */}
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {Object.entries(groupedThreads).map(([date, dateThreads]) => (
              <div key={date} className="mb-3">
                <h3 className={`text-[11px] font-semibold uppercase tracking-wide px-2 mb-1 ${
                  isDarkMode ? 'text-apple-darkLabelSecondary' : 'text-apple-labelSecondary'
                }`}>
                  {date}
                </h3>
                <div>
                  {dateThreads.map((thread) => (
                    <motion.div
                      key={thread.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      onMouseEnter={() => setHoveredId(thread.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => onSelectThread(thread.id)}
                      className={`
                        relative group rounded-lg cursor-pointer press-effect
                        ${activeThreadId === thread.id 
                          ? isDarkMode 
                            ? 'bg-apple-darkBgTertiary' 
                            : 'bg-apple-bgTertiary'
                          : isDarkMode
                            ? 'hover:bg-apple-darkBgTertiary/50'
                            : 'hover:bg-apple-bgTertiary/50'
                        }
                        transition-colors duration-150
                      `}
                    >
                      <div className="px-2 py-1.5 flex items-center gap-2">
                        <svg className={`w-4 h-4 flex-shrink-0 ${isDarkMode ? 'text-apple-darkLabelSecondary' : 'text-apple-labelSecondary'}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                        </svg>
                        
                        {editingId === thread.id ? (
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={handleSaveEdit}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                            className={`
                              flex-1 bg-transparent outline-none text-[13px]
                              ${isDarkMode ? 'text-apple-darkLabel' : 'text-apple-label'}
                            `}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className={`text-[13px] truncate flex-1 ${
                            isDarkMode ? 'text-apple-darkLabel' : 'text-apple-label'
                          }`}>
                            {thread.title}
                          </span>
                        )}

                        <AnimatePresence>
                          {hoveredId === thread.id && editingId !== thread.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              className="flex"
                            >
                              <button
                                onClick={(e) => { e.stopPropagation(); handleStartEdit(thread) }}
                                className={`p-1 rounded ${isDarkMode ? 'hover:bg-apple-darkBgElevated' : 'hover:bg-apple-separator'}`}
                              >
                                <svg className={`w-3 h-3 ${isDarkMode ? 'text-apple-darkLabelSecondary' : 'text-apple-labelSecondary'}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); onDeleteThread(thread.id) }}
                                className={`p-1 rounded ${isDarkMode ? 'hover:bg-apple-darkBgElevated' : 'hover:bg-apple-separator'}`}
                              >
                                <svg className={`w-3 h-3 ${isDarkMode ? 'text-apple-darkLabelSecondary hover:text-red-400' : 'text-apple-labelSecondary hover:text-red-500'}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-2 space-y-1">
            <button
              onClick={onShare}
              className={`
                w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px]
                press-effect apple-focus
                ${isDarkMode 
                  ? 'hover:bg-apple-darkBgTertiary text-apple-darkLabel' 
                  : 'hover:bg-apple-bgTertiary text-apple-label'}
              `}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
              Share
            </button>

            <div className={`flex items-center justify-between px-2 py-1.5 rounded-lg ${
              isDarkMode ? 'hover:bg-apple-darkBgTertiary' : 'hover:bg-apple-bgTertiary'
            }`}>
              <span className={`text-[13px] ${isDarkMode ? 'text-apple-darkLabel' : 'text-apple-label'}`}>
                Appearance
              </span>
              <button
                onClick={onToggleTheme}
                className={`
                  relative w-10 h-6 rounded-full transition-colors duration-200
                  ${isDarkMode ? 'bg-apple-blue' : 'bg-apple-gray/30'}
                `}
              >
                <div className={`
                  absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm
                  transition-transform duration-200
                  ${isDarkMode ? 'translate-x-4' : 'translate-x-0.5'}
                `} />
              </button>
            </div>

            {/* Auth section */}
            <div className={`pt-2 mt-2 border-t ${isDarkMode ? 'border-apple-darkSeparator' : 'border-apple-separator'}`}>
              {user ? (
                <div className="space-y-1">
                  <div className={`px-2 py-1.5 text-[13px] ${isDarkMode ? 'text-apple-darkLabel' : 'text-apple-label'}`}>
                    <div className="font-medium truncate">{user.name}</div>
                    <div className={`text-[11px] truncate ${isDarkMode ? 'text-apple-darkLabelSecondary' : 'text-apple-labelSecondary'}`}>
                      {user.email}
                    </div>
                  </div>
                  <button
                    onClick={onLogout}
                    className={`
                      w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px]
                      press-effect apple-focus
                      ${isDarkMode 
                        ? 'hover:bg-apple-darkBgTertiary text-apple-darkLabelSecondary hover:text-red-400' 
                        : 'hover:bg-apple-bgTertiary text-apple-labelSecondary hover:text-red-500'}
                    `}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                    Sign out
                  </button>
                </div>
              ) : (
                <button
                  onClick={onLogin}
                  className={`
                    w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px]
                    press-effect apple-focus
                    ${isDarkMode 
                      ? 'hover:bg-apple-darkBgTertiary text-apple-blue' 
                      : 'hover:bg-apple-bgTertiary text-apple-blue'}
                  `}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  Sign in
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Toggle button when closed - handled by ChatArea */}
    </>
  )
}

export default Sidebar
