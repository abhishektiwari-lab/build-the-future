'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function ModeratorDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'teams' | 'judging' | 'leaderboard' | 'settings'>('overview')
  const [participants, setParticipants] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [judges, setJudges] = useState<any[]>([])
  const [eventState, setEventState] = useState<any>(null)
  const [currentTeam, setCurrentTeam] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem('moderatorLoggedIn')
      if (!isLoggedIn) {
        router.push('/moderator')
      }
    }

    checkAuth()
    loadData()
  }, [router])

  const loadData = async () => {
    try {
      const [participantsRes, teamsRes, judgesRes, eventStateRes] = await Promise.all([
        supabase.from('participants').select('*'),
        supabase.from('teams').select('*'),
        supabase.from('judges').select('*'),
        supabase.from('event_state').select('*').single(),
      ])

      setParticipants(participantsRes.data || [])
      setTeams(teamsRes.data || [])
      setJudges(judgesRes.data || [])
      setEventState(eventStateRes.data)

      if (eventStateRes.data?.current_team_id) {
        const { data: team } = await supabase
          .from('teams')
          .select('*')
          .eq('id', eventStateRes.data.current_team_id)
          .single()
        setCurrentTeam(team)
      }

      setLoading(false)
    } catch (err) {
      console.error('Load data error:', err)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('moderatorLoggedIn')
    router.push('/moderator')
  }

  const handleSetCurrentTeam = async (teamId: string) => {
    if (!eventState) return
    const { error } = await supabase
      .from('event_state')
      .update({ current_team_id: teamId })
      .eq('id', eventState.id)

    if (!error) {
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
    const { error } = await supabase
      .from('event_state')
      .update({ [field]: value })
      .eq('id', eventState.id)

    if (!error) {
      setEventState({ ...eventState, [field]: value })
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
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">Participants ({participants.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Team</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <tr key={p.id} className="border-b border-gray-200 hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{p.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {teams.find((t) => t.id === p.team_id)?.name || 'No team'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TEAMS TAB */}
        {activeTab === 'teams' && (
          <div className="space-y-4">
            {teams.map((team) => {
              const teamMembers = participants.filter((p) => p.team_id === team.id)
              return (
                <div key={team.id} className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{team.name}</h3>
                      <p className="text-sm text-gray-600">Code: {team.join_code}</p>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {teamMembers.length} members
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">
                    {teamMembers.map((m) => (
                      <p key={m.id}>{m.name}</p>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* JUDGING TAB */}
        {activeTab === 'judging' && (
          <div className="space-y-6">
            {currentTeam ? (
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Judging for: {currentTeam.name}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {judges.map((judge) => (
                    <div key={judge.id} className="bg-slate-50 p-4 rounded-lg">
                      <p className="font-medium text-gray-900">{judge.name}</p>
                      <p className="text-sm text-gray-600 mt-2">Status: Pending</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-amber-800">
                No team selected. Select a team from Overview tab.
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
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Event Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Judges</label>
                <div className="space-y-2">
                  {judges.map((judge) => (
                    <div key={judge.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{judge.name}</p>
                        <p className="text-xs text-gray-500">{judge.access_code}</p>
                      </div>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={judge.active}
                          className="w-4 h-4"
                          disabled
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
