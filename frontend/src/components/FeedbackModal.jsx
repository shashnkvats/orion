import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const feedbackOptions = [
  { id: 'incorrect', label: 'Inaccurate', icon: '✕' },
  { id: 'unhelpful', label: 'Not helpful', icon: '?' },
  { id: 'harmful', label: 'Inappropriate', icon: '!' },
  { id: 'incomplete', label: 'Incomplete', icon: '…' },
  { id: 'other', label: 'Other', icon: '•' },
]

const FeedbackModal = ({ isOpen, onClose, onSubmit, isDarkMode }) => {
  const [selectedOptions, setSelectedOptions] = useState([])
  const [additionalFeedback, setAdditionalFeedback] = useState('')

  const handleToggleOption = (optionId) => {
    setSelectedOptions(prev => 
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    )
  }

  const handleSubmit = () => {
    onSubmit({ options: selectedOptions, additionalFeedback: additionalFeedback.trim() })
    setSelectedOptions([])
    setAdditionalFeedback('')
  }

  const handleClose = () => {
    setSelectedOptions([])
    setAdditionalFeedback('')
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
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
                What went wrong?
              </h2>
              <button
                onClick={handleClose}
                className={`p-2 rounded-full press-effect ${isDarkMode ? 'hover:bg-apple-darkBgTertiary' : 'hover:bg-apple-bgTertiary'}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className={`text-sm mb-4 ${isDarkMode ? 'text-apple-darkLabelSecondary' : 'text-apple-labelSecondary'}`}>
              Select all that apply.
            </p>

            <div className="flex flex-wrap gap-2 mb-5">
              {feedbackOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleToggleOption(option.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium
                    transition-all duration-200 press-effect
                    ${selectedOptions.includes(option.id)
                      ? 'bg-apple-blue text-white'
                      : isDarkMode
                        ? 'bg-apple-darkBgTertiary text-apple-darkLabel hover:bg-apple-darkBgElevated'
                        : 'bg-apple-bgSecondary text-apple-label hover:bg-apple-bgTertiary'
                    }
                  `}
                >
                  <span className="text-xs opacity-60">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>

            <textarea
              value={additionalFeedback}
              onChange={(e) => setAdditionalFeedback(e.target.value)}
              placeholder="Additional details (optional)"
              rows={3}
              className={`
                w-full p-4 rounded-xl resize-none outline-none text-sm
                transition-all duration-200
                ${isDarkMode 
                  ? 'bg-apple-darkBgTertiary text-apple-darkLabel placeholder-apple-darkLabelTertiary' 
                  : 'bg-apple-bgSecondary text-apple-label placeholder-apple-labelTertiary'}
              `}
            />

            <div className="flex gap-3 mt-5">
              <button
                onClick={handleClose}
                className={`
                  flex-1 py-3 rounded-xl font-medium text-sm
                  transition-all duration-200 press-effect
                  ${isDarkMode 
                    ? 'bg-apple-darkBgTertiary text-apple-darkLabel hover:bg-apple-darkBgElevated' 
                    : 'bg-apple-bgSecondary text-apple-label hover:bg-apple-bgTertiary'}
                `}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={selectedOptions.length === 0}
                className={`
                  flex-1 py-3 rounded-xl font-medium text-sm
                  transition-all duration-200 press-effect
                  ${selectedOptions.length > 0
                    ? 'bg-apple-blue text-white'
                    : isDarkMode
                      ? 'bg-apple-darkBgTertiary text-apple-darkLabelTertiary cursor-not-allowed'
                      : 'bg-apple-bgTertiary text-apple-labelTertiary cursor-not-allowed'}
                `}
              >
                Submit
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default FeedbackModal
