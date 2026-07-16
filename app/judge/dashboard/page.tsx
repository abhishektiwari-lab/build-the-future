'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { submitScore, hasJudgeScored, getJudgeScore, formatScore } from '@/lib/scoring'

interface Team {
  id: string
  name: string
  prototype_name: string | null
}

interface Submission {
  prototype_name: string | null
  current_product_or_process: string | null
}

interface Member {
  id: string
  name: string
}

type Criterion = 'customerOutcome' | 'aiNativeThinking' | 'innovationAndVision'

export default function JudgeDashboard() {
  const router = useRouter()
  const [judgeName, setJudgeName] = useState('')
  const [judgeId, setJudgeId] = useState<string | null>(null)
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [scores, setScores] = useState({
    customerOutcome: 5,
    aiNativeThinking: 5,
    innovationAndVision: 5,
  })
  const [touched, setTouched] = useState({
    customerOutcome: false,
    aiNativeThinking: false,
    innovationAndVision: false,
  })
  const [comment, setComment] = useState('')
  const [judgingOpen, setJudgingOpen] = useState(false)
  const [judgingLocked, setJudgingLocked] = useState(false)
  const [error, setError] = useState('')
  const [completedTeams, setCompletedTeams] = useState<string[]>([])
  const [totalTeams, setTotalTeams] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  const loadedTeamRef = useRef<string | null>(null)

  const loadTeamData = useCallback(async (teamId: string, jId: string) => {
    if (loadedTeamRef.current !== teamId) {
      loadedTeamRef.current = teamId

      const { data: teamData } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .maybeSingle()
      setCurrentTeam(teamData || null)

      const { data: submissionData } = await supabase
        .from('submissions')
        .select('prototype_name, current_product_or_process')
        .eq('team_id', teamId)
        .maybeSingle()
      setSubmission(submissionData || null)

      const { data: memberData } = await supabase
        .from('participants')
        .select('id, name')
        .eq('team_id', teamId)
      setMembers(memberData || [])

      const existing = await getJudgeScore(jId, teamId)
      if (existing) {
        setScores({
          customerOutcome: existing.customerOutcome,
          aiNativeThinking: existing.aiNativeThinking,
          innovationAndVision: existing.innovationAndVision,
        })
        setTouched({ customerOutcome: true, aiNativeThinking: true, innovationAndVision: true })
        setComment(existing.comment || '')
        setSubmitted(true)
      } else {
        setScores({ customerOutcome: 5, aiNativeThinking: 5, innovationAndVision: 5 })
        setTouched({ customerOutcome: false, aiNativeThinking: false, innovationAndVision: false })
        setComment('')
        setSubmitted(false)
      }
    }
  }, [])

  const refresh = useCallback(
    async (jId: string) => {
      const { data: eventState } = await supabase.from('event_state').select('*').maybeSingle()
      if (eventState) {
        setJudgingOpen(!!eventState.judging_open)
        setJudgingLocked(!!eventState.judging_locked)
        if (eventState.current_team_id) {
          await loadTeamData(eventState.current_team_id, jId)
        } else {
          setCurrentTeam(null)
          loadedTeamRef.current = null
        }
      }

      const { data: teamsData } = await supabase.from('teams').select('id')
      if (teamsData) {
        setTotalTeams(teamsData.length)
        const completed: string[] = []
        for (const team of teamsData) {
          if (await hasJudgeScored(jId, team.id)) completed.push(team.id)
        }
        setCompletedTeams(completed)
      }
    },
    [loadTeamData]
  )

  useEffect(() => {
    const storedJudgeId = localStorage.getItem('judgeId')
    const storedJudgeName = localStorage.getItem('judgeName')

    if (!storedJudgeId) {
      router.push('/judge')
      return
    }

    setJudgeId(storedJudgeId)
    setJudgeName(storedJudgeName || '')

    refresh(storedJudgeId).finally(() => setLoading(false))
    const interval = setInterval(() => refresh(storedJudgeId), 3000)
    return () => clearInterval(interval)
  }, [router, refresh])

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentTeam || !judgeId || !judgingOpen || judgingLocked) return

    setSubmitting(true)
    setError('')

    try {
      const success = await submitScore(judgeId, currentTeam.id, {
        customerOutcome: scores.customerOutcome,
        aiNativeThinking: scores.aiNativeThinking,
        innovationAndVision: scores.innovationAndVision,
        comment,
      })

      if (success) {
        setCompletedTeams((prev) =>
          prev.includes(currentTeam.id) ? prev : [...prev, currentTeam.id]
        )
        setSubmitted(true)
      } else {
        setError('Failed to submit score. Scoring may be locked.')
      }
    } catch (err) {
      setError('Error submitting score')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const setScore = (field: Criterion, value: number) => {
    setScores((prev) => ({ ...prev, [field]: value }))
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const slider = (field: Criterion, title: string, description: string, accent: string) => (
    <div className="border border-gray-200 rounded-xl p-4">
      <div className="flex items-baseline justify-between mb-1">
        <label className="text-base font-semibold text-gray-900">{title}</label>
        <span className={`text-3xl font-bold ${touched[field] ? accent : 'text-gray-300'}`}>
          {touched[field] ? scores[field] : '–'}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-3">{description}</p>
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={scores[field]}
        onChange={(e) => setScore(field, parseInt(e.target.value, 10))}
        className="w-full h-3 accent-current cursor-pointer"
        style={{ accentColor: 'currentColor' }}
      />
      <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
        <span>1</span>
        <span>5</span>
        <span>10</span>
      </div>
      {!touched[field] && <p className="text-xs text-amber-600 mt-2">Slide to set a score</p>}
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  const allScored = touched.customerOutcome && touched.aiNativeThinking && touched.innovationAndVision

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto pt-6 pb-16">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Judge</h1>
            <p className="text-sm text-gray-600">{judgeName}</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('judgeId')
              localStorage.removeItem('judgeName')
              router.push('/judge')
            }}
            className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-lg p-3 mb-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${totalTeams ? (completedTeams.length / totalTeams) * 100 : 0}%` }}
              />
            </div>
            <span className="text-sm font-bold text-blue-600 whitespace-nowrap">
              {completedTeams.length} of {totalTeams} scored
            </span>
          </div>
        </div>

        {currentTeam ? (
          <div className="bg-white rounded-lg p-5 shadow-sm">
            {/* Compact team header */}
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">{currentTeam.name}</h2>
            {members.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">{members.map((m) => m.name).join(', ')}</p>
            )}

            <div className="mt-3 space-y-2">
              <div>
                <span className="text-xs uppercase tracking-wide text-gray-400">Prototype</span>
                <p className="text-lg font-semibold text-purple-600 leading-tight">
                  {submission?.prototype_name || currentTeam.prototype_name || '—'}
                </p>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wide text-gray-400">Reimagining</span>
                <p className="text-base text-gray-900 leading-tight">
                  {submission?.current_product_or_process || '—'}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-100 my-4" />

            {judgingOpen && !judgingLocked ? (
              <form onSubmit={handleScoreSubmit} className="space-y-4">
                {submitted && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded text-sm">
                    You already scored this team. Adjust and resubmit until judging is locked.
                  </div>
                )}

                <div className="text-blue-600">
                  {slider(
                    'customerOutcome',
                    'Customer Outcome',
                    'Solves a meaningful problem with a significantly better outcome?',
                    'text-blue-600'
                  )}
                </div>
                <div className="text-purple-600">
                  {slider(
                    'aiNativeThinking',
                    'AI-Native Thinking',
                    'Fundamentally reimagines the experience with AI, not just an add-on?',
                    'text-purple-600'
                  )}
                </div>
                <div className="text-green-600">
                  {slider(
                    'innovationAndVision',
                    'Innovation & Vision',
                    'Creative, bold, forward-looking vision for the future?',
                    'text-green-600'
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comment (Optional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Optional note..."
                    rows={2}
                    maxLength={500}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {allScored && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-sm text-gray-600">Overall</span>
                    <span className="text-3xl font-bold text-blue-600">
                      {formatScore(
                        (scores.customerOutcome +
                          scores.aiNativeThinking +
                          scores.innovationAndVision) /
                          3
                      )}
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !allScored}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-4 rounded-lg text-lg transition-colors sticky bottom-2"
                >
                  {submitting ? 'Submitting...' : submitted ? 'Update Score' : 'Submit Scores'}
                </button>
              </form>
            ) : submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <p className="text-green-800 font-semibold mb-2">✓ Scores Submitted</p>
                <p className="text-green-700 text-sm">
                  Waiting for the moderator to advance to the next team...
                </p>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
                <p className="text-amber-800 font-semibold">
                  {judgingLocked ? 'Judging is locked' : 'Scoring not open yet'}
                </p>
                <p className="text-amber-700 text-sm mt-1">
                  {judgingLocked
                    ? 'All judging has been finalized.'
                    : 'The moderator will open scoring shortly.'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-6 shadow-sm text-center">
            <p className="text-gray-600">Waiting for the moderator to select a team...</p>
            <p className="text-gray-400 text-sm mt-2">This screen updates automatically.</p>
          </div>
        )}
      </div>
    </div>
  )
}
