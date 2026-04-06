'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'

export function DemoLoginButton() {
  const [loading, setLoading] = useState(false)

  async function handleDemo() {
    setLoading(true)
    await signIn('demo', {
      email: 'demo@funnelguard.ai',
      password: 'demo123',
      callbackUrl: '/dashboard',
    })
  }

  return (
    <button
      onClick={handleDemo}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-700 bg-gray-800 px-6 py-3 text-sm font-medium text-gray-300 transition-all hover:border-gray-600 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
      {loading ? 'Entrando...' : 'Entrar em Modo Demo'}
    </button>
  )
}
