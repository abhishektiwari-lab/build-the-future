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
    persona: '',
    jobToBeDone: '',
    problem: '',
    aiNativeSolution: '',
    expectedOutcomes: '',
    demoUrl: '',
    supportingUrl: '',
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

      // Check submissions open
      const { data: eventState } = await supabase.from('event_state').select('submissions_open').maybeSingle()
      if (eventState && !eventState.submissions_open) {
        setSubmissionsOpen(false)
      }

      // Load existing submission if any
      const { data: submission } = await supabase
        .from('submissions')
        .select('*')
        .eq('team_id', storedTeamId)
        .single()

      if (submission) {
        setFormData({
          prototypeName: submission.prototype_name || '',
          currentProduct: submission.current_product_or_process || '',
          persona: submission.persona || '',
          jobToBeDone: submission.job_to_be_done || '',
          problem: submission.problem || '',
          aiNativeSolution: submission.ai_native_solution || '',
          expectedOutcomes: submission.expected_outcomes || '',
          demoUrl: submission.demo_url || '',
          supportingUrl: submission.supporting_url || '',
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
          persona: formData.persona,
          job_to_be_done: formData.jobToBeDone,
          problem: formData.problem,
          ai_native_solution: formData.aiNativeSolution,
          expected_outcomes: formData.expectedOutcomes,
          demo_url: formData.demoUrl,
          supporting_url: formData.supportingUrl,
          submitted_at: new Date().toISOString(),
        },
        { onConflict: 'team_id' }
      )

      if (err) throw err

      setSuccess(true)
      setTimeout(() => {
        router.push('/participant/team')
      }, 2000)
    } catch (err) {
      setError('Failed to submit. Please try again.')
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
      <div className="max-w-2xl mx-auto pt-8 pb-16">
        <Link href="/participant/team" className="text-sm text-blue-600 hover:text-blue-700 mb-4 block">
          ← Back to Team
        </Link>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Submit Team Entry</h1>
          <p className="text-gray-600 mb-6">{teamName}</p>

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              ✓ Submission saved! Redirecting...
            </div>
          )}

          {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Prototype Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prototype Name *
              </label>
              <input
                type="text"
                name="prototypeName"
                required
                value={formData.prototypeName}
                onChange={handleChange}
                placeholder="AI-Powered Customer Onboarding"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Current Product */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Eltropy Product or Process Being Reimagined *
              </label>
              <input
                type="text"
                name="currentProduct"
                required
                value={formData.currentProduct}
                onChange={handleChange}
                placeholder="Customer Onboarding Workflow"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Persona */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer or Employee Persona *
              </label>
              <input
                type="text"
                name="persona"
                required
                value={formData.persona}
                onChange={handleChange}
                placeholder="New Banking Customer"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Job to Be Done */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job to Be Done *
              </label>
              <textarea
                name="jobToBeDone"
                required
                value={formData.jobToBeDone}
                onChange={handleChange}
                placeholder="Get verified and opened account in minutes"
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Problem */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Problem Being Solved *
              </label>
              <textarea
                name="problem"
                required
                value={formData.problem}
                onChange={handleChange}
                placeholder="Onboarding takes hours with manual verification steps"
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* AI Native Solution */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI-Native Solution Summary *
              </label>
              <textarea
                name="aiNativeSolution"
                required
                value={formData.aiNativeSolution}
                onChange={handleChange}
                placeholder="AI-driven identity verification and contextual chatbot..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Expected Outcomes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Customer, Employee, Operational, or Business Outcome *
              </label>
              <textarea
                name="expectedOutcomes"
                required
                value={formData.expectedOutcomes}
                onChange={handleChange}
                placeholder="Reduce onboarding time from 2 hours to 15 minutes, improve completion rate..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Demo URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Demo Link *
              </label>
              <input
                type="url"
                name="demoUrl"
                required
                value={formData.demoUrl}
                onChange={handleChange}
                placeholder="https://example.com/demo"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Supporting URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supporting Link (Optional)
              </label>
              <input
                type="url"
                name="supportingUrl"
                value={formData.supportingUrl}
                onChange={handleChange}
                placeholder="https://example.com/additional-info"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors mt-8"
            >
              {submitting ? 'Saving...' : 'Save & Submit Entry'}
            </button>
          </form>

          <p className="text-xs text-gray-500 mt-6 text-center">You can edit your submission until the moderator closes submissions.</p>
        </div>
      </div>
    </div>
  )
}
