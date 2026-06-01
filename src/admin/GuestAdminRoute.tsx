import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function GuestAdminRoute() {
  const { isAuthenticated, isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="admin-loading">
        <p>Loading…</p>
      </div>
    )
  }

  if (isAuthenticated && isAdmin) {
    return <Navigate to="/admin" replace />
  }

  return <Outlet />
}
