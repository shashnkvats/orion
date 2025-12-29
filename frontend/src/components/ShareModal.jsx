import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ShareModal = ({ isOpen, onClose, shareLink, isDarkMode }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className={`
              fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
              w-full max-w-md p-6 rounded-2xl z-50 shadow-apple-lg
              ${isDarkMode ? 'bg-apple-darkBgSecondary' : 'bg-white'}
            `}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-apple-darkLabel' : 'text-apple-label'}`}>
                Share Conversation
              </h2>
              <button
                onClick={onClose}
                className={`p-2 rounded-full press-effect ${isDarkMode ? 'hover:bg-apple-darkBgTertiary' : 'hover:bg-apple-bgTertiary'}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className={`text-sm mb-4 ${isDarkMode ? 'text-apple-darkLabelSecondary' : 'text-apple-labelSecondary'}`}>
              Anyone with the link can view this conversation.
            </p>

            <div className={`
              flex items-center gap-2 p-3 rounded-xl
              ${isDarkMode ? 'bg-apple-darkBgTertiary' : 'bg-apple-bgSecondary'}
            `}>
              <input
                type="text"
                value={shareLink}
                readOnly
                className={`
                  flex-1 bg-transparent outline-none text-sm truncate
                  ${isDarkMode ? 'text-apple-darkLabel' : 'text-apple-label'}
                `}
              />
              <button
                onClick={handleCopy}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                  transition-all duration-200 press-effect
                  ${copied 
                    ? 'bg-apple-green text-white' 
                    : 'bg-apple-blue text-white'}
                `}
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>

            <div className="separator my-5" />

            <p className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-apple-darkLabelSecondary' : 'text-apple-labelSecondary'}`}>
              Share via
            </p>
            <div className="flex gap-3">
              {[
                { name: 'Messages', icon: (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.546 20.2A1.5 1.5 0 003.8 21.454l3.032-.892A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                  </svg>
                ), color: 'bg-green-500' },
                { name: 'Mail', icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                ), color: 'bg-apple-blue' },
                { name: 'AirDrop', icon: (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 3a7 7 0 110 14 7 7 0 010-14zm0 3a4 4 0 100 8 4 4 0 000-8z"/>
                  </svg>
                ), color: 'bg-apple-blue' },
              ].map((item) => (
                <button
                  key={item.name}
                  className={`
                    flex-1 flex flex-col items-center gap-2 py-4 rounded-xl
                    press-effect
                    ${isDarkMode ? 'hover:bg-apple-darkBgTertiary' : 'hover:bg-apple-bgSecondary'}
                  `}
                >
                  <div className={`w-12 h-12 ${item.color} rounded-full flex items-center justify-center text-white`}>
                    {item.icon}
                  </div>
                  <span className={`text-xs ${isDarkMode ? 'text-apple-darkLabel' : 'text-apple-label'}`}>
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default ShareModal
