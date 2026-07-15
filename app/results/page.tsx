'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { getTeamLeaderboard, formatScore } from '@/lib/scoring'

interface TeamScore {
  teamId: string
  teamName: string
  prototypeName: string | null
  avgCustomerOutcome: number
  avgAiNativeThinking: number
  avgInnovationAndVision: number
  overallScore: number
  judgesCompleted: number
  totalJudges: number
  rank: number
}

export default function ResultsPage() {
  const [leaderboard, setLeaderboard] = useState<TeamScore[]>([])
  const [eventState, setEventState] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadResults = async () => {
      const [leaderboardRes, eventStateRes] = await Promise.all([
        getTeamLeaderboard(),
        supabase.from('event_state').select('*').maybeSingle(),
      ])

      setLeaderboard(leaderboardRes)
      setEventState(eventStateRes.data)
      setLoading(false)

      // Subscribe to updates
      const subscription = supabase
        .channel('event_state')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'event_state' },
          (payload) => {
            setEventState(payload.new)
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }

    loadResults()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center p-4">
        <div>Loading results...</div>
      </div>
    )
  }

  const isVisible = eventState?.leaderboard_visible
  const revealState = eventState?.winner_reveal_state

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <div className="max-w-4xl mx-auto p-4 py-12">
        <Link href="/" className="text-sm text-blue-300 hover:text-blue-200 mb-8 block">
          ← Back to Home
        </Link>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-2">Build the Future</h1>
          <p className="text-2xl text-blue-400 font-semibold">Awards Results</p>
          <p className="text-sm text-slate-400 mt-2">Future Builder Awards</p>
        </div>

        {/* Holding Screen */}
        {!isVisible ? (
          <div className="bg-slate-800 rounded-lg p-12 text-center border border-slate-700">
            <p className="text-2xl font-semibold text-slate-400">
              Build the Future Awards Results<br />
              Coming Soon
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top 3 Winners */}
            {(revealState === 'top3' || revealState === 'full' || revealState === 'winner') && leaderboard.length > 0 && (
              <div className="space-y-4">
                {/* 1st Place */}
                {leaderboard[0] && (
                  <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-lg p-6 shadow-2xl border-4 border-yellow-400">
                    <div className="text-center">
                      <p className="text-sm font-semibold text-yellow-100 mb-2">1ST PLACE</p>
                      <h2 className="text-3xl font-bold text-white mb-2">{leaderboard[0].teamName}</h2>
                      <p className="text-lg text-yellow-100 mb-4">{leaderboard[0].prototypeName}</p>
                      <p className="text-5xl font-bold text-white">{formatScore(leaderboard[0].overallScore)}</p>
                    </div>
                  </div>
                )}

                {/* 2nd & 3rd Place */}
                {(revealState === 'top3' || revealState === 'full' || revealState === 'winner') && leaderboard.length >= 2 && (
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* 2nd Place */}
                    {leaderboard[1] && (
                      <div className="bg-slate-700 rounded-lg p-6 border-2 border-slate-600">
                        <p className="text-sm font-semibold text-slate-300 mb-2">2ND PLACE</p>
                        <h3 className="text-xl font-bold text-white mb-1">{leaderboard[1].teamName}</h3>
                        <p className="text-sm text-slate-300 mb-3">{leaderboard[1].prototypeName}</p>
                        <p className="text-2xl font-bold text-slate-200">{formatScore(leaderboard[1].overallScore)}</p>
                      </div>
                    )}

                    {/* 3rd Place */}
                    {leaderboard[2] && (
                      <div className="bg-slate-700 rounded-lg p-6 border-2 border-slate-600">
                        <p className="text-sm font-semibold text-slate-300 mb-2">3RD PLACE</p>
                        <h3 className="text-xl font-bold text-white mb-1">{leaderboard[2].teamName}</h3>
                        <p className="text-sm text-slate-300 mb-3">{leaderboard[2].prototypeName}</p>
                        <p className="text-2xl font-bold text-slate-200">{formatScore(leaderboard[2].overallScore)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Full Leaderboard */}
            {(revealState === 'full' || revealState === 'winner') && leaderboard.length > 0 && (
              <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
                <div className="px-6 py-4 border-b border-slate-700">
                  <h3 className="text-lg font-bold text-white">Complete Leaderboard</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Rank</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Team</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-200">Prototype</th>
                        <th className="px-6 py-3 text-center text-sm font-semibold text-slate-200">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {leaderboard.map((team) => (
                        <tr key={team.teamId} className="hover:bg-slate-700 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-slate-200">#{team.rank}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-white">{team.teamName}</td>
                          <td className="px-6 py-4 text-sm text-slate-300">{team.prototypeName}</td>
                          <td className="px-6 py-4 text-sm text-center font-bold text-slate-200">
                            {formatScore(team.overallScore)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Breakdown (if full results shown) */}
            {(revealState === 'full' || revealState === 'winner') && leaderboard.length > 0 && (
              <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-4">Scoring Breakdown</h3>
                <div className="space-y-3">
                  {leaderboard.slice(0, 5).map((team) => (
                    <div key={team.teamId} className="border-b border-slate-700 pb-3">
                      <h4 className="font-semibold text-white mb-2">{team.teamName}</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-slate-300">
                          <p className="text-xs text-slate-400">Customer Outcome</p>
                          <p className="font-bold text-slate-200">{formatScore(team.avgCustomerOutcome)}</p>
                        </div>
                        <div className="text-slate-300">
                          <p className="text-xs text-slate-400">AI-Native Thinking</p>
                          <p className="font-bold text-slate-200">{formatScore(team.avgAiNativeThinking)}</p>
                        </div>
                        <div className="text-slate-300">
                          <p className="text-xs text-slate-400">Innovation & Vision</p>
                          <p className="font-bold text-slate-200">{formatScore(team.avgInnovationAndVision)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-slate-500 text-sm">
          <p>Eltropy Innovation Contest</p>
          <p className="mt-1">Betting the Farm on AI</p>
        </div>
      </div>
    </div>
  )
}
