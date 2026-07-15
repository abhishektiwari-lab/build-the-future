'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

interface TeamMember {
  id: string
  name: string
  email: string
}

export default function TeamPage() {
  const router = useRouter()
  const [teamName, setTeamName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [members, setMembers] = useState<TeamMember[]>([])
  const [teamId, setTeamId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submissionsOpen, setSubmissionsOpen] = useState(true)
  const [hasSubmission, setHasSubmission] = useState(false)

  useEffect(() => {
    const loadTeamData = async () => {
      const storedTeamId = localStorage.getItem('teamId')
      const storedTeamName = localStorage.getItem('teamName')
      const storedJoinCode = localStorage.getItem('joinCode')

      if (!storedTeamId) {
        router.push('/participant')
        return
      }

      setTeamId(storedTeamId)
      setTeamName(storedTeamName || '')
      setJoinCode(storedJoinCode || '')

      // Fetch team members
      const { data: participantsData } = await supabase
        .from('participants')
        .select('id, name, email')
        .eq('team_id', storedTeamId)

      if (participantsData) {
        setMembers(participantsData)
      }

      // Check submissions state
      const { data: eventState } = await supabase.from('event_state').select('submissions_open').single()
      if (eventState) {
        setSubmissionsOpen(eventState.submissions_open)
      }

      // Check if team has submission
      const { data: submission } = await supabase
        .from('submissions')
        .select('id')
        .eq('team_id', storedTeamId)
        .single()

      if (submission) {
        setHasSubmission(true)
      }

      setLoading(false)
    }

    loadTeamData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-md mx-auto pt-8">
        <Link href="/participant" className="text-sm text-blue-600 hover:text-blue-700 mb-4 block">
          ← Back
        </Link>

        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your Team</h1>

          {/* Team Name */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-600 mb-1">Team Name</p>
            <p className="text-lg font-semibold text-gray-900">{teamName}</p>
          </div>

          {/* Join Code */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600 mb-2">Share this code with teammates</p>
            <div className="bg-white border-2 border-blue-400 rounded px-3 py-2 text-center">
              <code className="text-2xl font-bold text-blue-600 tracking-widest">{joinCode}</code>
            </div>
          </div>

          {/* Team Members */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-600 mb-3">Team Members ({members.length}/5)</p>
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-start gap-2 text-sm">
                  <span className="text-gray-400 mt-1">✓</span>
                  <div>
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submission Status */}
          <div className={`p-4 rounded-lg mb-6 ${hasSubmission ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
            <p className={`text-sm font-medium ${hasSubmission ? 'text-green-800' : 'text-amber-800'}`}>
              {hasSubmission ? '✓ Submission Complete' : 'No submission yet'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {submissionsOpen ? (
              <Link href="/participant/submit" className="block">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors">
                  {hasSubmission ? 'Edit Submission' : 'Submit Team Entry'}
                </button>
              </Link>
            ) : (
              <button disabled className="w-full bg-gray-300 text-gray-600 font-semibold py-3 rounded-lg cursor-not-allowed">
                Submissions Closed
              </button>
            )}

            <button
              onClick={() => {
                localStorage.removeItem('teamId')
                localStorage.removeItem('teamName')
                localStorage.removeItem('joinCode')
                router.push('/participant')
              }}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded-lg transition-colors"
            >
              Change Team
            </button>
          </div>
        </div>

        {!submissionsOpen && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
            Submissions are currently closed. You can no longer submit or edit team entries.
          </div>
        )}
      </div>
    </div>
  )
}
