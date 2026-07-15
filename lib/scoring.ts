import { supabase } from './supabase'

export interface TeamScore {
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

export interface ScoreData {
  customerOutcome: number
  aiNativeThinking: number
  innovationAndVision: number
  comment?: string
}

export async function submitScore(
  judgeId: string,
  teamId: string,
  scores: ScoreData
): Promise<boolean> {
  const { error } = await supabase.from('scores').upsert(
    {
      judge_id: judgeId,
      team_id: teamId,
      customer_outcome: scores.customerOutcome,
      ai_native_thinking: scores.aiNativeThinking,
      innovation_and_vision: scores.innovationAndVision,
      comment: scores.comment || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'judge_id,team_id' }
  )

  return !error
}

export async function getTeamLeaderboard(): Promise<TeamScore[]> {
  const { data, error } = await supabase.rpc('get_team_ranking')

  if (error || !data) {
    console.error('Leaderboard error:', error)
    return []
  }

  return data.map((row: any) => ({
    teamId: row.team_id,
    teamName: row.team_name,
    prototypeName: row.prototype_name,
    avgCustomerOutcome: parseFloat(row.avg_customer_outcome || 0),
    avgAiNativeThinking: parseFloat(row.avg_ai_native_thinking || 0),
    avgInnovationAndVision: parseFloat(row.avg_innovation_and_vision || 0),
    overallScore: parseFloat(row.overall_score || 0),
    judgesCompleted: row.judges_completed || 0,
    totalJudges: 5, // hardcoded for now, should come from event_state
    rank: row.rank || 0,
  }))
}

export async function getTeamScores(teamId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('team_id', teamId)

  if (error) {
    console.error('Score fetch error:', error)
    return []
  }

  return data || []
}

export async function hasJudgeScored(judgeId: string, teamId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('scores')
    .select('id')
    .eq('judge_id', judgeId)
    .eq('team_id', teamId)
    .single()

  return !error && !!data
}

export async function getJudgeScore(
  judgeId: string,
  teamId: string
): Promise<ScoreData | null> {
  const { data, error } = await supabase
    .from('scores')
    .select('*')
    .eq('judge_id', judgeId)
    .eq('team_id', teamId)
    .single()

  if (error || !data) return null

  return {
    customerOutcome: data.customer_outcome,
    aiNativeThinking: data.ai_native_thinking,
    innovationAndVision: data.innovation_and_vision,
    comment: data.comment,
  }
}

export async function updateJudgeScore(
  judgeId: string,
  teamId: string,
  scores: ScoreData
): Promise<boolean> {
  // Check if judging is locked
  const { data: eventState } = await supabase
    .from('event_state')
    .select('judging_locked')
    .single()

  if (eventState?.judging_locked) {
    return false
  }

  return submitScore(judgeId, teamId, scores)
}

export function calculateOverallScore(
  customerOutcome: number,
  aiNativeThinking: number,
  innovationAndVision: number
): number {
  return (customerOutcome + aiNativeThinking + innovationAndVision) / 3
}

export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'N/A'
  return (Math.round(score * 100) / 100).toFixed(2)
}
