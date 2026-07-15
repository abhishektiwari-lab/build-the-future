import { supabase } from './supabase'

export interface Session {
  participantId: string
  name: string
  email: string
  teamId: string | null
  role: 'participant' | 'judge' | 'moderator'
}

export async function createParticipantSession(
  name: string,
  email: string
): Promise<Session> {
  const sessionId = generateSessionId()

  const { data, error } = await supabase
    .from('participants')
    .insert({
      name,
      email,
      role: 'participant',
      session_id: sessionId,
    })
    .select()
    .single()

  if (error) throw error

  return {
    participantId: data.id,
    name: data.name,
    email: data.email,
    teamId: data.team_id,
    role: 'participant',
  }
}

export async function getParticipantSession(
  sessionId: string
): Promise<Session | null> {
  const { data, error } = await supabase
    .from('participants')
    .select()
    .eq('session_id', sessionId)
    .single()

  if (error || !data) return null

  return {
    participantId: data.id,
    name: data.name,
    email: data.email,
    teamId: data.team_id,
    role: data.role as 'participant' | 'judge' | 'moderator',
  }
}

export async function authenticateJudge(accessCode: string): Promise<Session | null> {
  const { data, error } = await supabase
    .from('judges')
    .select()
    .eq('access_code', accessCode)
    .eq('active', true)
    .single()

  if (error || !data) return null

  return {
    participantId: data.id,
    name: data.name,
    email: data.access_code,
    teamId: null,
    role: 'judge',
  }
}

export async function authenticateModerator(password: string): Promise<boolean> {
  const correctPassword = process.env.NEXT_PUBLIC_MODERATOR_PASSWORD
  return password === correctPassword
}

export function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function generateJoinCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function generateAccessCode(): string {
  return 'JUDGE' + Math.random().toString(36).substring(2, 8).toUpperCase()
}
