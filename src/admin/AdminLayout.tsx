import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './AdminLayout.css'

export default function AdminLayout() {
  const { signOut, user, demoMode } = useAuth()

  return (
    <div className="admin-app">
      <header className="admin-header">
        <div className="container admin-header-inner">
          <Link to="/admin" className="admin-brand">
            Organic Food House <span>Admin</span>
          </Link>
          <nav className="admin-nav">
            <NavLink to="/admin" end>
              Catalog
            </NavLink>
            <Link to="/" className="admin-nav-muted">
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
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}
