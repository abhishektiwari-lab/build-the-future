'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { generateJoinCode, generateAccessCode } from '@/lib/auth'

export default function ModeratorDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'teams' | 'judging' | 'leaderboard' | 'settings'>('overview')
  const [participants, setParticipants] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [judges, setJudges] = useState<any[]>([])
  const [eventState, setEventState] = useState<any>(null)
  const [currentTeam, setCurrentTeam] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Form states
  const [showAddTeam, setShowAddTeam] = useState(false)
  const [showAddJudge, setShowAddJudge] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [newJudgeName, setNewJudgeName] = useState('')
  const [saving, setSaving] = useState(false)

  // Participant management
  const [showAddParticipant, setShowAddParticipant] = useState(false)
  const [newParticipantName, setNewParticipantName] = useState('')
  const [newParticipantEmail, setNewParticipantEmail] = useState('')
  const [newParticipantTeamId, setNewParticipantTeamId] = useState('')

  // Add-member-to-team (inline per team)
  const [addMemberTeamId, setAddMemberTeamId] = useState<string | null>(null)
  const [memberName, setMemberName] = useState('')
  const [memberEmail, setMemberEmail] = useState('')

  // Judging status: judge_ids that have scored the current team
  const [scoredJudgeIds, setScoredJudgeIds] = useState<string[]>([])

  const loadData = useCallback(async () => {
    try {
      setError('')
      const [participantsRes, teamsRes, judgesRes, eventStateRes] = await Promise.all([
        supabase.from('participants').select('*'),
        supabase.from('teams').select('*'),
        supabase.from('judges').select('*'),
        // maybeSingle() returns null (not an error) when the row doesn't exist yet
        supabase.from('event_state').select('*').maybeSingle(),
      ])

      // Surface read errors (e.g. RLS blocking SELECT, bad env vars)
      const readErr =
        participantsRes.error || teamsRes.error || judgesRes.error || eventStateRes.error
      if (readErr) {
        console.error('Read error:', readErr)
        setError(
          `Read failed — ${readErr.message}` +
            ((readErr as any).code ? ` [code: ${(readErr as any).code}]` : '') +
            ((readErr as any).hint ? ` | hint: ${(readErr as any).hint}` : '')
        )
      }

      setParticipants(participantsRes.data || [])
      setTeams(teamsRes.data || [])
      setJudges(judgesRes.data || [])

      // Ensure exactly one event_state row exists; create it on first load
      let eventStateRow = eventStateRes.data
      if (!eventStateRow) {
        const { data: created, error: createErr } = await supabase
          .from('event_state')
          .insert([
            {
              registration_open: true,
              submissions_open: true,
              judging_open: false,
              judging_locked: false,
              leaderboard_visible: false,
              winner_reveal_state: 'hidden',
            },
          ])
          .select()
          .single()
        if (createErr) {
          console.error('Event state create error:', createErr)
          setError(`Could not initialize event state — ${createErr.message}`)
        } else {
          eventStateRow = created
        }
      }
      setEventState(eventStateRow)

      if (eventStateRow?.current_team_id) {
        const { data: team } = await supabase
          .from('teams')
          .select('*')
          .eq('id', eventStateRow.current_team_id)
          .maybeSingle()
        setCurrentTeam(team)
      }

      setLoading(false)
    } catch (err) {
      console.error('Load data error:', err)
      setError('Failed to load data')
    }
  }, [])

  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem('moderatorLoggedIn')
      if (!isLoggedIn) {
        router.push('/moderator')
      }
    }

    checkAuth()
    loadData()
  }, [router, loadData])

  // Poll judge scoring status while the Judging tab is open
  useEffect(() => {
    if (activeTab !== 'judging' || !currentTeam) return
    loadJudgingStatus()
    const interval = setInterval(loadJudgingStatus, 4000)
    return () => clearInterval(interval)
  }, [activeTab, currentTeam, loadJudgingStatus])

  const handleLogout = () => {
    localStorage.removeItem('moderatorLoggedIn')
    router.push('/moderator')
  }

  const handleSetCurrentTeam = async (teamId: string) => {
    if (!eventState) return
    const { error: err } = await supabase
      .from('event_state')
      .update({ current_team_id: teamId })
      .eq('id', eventState.id)

    if (!err) {
      const { data: team } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single()
      setCurrentTeam(team)
    }
  }

  const handleToggleEvent = async (field: string, value: boolean) => {
    if (!eventState) return
    const { error: err } = await supabase
      .from('event_state')
      .update({ [field]: value })
      .eq('id', eventState.id)

    if (!err) {
      setEventState({ ...eventState, [field]: value })
    }
  }

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTeamName.trim()) return
    setSaving(true)
    setError('')

    try {
      const code = generateJoinCode()
      const { error: err } = await supabase.from('teams').insert([
        {
          name: newTeamName,
          join_code: code,
          presentation_order: teams.length + 1,
        },
      ])

      if (err) throw err

      setNewTeamName('')
      setShowAddTeam(false)
      await loadData()
    } catch (err: any) {
      console.error('Error adding team:', err)
      setError(
        `Add team failed — ${err?.message || 'unknown error'}` +
          (err?.code ? ` [code: ${err.code}]` : '') +
          (err?.hint ? ` | hint: ${err.hint}` : '')
      )
    } finally {
      setSaving(false)
    }
  }

  const handleAddJudge = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newJudgeName.trim()) return
    setSaving(true)
    setError('')

    try {
      const code = generateAccessCode()
      const { error: err } = await supabase.from('judges').insert([
        {
          name: newJudgeName,
          access_code: code,
          active: true,
        },
      ])

      if (err) throw err

      setNewJudgeName('')
      setShowAddJudge(false)
      await loadData()
    } catch (err: any) {
      console.error('Error adding judge:', err)
      setError(
        `Add judge failed — ${err?.message || 'unknown error'}` +
          (err?.code ? ` [code: ${err.code}]` : '') +
          (err?.hint ? ` | hint: ${err.hint}` : '')
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Delete this team? This cannot be undone.')) return

    setSaving(true)
    setError('')
    try {
      const { error: err } = await supabase.from('teams').delete().eq('id', teamId)
      if (err) throw err
      await loadData()
    } catch (err) {
      console.error('Error deleting team:', err)
      setError('Failed to delete team')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteJudge = async (judgeId: string) => {
    if (!confirm('Delete this judge?')) return

    setSaving(true)
    setError('')
    try {
      const { error: err } = await supabase.from('judges').delete().eq('id', judgeId)
      if (err) throw err
      await loadData()
    } catch (err) {
      console.error('Error deleting judge:', err)
      setError('Failed to delete judge')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleJudge = async (judgeId: string, currentStatus: boolean) => {
    try {
      const { error: err } = await supabase.from('judges').update({ active: !currentStatus }).eq('id', judgeId)
      if (err) throw err
      await loadData()
    } catch (err) {
      console.error('Error toggling judge:', err)
      setError('Failed to update judge')
    }
  }

  // ---- Participant management ----

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newParticipantName.trim() || !newParticipantEmail.trim()) return
    setSaving(true)
    setError('')

    try {
      const { error: err } = await supabase.from('participants').insert([
        {
          name: newParticipantName,
          email: newParticipantEmail,
          role: 'participant',
          team_id: newParticipantTeamId || null,
        },
      ])
      if (err) throw err

      setNewParticipantName('')
      setNewParticipantEmail('')
      setNewParticipantTeamId('')
      setShowAddParticipant(false)
      await loadData()
    } catch (err: any) {
      console.error('Error adding participant:', err)
      setError(`Add participant failed — ${err?.message || 'unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleMoveParticipant = async (participantId: string, teamId: string) => {
    setSaving(true)
    setError('')
    try {
      const { error: err } = await supabase
        .from('participants')
        .update({ team_id: teamId || null })
        .eq('id', participantId)
      if (err) throw err
      await loadData()
    } catch (err: any) {
      console.error('Error moving participant:', err)
      setError(`Move failed — ${err?.message || 'unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteParticipant = async (participantId: string) => {
    if (!confirm('Remove this participant entirely?')) return
    setSaving(true)
    setError('')
    try {
      const { error: err } = await supabase.from('participants').delete().eq('id', participantId)
      if (err) throw err
      await loadData()
    } catch (err: any) {
      console.error('Error deleting participant:', err)
      setError(`Delete failed — ${err?.message || 'unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleAddMember = async (e: React.FormEvent, teamId: string) => {
    e.preventDefault()
    if (!memberName.trim() || !memberEmail.trim()) return
    setSaving(true)
    setError('')

    try {
      const { error: err } = await supabase.from('participants').insert([
        {
          name: memberName,
          email: memberEmail,
          role: 'participant',
          team_id: teamId,
        },
      ])
      if (err) throw err

      setMemberName('')
      setMemberEmail('')
      setAddMemberTeamId(null)
      await loadData()
    } catch (err: any) {
      console.error('Error adding member:', err)
      setError(`Add member failed — ${err?.message || 'unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  // ---- Judging controls ----

  const loadJudgingStatus = useCallback(async () => {
    if (!currentTeam) {
      setScoredJudgeIds([])
      return
    }
    const { data } = await supabase.from('scores').select('judge_id').eq('team_id', currentTeam.id)
    setScoredJudgeIds((data || []).map((s: any) => s.judge_id))
  }, [currentTeam])

  const handleAdvanceToNextTeam = async () => {
    if (!eventState) return
    // Order teams by presentation_order (nulls last), find the one after current
    const ordered = [...teams].sort(
      (a, b) => (a.presentation_order ?? 9999) - (b.presentation_order ?? 9999)
    )
    const idx = ordered.findIndex((t) => t.id === currentTeam?.id)
    const next = idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1] : null

    if (!next) {
      setError('No next team — this is the last team in the presentation order.')
      return
    }

    setSaving(true)
    setError('')
    try {
      // Close scoring and move to the next team in one update
      const { error: err } = await supabase
        .from('event_state')
        .update({ current_team_id: next.id, judging_open: false })
        .eq('id', eventState.id)
      if (err) throw err
      setCurrentTeam(next)
      setEventState({ ...eventState, current_team_id: next.id, judging_open: false })
      setScoredJudgeIds([])
    } catch (err: any) {
      console.error('Error advancing team:', err)
      setError(`Advance failed — ${err?.message || 'unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Moderator Dashboard</h1>
            <p className="text-sm text-gray-600">Build the Future - Event Control</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {['overview', 'participants', 'teams', 'judging', 'leaderboard', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Participants</p>
                <p className="text-3xl font-bold text-blue-600">{participants.length}</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Teams</p>
                <p className="text-3xl font-bold text-purple-600">{teams.length}</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Judges</p>
                <p className="text-3xl font-bold text-green-600">{judges.length}</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <p className="text-sm text-gray-600 mb-1">Current Team</p>
                <p className="text-lg font-bold text-gray-900">{currentTeam?.name || 'None'}</p>
              </div>
            </div>

            {/* Event Status */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Event Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <span className="font-medium text-gray-700">Registration Open</span>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eventState?.registration_open || false}
                      onChange={(e) => handleToggleEvent('registration_open', e.target.checked)}
                      className="w-5 h-5"
                    />
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <span className="font-medium text-gray-700">Submissions Open</span>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eventState?.submissions_open || false}
                      onChange={(e) => handleToggleEvent('submissions_open', e.target.checked)}
                      className="w-5 h-5"
                    />
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <span className="font-medium text-gray-700">Judging Open</span>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eventState?.judging_open || false}
                      onChange={(e) => handleToggleEvent('judging_open', e.target.checked)}
                      className="w-5 h-5"
                    />
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <span className="font-medium text-gray-700">Judging Locked</span>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eventState?.judging_locked || false}
                      onChange={(e) => handleToggleEvent('judging_locked', e.target.checked)}
                      className="w-5 h-5"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Team Selection for Judging */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Current Presenting Team</h2>
              <div className="space-y-2">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => handleSetCurrentTeam(team.id)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      currentTeam?.id === team.id
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{team.name}</p>
                    <p className="text-xs text-gray-500">Presentation Order: {team.presentation_order || 'Not set'}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PARTICIPANTS TAB */}
        {activeTab === 'participants' && (
          <div className="space-y-4">
            {/* Add Participant Form */}
            {!showAddParticipant ? (
              <button
                onClick={() => setShowAddParticipant(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                + Add Participant
              </button>
            ) : (
              <form onSubmit={handleAddParticipant} className="bg-white rounded-lg p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900">Add Participant</h3>
                <input
                  type="text"
                  value={newParticipantName}
                  onChange={(e) => setNewParticipantName(e.target.value)}
                  placeholder="Full name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <input
                  type="email"
                  value={newParticipantEmail}
                  onChange={(e) => setNewParticipantEmail(e.target.value)}
                  placeholder="Work email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={newParticipantTeamId}
                  onChange={(e) => setNewParticipantTeamId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">No team (assign later)</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving || !newParticipantName.trim() || !newParticipantEmail.trim()}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition-colors"
                  >
                    {saving ? 'Adding...' : 'Add Participant'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddParticipant(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Participants ({participants.length})</h2>
                <p className="text-sm text-gray-500 mt-1">Use the dropdown to move a participant between teams.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Team</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.length > 0 ? (
                      participants.map((p) => (
                        <tr key={p.id} className="border-b border-gray-200 hover:bg-slate-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{p.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <select
                              value={p.team_id || ''}
                              onChange={(e) => handleMoveParticipant(p.id, e.target.value)}
                              disabled={saving}
                              className="px-3 py-1 border border-gray-300 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">No team</option>
                              {teams.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteParticipant(p.id)}
                              disabled={saving}
                              className="px-3 py-1 bg-red-100 hover:bg-red-200 disabled:bg-gray-200 text-red-700 rounded text-sm font-semibold transition-colors"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">
                          No participants yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TEAMS TAB */}
        {activeTab === 'teams' && (
          <div className="space-y-4">
            {/* Add Team Form */}
            {!showAddTeam ? (
              <button
                onClick={() => setShowAddTeam(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                + Add New Team
              </button>
            ) : (
              <form onSubmit={handleAddTeam} className="bg-white rounded-lg p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900">Create New Team</h3>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Team name (e.g., Team Alpha)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving || !newTeamName.trim()}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition-colors"
                  >
                    {saving ? 'Creating...' : 'Create Team'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddTeam(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Teams List */}
            {teams.map((team) => {
              const teamMembers = participants.filter((p) => p.team_id === team.id)
              return (
                <div key={team.id} className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{team.name}</h3>
                      <p className="text-sm text-gray-600">
                        Code: <code className="bg-gray-100 px-2 py-1 rounded font-mono">{team.join_code}</code>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Presentation Order: {team.presentation_order || 'Not set'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {teamMembers.length} members
                      </span>
                      <button
                        onClick={() => handleDeleteTeam(team.id)}
                        disabled={saving}
                        className="px-3 py-1 bg-red-100 hover:bg-red-200 disabled:bg-gray-200 text-red-700 disabled:text-gray-500 rounded text-sm font-semibold transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700">
                    {teamMembers.length > 0 ? (
                      <div className="space-y-1">
                        <p className="font-medium mb-2">Members:</p>
                        {teamMembers.map((m) => (
                          <div key={m.id} className="flex items-center justify-between">
                            <p className="text-gray-600">
                              • {m.name} ({m.email})
                            </p>
                            <button
                              onClick={() => handleMoveParticipant(m.id, '')}
                              disabled={saving}
                              className="text-xs text-red-600 hover:text-red-700 font-medium"
                            >
                              Remove from team
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No members yet</p>
                    )}
                  </div>

                  {/* Add Member */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {addMemberTeamId === team.id ? (
                      <form onSubmit={(e) => handleAddMember(e, team.id)} className="space-y-2">
                        <input
                          type="text"
                          value={memberName}
                          onChange={(e) => setMemberName(e.target.value)}
                          placeholder="Member name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <input
                          type="email"
                          value={memberEmail}
                          onChange={(e) => setMemberEmail(e.target.value)}
                          placeholder="Member email"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={saving || !memberName.trim() || !memberEmail.trim()}
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
                          >
                            {saving ? 'Adding...' : 'Add'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAddMemberTeamId(null)
                              setMemberName('')
                              setMemberEmail('')
                            }}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded-lg text-sm transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => {
                          setAddMemberTeamId(team.id)
                          setMemberName('')
                          setMemberEmail('')
                        }}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700"
                      >
                        + Add Member
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* JUDGING TAB */}
        {activeTab === 'judging' && (
          <div className="space-y-6">
            {/* Team selector */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Select Presenting Team</h2>
              {teams.length === 0 ? (
                <p className="text-gray-500 italic">No teams yet. Create teams in the Teams tab first.</p>
              ) : (
                <div className="space-y-2">
                  {[...teams]
                    .sort((a, b) => (a.presentation_order ?? 9999) - (b.presentation_order ?? 9999))
                    .map((team, idx) => (
                      <button
                        key={team.id}
                        onClick={() => handleSetCurrentTeam(team.id)}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all flex items-center justify-between ${
                          currentTeam?.id === team.id
                            ? 'border-green-600 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{team.name}</p>
                          <p className="text-xs text-gray-500">Order: {team.presentation_order ?? idx + 1}</p>
                        </div>
                        {currentTeam?.id === team.id && (
                          <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">
                            NOW PRESENTING
                          </span>
                        )}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {currentTeam ? (
              <>
                {/* Now presenting + scoring controls */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Now Presenting</p>
                      <h2 className="text-xl font-bold text-gray-900">{currentTeam.name}</h2>
                      <p className="text-sm text-gray-600">
                        {(() => {
                          const ordered = [...teams].sort(
                            (a, b) => (a.presentation_order ?? 9999) - (b.presentation_order ?? 9999)
                          )
                          const pos = ordered.findIndex((t) => t.id === currentTeam.id) + 1
                          return `Team ${pos} of ${teams.length}`
                        })()}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        eventState?.judging_open
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {eventState?.judging_open ? 'Scoring OPEN' : 'Scoring CLOSED'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      onClick={() => handleToggleEvent('judging_open', true)}
                      disabled={eventState?.judging_open || eventState?.judging_locked}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition-colors"
                    >
                      Open Scoring
                    </button>
                    <button
                      onClick={() => handleToggleEvent('judging_open', false)}
                      disabled={!eventState?.judging_open}
                      className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition-colors"
                    >
                      Close Scoring
                    </button>
                    <button
                      onClick={handleAdvanceToNextTeam}
                      disabled={saving}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition-colors"
                    >
                      Next Team →
                    </button>
                  </div>
                  {eventState?.judging_locked && (
                    <p className="text-sm text-amber-700 mt-3">
                      Judging is locked. Unlock it in the Overview tab to reopen scoring.
                    </p>
                  )}
                </div>

                {/* Judge completion status */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Judge Status</h2>
                    <span className="text-sm font-semibold text-gray-600">
                      {scoredJudgeIds.length} of {judges.filter((j) => j.active).length} submitted
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {judges.filter((j) => j.active).length === 0 ? (
                      <p className="text-gray-500 italic col-span-full">No active judges.</p>
                    ) : (
                      judges
                        .filter((j) => j.active)
                        .map((judge) => {
                          const scored = scoredJudgeIds.includes(judge.id)
                          return (
                            <div
                              key={judge.id}
                              className={`p-4 rounded-lg border-2 ${
                                scored ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-slate-50'
                              }`}
                            >
                              <p className="font-medium text-gray-900">{judge.name}</p>
                              <p
                                className={`text-sm mt-1 font-semibold ${
                                  scored ? 'text-green-700' : 'text-gray-500'
                                }`}
                              >
                                {scored ? '✓ Submitted' : '⏳ Waiting'}
                              </p>
                            </div>
                          )
                        })
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-amber-800">
                Select a team above to begin judging.
              </div>
            )}
          </div>
        )}

        {/* LEADERBOARD TAB */}
        {activeTab === 'leaderboard' && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Leaderboard</h2>
            <p className="text-gray-600">Leaderboard view coming soon...</p>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            {/* Add Judge Form */}
            {!showAddJudge ? (
              <button
                onClick={() => setShowAddJudge(true)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                + Add New Judge
              </button>
            ) : (
              <form onSubmit={handleAddJudge} className="bg-white rounded-lg p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900">Add Judge</h3>
                <input
                  type="text"
                  value={newJudgeName}
                  onChange={(e) => setNewJudgeName(e.target.value)}
                  placeholder="Judge name (e.g., Ashish Garg)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving || !newJudgeName.trim()}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition-colors"
                  >
                    {saving ? 'Adding...' : 'Add Judge'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddJudge(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Judges List */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Manage Judges ({judges.length})</h2>
              <div className="space-y-2">
                {judges.length > 0 ? (
                  judges.map((judge) => (
                    <div key={judge.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{judge.name}</p>
                        <p className="text-sm text-gray-600 font-mono">Code: {judge.access_code}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={judge.active}
                            onChange={() => handleToggleJudge(judge.id, judge.active)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-700">{judge.active ? 'Active' : 'Inactive'}</span>
                        </label>
                        <button
                          onClick={() => handleDeleteJudge(judge.id)}
                          disabled={saving}
                          className="px-3 py-1 bg-red-100 hover:bg-red-200 disabled:bg-gray-200 text-red-700 disabled:text-gray-500 rounded text-sm font-semibold transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic text-center py-4">No judges added yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
