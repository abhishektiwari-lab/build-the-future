'use client'

import { TeamScore, formatScore } from '@/lib/scoring'

interface LeaderboardProps {
  teams: TeamScore[]
  showBreakdown?: boolean
}

export function Leaderboard({ teams, showBreakdown = true }: LeaderboardProps) {
  return (
    <div className="space-y-4">
      {teams.map((team) => (
        <div key={team.teamId} className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl font-bold text-blue-600 w-10">#{team.rank}</span>
                <div>
                  <h3 className="font-bold text-gray-900">{team.teamName}</h3>
                  <p className="text-sm text-gray-600">{team.prototypeName}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-blue-600">{formatScore(team.overallScore)}</p>
              <p className="text-xs text-gray-500">{team.judgesCompleted}/{team.totalJudges} judges</p>
            </div>
          </div>

          {showBreakdown && (
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-200">
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-1">Customer Outcome</p>
                <p className="font-bold text-gray-900">{formatScore(team.avgCustomerOutcome)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-1">AI-Native Thinking</p>
                <p className="font-bold text-gray-900">{formatScore(team.avgAiNativeThinking)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-1">Innovation & Vision</p>
                <p className="font-bold text-gray-900">{formatScore(team.avgInnovationAndVision)}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
