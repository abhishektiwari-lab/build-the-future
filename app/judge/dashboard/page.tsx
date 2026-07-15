'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { submitScore, hasJudgeScored, formatScore } from '@/lib/scoring'

interface Team {
  id: string
  name: string
  prototype_name: string | null
}

interface Submission {
  ai_native_solution: string | null
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
  const [error, setError] = useState('')
  const [completedTeams, setCompletedTeams] = useState<string[]>([])
  const [totalTeams, setTotalTeams] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const storedJudgeId = localStorage.getItem('judgeId')
      const storedJudgeName = localStorage.getItem('judgeName')

      if (!storedJudgeId) {
        router.push('/judge')
        return
      }

      setJudgeId(storedJudgeId)
      setJudgeName(storedJudgeName || '')

      // Subscribe to event state changes
      const subscription = supabase
        .channel('event_state')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'event_state' },
          (payload) => {
            const newState = payload.new as any
            setJudgingOpen(newState.judging_open && !newState.judging_locked)
            if (newState.current_team_id) {
              loadTeamData(newState.current_team_id, storedJudgeId)
            }
          }
        )
        .subscribe()

      // Load initial data
      const { data: eventState } = await supabase.from('event_state').select('*').single()
      if (eventState) {
        setJudgingOpen(eventState.judging_open && !eventState.judging_locked)
        if (eventState.current_team_id) {
          await loadTeamData(eventState.current_team_id, storedJudgeId)
        }
      }

      // Load teams and check completed
      const { data: teamsData } = await supabase.from('teams').select('id')
      if (teamsData) {
        setTotalTeams(teamsData.length)
        const completed: string[] = []
        for (const team of teamsData) {
          const hasScored = await hasJudgeScored(storedJudgeId, team.id)
          if (hasScored) {
            completed.push(team.id)
          }
        }
        setCompletedTeams(completed)
      }

      setLoading(false)

      return () => {
        subscription.unsubscribe()
      }
    }

    loadData()
  }, [router])

  const loadTeamData = async (teamId: string, jId: string) => {
    const { data: teamData } = await supabase.from('teams').select('*').eq('id', teamId).single()

    if (teamData) {
      setCurrentTeam(teamData)

      const { data: submissionData } = await supabase
        .from('submissions')
        .select('*')
        .eq('team_id', teamId)
        .single()

      if (submissionData) {
        setSubmission(submissionData)
      }

      // Check if already scored
      const alreadyScored = await hasJudgeScored(jId, teamId)
      if (alreadyScored) {
        setSubmitted(true)
      } else {
        setSubmitted(false)
      }
    }
  }

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentTeam || !judgeId || !judgingOpen) return

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
        setCompletedTeams([...completedTeams, currentTeam.id])
        setSubmitted(true)
      } else {
        setError('Failed to submit score')
      }
    } catch (err) {
      setError('Error submitting score')
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

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
                style={{ width: `${(completedTeams.length / totalTeams) * 100}%` }}
              />
            </div>
            <span className="text-lg font-bold text-blue-600">
              {completedTeams.length} of {totalTeams}
            </span>
          </div>
        </div>

        {/* Current Team */}
        {currentTeam && submission ? (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentTeam.name}</h2>
            <p className="text-lg text-purple-600 font-semibold mb-4">{currentTeam.prototype_name}</p>

            {/* Solution Summary */}
            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">AI-Native Solution</p>
              <p className="text-gray-900">{submission.ai_native_solution}</p>
            </div>

            {!submitted && judgingOpen ? (
              <form onSubmit={handleScoreSubmit} className="space-y-6">
                {/* Customer Outcome Score */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Customer Outcome Score
                  </label>
                  <p className="text-xs text-gray-600 mb-3">Does the prototype solve a meaningful problem and create a significantly better outcome?</p>
                  <div className="flex gap-2 flex-wrap">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setScores({ ...scores, customerOutcome: num })}
                        className={`w-10 h-10 rounded-lg font-bold transition-all ${
                          scores.customerOutcome === num
                            ? 'bg-blue-600 text-white scale-110'
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  {scores.customerOutcome > 0 && <p className="text-sm text-blue-600 font-semibold mt-2">Selected: {scores.customerOutcome}</p>}
                </div>

                {/* AI-Native Thinking Score */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    AI-Native Thinking Score
                  </label>
                  <p className="text-xs text-gray-600 mb-3">Does the solution fundamentally reimagine the experience using AI, rather than simply adding an AI feature?</p>
                  <div className="flex gap-2 flex-wrap">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setScores({ ...scores, aiNativeThinking: num })}
                        className={`w-10 h-10 rounded-lg font-bold transition-all ${
                          scores.aiNativeThinking === num
                            ? 'bg-purple-600 text-white scale-110'
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  {scores.aiNativeThinking > 0 && <p className="text-sm text-purple-600 font-semibold mt-2">Selected: {scores.aiNativeThinking}</p>}
                </div>

                {/* Innovation and Vision Score */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Innovation and Vision Score
                  </label>
                  <p className="text-xs text-gray-600 mb-3">Is the idea creative, bold, and forward-looking? Does it offer a compelling vision for the future?</p>
                  <div className="flex gap-2 flex-wrap">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setScores({ ...scores, innovationAndVision: num })}
                        className={`w-10 h-10 rounded-lg font-bold transition-all ${
                          scores.innovationAndVision === num
                            ? 'bg-green-600 text-white scale-110'
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  {scores.innovationAndVision > 0 && <p className="text-sm text-green-600 font-semibold mt-2">Selected: {scores.innovationAndVision}</p>}
                </div>

                {/* Comment */}
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

                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

                {/* Overall Score Preview */}
                {scores.customerOutcome > 0 && scores.aiNativeThinking > 0 && scores.innovationAndVision > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">Overall Score</p>
                    <p className="text-4xl font-bold text-blue-600">
                      {formatScore((scores.customerOutcome + scores.aiNativeThinking + scores.innovationAndVision) / 3)}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    scores.customerOutcome === 0 ||
                    scores.aiNativeThinking === 0 ||
                    scores.innovationAndVision === 0
                  }
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Submit Scores'}
                </button>
              </form>
            ) : submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <p className="text-green-800 font-semibold mb-2">✓ Scores Submitted</p>
                <p className="text-green-700 text-sm">Waiting for moderator to advance to the next team...</p>
              </div>
            ) : !judgingOpen ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
                <p className="text-amber-800 font-semibold">Judging not yet open</p>
                <p className="text-amber-700 text-sm mt-1">The moderator will open judging for this team</p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-6 shadow-sm text-center">
            <p className="text-gray-600">Waiting for moderator to select a team...</p>
          </div>
        )}
      </div>
    </div>
  )
}
