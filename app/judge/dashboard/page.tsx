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
  ai_native_solution: string | null
  problem: string | null
  persona: string | null
  expected_outcomes: string | null
}

export default function JudgeDashboard() {
  const router = useRouter()
  const [judgeName, setJudgeName] = useState('')
  const [judgeId, setJudgeId] = useState<string | null>(null)
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [scores, setScores] = useState({
    customerOutcome: 0,
    aiNativeThinking: 0,
    innovationAndVision: 0,
  })
  const [comment, setComment] = useState('')
  const [judgingOpen, setJudgingOpen] = useState(false)
  const [judgingLocked, setJudgingLocked] = useState(false)
  const [error, setError] = useState('')
  const [completedTeams, setCompletedTeams] = useState<string[]>([])
  const [totalTeams, setTotalTeams] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  // Track which team we've loaded so we can reset the form when it changes
  const loadedTeamRef = useRef<string | null>(null)

  const loadTeamData = useCallback(
    async (teamId: string, jId: string) => {
      // Only reload team/submission when the presenting team actually changes
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
          .select('*')
          .eq('team_id', teamId)
          .maybeSingle()
        setSubmission(submissionData || null)

        // Preload an existing score (if this judge already scored this team)
        const existing = await getJudgeScore(jId, teamId)
        if (existing) {
          setScores({
            customerOutcome: existing.customerOutcome,
            aiNativeThinking: existing.aiNativeThinking,
            innovationAndVision: existing.innovationAndVision,
          })
          setComment(existing.comment || '')
          setSubmitted(true)
        } else {
          setScores({ customerOutcome: 0, aiNativeThinking: 0, innovationAndVision: 0 })
          setComment('')
          setSubmitted(false)
        }
      }
    },
    []
  )

  const refresh = useCallback(
    async (jId: string) => {
      // Event state -> current team + judging flags
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

      // Progress: how many teams this judge has scored
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

    // Initial load
    refresh(storedJudgeId).finally(() => setLoading(false))

    // Poll every 3s so judges reliably see the current team and scoring
    // status without depending on realtime being enabled server-side.
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

  const scoreButtons = (
    field: 'customerOutcome' | 'aiNativeThinking' | 'innovationAndVision',
    color: string
  ) => (
    <div className="flex gap-2 flex-wrap">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
        <button
          key={num}
          type="button"
          onClick={() => setScores({ ...scores, [field]: num })}
          className={`w-12 h-12 rounded-lg font-bold text-lg transition-all ${
            scores[field] === num
              ? `${color} text-white scale-110 shadow-md`
              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          {num}
        </button>
      ))}
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  const allScored =
    scores.customerOutcome > 0 && scores.aiNativeThinking > 0 && scores.innovationAndVision > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto pt-6 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Judge Dashboard</h1>
            <p className="text-gray-600">{judgeName}</p>
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
        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
          <p className="text-sm font-medium text-gray-600 mb-2">Progress</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${totalTeams ? (completedTeams.length / totalTeams) * 100 : 0}%` }}
              />
            </div>
            <span className="text-lg font-bold text-blue-600">
              {completedTeams.length} of {totalTeams}
            </span>
          </div>
        </div>

        {/* Current Team */}
        {currentTeam ? (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{currentTeam.name}</h2>
            <p className="text-lg text-purple-600 font-semibold mb-4">
              {submission?.prototype_name || currentTeam.prototype_name || 'Prototype'}
            </p>

            {/* Solution Summary */}
            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">AI-Native Solution</p>
              <p className="text-gray-900">
                {submission?.ai_native_solution || (
                  <span className="italic text-gray-500">
                    No written submission yet — score based on the live presentation.
                  </span>
                )}
              </p>
              {submission?.problem && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-1">Problem</p>
                  <p className="text-gray-900">{submission.problem}</p>
                </div>
              )}
              {submission?.expected_outcomes && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-1">Expected Outcome</p>
                  <p className="text-gray-900">{submission.expected_outcomes}</p>
                </div>
              )}
            </div>

            {/* Scoring form: available whenever judging is open and not locked */}
            {judgingOpen && !judgingLocked ? (
              <form onSubmit={handleScoreSubmit} className="space-y-6">
                {submitted && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded text-sm">
                    You already submitted a score for this team. You can adjust it and resubmit until
                    judging is locked.
                  </div>
                )}

                <div>
                  <label className="block text-base font-semibold text-gray-900 mb-1">
                    Customer Outcome
                  </label>
                  <p className="text-xs text-gray-600 mb-3">
                    Does the prototype solve a meaningful problem and create a significantly better
                    outcome?
                  </p>
                  {scoreButtons('customerOutcome', 'bg-blue-600')}
                </div>

                <div>
                  <label className="block text-base font-semibold text-gray-900 mb-1">
                    AI-Native Thinking
                  </label>
                  <p className="text-xs text-gray-600 mb-3">
                    Does the solution fundamentally reimagine the experience using AI, rather than
                    simply adding an AI feature?
                  </p>
                  {scoreButtons('aiNativeThinking', 'bg-purple-600')}
                </div>

                <div>
                  <label className="block text-base font-semibold text-gray-900 mb-1">
                    Innovation and Vision
                  </label>
                  <p className="text-xs text-gray-600 mb-3">
                    Is the idea creative, bold, and forward-looking? Does it offer a compelling vision
                    for the future?
                  </p>
                  {scoreButtons('innovationAndVision', 'bg-green-600')}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comment (Optional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share feedback or observations..."
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">{comment.length}/500</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}

                {allScored && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Overall Score</p>
                    <p className="text-4xl font-bold text-blue-600">
                      {formatScore(
                        (scores.customerOutcome +
                          scores.aiNativeThinking +
                          scores.innovationAndVision) /
                          3
                      )}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !allScored}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-4 rounded-lg text-lg transition-colors"
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
                    ? 'All judging has been finalized by the moderator.'
                    : 'The moderator will open scoring for this team shortly.'}
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
