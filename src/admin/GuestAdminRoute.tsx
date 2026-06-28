'use client'

import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function GuestAdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return (
      <div className="admin-loading">
        <p>Loading…</p>
      </div>
    )
  }

  if (isAuthenticated && isAdmin) {
    router.replace('/admin')
    return null
  }

  return <>{children}</>
}
