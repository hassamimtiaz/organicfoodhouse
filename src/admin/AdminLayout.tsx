'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { SITE } from '../config/site'
import { useAuth } from '../contexts/AuthContext'
import './AdminLayout.css'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { signOut, user, demoMode } = useAuth()
  const pathname = usePathname()
  const isCatalogActive = pathname === '/admin'

  return (
    <div className="admin-app">
      <header className="admin-header">
        <div className="container admin-header-inner">
          <Link href="/admin" className="admin-brand">
            {SITE.name} <span>Admin</span>
          </Link>
          <nav className="admin-nav">
            <Link
              href="/admin"
              className={isCatalogActive ? 'active' : undefined}
              aria-current={isCatalogActive ? 'page' : undefined}
            >
              Catalog
            </Link>
            <Link href="/" className="admin-nav-muted">
              View store
            </Link>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => void signOut()}
            >
              Sign out
            </button>
          </nav>
        </div>
        {demoMode && (
          <div className="admin-banner-demo">
            <div className="container">
              Demo admin — connect Supabase and add your user to{' '}
              <code>admin_users</code> for real auth.
            </div>
          </div>
        )}
        {!demoMode && user?.email && (
          <div className="admin-user-bar">
            <div className="container">Signed in as {user.email}</div>
          </div>
        )}
      </header>
      <main className="admin-main">{children}</main>
    </div>
  )
}
