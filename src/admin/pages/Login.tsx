'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Redirect from '../../components/Redirect'
import { SITE } from '../../config/site'
import { useAuth } from '../../contexts/AuthContext'
import './Login.css'

export default function AdminLogin() {
  const { signIn, isAuthenticated, isAdmin, loading, demoMode } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const from = searchParams?.get('from') ?? '/admin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && isAuthenticated && isAdmin) {
    return <Redirect to={from} />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signIn(email, password)
      router.replace(from)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <Link href="/" className="admin-login-back">
          ← Back to store
        </Link>
        <h1>Admin sign in</h1>
        <p className="admin-login-sub">
          Manage products and categories for {SITE.name}.
        </p>

        {demoMode && (
          <p className="admin-login-hint">
            Demo mode: enter any email{demoMode ? ' and password' : ''} to
            preview the admin portal locally.
          </p>
        )}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required={!demoMode}
            />
          </label>

          {error && <p className="admin-login-error">{error}</p>}

          <button
            type="submit"
            className="btn btn-primary admin-login-btn"
            disabled={submitting}
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
