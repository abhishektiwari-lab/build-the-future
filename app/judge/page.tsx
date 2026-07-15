'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function JudgePage() {
  const router = useRouter()
  const [accessCode, setAccessCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [judges, setJudges] = useState<any[]>([])
  const [showCodeInput, setShowCodeInput] = useState(true)

  const handleAccessCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: err } = await supabase
        .from('judges')
        .select()
        .eq('access_code', accessCode.toUpperCase())
        .eq('active', true)
        .single()

      if (err || !data) {
        setError('Invalid access code')
        return
      }

      localStorage.setItem('judgeId', data.id)
      localStorage.setItem('judgeName', data.name)
      router.push('/judge/dashboard')
    } catch (err) {
      setError('Authentication failed')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="text-sm text-purple-300 hover:text-purple-200 mb-8 block">
          ← Back
        </Link>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">Judge Login</h1>
          <p className="text-purple-300">Build the Future</p>
        </div>

        {showCodeInput ? (
          <form onSubmit={handleAccessCode} className="bg-slate-800 rounded-lg p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Access Code
              </label>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="JUDGE001"
                maxLength={10}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase font-mono"
              />
              <p className="text-xs text-gray-400 mt-2">Enter the code provided by the moderator</p>
            </div>

            {error && <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded text-sm">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Authenticating...' : 'Continue'}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  )
}
