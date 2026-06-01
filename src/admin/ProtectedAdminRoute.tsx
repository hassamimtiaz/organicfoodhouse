import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedAdminRoute() {
  const { isAuthenticated, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="admin-loading">
        <p>Checking access…</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
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

  return <Outlet />
}
