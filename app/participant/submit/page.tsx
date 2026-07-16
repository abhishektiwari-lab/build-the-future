'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function SubmitPage() {
  const router = useRouter()
  const [teamId, setTeamId] = useState<string | null>(null)
  const [teamName, setTeamName] = useState('')
  const [formData, setFormData] = useState({
    prototypeName: '',
    currentProduct: '',
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submissionsOpen, setSubmissionsOpen] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      const storedTeamId = localStorage.getItem('teamId')
      const storedTeamName = localStorage.getItem('teamName')

      if (!storedTeamId) {
        router.push('/participant')
        return
      }

      setTeamId(storedTeamId)
      setTeamName(storedTeamName || '')

      const { data: eventState } = await supabase
        .from('event_state')
        .select('submissions_open')
        .maybeSingle()
      if (eventState && !eventState.submissions_open) {
        setSubmissionsOpen(false)
      }

      const { data: submission } = await supabase
        .from('submissions')
        .select('prototype_name, current_product_or_process')
        .eq('team_id', storedTeamId)
        .maybeSingle()

      if (submission) {
        setFormData({
          prototypeName: submission.prototype_name || '',
          currentProduct: submission.current_product_or_process || '',
        })
      }

      setLoading(false)
    }

    loadData()
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!teamId) return

    setSubmitting(true)
    setError('')

    try {
      if (!submissionsOpen) {
        setError('Submissions are closed')
        return
      }

      const { error: err } = await supabase.from('submissions').upsert(
        {
          team_id: teamId,
          prototype_name: formData.prototypeName,
          current_product_or_process: formData.currentProduct,
          submitted_at: new Date().toISOString(),
        },
        { onConflict: 'team_id' }
      )

      if (err) throw err

      setSuccess(true)
      setTimeout(() => {
        router.push('/participant/team')
      }, 1500)
    } catch (err: any) {
      setError(`Failed to submit — ${err?.message || 'please try again'}`)
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

  if (!submissionsOpen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-md mx-auto pt-8">
          <Link href="/participant/team" className="text-sm text-blue-600 hover:text-blue-700 mb-4 block">
            ← Back
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-semibold">Submissions are closed</p>
            <p className="text-red-700 text-sm mt-2">The moderator has closed submissions.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-md mx-auto pt-8 pb-16">
        <Link href="/participant/team" className="text-sm text-blue-600 hover:text-blue-700 mb-4 block">
          ← Back to Team
        </Link>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Submit Team Entry</h1>
          <p className="text-gray-600 mb-6">{teamName}</p>

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              ✓ Submission saved! Redirecting...
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Prototype Name *</label>
              <input
                type="text"
                name="prototypeName"
                required
                value={formData.prototypeName}
                onChange={handleChange}
                placeholder="e.g. AI-Powered Onboarding"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Eltropy Product or Process Being Reimagined *
              </label>
              <input
                type="text"
                name="currentProduct"
                required
                value={formData.currentProduct}
                onChange={handleChange}
                placeholder="e.g. Customer Onboarding Workflow"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {submitting ? 'Saving...' : 'Save & Submit Entry'}
            </button>
          </form>

          <p className="text-xs text-gray-500 mt-6 text-center">
            You can edit your submission until the moderator closes submissions.
          </p>
        </div>
      </div>
    </div>
  )
}
