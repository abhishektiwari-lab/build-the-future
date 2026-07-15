'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ModeratorPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const correctPassword = process.env.NEXT_PUBLIC_MODERATOR_PASSWORD

      if (password === correctPassword) {
        localStorage.setItem('moderatorLoggedIn', 'true')
        router.push('/moderator/dashboard')
      } else {
        setError('Invalid password')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="text-sm text-green-300 hover:text-green-200 mb-8 block">
          ← Back
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">Moderator Login</h1>
          <p className="text-green-300">Build the Future</p>
        </div>

        <form onSubmit={handleLogin} className="bg-slate-800 rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Moderator Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {error && <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  )
}
