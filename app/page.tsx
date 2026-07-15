'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function LandingPage() {
  const [roleSelected, setRoleSelected] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-2">Build the Future</h1>
          <p className="text-xl text-blue-400 font-semibold">Innovation Contest</p>
          <p className="text-sm text-slate-400 mt-2">Betting the Farm on AI</p>
        </div>

        {/* Main Buttons */}
        <div className="space-y-4 mb-8">
          <Link href="/participant">
            <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-lg transition-all active:scale-95">
              🚀 Join or Create a Team
            </button>
          </Link>

          <Link href="/judge">
            <button className="w-full py-4 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold text-lg transition-all active:scale-95">
              ⭐ Judge Login
            </button>
          </Link>

          <Link href="/moderator">
            <button className="w-full py-4 bg-green-600 hover:bg-green-700 rounded-lg font-semibold text-lg transition-all active:scale-95">
              ⚙️ Moderator Login
            </button>
          </Link>

          <Link href="/results">
            <button className="w-full py-4 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold text-lg transition-all active:scale-95">
              📊 View Results
            </button>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center text-slate-500 text-sm">
          <p>Internal Eltropy Event</p>
          <p className="mt-1">July 2026</p>
        </div>
      </div>
    </div>
  )
}
