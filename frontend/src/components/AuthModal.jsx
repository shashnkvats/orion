import { useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export default function AuthModal({ isOpen, onClose, onAuthSuccess, isDarkMode }) {
  const [mode, setMode] = useState('login') // 'login' or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup'
      const body = mode === 'login' 
        ? { email, password }
        : { email, password, name }

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Authentication failed')
      }

      // Store token and user info
      localStorage.setItem('token', data.access_token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      onAuthSuccess(data.user, data.access_token)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login')
    setError('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`
        relative w-full max-w-md mx-4 p-8 rounded-2xl shadow-2xl
        ${isDarkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}
      `}>
        {/* Close button */}
        <button 
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full transition-colors
            ${isDarkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {mode === 'login' 
              ? 'Sign in to access your conversations' 
              : 'Sign up to save your conversations'}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={`
                  w-full px-4 py-3 rounded-xl border transition-colors
                  ${isDarkMode 
                    ? 'bg-zinc-800 border-zinc-700 focus:border-blue-500 text-white' 
                    : 'bg-zinc-50 border-zinc-200 focus:border-blue-500 text-zinc-900'}
                  outline-none
                `}
                placeholder="Your name"
              />
            </div>
          )}

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={`
                w-full px-4 py-3 rounded-xl border transition-colors
                ${isDarkMode 
                  ? 'bg-zinc-800 border-zinc-700 focus:border-blue-500 text-white' 
                  : 'bg-zinc-50 border-zinc-200 focus:border-blue-500 text-zinc-900'}
                outline-none
              `}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className={`
                w-full px-4 py-3 rounded-xl border transition-colors
                ${isDarkMode 
                  ? 'bg-zinc-800 border-zinc-700 focus:border-blue-500 text-white' 
                  : 'bg-zinc-50 border-zinc-200 focus:border-blue-500 text-zinc-900'}
                outline-none
              `}
              placeholder={mode === 'signup' ? 'Min 8 characters' : '••••••••'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`
              w-full py-3 px-4 rounded-xl font-medium transition-all
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}
              bg-blue-600 hover:bg-blue-700 text-white
            `}
          >
            {loading 
              ? 'Please wait...' 
              : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {/* Switch mode */}
        <p className={`text-center mt-6 text-sm ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button 
            onClick={switchMode}
            className="text-blue-500 hover:text-blue-400 font-medium"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
