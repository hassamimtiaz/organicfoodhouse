'use client'

import { usePathname, useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedAdminRoute({
  children,
}: {
  children: ReactNode
}) {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  if (loading) {
    return (
      <div className="admin-loading">
        <p>Checking access…</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    router.replace(`/admin/login?from=${encodeURIComponent(pathname ?? '/admin')}`)
    return null
  }

  if (!isAdmin) {
    return (
      <div className="admin-denied">
        <h1>Access denied</h1>
        <p>This account is not authorized to manage the store.</p>
        <a href="/admin/login">Back to sign in</a>
      </div>
    )
  }

  return <>{children}</>
}
