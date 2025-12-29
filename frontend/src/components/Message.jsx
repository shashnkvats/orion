import { useState } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'

const Message = ({ message, isDarkMode, onRate }) => {
  const [showActions, setShowActions] = useState(false)
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Custom components for markdown rendering
  const MarkdownComponents = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '')
      const codeString = String(children).replace(/\n$/, '')
      
      if (!inline && match) {
        return (
          <div className="relative group my-3">
            <div className={`flex items-center justify-between px-4 py-2 text-xs rounded-t-lg ${
              isDarkMode ? 'bg-[#1e1e1e] text-gray-400' : 'bg-gray-100 text-gray-600'
            }`}>
              <span>{match[1]}</span>
              <button
                onClick={() => copyToClipboard(codeString)}
                className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-white"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <SyntaxHighlighter
              style={isDarkMode ? oneDark : oneLight}
              language={match[1]}
              PreTag="div"
              customStyle={{
                margin: 0,
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                borderBottomLeftRadius: '0.5rem',
                borderBottomRightRadius: '0.5rem',
              }}
              {...props}
            >
              {codeString}
            </SyntaxHighlighter>
          </div>
        )
      }
      
      return (
        <code className={`px-1.5 py-0.5 rounded text-sm ${
          isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'
        }`} {...props}>
          {children}
        </code>
      )
    },
    p({ children }) {
      return <p className="mb-3 last:mb-0">{children}</p>
    },
    ul({ children }) {
      return <ul className="list-disc pl-5 mb-3 space-y-1.5">{children}</ul>
    },
    ol({ children }) {
      return <ol className="list-decimal pl-5 mb-3 space-y-2">{children}</ol>
    },
    li({ children }) {
      return <li className="pl-1">{children}</li>
    },
    h1({ children }) {
      return <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0">{children}</h1>
    },
    h2({ children }) {
      return <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h2>
    },
    h3({ children }) {
      return <h3 className="text-base font-semibold mb-2 mt-3 first:mt-0">{children}</h3>
    },
    blockquote({ children }) {
      return (
        <blockquote className={`border-l-4 pl-4 my-3 italic ${
          isDarkMode ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-600'
        }`}>
          {children}
        </blockquote>
      )
    },
    a({ href, children }) {
      return (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-apple-blue hover:underline"
        >
          {children}
        </a>
      )
    },
    table({ children }) {
      return (
        <div className="overflow-x-auto my-3">
          <table className={`min-w-full border ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
            {children}
          </table>
        </div>
      )
    },
    th({ children }) {
      return (
        <th className={`px-4 py-2 text-left font-semibold border-b ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'
        }`}>
          {children}
        </th>
      )
    },
    td({ children }) {
      return (
        <td className={`px-4 py-2 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
          {children}
        </td>
      )
    },
    hr() {
      return <hr className={`my-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`} />
    },
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className={`flex gap-3 mb-5 ${isUser ? 'flex-row-reverse' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600">
          <svg className="w-5 h-5 text-white" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 15 L54 32 L68 22 L56 36 L75 40 L56 44 L68 58 L53 46 L50 70 L47 46 L32 58 L44 44 L25 40 L44 36 L32 22 L46 32 Z"/>
          </svg>
        </div>
      )}

      {/* Message Content */}
      <div className={`flex flex-col max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`
          px-4 py-2.5 rounded-2xl
          ${isUser 
            ? 'bg-apple-blue text-white rounded-tr-md' 
            : isDarkMode 
              ? 'bg-apple-darkBgTertiary text-apple-darkLabel rounded-tl-md' 
              : 'bg-apple-bgSecondary text-apple-label rounded-tl-md'}
        `}>
          {isUser ? (
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="text-[15px] leading-relaxed prose-compact">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={MarkdownComponents}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Meta & Actions */}
        <div className={`flex items-center gap-2 mt-1.5 px-1 ${isUser ? 'flex-row-reverse' : ''}`}>
          <span className={`text-xs ${isDarkMode ? 'text-apple-darkLabelTertiary' : 'text-apple-labelTertiary'}`}>
            {formatTime(message.timestamp)}
          </span>

          {/* Rating (only for assistant) */}
          {!isUser && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: showActions || message.rating ? 1 : 0 }}
              className="flex items-center gap-0.5"
            >
              <button
                onClick={() => onRate(message.id, 'up')}
                className={`
                  p-1.5 rounded-lg transition-all duration-150 press-effect
                  ${message.rating === 'up' 
                    ? 'text-apple-green bg-apple-green/10' 
                    : isDarkMode 
                      ? 'text-apple-darkLabelSecondary hover:bg-apple-darkBgTertiary' 
                      : 'text-apple-labelSecondary hover:bg-apple-bgTertiary'}
                `}
              >
                <svg className="w-4 h-4" fill={message.rating === 'up' ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
                </svg>
              </button>
              <button
                onClick={() => onRate(message.id, 'down')}
                className={`
                  p-1.5 rounded-lg transition-all duration-150 press-effect
                  ${message.rating === 'down' 
                    ? 'text-red-500 bg-red-500/10' 
                    : isDarkMode 
                      ? 'text-apple-darkLabelSecondary hover:bg-apple-darkBgTertiary' 
                      : 'text-apple-labelSecondary hover:bg-apple-bgTertiary'}
                `}
              >
                <svg className="w-4 h-4" fill={message.rating === 'down' ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 15h2.25m8.024-9.75c.011.05.028.1.052.148.591 1.2.924 2.55.924 3.977a8.96 8.96 0 01-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398-.306.774-1.086 1.227-1.918 1.227h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 00.303-.54m.023-8.25H16.48a4.5 4.5 0 01-1.423-.23l-3.114-1.04a4.5 4.5 0 00-1.423-.23H6.504c-.618 0-1.217.247-1.605.729A11.95 11.95 0 002.25 12c0 .434.023.863.068 1.285C2.427 14.306 3.346 15 4.372 15h3.126c.618 0 .991.724.725 1.282A7.471 7.471 0 007.5 19.5a2.25 2.25 0 002.25 2.25.75.75 0 00.75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 002.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384" />
                </svg>
              </button>
              <button
                onClick={() => copyToClipboard(message.content)}
                className={`
                  p-1.5 rounded-lg transition-all duration-150 press-effect
                  ${isDarkMode 
                    ? 'text-apple-darkLabelSecondary hover:bg-apple-darkBgTertiary' 
                    : 'text-apple-labelSecondary hover:bg-apple-bgTertiary'}
                `}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                </svg>
              </button>
            </motion.div>
          )}

          {message.rating === 'down' && message.feedback && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isDarkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-500'
            }`}>
              Feedback sent
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default Message
