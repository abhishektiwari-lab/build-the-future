'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { createParticipantSession, generateJoinCode } from '@/lib/auth'
import Link from 'next/link'

export default function ParticipantPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'welcome' | 'create-or-join' | 'create-team' | 'join-team'>('welcome')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [teamName, setTeamName] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [registrationOpen, setRegistrationOpen] = useState(true)

  useEffect(() => {
    // Check if registration is open
    const checkRegistration = async () => {
      const { data } = await supabase.from('event_state').select('registration_open').maybeSingle()
      if (data) {
        setRegistrationOpen(data.registration_open)
      }
    }
    checkRegistration()
  }, [])

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!registrationOpen) {
        setError('Registration is currently closed')
        return
      }

      const session = await createParticipantSession(name, email)
      setSessionId(session.participantId)
      localStorage.setItem('sessionId', session.participantId)
      localStorage.setItem('participantName', name)
      localStorage.setItem('participantEmail', email)
      setStep('create-or-join')
    } catch (err) {
      setError('Failed to create session. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const code = generateJoinCode()
      const { data, error: err } = await supabase
        .from('teams')
        .insert({ name: teamName, join_code: code })
        .select()
        .single()

      if (err) throw err

      // Update participant with team
      await supabase
        .from('participants')
        .update({ team_id: data.id })
        .eq('id', sessionId)

      localStorage.setItem('teamId', data.id)
      localStorage.setItem('teamName', teamName)
      localStorage.setItem('joinCode', code)
      router.push('/participant/team')
    } catch (err) {
      setError('Failed to create team. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: err } = await supabase
        .from('teams')
        .select()
        .eq('join_code', joinCode.toUpperCase())
        .single()

      if (err || !data) {
        setError('Invalid join code. Please check and try again.')
        return
      }

      // Check team size
      const { data: members, error: memberErr } = await supabase
        .from('participants')
        .select('id')
        .eq('team_id', data.id)

      if (!memberErr && members && members.length >= 5) {
        setError('Team is full. Maximum 5 members allowed.')
        return
      }

      // Update participant with team
      await supabase
        .from('participants')
        .update({ team_id: data.id })
        .eq('id', sessionId)

      localStorage.setItem('teamId', data.id)
      localStorage.setItem('teamName', data.name)
      localStorage.setItem('joinCode', data.join_code)
      router.push('/participant/team')
    } catch (err) {
      setError('Failed to join team. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-700 mb-4 block">
            ← Back
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Build the Future</h1>
          <p className="text-gray-600">Contest Registration</p>
        </div>

        {/* Welcome Step */}
        {step === 'welcome' && (
          <form onSubmit={handleCreateSession} className="space-y-4 bg-white rounded-lg p-6 shadow-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Email *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@eltropy.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{error}</div>}

            {!registrationOpen && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded text-sm">
                Registration is currently closed
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !registrationOpen}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Loading...' : 'Continue'}
            </button>
          </form>
        )}

        {/* Create or Join Step */}
        {step === 'create-or-join' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <p className="text-gray-700 mb-6">Welcome, {name}!</p>
              <button
                onClick={() => setStep('create-team')}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg mb-3 transition-colors"
              >
                + Create New Team
              </button>
              <button
                onClick={() => setStep('join-team')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                🔗 Join Existing Team
              </button>
            </div>
          </div>
        )}

        {/* Create Team Step */}
        {step === 'create-team' && (
          <form onSubmit={handleCreateTeam} className="space-y-4 bg-white rounded-lg p-6 shadow-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Name *
              </label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Team Alpha"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Creating...' : 'Create Team'}
            </button>

            <button
              type="button"
              onClick={() => setStep('create-or-join')}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded-lg transition-colors"
            >
              Back
            </button>
          </form>
        )}

        {/* Join Team Step */}
        {step === 'join-team' && (
          <form onSubmit={handleJoinTeam} className="space-y-4 bg-white rounded-lg p-6 shadow-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Join Code *
              </label>
              <input
                type="text"
                required
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ALPHA001"
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono text-center"
              />
              <p className="text-xs text-gray-500 mt-2">Ask a team member for the code</p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Joining...' : 'Join Team'}
            </button>

            <button
              type="button"
              onClick={() => setStep('create-or-join')}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded-lg transition-colors"
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
